"""
Emergency Response Orchestrator.

Per Part II: called by the Compound Risk Detection Engine at Critical tier;
output is evacuation protocol, alert dispatch, evidence preservation, and a
preliminary report. This is the first Track 3 agent that writes an action
into the simulated world rather than producing a score or a retrieval
result — a bug here doesn't just mislabel something, it dispatches the
wrong evacuation zone or the wrong recipients, which is why this module
(and its DB writes) got the same "run it twice and diff" testing treatment
as the permit-replay-determinism fix, not just a single happy-path run.

Deliberately does NOT make its own Gemini call. The Detection Engine already
spent this event's one LLM call producing Evidence.reasoning before this
agent runs — reusing that text keeps quota flat (still one Gemini call per
Warning/Critical crossing, not two), consistent with the rate-limit
discipline established since Track 3 agent #1.
"""

from __future__ import annotations

import datetime as dt

from sqlalchemy.orm import Session

from app.models import WorkerLocation
from app.schemas import AlertRecipient, EmergencyResponseResult, RiskEvent

# Secondary zones placed on precautionary evacuation standby when the primary
# zone reaches Critical, per Step 3's "Propagates to" column — the same
# doc-grounded, hand-encoded relationship pattern already used for
# UTILITY_DEPENDENTS (rule_engine.py) and ZONE_GAS_CHECK (permit_intelligence.py).
# Not every zone has a documented cross-zone propagation target; those default
# to evacuating only themselves.
EVACUATION_CASCADE: dict[str, list[str]] = {
    "A": ["C"],       # Reactor -> Zone C tank pressure
    "C": ["D"],        # Tank Farm -> Zone D vapor drift
    "F": ["A", "B"],   # Utilities -> cooling to A and B simultaneously
}


def _evacuation_zones(zone_id: str) -> list[str]:
    return [zone_id] + [z for z in EVACUATION_CASCADE.get(zone_id, []) if z != zone_id]


def _alert_recipients(session: Session, evacuation_zones: list[str]) -> list[AlertRecipient]:
    recipients: list[AlertRecipient] = []

    # Safety Officers and Shift Supervisors are always notified of any Critical
    # event, regardless of physical presence (Step 5: "Compound risk alerts,
    # evacuation recommendations, evidence packages" / "Cross-shift risk continuity").
    for role_id in ("safety_officer", "shift_supervisor"):
        recipients.append(AlertRecipient(
            role=role_id, zone=evacuation_zones[0],
            message=f"Critical risk event in Zone {evacuation_zones[0]}" + (
                f" (evacuation standby also raised for {', '.join(evacuation_zones[1:])})"
                if len(evacuation_zones) > 1 else ""
            ),
        ))

    # Everyone else notified is data-driven off who's actually present, not a
    # hardcoded role list — ties directly to the same worker_locations data
    # rule_engine's worker_presence signal reads, so "who gets the stop-work
    # alert" matches "who the risk score already accounted for."
    present = (
        session.query(WorkerLocation)
        .filter(WorkerLocation.zone_id.in_(evacuation_zones), WorkerLocation.checked_in.is_(True))
        .order_by(WorkerLocation.timestamp.desc())
        .all()
    )
    seen = set()
    for w in present:
        key = (w.role_id, w.zone_id)
        if w.count <= 0 or key in seen or w.role_id in ("safety_officer", "shift_supervisor"):
            continue
        seen.add(key)
        recipients.append(AlertRecipient(
            role=w.role_id, zone=w.zone_id,
            message=f"Stop-work / evacuate — Zone {w.zone_id} at Critical risk tier.",
        ))

    return recipients


def _preliminary_report(risk_event: RiskEvent, evacuation_zones: list[str], recipients: list[AlertRecipient]) -> str:
    lines = [
        f"PRELIMINARY INCIDENT REPORT — Zone {risk_event.zone}",
        f"Generated: {risk_event.timestamp.isoformat()}",
        f"Risk score: {risk_event.risk_score} (Critical)",
        "",
        "Contributing signals:",
    ]
    for s in risk_event.contributing_signals:
        lines.append(f"  - [{s.category}] {s.description}")

    if risk_event.evidence:
        lines += ["", "Detection Engine reasoning:", risk_event.evidence.reasoning or "(none)"]
        if risk_event.evidence.matched_incident_summary:
            lines.append(f"Historical precedent: {risk_event.evidence.matched_incident_summary} "
                          f"({risk_event.evidence.matched_incident_confidence or 'unknown'} confidence)")
        if risk_event.evidence.regulatory_citation:
            lines.append(f"Regulatory basis: {risk_event.evidence.regulatory_citation}")

    lines += [
        "",
        f"Evacuation zones: {', '.join(evacuation_zones)}",
        f"Alerted: {', '.join(sorted({r.role for r in recipients})) or 'none'}",
    ]
    return "\n".join(lines)


def dispatch(session: Session, risk_event: RiskEvent, now: dt.datetime) -> EmergencyResponseResult:
    evacuation_zones = _evacuation_zones(risk_event.zone)
    recipients = _alert_recipients(session, evacuation_zones)
    report = _preliminary_report(risk_event, evacuation_zones, recipients)

    evidence_snapshot = {
        "zone": risk_event.zone,
        "risk_score": risk_event.risk_score,
        "tier": risk_event.tier,
        "contributing_signals": [s.model_dump() for s in risk_event.contributing_signals],
        "evidence": risk_event.evidence.model_dump() if risk_event.evidence else None,
    }

    return EmergencyResponseResult(
        zone=risk_event.zone, triggered_at=now, evacuation_zones=evacuation_zones,
        alert_recipients=recipients, evidence_snapshot=evidence_snapshot,
        preliminary_report=report, status="dispatched",
    )
