"""
Seeds baseline *operating state* — CMMS records, closed historical permits,
routine worker presence — as opposed to Track 1's static reference data.

Scope note: Part II's Track 1 only calls for seeding zones/assets/permit
types/worker roles; CMMS/permits/worker-location rows are instance data the
simulator needs a starting point for, so that lives here in Track 2 rather
than in seed/seed_reference.py. Two maintenance records are deliberately
overdue on purpose:
  - C-EO-TANK: 41 days overdue, open work order — the compound-risk input
    Scenario 4 and the flagship Scenario 10 read (mirrors Incident 03/10).
  - F-BOILERS-COMPRESSORS: 15 days overdue — Scenario 3's "overdue alone,
    no other signal, should not alert" control case.
Everything else starts within its normal service interval.
"""

import datetime as dt
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db import SessionLocal, engine
from app.models import Base, CctvEvent, MaintenanceRecord, Permit, ShiftLog, WorkerLocation
from app.models import EmergencyResponse as EmergencyResponseModel
from app.models import RiskEvent as RiskEventModel
from app.models import SensorReading

NOW = dt.datetime(2026, 7, 20, 6, 0, 0)  # simulator baseline reference time (shift start)

MAINTENANCE = [
    dict(asset_id="A-REACTOR", scheduling_type="preventive", last_service_date=NOW.date() - dt.timedelta(days=30),
         scheduled_interval_days=90, overdue_days=0, criticality_rating="critical", open_work_order_status="closed"),
    dict(asset_id="A-COOLING-JACKET", scheduling_type="preventive", last_service_date=NOW.date() - dt.timedelta(days=20),
         scheduled_interval_days=60, overdue_days=0, criticality_rating="high", open_work_order_status="closed"),
    dict(asset_id="B-ELECTROLYSIS-CELLS", scheduling_type="condition_based", last_service_date=NOW.date() - dt.timedelta(days=45),
         scheduled_interval_days=120, overdue_days=0, criticality_rating="high", open_work_order_status="closed"),
    dict(asset_id="B-CHLORINE-COMPRESSOR", scheduling_type="condition_based", last_service_date=NOW.date() - dt.timedelta(days=10),
         scheduled_interval_days=30, overdue_days=0, criticality_rating="critical", open_work_order_status="closed"),
    dict(asset_id="C-EO-TANK", scheduling_type="preventive", last_service_date=NOW.date() - dt.timedelta(days=71),
         scheduled_interval_days=30, overdue_days=41, criticality_rating="high", open_work_order_status="open"),
    dict(asset_id="D-BLENDING-VESSEL", scheduling_type="preventive", last_service_date=NOW.date() - dt.timedelta(days=15),
         scheduled_interval_days=60, overdue_days=0, criticality_rating="medium", open_work_order_status="closed"),
    dict(asset_id="D-GROUNDING-POINTS", scheduling_type="preventive", last_service_date=NOW.date() - dt.timedelta(days=25),
         scheduled_interval_days=30, overdue_days=0, criticality_rating="medium", open_work_order_status="closed"),
    dict(asset_id="F-COOLING-TOWERS", scheduling_type="preventive", last_service_date=NOW.date() - dt.timedelta(days=40),
         scheduled_interval_days=45, overdue_days=0, criticality_rating="high", open_work_order_status="closed"),
    dict(asset_id="F-BOILERS-COMPRESSORS", scheduling_type="preventive", last_service_date=NOW.date() - dt.timedelta(days=95),
         scheduled_interval_days=80, overdue_days=15, criticality_rating="medium", open_work_order_status="open"),
    dict(asset_id="G-LOADING-ARM", scheduling_type="preventive", last_service_date=NOW.date() - dt.timedelta(days=20),
         scheduled_interval_days=45, overdue_days=0, criticality_rating="medium", open_work_order_status="closed"),
    dict(asset_id="H-CMMS-TERMINAL", scheduling_type="preventive", last_service_date=NOW.date() - dt.timedelta(days=5),
         scheduled_interval_days=180, overdue_days=0, criticality_rating="low", open_work_order_status="closed"),
    dict(asset_id="K-FLARE-STACK", scheduling_type="preventive", last_service_date=NOW.date() - dt.timedelta(days=60),
         scheduled_interval_days=90, overdue_days=0, criticality_rating="high", open_work_order_status="closed"),
    dict(asset_id="K-N2-MANIFOLD", scheduling_type="condition_based", last_service_date=NOW.date() - dt.timedelta(days=30),
         scheduled_interval_days=60, overdue_days=0, criticality_rating="critical", open_work_order_status="closed"),
]

