"""
The asyncio tick loop powering the Industrial Digital Twin. Two modes, one
engine, per Part II: baseline random-walk when nothing is scripted, scenario
overrides layered on top when a demo scenario is running.

Rate-limit discipline lives here, not just in the agent layer: rule_engine's
cheap scoring runs for every zone on every tick, but the expensive path
(agents.compound_risk_engine.evaluate_zone — structural RAG filter + Gemini)
is only invoked when a zone's tier actually changes from the previous tick,
never just because it's still sitting in Warning/Critical. A zone parked at
Warning for two straight minutes must not re-trigger Gemini every 2 seconds
— that would blow through the free-tier quota for no new information.
"""

from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

from agents import compound_risk_engine, emergency_response, geospatial_heatmap, permit_intelligence, rule_engine
from app.db import SessionLocal
from app.models import CctvEvent, MaintenanceRecord, Permit, SensorReading, SensorTag, ShiftLog, WorkerLocation
from app.models import EmergencyResponse as EmergencyResponseModel
from app.models import RiskEvent as RiskEventModel
from app.schemas import RiskEvent
from simulator import baseline
from simulator.seed_baseline_state import reset_instance_state

SCENARIOS_DIR = Path(__file__).resolve().parent / "scenarios"
TICK_INTERVAL = 2.0  # wall-clock seconds between ticks


