"""
Compound Risk Detection Engine — rule-based scoring layer.

This is deliberately NOT `if sensor_value > threshold: alert()`. Every zone's
score is built from up to seven independent categories of evidence, most of
which are individually insufficient to trigger an alert on their own (per
the Step 7 design rule for maintenance, and by direct extension to permits,
CCTV, and shift handovers). The point is that the platform reasons across
sensor + permit + CMMS + CCTV + worker location + shift-handover signals,
matching what the Foundation Design's Guiding Principles and the problem
statement's "compound risk detection accuracy vs. single-sensor baselines"
evaluation focus actually require.

Cheap and deterministic by design — runs every tick for every zone. The
LLM reasoning step (agents/llm_client.py, Groq) is only invoked afterward,
and only when this scoring crosses into Warning/Critical, per the
rate-limit design consequence in Part II.
"""

from __future__ import annotations

import datetime as dt

from sqlalchemy.orm import Session

from agents import permit_intelligence
from app.models import Asset, CctvEvent, MaintenanceRecord, Permit, ShiftLog, WorkerLocation
from app.schemas import ContributingSignal

TIER_BASE_SCORE = {"normal": 0, "warning": 55, "critical": 90}
TIER_ORDER = {"normal": 0, "warning": 1, "critical": 2}

# Utility zone F feeds cooling/power to these zones simultaneously (Step 2/3
# propagation table) — the basis for cross-zone cascade detection (Scenario 7).
UTILITY_DEPENDENTS = {"A", "B", "D", "G"}
UTILITY_TAGS = ("CT-OUTTEMP", "BOIL-PRESS", "COMP-LOAD")

CCTV_HARD_CRITICAL = {"fire", "smoke", "oil_leak"}
CCTV_SOFT = {"worker_fallen", "restricted_entry"}

RECENT_WINDOW = dt.timedelta(minutes=30)


def worse_tier(a: str, b: str) -> str:
    return a if TIER_ORDER[a] >= TIER_ORDER[b] else b


