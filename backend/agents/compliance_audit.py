"""
Quality & Compliance Audit Agent.

Per Part II: triggered by schedule (daily) + CMMS/permit anomaly, NOT
continuously — a deliberately different cadence from the other five agents,
and per the build plan the lowest-priority, most cuttable agent in the
roster ("build only after 1-5 are demo-ready"). Output is a compliance gap
report vs. OISD/Factory Act.

Bolt-on by design, checked deliberately rather than assumed:
  - run_audit() takes only a session and a timestamp — no TickEngine
    reference, no dependency on a scenario being active or any other
    agent's live output. It can run with zero sensors ever having ticked.
  - Nothing else in the codebase imports this module. rule_engine,
    permit_intelligence, geospatial_heatmap, emergency_response, and
    main.py's tick broadcast all function identically whether or not this
    agent, its table, or its endpoint exist. If this were cut from the
    final demo, deleting this file and the /api/compliance-audit route
    would be the entire removal — no other agent's behavior would change.
  - It DOES reuse incident_pattern_intelligence.lookup_regulatory_by_text
    rather than opening its own Chroma connection to the regulatory
    collection — the "call an existing agent's function, don't duplicate
    it" discipline applies here too, even though this agent runs standalone.

This is also the agent Step 12 explicitly flags as having the weakest
existing coverage ("Zone F/CMMS — weakest coverage so far"), which is why
its primary focus is a plant-wide CMMS sweep — not zone-scored like
rule_engine's maintenance-as-multiplier check, but a full audit across every
asset regardless of whether that zone currently has an active sensor
signal. It also catches a gap Digital Permit Intelligence's continuous
check structurally cannot: permit_intelligence.evaluate_active_permits()
only ever looks at permits with valid_to > now, so a permit that expired
and was never administratively closed is invisible to the continuous path.
This periodic sweep is precisely where that kind of gap is meant to surface.
"""

from __future__ import annotations

import datetime as dt

from sqlalchemy.orm import Session

from agents.incident_pattern_intelligence import lookup_regulatory_by_text
from app.models import Asset, MaintenanceRecord, Permit
from app.schemas import ComplianceAuditReport, ComplianceGap

# Criticality-weighted overdue policy: critical/high assets are a gap the
# moment they're overdue at all; medium/low assets get a 30-day grace period
# before the same overdue status counts as a compliance gap rather than
# routine scheduling slack.
IMMEDIATE_GAP_CRITICALITY = {"critical", "high"}
GRACE_DAYS_FOR_OTHERS = 30


def _maintenance_gaps(session: Session) -> list[ComplianceGap]:
    gaps = []
    records = (
        session.query(MaintenanceRecord)
        .filter(MaintenanceRecord.overdue_days > 0, MaintenanceRecord.open_work_order_status.in_(["open", "in_progress"]))
        .all()
    )
    for record in records:
        is_gap = (
            record.criticality_rating in IMMEDIATE_GAP_CRITICALITY
            or record.overdue_days > GRACE_DAYS_FOR_OTHERS
        )
        if not is_gap:
            continue
        asset = session.query(Asset).filter(Asset.id == record.asset_id).first()
        if asset is None:
            continue
        query = f"preventive maintenance interval compliance for overdue {record.criticality_rating}-criticality industrial equipment"
        matches = lookup_regulatory_by_text(query, n_results=1)
        gaps.append(ComplianceGap(
            category="maintenance_overdue", zone_id=asset.zone_id, source=asset.id,
            description=f"{asset.name} ({record.criticality_rating} criticality) {record.overdue_days}d overdue, "
                        f"work order {record.open_work_order_status}.",
            regulatory_match=matches[0] if matches else None,
        ))
    return gaps


def _permit_gaps(session: Session, now: dt.datetime) -> list[ComplianceGap]:
    gaps = []
    expired = session.query(Permit).filter(Permit.status == "approved", Permit.valid_to < now).all()
    for permit in expired:
        query = "permit validity expired without revalidation or closure"
        matches = lookup_regulatory_by_text(query, n_results=1)
        overdue_days = (now - permit.valid_to).days
        gaps.append(ComplianceGap(
            category="permit_expired_not_closed", zone_id=permit.zone_id, source=f"permit#{permit.id}",
            description=f"{permit.permit_type_id} permit expired {overdue_days}d ago, still marked 'approved' "
                        f"rather than closed.",
            regulatory_match=matches[0] if matches else None,
        ))
    return gaps


def run_audit(session: Session, now: dt.datetime, triggered_by: str = "manual") -> ComplianceAuditReport:
    gaps = _maintenance_gaps(session) + _permit_gaps(session, now)

    if gaps:
        weak_citations = sum(1 for g in gaps if not g.regulatory_match or g.regulatory_match.confidence_band == "low")
        summary = (
            f"{len(gaps)} compliance gap(s) found across {len({g.zone_id for g in gaps})} zone(s). "
            f"{len(gaps) - weak_citations} have a moderate-or-better regulatory match; "
            f"{weak_citations} do not — reported as gaps regardless, not suppressed for lack of a clean citation."
        )
    else:
        summary = "No compliance gaps found."

    return ComplianceAuditReport(run_at=now, triggered_by=triggered_by, gaps=gaps, gap_count=len(gaps), summary=summary)