# A handful of closed, expired general-work permits so the permits table isn't empty at t=0.
# Scenarios issue their own hot_work / confined_space_entry permits live.
CLOSED_PERMITS = [
    dict(permit_type_id="general_work", zone_id="E", status="closed", issued_by="R. Deshpande",
         issued_at=NOW - dt.timedelta(days=1, hours=2), valid_from=NOW - dt.timedelta(days=1, hours=2),
         valid_to=NOW - dt.timedelta(days=1), gas_test_ppm=None, gas_test_pass=None,
         extra_fields={"task_description": "Routine dryer housekeeping"}),
    dict(permit_type_id="general_work", zone_id="H", status="closed", issued_by="R. Deshpande",
         issued_at=NOW - dt.timedelta(hours=20), valid_from=NOW - dt.timedelta(hours=20),
         valid_to=NOW - dt.timedelta(hours=12), gas_test_ppm=None, gas_test_pass=None,
         extra_fields={"task_description": "CMMS terminal software update"}),
]

WORKER_LOCATIONS = [
    ("A", "plant_operator", 2), ("A", "maintenance_engineer", 1),
    ("B", "plant_operator", 2),
    ("C", "plant_operator", 1),
    ("D", "plant_operator", 1), ("D", "contractor", 1),
    ("E", "plant_operator", 2),
    ("F", "maintenance_engineer", 2),
    ("G", "contractor", 1),
    ("H", "maintenance_engineer", 2),
    ("I", "shift_supervisor", 1), ("I", "safety_officer", 1), ("I", "plant_operator", 1),
    ("J", "security_personnel", 2),
    ("K", "plant_operator", 0),
]


def reset_instance_state(session) -> None:
    """
    Restores operating state to the exact baseline every time — called by
    TickEngine.reset_to_baseline() before each scenario run, not just once at
    setup. Without this, a second take of the same scenario (or any scenario
    run after another) would find the first take's permits/CMMS-overdue/
    worker-location changes still sitting in SQLite and compound on top of
    them, which breaks the "manual trigger, clean re-recordable replay"
    requirement (Part II) — each take needs to start from the same clean
    slate as the first, found via repeated manual test runs during Track 3
    build, not by inspection.
    """
    # EmergencyResponse FK-references risk_events, so it must be cleared before
    # RiskEventModel — SQLite doesn't enforce FK ordering by default (no PRAGMA
    # foreign_keys=ON in app/db.py), so this wouldn't error either way, but the
    # ordering keeps intent clear.
    session.query(EmergencyResponseModel).delete()
    session.query(Permit).delete()
    session.query(CctvEvent).delete()
    session.query(ShiftLog).delete()
    session.query(RiskEventModel).delete()
    session.query(SensorReading).delete()
    session.query(MaintenanceRecord).delete()
    session.query(WorkerLocation).delete()

    session.add_all(MaintenanceRecord(**m) for m in MAINTENANCE)
    session.add_all(Permit(**p) for p in CLOSED_PERMITS)
    session.add_all(
        WorkerLocation(zone_id=z, role_id=r, count=c, checked_in=True, timestamp=NOW)
        for z, r, c in WORKER_LOCATIONS
    )
    session.commit()


def main():
    Base.metadata.create_all(engine)
    session = SessionLocal()
    try:
        if session.query(MaintenanceRecord).count() > 0:
            print("Baseline instance state already seeded — skipping (delete safety_intelligence.db to reseed).")
            return

        reset_instance_state(session)
        print(f"Seeded {len(MAINTENANCE)} maintenance records, {len(CLOSED_PERMITS)} closed permits, "
              f"{len(WORKER_LOCATIONS)} worker location rows.")
    finally:
        session.close()


if __name__ == "__main__":
    main()
