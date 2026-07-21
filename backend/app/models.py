"""
SQLAlchemy models for the SPSCL Industrial Safety Intelligence platform.

Maps directly to SPSCL_Foundation_Design.md Part II ("Data Schema (PostgreSQL)").
Running on SQLite for this build (see backend/.env.example) — the JSON columns
below use SQLAlchemy's generic JSON type, which serializes transparently to
TEXT on SQLite and would map straight to JSONB on Postgres with zero code
changes, so this stays a drop-in swap if the project ever moves databases.

Additions beyond the Part II table list, each covering a named build-plan
requirement rather than a speculative extension:
  - SensorTag: Step 4's tag/threshold table. sensor_readings needs a value to
    compare against a tier, and Track 2 (simulator) needs Step 4's Normal/
    Warning/Critical ranges to generate readings from — that data has to live
    somewhere, and this is it.
  - PermitType, WorkerRole: Step 6 and Step 5 reference tables. The build plan
    explicitly calls for seeding "permit types, worker roles" as static
    reference data, which requires tables to seed into.
  - ShiftLog: Step 11 Scenario 9 ("Shift changeover: flagged condition not
    escalated") depends on shift handover records, which no table in the
    Part II list covers. Added narrowly for that scenario.
"""

from __future__ import annotations

import datetime as dt

from sqlalchemy import JSON, Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


# ---------------------------------------------------------------------------
# Reference / static data
# ---------------------------------------------------------------------------


class Zone(Base):
    """The 10 factory zones (Step 2) plus hazard-map fields (Step 10)."""

    __tablename__ = "zones"

    id: Mapped[str] = mapped_column(String(2), primary_key=True)  # "A".."K"
    name: Mapped[str] = mapped_column(String(64))
    purpose: Mapped[str] = mapped_column(Text)
    key_data_produced: Mapped[str] = mapped_column(Text)
    compound_risk_notes: Mapped[str] = mapped_column(Text)
    possible_hazards: Mapped[str] = mapped_column(Text)
    failure_modes: Mapped[str] = mapped_column(Text)
    safety_requirements: Mapped[str] = mapped_column(Text)


class Asset(Base):
    """Key equipment per zone (Step 3)."""

    __tablename__ = "assets"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)  # e.g. "A-REACTOR"
    zone_id: Mapped[str] = mapped_column(ForeignKey("zones.id"))
    name: Mapped[str] = mapped_column(String(128))
    data_generated: Mapped[str] = mapped_column(Text)
    influenced_by: Mapped[str] = mapped_column(Text)
    propagates_to: Mapped[str] = mapped_column(Text)


class SensorTag(Base):
    """SCADA/IoT tag definitions and 3-tier thresholds (Step 4)."""

    __tablename__ = "sensor_tags"

    tag: Mapped[str] = mapped_column(String(16), primary_key=True)  # e.g. "RX-TEMP"
    zone_id: Mapped[str] = mapped_column(ForeignKey("zones.id"))
    parameter: Mapped[str] = mapped_column(String(64))
    unit: Mapped[str] = mapped_column(String(16))
    # Numeric ranges; null where the tag is non-numeric (GND-CONT: pass/fail,
    # N2-PURGE: completed/delayed/skipped, FLARE-FLOW: baseline/elevated/high).
    normal_low: Mapped[float | None] = mapped_column(Float, nullable=True)
    normal_high: Mapped[float | None] = mapped_column(Float, nullable=True)
    warning_low: Mapped[float | None] = mapped_column(Float, nullable=True)
    warning_high: Mapped[float | None] = mapped_column(Float, nullable=True)
    critical_low: Mapped[float | None] = mapped_column(Float, nullable=True)
    critical_high: Mapped[float | None] = mapped_column(Float, nullable=True)
    # "higher_is_worse" (e.g. RX-TEMP), "lower_is_worse" (e.g. COOL-FLOW),
    # "binary" (GND-CONT), "special" (FLARE-FLOW / N2-PURGE — status strings,
    # not thresholds; the simulator handles these as scripted state changes).
    direction: Mapped[str] = mapped_column(String(16))


