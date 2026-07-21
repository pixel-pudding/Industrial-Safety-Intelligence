"""
Geospatial Safety Heatmap Agent.

Per Part II: continuous, consumes location + risk scores; output is a live
zone-by-zone visualization. Per the build plan: "mostly a data-shaping layer
over existing risk scores + locations" — deliberately NOT a place for new
reasoning. Matches the problem statement's own explicit criteria for this
agent: "integrating worker location data, hazardous area classifications,
and active permit overlaps."

Every field this module produces is sourced from something another agent (or
Track 1's static reference data) already computed:
  - risk_tier / risk_score / signal_categories come from the Detection
    Engine's per-tick rule_engine.score_zone() result, passed in by the
    caller (simulator/tick_engine.py) — NOT recomputed here. This module
    never imports rule_engine.
  - active_permits comes from Digital Permit Intelligence's own flags,
    also passed in — this module never imports Permit or re-derives a
    gas/purge/isolation check.
  - hazard_classification is Track 1's static Zone.possible_hazards field.
  - worker_count is a plain aggregation of WorkerLocation rows — a count,
    not a judgment about whether that count matters to a risk score (that
    judgment already happened in rule_engine's worker_presence signal).

If a future change ever needs this module to import rule_engine or Permit
directly, that's a sign the reshaping boundary has been violated — pull the
existing agent's output through the caller instead.
"""

from __future__ import annotations

import datetime as dt

from sqlalchemy.orm import Session

from app.models import WorkerLocation, Zone
from app.schemas import ContributingSignal, GeospatialHeatmap, PermitFlag, Tier, ZoneHeatmapEntry


def _worker_count(session: Session, zone_id: str) -> int:
    """Latest checked-in count per role in this zone, summed. Pure aggregation."""
    rows = (
        session.query(WorkerLocation)
        .filter(WorkerLocation.zone_id == zone_id, WorkerLocation.checked_in.is_(True))
        .order_by(WorkerLocation.timestamp.desc())
        .all()
    )
    seen_roles: set[str] = set()
    total = 0
    for w in rows:
        if w.role_id in seen_roles:
            continue
        seen_roles.add(w.role_id)
        total += w.count
    return total


def build_heatmap(
    session: Session,
    zone_states: dict[str, tuple[float, Tier, list[ContributingSignal]]],
    permit_flags: list[PermitFlag],
    now: dt.datetime,
) -> GeospatialHeatmap:
    flags_by_zone: dict[str, list[PermitFlag]] = {}
    for f in permit_flags:
        flags_by_zone.setdefault(f.zone_id, []).append(f)

    entries = []
    for zone in session.query(Zone).all():
        score, tier, signals = zone_states.get(zone.id, (0.0, "normal", []))
        entries.append(ZoneHeatmapEntry(
            zone_id=zone.id, zone_name=zone.name, hazard_classification=zone.possible_hazards,
            risk_tier=tier, risk_score=score, worker_count=_worker_count(session, zone.id),
            active_permits=[
                {"permit_id": f.permit_id, "permit_type_id": f.permit_type_id, "flag": f.flag}
                for f in flags_by_zone.get(zone.id, [])
            ],
            signal_categories=sorted({s.category for s in signals}),
        ))

    return GeospatialHeatmap(timestamp=now, zones=entries)
