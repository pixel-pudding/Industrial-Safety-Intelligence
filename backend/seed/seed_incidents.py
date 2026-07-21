"""
Seeds structured fields for the 10 historical incidents (Step 9). Full
narrative/root-cause/lessons-learned text lives in seed/narratives/*.md and
is ingested into ChromaDB by rag/ingest_incidents.py — narrative_doc_ref
bridges the two so the RAG agent can filter structurally here first, then
retrieve semantically there.
"""

import datetime as dt
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db import SessionLocal, engine
from app.models import Base, HistoricalIncident

INCIDENTS = [
    dict(
        incident_number=1, title="Reactor Overheating Near-Miss",
        date=dt.date(2021, 3, 14), zone_id="A", zones_involved=["A"],
        hazard_category="thermal_runaway_precursor",
        contributing_factors=["cooling_water_flow_reduction", "delayed_operator_response", "catalyst_near_end_of_life"],
        severity="near_miss",
        narrative_summary="RX-TEMP climbed from 255C to 279C after a cooling jacket strainer partially blocked; catalyst at 172 days amplified the exotherm. Caught before Critical crossover.",
        root_cause="Strainer fouling missed by preventive interval; single-signal (temperature-only) monitoring delayed recognition that catalyst age was compounding the cooling loss.",
        lessons_learned="Cross-reference COOL-FLOW drift against CAT-AGE; reduce strainer inspection interval from 180 to 90 days.",
        narrative_doc_ref="incident_01",
    ),
    dict(
        incident_number=2, title="Chlorine Gas Minor Release",
        date=dt.date(2020, 8, 2), zone_id="B", zones_involved=["B", "J"],
        hazard_category="toxic_gas_release",
        contributing_factors=["compressor_seal_wear", "vibration_trend_ignored", "wind_direction_toward_zone_j"],
        severity="minor",
        narrative_summary="COMP-VIB trended upward for 11 days within the Warning band without a work order; seal failure caused a brief CL2-CONC spike to 1.4 ppm, contained within ~6 minutes.",
        root_cause="A sustained sub-threshold vibration trend was never flagged because monitoring was threshold-based, not trend-based.",
        lessons_learned="Treat sustained upward trends as risk multipliers even while in-range; log wind direction alongside gas events.",
        narrative_doc_ref="incident_02",
    ),
    dict(
        incident_number=3, title="Tank Overpressure Event",
        date=dt.date(2022, 1, 19), zone_id="C", zones_involved=["A", "C"],
        hazard_category="overpressure",
        contributing_factors=["relief_valve_partially_seized", "overfill_during_zone_a_high_output", "delayed_operator_round"],
        severity="moderate",
        narrative_summary="TK-LEVEL reached 97% and TK-PRESS hit 5.4 bar (past Critical) after a Zone A high-output run; a partially seized relief valve and extended operator rounds delayed the response.",
        root_cause="Relief valve inspection was overdue by 34 days, but the overdue CMMS flag was never cross-referenced against the live TK-PRESS trend.",
        lessons_learned="Overdue maintenance should raise a tank's effective risk tier, not sit as an isolated CMMS flag — precedent for maintenance as a risk multiplier.",
        narrative_doc_ref="incident_03",
    ),
    dict(
        incident_number=4, title="Hot Work Ignition Near-Miss",
        date=dt.date(2021, 11, 5), zone_id="D", zones_involved=["C", "D"],
        hazard_category="fire_explosion_precursor",
        contributing_factors=["hot_work_permit_not_revalidated", "voc_drift_after_approval", "no_continuous_retest_requirement"],
        severity="near_miss",
        narrative_summary="A hot work permit approved at 4% LEL was still active when a nearby transfer raised local VOC-CONC to 14% LEL (Warning); a contractor independently stopped work before ignition.",
        root_cause="Gas test was point-in-time at issuance only, with no continuous re-validation against live VOC-CONC for the permit's duration.",
        lessons_learned="Hot work permits must be continuously cross-checked against live gas readings for their full validity window.",
        narrative_doc_ref="incident_04",
    ),
    dict(
        incident_number=5, title="Static Discharge Incident",
        date=dt.date(2019, 6, 27), zone_id="G", zones_involved=["G"],
        hazard_category="static_discharge",
        contributing_factors=["grounding_clamp_corrosion", "grounding_check_bypassed", "rushed_loading_schedule"],
        severity="near_miss",
        narrative_summary="A tanker loading toluene began transfer with a failed grounding connection (GND-CONT: Fail); a visible spark occurred during a rushed changeover but did not ignite vapor.",
        root_cause="Grounding check was a manual pre-transfer step that could be, and was, skipped under schedule pressure.",
        lessons_learned="GND-CONT should gate LOAD-FLOW initiation automatically rather than relying on a human pre-check step.",
        narrative_doc_ref="incident_05",
    ),
    dict(
        incident_number=6, title="Cooling Tower Failure Cascading Event",
        date=dt.date(2023, 5, 9), zone_id="F", zones_involved=["F", "A", "B"],
        hazard_category="cascading_utility_failure",
        contributing_factors=["cooling_tower_fan_motor_failure", "simultaneous_demand_zones_a_and_b", "no_shared_cross_zone_visibility"],
        severity="moderate",
        narrative_summary="A Zone F cooling tower fan failure degraded cooling to both Zone A (COOL-FLOW) and Zone B (COMP-VIB) simultaneously; each zone's operator assumed a local fault for 20 minutes before the shared root cause was found.",
        root_cause="A single utility fault with no shared visibility across the two zones it fed, delaying diagnosis.",
        lessons_learned="Clearest 'no single sensor sees this' case — a utility-block signal degrading two zones at once is only diagnosable via cross-zone correlation.",
        narrative_doc_ref="incident_06",
    ),
    dict(
        incident_number=7, title="Skipped Inerting Cycle Near-Miss",
        date=dt.date(2022, 9, 30), zone_id="K", zones_involved=["K"],
        hazard_category="uncontrolled_venting",
        contributing_factors=["n2_purge_skipped_under_time_pressure", "confined_space_entry_request_pending", "cmms_backlog"],
        severity="near_miss",
        narrative_summary="A confined space entry request was nearly authorized after a nitrogen purge work order was marked complete without the full cycle elapsing; a safety officer caught the discrepancy against the live N2-PURGE log and blocked entry.",
        root_cause="CMMS work-order status and the underlying N2-PURGE system state were treated as equivalent when they are not.",
        lessons_learned="Confined space entry must verify against the live N2-PURGE system state directly, not CMMS status — precedent for hard permit-blocking on skipped inerting.",
        narrative_doc_ref="incident_07",
    ),
    dict(
        incident_number=8, title="Shift Changeover Communication Gap",
        date=dt.date(2023, 2, 14), zone_id="D", zones_involved=["D"],
        hazard_category="process_drift_communication",
        contributing_factors=["incomplete_handover_note", "verbal_only_communication", "no_persistent_flag_on_subthreshold_condition"],
        severity="near_miss",
        narrative_summary="A mildly elevated BLEND-TEMP was mentioned verbally at shift changeover but not logged; the incoming shift didn't recognize a later Warning-range reading as a continuation of the same trend.",
        root_cause="Verbal-only handover of a sub-threshold condition with no persistent record broke temporal continuity across the shift boundary.",
        lessons_learned="Any non-normal trend at changeover should generate a persistent flagged-condition record that carries forward automatically.",
        narrative_doc_ref="incident_08",
    ),
    dict(
        incident_number=9, title="Contractor Unauthorized Zone Entry",
        date=dt.date(2021, 7, 22), zone_id="C", zones_involved=["J", "C"],
        hazard_category="unauthorized_access",
        contributing_factors=["escort_requirement_not_enforced", "badge_scope_mismatch", "no_realtime_permit_location_crosscheck"],
        severity="near_miss",
        narrative_summary="A contractor badged for Zone E was found via CCTV inside the Zone C tank farm without escort or permit; no incident occurred, but the individual had no gas-test awareness for that environment.",
        root_cause="Gate check-in recorded zone authorization, but nothing cross-checked live location against it in real time; detection was reactive (CCTV) rather than proactive.",
        lessons_learned="Worker/contractor location should be continuously cross-checked against active permit zone authorization, alerting on mismatch immediately.",
        narrative_doc_ref="incident_09",
    ),
    dict(
        incident_number=10, title="Fatal Explosion (Composite Pattern)",
        date=dt.date(2018, 4, 11), zone_id="D", zones_involved=["A", "C", "D", "K"],
        hazard_category="vapor_explosion_compound_cascade",
        contributing_factors=[
            "voc_concentration_drift", "hot_work_permit_not_revalidated",
            "overdue_vapor_recovery_maintenance", "workers_present_in_zone",
            "skipped_nitrogen_inerting_cycle",
        ],
        severity="fatal",
        narrative_summary=(
            "A hot work permit issued safe in Zone D was never re-validated as VOC-CONC at the "
            "Zone C/D boundary drifted from Normal to Critical over ~4.5 hours, compounded by "
            "overdue vapor-recovery maintenance in Zone C, workers present for active hot work, "
            "and a silently skipped nitrogen inerting cycle in Zone K. Vapor ignition at 11:24 "
            "caused a flash fire and partial vessel overpressure failure — 3 fatalities, 5 serious injuries."
        ),
        root_cause=(
            "No single signal ever crossed an unambiguous solo threshold in time to trigger a hard stop; "
            "it was the combination of five independent, individually subthreshold-or-normal signals "
            "across four zones that produced a fatal outcome."
        ),
        lessons_learned=(
            "Structural template for the platform's core thesis: compound risk detection must reason "
            "across sensor, permit, maintenance, location, and safety-barrier signals simultaneously. "
            "Continuous cross-referencing would have shown a multi-signal Warning condition by ~10:05, "
            "over an hour before ignition — that lead time is the Compound Risk Detection Engine's value proposition."
        ),
        narrative_doc_ref="incident_10",
    ),
]


def main():
    Base.metadata.create_all(engine)
    session = SessionLocal()
    try:
        if session.query(HistoricalIncident).count() > 0:
            print("Historical incidents already seeded — skipping (delete safety_intelligence.db to reseed).")
            return

        session.add_all(HistoricalIncident(**i) for i in INCIDENTS)
        session.commit()
        print(f"Seeded {len(INCIDENTS)} historical incidents.")
    finally:
        session.close()


if __name__ == "__main__":
    main()