class WorkerRole(Base):
    """Worker roles and what the AI surfaces to each (Step 5)."""

    __tablename__ = "worker_roles"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)  # e.g. "safety_officer"
    name: Mapped[str] = mapped_column(String(64))
    data_generated: Mapped[str] = mapped_column(Text)
    ai_surfaces: Mapped[str] = mapped_column(Text)


class PermitType(Base):
    """Permit-to-Work types (Step 6)."""

    __tablename__ = "permit_types"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)  # e.g. "hot_work"
    name: Mapped[str] = mapped_column(String(64))
    required_when: Mapped[str] = mapped_column(Text)
    key_data_fields: Mapped[str] = mapped_column(Text)
    compound_risk_interaction: Mapped[str] = mapped_column(Text)


# ---------------------------------------------------------------------------
# Time-series / event data
# ---------------------------------------------------------------------------


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tag: Mapped[str] = mapped_column(ForeignKey("sensor_tags.tag"))
    zone_id: Mapped[str] = mapped_column(ForeignKey("zones.id"))
    value: Mapped[float] = mapped_column(Float)
    tier: Mapped[str] = mapped_column(String(8))  # normal | warning | critical
    timestamp: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)


class WorkerLocation(Base):
    __tablename__ = "worker_locations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    zone_id: Mapped[str] = mapped_column(ForeignKey("zones.id"))
    role_id: Mapped[str] = mapped_column(ForeignKey("worker_roles.id"))
    count: Mapped[int] = mapped_column(Integer)
    checked_in: Mapped[bool] = mapped_column(Boolean, default=True)
    timestamp: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)


class Permit(Base):
    """
    Digital Permit-to-Work record.

    extra_fields holds permit-type-specific data instead of a sparse wide
    table (most fields only apply to one or two of the six permit types).
    Expected keys per permit_type_id are documented in backend/README.md.
    """

    __tablename__ = "permits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    permit_type_id: Mapped[str] = mapped_column(ForeignKey("permit_types.id"))
    zone_id: Mapped[str] = mapped_column(ForeignKey("zones.id"))
    status: Mapped[str] = mapped_column(String(24))  # approved | flagged | block_recommended | closed
    issued_by: Mapped[str] = mapped_column(String(64))
    issued_at: Mapped[dt.datetime] = mapped_column(DateTime)
    valid_from: Mapped[dt.datetime] = mapped_column(DateTime)
    valid_to: Mapped[dt.datetime] = mapped_column(DateTime)
    gas_test_ppm: Mapped[float | None] = mapped_column(Float, nullable=True)
    gas_test_pass: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    extra_fields: Mapped[dict] = mapped_column(JSON, default=dict)


class MaintenanceRecord(Base):
    """CMMS record (Step 7). Feeds risk scoring as a multiplier, never a standalone trigger."""

    __tablename__ = "maintenance_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    asset_id: Mapped[str] = mapped_column(ForeignKey("assets.id"))
    scheduling_type: Mapped[str] = mapped_column(String(24))  # preventive | condition_based | reactive
    last_service_date: Mapped[dt.date] = mapped_column(Date)
    scheduled_interval_days: Mapped[int] = mapped_column(Integer)
    overdue_days: Mapped[int] = mapped_column(Integer, default=0)
    criticality_rating: Mapped[str] = mapped_column(String(16))  # low | medium | high | critical
    open_work_order_status: Mapped[str] = mapped_column(String(16))  # none | open | in_progress | closed


class CctvEvent(Base):
    __tablename__ = "cctv_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    zone_id: Mapped[str] = mapped_column(ForeignKey("zones.id"))
    camera_placement: Mapped[str] = mapped_column(String(64))
    # ppe | fire | smoke | oil_leak | worker_fallen | restricted_entry
    detection_category: Mapped[str] = mapped_column(String(24))
    confidence: Mapped[float] = mapped_column(Float)
    details: Mapped[str] = mapped_column(Text)
    timestamp: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)