def score_zone(
    session: Session,
    zone_id: str,
    zone_tag_tiers: dict[str, str],
    all_zone_tag_tiers: dict[str, dict[str, str]],
    now: dt.datetime,
) -> tuple[float, str, list[ContributingSignal]]:
    """
    zone_tag_tiers: {tag: tier} for this zone's own sensors this tick.
    all_zone_tag_tiers: {zone_id: {tag: tier}} for every zone this tick — needed for cross-zone reads.
    """
    signals: list[ContributingSignal] = []
    score = 0.0
    tier = "normal"

    # 1. This zone's own sensors.
    for tag, t in zone_tag_tiers.items():
        if t == "normal":
            continue
        score += TIER_BASE_SCORE[t]
        tier = worse_tier(tier, t)
        signals.append(ContributingSignal(
            category="sensor", source=tag,
            description=f"{tag} reading in {t.title()} range",
            severity_weight=TIER_BASE_SCORE[t],
        ))
    # Only the worst single-sensor reading should set the base — a zone with
    # two Warning tags isn't automatically Critical from sensors alone.
    sensor_only_score = max([TIER_BASE_SCORE[t] for t in zone_tag_tiers.values()], default=0)
    score = sensor_only_score

    # 2. Cross-zone utility cascade (Scenario 7) — a Zone F fault degrading
    # this zone is informative even though it's not this zone's own equipment.
    if zone_id in UTILITY_DEPENDENTS:
        f_tiers = all_zone_tag_tiers.get("F", {})
        f_worst = "normal"
        for ut in UTILITY_TAGS:
            if ut in f_tiers:
                f_worst = worse_tier(f_worst, f_tiers[ut])
        if f_worst != "normal":
            bump = 15 if f_worst == "warning" else 30
            score += bump
            tier = worse_tier(tier, "warning")
            signals.append(ContributingSignal(
                category="cross_zone_utility", source="Zone F utilities",
                description=f"Zone F utility signal in {f_worst.title()} range is degrading this zone's cooling/power simultaneously",
                severity_weight=bump,
            ))

    # 3. Overdue maintenance — risk MULTIPLIER only, never a standalone trigger.
    if score > 0:
        assets = session.query(Asset).filter(Asset.zone_id == zone_id).all()
        for asset in assets:
            record = (
                session.query(MaintenanceRecord)
                .filter(MaintenanceRecord.asset_id == asset.id, MaintenanceRecord.overdue_days > 0)
                .order_by(MaintenanceRecord.overdue_days.desc())
                .first()
            )
            if record and record.open_work_order_status in ("open", "in_progress"):
                boost = min(record.overdue_days / 100, 0.5)  # up to +50%
                added = score * boost
                score += added
                signals.append(ContributingSignal(
                    category="maintenance_overdue", source=asset.id,
                    description=f"{asset.name} maintenance {record.overdue_days}d overdue ({record.criticality_rating} criticality) — amplifying an already-active sensor signal",
                    severity_weight=added,
                ))

    # 4. Digital Permit Intelligence — a semi-independent agent (Part II)
    # whose flags feed back into this scoring. Deliberately NOT re-deriving
    # gas/purge/isolation logic here; agents/permit_intelligence.py owns that,
    # including which cross-zone tag is relevant to which permit's zone (e.g.
    # a Zone D hot-work permit reads Zone C's VOC-CONC). Only permits actually
    # issued to this zone affect this zone's own score — a "flag" bumps the
    # score, a "block_recommend" is a hard override to Critical regardless of
    # permit type, since by definition it means this permit should not be
    # allowed to continue.
    zone_permits = (
        session.query(Permit)
        .filter(Permit.zone_id == zone_id, Permit.status == "approved", Permit.valid_to > now)
        .all()
    )
    for permit in zone_permits:
        pflag = permit_intelligence.evaluate_permit(permit, all_zone_tag_tiers, now)
        if pflag.flag == "approve":
            continue
        reason_text = "; ".join(pflag.reasons)
        category = "safety_barrier_gap" if permit.permit_type_id == "confined_space_entry" else "permit_drift"
        if pflag.flag == "block_recommend":
            tier = "critical"
            bump = 90
            score = max(score, bump)
        else:  # "flag"
            bump = 45
            score += bump
        signals.append(ContributingSignal(
            category=category, source=f"permit#{permit.id}", description=reason_text, severity_weight=bump,
        ))

    # 5. Worker presence — turns equipment risk into life-safety risk.
    provisional_tier = worse_tier(tier, "warning" if score >= 40 else "normal")
    provisional_tier = worse_tier(provisional_tier, "critical" if score >= 75 else "normal")
    if provisional_tier != "normal":
        worker_count = (
            session.query(WorkerLocation)
            .filter(WorkerLocation.zone_id == zone_id, WorkerLocation.checked_in.is_(True))
            .order_by(WorkerLocation.timestamp.desc())
            .all()
        )
        total_present = sum(w.count for w in worker_count[:6])  # latest row per role, roughly
        if total_present > 0:
            score += 8
            signals.append(ContributingSignal(
                category="worker_presence", source=zone_id,
                description=f"{total_present} worker(s) present in a zone with an active elevated condition",
                severity_weight=8,
            ))

    # 6. CCTV — visual confirmation can override numeric uncertainty.
    recent_events = (
        session.query(CctvEvent)
        .filter(CctvEvent.zone_id == zone_id, CctvEvent.timestamp >= now - RECENT_WINDOW)
        .all()
    )
    for event in recent_events:
        if event.detection_category in CCTV_HARD_CRITICAL:
            tier = "critical"
            score = max(score, 95)
            signals.append(ContributingSignal(
                category="cctv_event", source=event.camera_placement,
                description=f"CCTV detected {event.detection_category.replace('_', ' ')} — visual confirmation",
                severity_weight=95,
            ))
        elif event.detection_category in CCTV_SOFT:
            score += 10
            signals.append(ContributingSignal(
                category="cctv_event", source=event.camera_placement,
                description=f"CCTV detected {event.detection_category.replace('_', ' ')}",
                severity_weight=10,
            ))

    # 7. Shift handover gap — a flagged-but-unescalated condition is itself evidence.
    recent_logs = (
        session.query(ShiftLog)
        .filter(ShiftLog.zone_id == zone_id, ShiftLog.flagged_condition.isnot(None),
                ShiftLog.escalated.is_(False), ShiftLog.timestamp >= now - RECENT_WINDOW)
        .all()
    )
    for log in recent_logs:
        score += 10
        signals.append(ContributingSignal(
            category="shift_handover_gap", source=log.shift_name,
            description=f"Flagged condition '{log.flagged_condition}' carried across shift change without formal escalation",
            severity_weight=10,
        ))

    # Final tier from composite score, respecting any hard override already set.
    if tier != "critical":
        if score >= 75:
            tier = "critical"
        elif score >= 40:
            tier = worse_tier(tier, "warning")

    return round(score, 1), tier, signals
