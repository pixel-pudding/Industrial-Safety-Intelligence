"""
Seeds static reference data: zones, assets, sensor tag thresholds, permit
types, worker roles. Source: SPSCL_Foundation_Design.md Steps 2-6, 10.

Instance-level data (actual sensor readings, permits, worker locations, CMMS
records, CCTV events) is deliberately NOT seeded here — that's Track 2's
simulator (baseline random-walk + scripted scenarios), not static reference
data. This script only creates the tables those readings will reference.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db import engine, SessionLocal
from app.models import Asset, Base, PermitType, SensorTag, WorkerRole, Zone

ZONES = [
    dict(
        id="A", name="Reactor Block",
        purpose="EO/EG production",
        key_data_produced="Reactor temp/pressure, cooling flow, catalyst age, CCTV, operator presence",
        compound_risk_notes="Fed by Zone F cooling; can propagate to Zone C (storage overpressure)",
        possible_hazards="Explosion/runaway, burns",
        failure_modes="Cooling failure, catalyst degradation",
        safety_requirements="Continuous monitoring, cooling redundancy",
    ),
    dict(
        id="B", name="Chlor-Alkali Unit",
        purpose="Electrolysis -> chlorine + caustic",
        key_data_produced="Cell voltage, chlorine concentration, compressor vibration",
        compound_risk_notes="Independent hazard class from A; fed by Zone F power/cooling",
        possible_hazards="Toxic gas release",
        failure_modes="Compressor failure, seal degradation",
        safety_requirements="Gas detection, PPE, evacuation plan",
    ),
    dict(
        id="C", name="Tank Farm",
        purpose="EO/solvent storage",
        key_data_produced="Tank level/pressure, vapor concentration",
        compound_risk_notes="Bridge zone between A and D; receives product from A",
        possible_hazards="Overpressure, vapor explosion",
        failure_modes="Relief valve failure, overfill",
        safety_requirements="Interlocks, vapor detection, hot-work restrictions",
    ),
    dict(
        id="D", name="Solvent Blending & Packaging",
        purpose="Blend/package toluene, MEK",
        key_data_produced="Blend temp, grounding continuity",
        compound_risk_notes="Primary source of \"permit + maintenance\" scenarios",
        possible_hazards="Fire, explosion",
        failure_modes="Static discharge, hot work near vapor",
        safety_requirements="Grounding checks, gas testing before permits",
    ),
    dict(
        id="E", name="Surfactant/Resin Plant",
        purpose="Downstream EO conversion",
        key_data_produced="Dryer temp, batch status",
        compound_risk_notes="Deliberate low-hazard \"control\" zone",
        possible_hazards="Thermal (low severity)",
        failure_modes="Dryer overheat",
        safety_requirements="Standard monitoring",
    ),
    dict(
        id="F", name="Utilities Block",
        purpose="Boilers, compressors, cooling towers, generators",
        key_data_produced="Boiler pressure, cooling tower outlet temp, compressor load",
        compound_risk_notes="Single point of failure affecting multiple zones simultaneously",
        possible_hazards="Cascading utility failure",
        failure_modes="Cooling fouling, compressor overload",
        safety_requirements="Redundant cooling, pressure relief",
    ),
    dict(
        id="G", name="Loading Bay",
        purpose="Tanker loading",
        key_data_produced="Loading flow rate, grounding continuity",
        compound_risk_notes="External-party risk (drivers, static discharge)",
        possible_hazards="Static discharge, spill",
        failure_modes="Grounding/coupling failure",
        safety_requirements="Grounding checks, containment",
    ),
    dict(
        id="H", name="Maintenance Workshop",
        purpose="CMMS + permit issuance origin",
        key_data_produced="Work order status, permit issuance records",
        compound_risk_notes="Upstream source of \"maintenance overdue\" flags site-wide",
        possible_hazards="Indirect (originates elsewhere)",
        failure_modes="Backlog accumulation",
        safety_requirements="CMMS compliance tracking",
    ),
    dict(
        id="I", name="Control Room/Admin",
        purpose="SCADA aggregation, shift handover",
        key_data_produced="Shift logs",
        compound_risk_notes="Consumption point for all agents",
        possible_hazards="N/A — administrative zone",
        failure_modes="N/A",
        safety_requirements="N/A",
    ),
    dict(
        id="J", name="Main Gate/Security",
        purpose="Access control, CCTV hub",
        key_data_produced="Worker/contractor location, check-in/out",
        compound_risk_notes="Source of worker-location and permit-context data",
        possible_hazards="Unauthorized access",
        failure_modes="Check-in bypass",
        safety_requirements="Escort requirements, access logging",
    ),
    dict(
        id="K", name="Flare Stack & Nitrogen Inerting",
        purpose="Emergency venting, vessel purging",
        key_data_produced="Flare gas flow, N2 purge status",
        compound_risk_notes="Silent failure point — only visible when cross-checked with permits",
        possible_hazards="Uncontrolled venting",
        failure_modes="Ignition failure, skipped purge",
        safety_requirements="Mandatory purge verification",
    ),
]

ASSETS = [
    dict(id="A-REACTOR", zone_id="A", name="EO Reactor",
         data_generated="Temp, pressure, catalyst feed",
         influenced_by="Zone F cooling, catalyst age",
         propagates_to="Zone C tank pressure, Zone K flare load"),
    dict(id="A-COOLING-JACKET", zone_id="A", name="Reactor Cooling Jacket",
         data_generated="Coolant flow/temp",
         influenced_by="Zone F cooling tower",
         propagates_to="Reactor (loss of cooling)"),
    dict(id="B-ELECTROLYSIS-CELLS", zone_id="B", name="Electrolysis Cells",
         data_generated="Cell voltage/current",
         influenced_by="Zone F power quality",
         propagates_to="Chlorine compressor load"),
    dict(id="B-CHLORINE-COMPRESSOR", zone_id="B", name="Chlorine Compressor",
         data_generated="Pressure, vibration",
         influenced_by="Zone F cooling water",
         propagates_to="Chlorine storage/release risk"),
    dict(id="C-EO-TANK", zone_id="C", name="EO Storage Tank",
         data_generated="Level, pressure, vapor conc.",
         influenced_by="Zone A output rate",
         propagates_to="Zone D vapor drift, Zone G loading"),
    dict(id="D-BLENDING-VESSEL", zone_id="D", name="Blending Vessel",
         data_generated="Temp, agitator status",
         influenced_by="Zone C feed quality",
         propagates_to="Fire/explosion risk with hot work"),
    dict(id="D-GROUNDING-POINTS", zone_id="D", name="Static Grounding Points",
         data_generated="Continuity pass/fail",
         influenced_by="CMMS schedule",
         propagates_to="Ignition source risk"),
    dict(id="F-COOLING-TOWERS", zone_id="F", name="Cooling Towers",
         data_generated="Outlet temp, fan status",
         influenced_by="Ambient weather",
         propagates_to="Zone A + Zone B cooling simultaneously"),
    dict(id="F-BOILERS-COMPRESSORS", zone_id="F", name="Boilers/Compressors",
         data_generated="Pressure, load, run-hours",
         influenced_by="CMMS intervals",
         propagates_to="Steam/air supply to D, G"),
    dict(id="G-LOADING-ARM", zone_id="G", name="Loading Arm",
         data_generated="Flow rate, coupling status",
         influenced_by="Tank pressure (C)",
         propagates_to="Spill/static discharge"),
    dict(id="H-CMMS-TERMINAL", zone_id="H", name="CMMS Terminal",
         data_generated="Work order/overdue flags",
         influenced_by="(origin)",
         propagates_to="Feeds overdue status to every zone"),
    dict(id="K-FLARE-STACK", zone_id="K", name="Flare Stack",
         data_generated="Gas flow, ignition status",
         influenced_by="Zone A off-gas rate",
         propagates_to="Uncontrolled venting"),
    dict(id="K-N2-MANIFOLD", zone_id="K", name="Nitrogen Inerting Manifold",
         data_generated="Purge cycle status",
         influenced_by="CMMS service",
         propagates_to="Silent safety-barrier failure"),
]

# normal_low, normal_high, warning_low, warning_high, critical_low, critical_high, direction
SENSOR_TAGS = [
    dict(tag="RX-TEMP", zone_id="A", parameter="Reactor temperature", unit="°C",
         normal_low=220, normal_high=260, warning_low=260, warning_high=280,
         critical_low=280, critical_high=None, direction="higher_is_worse"),
    dict(tag="RX-PRESS", zone_id="A", parameter="Reactor pressure", unit="bar",
         normal_low=8, normal_high=12, warning_low=12, warning_high=15,
         critical_low=15, critical_high=None, direction="higher_is_worse"),
    dict(tag="COOL-FLOW", zone_id="A", parameter="Cooling jacket flow", unit="m3/hr",
         normal_low=40, normal_high=60, warning_low=20, warning_high=40,
         critical_low=None, critical_high=20, direction="lower_is_worse"),
    dict(tag="CAT-AGE", zone_id="A", parameter="Catalyst service age", unit="days",
         normal_low=0, normal_high=90, warning_low=90, warning_high=180,
         critical_low=180, critical_high=None, direction="higher_is_worse"),
    dict(tag="CL2-CONC", zone_id="B", parameter="Chlorine concentration", unit="ppm",
         normal_low=0, normal_high=0.5, warning_low=0.5, warning_high=1,
         critical_low=1, critical_high=None, direction="higher_is_worse"),
    dict(tag="CELL-VOLT", zone_id="B", parameter="Cell voltage", unit="V",
         normal_low=3.0, normal_high=3.5, warning_low=3.5, warning_high=4.0,
         critical_low=4.0, critical_high=None, direction="higher_is_worse"),
    dict(tag="COMP-VIB", zone_id="B", parameter="Compressor vibration", unit="mm/s",
         normal_low=0, normal_high=2, warning_low=2, warning_high=7,
         critical_low=7, critical_high=None, direction="higher_is_worse"),
    dict(tag="TK-LEVEL", zone_id="C", parameter="Tank level", unit="%",
         normal_low=30, normal_high=85, warning_low=85, warning_high=95,
         critical_low=95, critical_high=None, direction="higher_is_worse"),
    dict(tag="TK-PRESS", zone_id="C", parameter="Tank pressure", unit="bar",
         normal_low=1, normal_high=3, warning_low=3, warning_high=5,
         critical_low=5, critical_high=None, direction="higher_is_worse"),
    dict(tag="VOC-CONC", zone_id="C", parameter="Vapor concentration", unit="%LEL",
         normal_low=0, normal_high=10, warning_low=10, warning_high=25,
         critical_low=25, critical_high=None, direction="higher_is_worse"),
    dict(tag="BLEND-TEMP", zone_id="D", parameter="Blend vessel temp", unit="°C",
         normal_low=25, normal_high=40, warning_low=40, warning_high=55,
         critical_low=55, critical_high=None, direction="higher_is_worse"),
    dict(tag="GND-CONT", zone_id="D", parameter="Grounding continuity", unit="pass/fail",
         normal_low=None, normal_high=None, warning_low=None, warning_high=None,
         critical_low=None, critical_high=None, direction="binary"),
    dict(tag="DRY-TEMP", zone_id="E", parameter="Dryer temperature", unit="°C",
         normal_low=60, normal_high=90, warning_low=90, warning_high=110,
         critical_low=110, critical_high=None, direction="higher_is_worse"),
    dict(tag="BOIL-PRESS", zone_id="F", parameter="Boiler pressure", unit="bar",
         normal_low=10, normal_high=14, warning_low=14, warning_high=18,
         critical_low=18, critical_high=None, direction="higher_is_worse"),
    dict(tag="CT-OUTTEMP", zone_id="F", parameter="Cooling tower outlet temp", unit="°C",
         normal_low=28, normal_high=32, warning_low=32, warning_high=38,
         critical_low=38, critical_high=None, direction="higher_is_worse"),
    dict(tag="COMP-LOAD", zone_id="F", parameter="Air compressor load", unit="%",
         normal_low=60, normal_high=80, warning_low=80, warning_high=95,
         critical_low=95, critical_high=None, direction="higher_is_worse"),
    dict(tag="LOAD-FLOW", zone_id="G", parameter="Loading arm flow rate", unit="m3/hr",
         normal_low=20, normal_high=40, warning_low=None, warning_high=None,
         critical_low=None, critical_high=None, direction="special"),
    dict(tag="GND-CONT-BAY", zone_id="G", parameter="Grounding continuity (bay)", unit="pass/fail",
         normal_low=None, normal_high=None, warning_low=None, warning_high=None,
         critical_low=None, critical_high=None, direction="binary"),
    dict(tag="FLARE-FLOW", zone_id="K", parameter="Flare gas flow", unit="status",
         normal_low=None, normal_high=None, warning_low=None, warning_high=None,
         critical_low=None, critical_high=None, direction="special"),
    dict(tag="N2-PURGE", zone_id="K", parameter="Nitrogen purge status", unit="status",
         normal_low=None, normal_high=None, warning_low=None, warning_high=None,
         critical_low=None, critical_high=None, direction="special"),
]

WORKER_ROLES = [
    dict(id="plant_operator", name="Plant Operators",
         data_generated="Shift logs, SCADA acknowledgments, location",
         ai_surfaces="Zone-specific risk, recommended process adjustments"),
    dict(id="maintenance_engineer", name="Maintenance Engineers",
         data_generated="CMMS status, service history, permit closures",
         ai_surfaces="Predictive maintenance flags, compounding-risk warnings"),
    dict(id="safety_officer", name="Safety Officers",
         data_generated="Permit approvals, safety walk logs",
         ai_surfaces="Compound risk alerts, evacuation recommendations, evidence packages"),
    dict(id="contractor", name="Contractors",
         data_generated="Check-in/out, permit assignment, location",
         ai_surfaces="Real-time stop-work alerts"),
    dict(id="security_personnel", name="Security Personnel",
         data_generated="CCTV events, gate logs",
         ai_surfaces="Unauthorized access/zone entry alerts"),
    dict(id="shift_supervisor", name="Shift Supervisors",
         data_generated="Handover records, worker allocation",
         ai_surfaces="Cross-shift risk continuity"),
]

PERMIT_TYPES = [
    dict(id="hot_work", name="Hot Work",
         required_when="Welding/cutting/grinding",
         key_data_fields="Zone, time window, gas test at issuance",
         compound_risk_interaction="Cross-checked live against VOC/CL2 readings — conditions can drift after approval"),
    dict(id="confined_space_entry", name="Confined Space Entry",
         required_when="Entry into reactors/tanks",
         key_data_fields="Entrant IDs, gas test, standby attendant",
         compound_risk_interaction="Should require N2-PURGE completion first — a gap here is a key detection target"),
    dict(id="electrical_work", name="Electrical Work",
         required_when="Live/isolated electrical work",
         key_data_fields="Isolation confirmation, LOTO status",
         compound_risk_interaction="Interacts with electrical load/voltage tags"),
    dict(id="excavation", name="Excavation",
         required_when="Digging near utilities",
         key_data_fields="Depth, utility clearance",
         compound_risk_interaction="Low relevance — listed for completeness only"),
    dict(id="working_at_height", name="Working at Height",
         required_when="Elevated tank/structure work",
         key_data_fields="Harness/scaffold inspection",
         compound_risk_interaction="Interacts with evacuation planning"),
    dict(id="general_work", name="General Work",
         required_when="Routine non-hazardous tasks",
         key_data_fields="Task description",
         compound_risk_interaction="Control case — should not be flagged"),
]


def main():
    Base.metadata.create_all(engine)
    session = SessionLocal()
    try:
        if session.query(Zone).count() > 0:
            print("Reference data already seeded — skipping (delete safety_intelligence.db to reseed).")
            return

        session.add_all(Zone(**z) for z in ZONES)
        session.add_all(Asset(**a) for a in ASSETS)
        session.add_all(SensorTag(**s) for s in SENSOR_TAGS)
        session.add_all(WorkerRole(**w) for w in WORKER_ROLES)
        session.add_all(PermitType(**p) for p in PERMIT_TYPES)
        session.commit()

        print(f"Seeded {len(ZONES)} zones, {len(ASSETS)} assets, "
              f"{len(SENSOR_TAGS)} sensor tags, {len(WORKER_ROLES)} worker roles, "
              f"{len(PERMIT_TYPES)} permit types.")
    finally:
        session.close()


if __name__ == "__main__":
    main()