class ShiftLog(Base):
    """Not in the Part II table list — added for Scenario 9 (see module docstring)."""

    __tablename__ = "shift_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    shift_name: Mapped[str] = mapped_column(String(32))  # e.g. "Shift A (Morning)"
    zone_id: Mapped[str] = mapped_column(ForeignKey("zones.id"))
    supervisor: Mapped[str] = mapped_column(String(64))
    handover_notes: Mapped[str] = mapped_column(Text)
    flagged_condition: Mapped[str | None] = mapped_column(Text, nullable=True)
    escalated: Mapped[bool] = mapped_column(Boolean, default=False)
    timestamp: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)


class RiskEvent(Base):
    """
    The agent handoff object (Part II orchestration contract):
    { zone, timestamp, risk_score, tier, contributing_signals, triggered_agents }
    """

    __tablename__ = "risk_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    zone_id: Mapped[str] = mapped_column(ForeignKey("zones.id"))
    timestamp: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)
    risk_score: Mapped[float] = mapped_column(Float)
    tier: Mapped[str] = mapped_column(String(8))  # normal | warning | critical
    contributing_signals: Mapped[list] = mapped_column(JSON, default=list)
    triggered_agents: Mapped[list] = mapped_column(JSON, default=list)


class EmergencyResponse(Base):
    """
    Emergency Response Orchestrator output. Not in the Part II table list —
    added because this agent (Part II: "evacuation protocol, alert dispatch,
    evidence preservation, preliminary report") is the first one that writes
    an action rather than a score or a retrieval result, and Track 4's
    Recommended Interventions panel needs a persisted row to read, not a
    value computed fresh on every request. See agents/emergency_response.py.
    """

    __tablename__ = "emergency_responses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    risk_event_id: Mapped[int] = mapped_column(ForeignKey("risk_events.id"))
    zone_id: Mapped[str] = mapped_column(ForeignKey("zones.id"))
    triggered_at: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)
    evacuation_zones: Mapped[list] = mapped_column(JSON, default=list)
    alert_recipients: Mapped[list] = mapped_column(JSON, default=list)  # [{role, zone, message}]
    evidence_snapshot: Mapped[dict] = mapped_column(JSON, default=dict)  # frozen state at trigger time
    preliminary_report: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(16), default="dispatched")  # dispatched | acknowledged | resolved


class HistoricalIncident(Base):
    """
    Structured fields (Step 9). Full narrative + root cause / lessons learned
    live as documents in ChromaDB (see backend/rag/); narrative_doc_ref is the
    bridge so the RAG agent can filter structurally first, then retrieve
    semantically, per Part II's data-schema note.
    """

    __tablename__ = "historical_incidents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    incident_number: Mapped[int] = mapped_column(Integer)  # 1-10, matches Step 9 list order
    title: Mapped[str] = mapped_column(String(128))
    date: Mapped[dt.date] = mapped_column(Date)
    zone_id: Mapped[str | None] = mapped_column(ForeignKey("zones.id"), nullable=True)
    zones_involved: Mapped[list] = mapped_column(JSON, default=list)  # for cross-zone incidents
    hazard_category: Mapped[str] = mapped_column(String(64))
    contributing_factors: Mapped[list] = mapped_column(JSON, default=list)
    severity: Mapped[str] = mapped_column(String(16))  # near_miss | minor | moderate | major | fatal
    narrative_summary: Mapped[str] = mapped_column(Text)
    root_cause: Mapped[str] = mapped_column(Text)
    lessons_learned: Mapped[str] = mapped_column(Text)
    narrative_doc_ref: Mapped[str] = mapped_column(String(32))  # ChromaDB doc id, e.g. "incident_10"