class TickEngine:
    def __init__(self):
        self.tags: dict[str, SensorTag] = {}
        self.values: dict[str, float | str] = {}
        self.zone_tags: dict[str, list[str]] = {}
        self.active_ramps: dict[str, dict] = {}
        self.held_tags: set[str] = set()
        self.sim_time = 0.0
        self.scenario_queue: list[dict] = []
        self.scenario_running = False
        self.active_scenario_id: str | None = None
        self.playback_speed = 1.0
        self.previous_tier: dict[str, str] = {}
        self._load_tags()

    def _load_tags(self):
        session = SessionLocal()
        try:
            for t in session.query(SensorTag).all():
                self.tags[t.tag] = t
                self.values[t.tag] = baseline.initial_value(t)
                self.zone_tags.setdefault(t.zone_id, []).append(t.tag)
            for zone_id in self.zone_tags:
                self.previous_tier[zone_id] = "normal"
        finally:
            session.close()

    def reset_to_baseline(self):
        for tag_name, tag in self.tags.items():
            self.values[tag_name] = baseline.initial_value(tag)
        self.active_ramps.clear()
        self.held_tags.clear()
        self.sim_time = 0.0
        self.scenario_queue.clear()
        self.scenario_running = False
        for zone_id in self.zone_tags:
            self.previous_tier[zone_id] = "normal"

        # Also wipe scenario-injected DB state (permits, CMMS overdue flags,
        # worker locations, CCTV events, shift logs, sensor readings, risk
        # events) back to the seeded baseline — see reset_instance_state's
        # docstring for why this has to happen on every reset, not just once.
        session = SessionLocal()
        try:
            reset_instance_state(session)
        finally:
            session.close()

    def current_zone_tag_tiers(self) -> dict[str, dict[str, str]]:
        """Snapshot of every tag's current tier without advancing sim time — used
        by the on-demand /api/permits/flags and /api/heatmap endpoints between ticks."""
        result: dict[str, dict[str, str]] = {}
        for tag_name, tag in self.tags.items():
            tier = baseline.classify_tier(tag, self.values[tag_name])
            result.setdefault(tag.zone_id, {})[tag_name] = tier
        return result

    def current_heatmap(self, session):
        """On-demand heatmap between ticks, for REST polling — calls the same
        rule_engine.score_zone / permit_intelligence.evaluate_active_permits /
        geospatial_heatmap.build_heatmap the tick loop uses, not a second
        implementation of any of them."""
        all_zone_tag_tiers = self.current_zone_tag_tiers()
        now = dt.datetime.utcnow()
        zone_states = {
            zone_id: rule_engine.score_zone(session, zone_id, zone_tiers, all_zone_tag_tiers, now)
            for zone_id, zone_tiers in all_zone_tag_tiers.items()
        }
        permit_flags = permit_intelligence.evaluate_active_permits(session, all_zone_tag_tiers, now)
        return geospatial_heatmap.build_heatmap(session, zone_states, permit_flags, now)

    @staticmethod
    def load_scenario(scenario_id: str) -> dict:
        return json.loads((SCENARIOS_DIR / f"{scenario_id}.json").read_text(encoding="utf-8"))

    @staticmethod
    def list_scenarios() -> list[dict]:
        return [
            json.loads(p.read_text(encoding="utf-8"))
            for p in sorted(SCENARIOS_DIR.glob("scenario_*.json"))
        ]

    def run_scenario(self, scenario_id: str, playback_speed: float = 1.0) -> dict:
        scenario = self.load_scenario(scenario_id)
        self.reset_to_baseline()
        self.scenario_queue = sorted(scenario["steps"], key=lambda s: s["t"])
        self.scenario_running = True
        self.active_scenario_id = scenario_id
        self.playback_speed = playback_speed
        return scenario

    def _execute_step(self, step: dict, session) -> str:
        action = step["action"]
        now = dt.datetime.utcnow()

        if action == "ramp_sensor":
            tag = step["tag"]
            self.active_ramps[tag] = {
                "start_value": float(self.values[tag]),
                "target_value": float(step["target_value"]),
                "start_t": self.sim_time,
                "duration": step["duration"],
            }
            self.held_tags.add(tag)

        elif action == "set_sensor":
            tag = step["tag"]
            self.values[tag] = step["value"]
            self.held_tags.add(tag)
            self.active_ramps.pop(tag, None)

        elif action == "issue_permit":
            session.add(Permit(
                permit_type_id=step["permit_type_id"], zone_id=step["zone_id"], status="approved",
                issued_by="Simulator", issued_at=now, valid_from=now,
                valid_to=now + dt.timedelta(hours=step.get("valid_hours", 8)),
                gas_test_ppm=step.get("gas_test_ppm"), gas_test_pass=step.get("gas_test_pass"),
                extra_fields=step.get("extra_fields", {}),
            ))
            session.commit()

        elif action == "set_cmms_overdue":
            record = (
                session.query(MaintenanceRecord)
                .filter(MaintenanceRecord.asset_id == step["asset_id"])
                .order_by(MaintenanceRecord.id.desc())
                .first()
            )
            if record:
                record.overdue_days = step["overdue_days"]
                record.open_work_order_status = step["open_work_order_status"]
                session.commit()

        elif action == "set_worker_location":
            session.add(WorkerLocation(
                zone_id=step["zone_id"], role_id=step["role_id"], count=step["count"],
                checked_in=True, timestamp=now,
            ))
            session.commit()

        elif action == "cctv_event":
            session.add(CctvEvent(
                zone_id=step["zone_id"], camera_placement=step.get("camera_placement", step["zone_id"]),
                detection_category=step["detection_category"], confidence=step.get("confidence", 0.9),
                details=step.get("note", ""), timestamp=now,
            ))
            session.commit()

        elif action == "shift_log":
            session.add(ShiftLog(
                shift_name=step["shift_name"], zone_id=step["zone_id"], supervisor=step["supervisor"],
                handover_notes=step["handover_notes"], flagged_condition=step.get("flagged_condition"),
                escalated=step.get("escalated", False), timestamp=now,
            ))
            session.commit()

        return step.get("note", "")

    def tick(self) -> dict:
        session = SessionLocal()
        try:
            now = dt.datetime.utcnow()
            self.sim_time += TICK_INTERVAL * self.playback_speed
            executed_notes = []

            while self.scenario_queue and self.scenario_queue[0]["t"] <= self.sim_time:
                note = self._execute_step(self.scenario_queue.pop(0), session)
                if note:
                    executed_notes.append(note)
            if self.scenario_running and not self.scenario_queue and not self.active_ramps:
                self.scenario_running = False

            for tag_name, ramp in list(self.active_ramps.items()):
                progress = min(1.0, (self.sim_time - ramp["start_t"]) / max(ramp["duration"], 0.001))
                value = ramp["start_value"] + (ramp["target_value"] - ramp["start_value"]) * progress
                self.values[tag_name] = round(value, 2)
                if progress >= 1.0:
                    del self.active_ramps[tag_name]

            for tag_name, tag in self.tags.items():
                if tag_name in self.active_ramps or tag_name in self.held_tags:
                    continue  # scenario-driven: holds at last scripted value, no baseline drift
                self.values[tag_name] = baseline.step_baseline(tag, self.values[tag_name])

            all_zone_tag_tiers: dict[str, dict[str, str]] = {}
            for zone_id, tag_names in self.zone_tags.items():
                zone_tiers = {}
                for tag_name in tag_names:
                    tag = self.tags[tag_name]
                    value = self.values[tag_name]
                    tier = baseline.classify_tier(tag, value)
                    zone_tiers[tag_name] = tier
                    session.add(SensorReading(
                        tag=tag_name, zone_id=zone_id,
                        value=value if isinstance(value, (int, float)) else 0.0,
                        tier=tier, timestamp=now,
                    ))
                all_zone_tag_tiers[zone_id] = zone_tiers
            session.commit()

            new_events: list[RiskEvent] = []
            new_emergency_responses: list[dict] = []
            zone_states: dict[str, tuple[float, str, list]] = {}  # for geospatial_heatmap — captured, not recomputed
            for zone_id, zone_tiers in all_zone_tag_tiers.items():
                # Cheap path: every zone, every tick.
                score, tier, signals = rule_engine.score_zone(session, zone_id, zone_tiers, all_zone_tag_tiers, now)
                zone_states[zone_id] = (score, tier, signals)
                prev = self.previous_tier.get(zone_id, "normal")

                if tier != prev:
                    if tier == "normal":
                        # Recovery — no RAG/Gemini needed, there's no elevated condition to explain.
                        risk_event = RiskEvent(
                            zone=zone_id, timestamp=now, risk_score=score, tier=tier,
                            contributing_signals=signals,
                            triggered_agents=["compound_risk_detection_engine"], evidence=None,
                        )
                    else:
                        # Expensive path: only on an actual Warning/Critical crossing.
                        risk_event = compound_risk_engine.evaluate_zone(
                            session, zone_id, zone_tiers, all_zone_tag_tiers, now
                        )

                    # Emergency Response Orchestrator — "called by Detection Engine
                    # at Critical tier" (Part II). Computed before the RiskEvent row
                    # is persisted (so triggered_agents reflects it on the same row),
                    # but only written to the DB after, since EmergencyResponse needs
                    # the persisted risk_event's autoincrement id as its FK — that
                    # ordering dependency is why this lives here rather than as a
                    # LangGraph node inside compound_risk_engine.py.
                    er_result = None
                    if tier == "critical":
                        er_result = emergency_response.dispatch(session, risk_event, now)
                        risk_event.triggered_agents = risk_event.triggered_agents + ["emergency_response_orchestrator"]

                    row = RiskEventModel(**risk_event.to_orm_kwargs())
                    session.add(row)
                    session.commit()
                    new_events.append(risk_event)

                    if er_result is not None:
                        er_row = EmergencyResponseModel(
                            risk_event_id=row.id, zone_id=zone_id, triggered_at=er_result.triggered_at,
                            evacuation_zones=er_result.evacuation_zones,
                            alert_recipients=[r.model_dump() for r in er_result.alert_recipients],
                            evidence_snapshot=er_result.evidence_snapshot,
                            preliminary_report=er_result.preliminary_report, status=er_result.status,
                        )
                        session.add(er_row)
                        session.commit()
                        new_emergency_responses.append(er_result.model_dump(mode="json"))

                self.previous_tier[zone_id] = tier

            # Digital Permit Intelligence — continuous re-check every tick, per
            # Part II's trigger ("permit issuance + continuous re-check"). Cheap
            # (no LLM), so unlike the Detection Engine's RAG/Gemini step this can
            # safely run unconditionally rather than only on a transition.
            permit_flags = permit_intelligence.evaluate_active_permits(session, all_zone_tag_tiers, now)

            # Geospatial Safety Heatmap — continuous, per Part II. Pure reshaping
            # of zone_states (already computed above) and permit_flags (already
            # computed above); this call does not re-derive either.
            heatmap = geospatial_heatmap.build_heatmap(session, zone_states, permit_flags, now)

            return {
                "type": "tick",
                "sim_time": self.sim_time,
                "scenario_running": self.scenario_running,
                "active_scenario_id": self.active_scenario_id,
                "readings": {
                    tag_name: {"value": self.values[tag_name], "zone": tag.zone_id,
                               "tier": all_zone_tag_tiers[tag.zone_id][tag_name]}
                    for tag_name, tag in self.tags.items()
                },
                "notes": executed_notes,
                "risk_events": [e.model_dump(mode="json") for e in new_events],
                "permit_flags": [f.model_dump(mode="json") for f in permit_flags if f.flag != "approve"],
                "emergency_responses": new_emergency_responses,
                "heatmap": heatmap.model_dump(mode="json"),
            }
        finally:
            session.close()
