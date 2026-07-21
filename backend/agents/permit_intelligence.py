"""
Digital Permit Intelligence Agent.

Per Part II: triggered by permit issuance + continuous re-check; output is a
permit risk flag (approve / flag / block_recommend). Step 6's core design
principle is the whole reason this agent exists as its own thing rather than
being folded into the ePTW issuance step: "permits are validated at issuance
only; the AI's job is to detect when conditions drift dangerous *after*
approval — this is the gap existing ePTW systems don't cover."

This module is called from two places:
  - agents/rule_engine.py, which turns flags into contributing_signals for
    zone-level scoring (the "semi-independent, feeds back into the Detection
    Engine's scoring" relationship Part II specifies) — rule_engine does NOT
    re-derive gas/purge/isolation logic itself, it calls this.
  - main.py's /api/permits/flags and the tick payload, for a live permit-
    status view independent of whether a zone's overall tier has changed.
"""

from __future__ import annotations

import datetime as dt

from sqlalchemy.orm import Session

from app.models import Permit
from app.schemas import PermitFlag

# Gas-hazard tag relevant to each permit zone's hot-work cross-check: (zone the
# tag actually belongs to, tag name). VOC-CONC is physically a Zone C tag but
# is also the correct live check for a Zone D hot-work permit — Zone C is the
# bridge/source zone for Zone D per Step 2.
ZONE_GAS_CHECK = {"C": ("C", "VOC-CONC"), "D": ("C", "VOC-CONC"), "B": ("B", "CL2-CONC")}


def _check_hot_work(permit: Permit, all_zone_tag_tiers: dict, now: dt.datetime) -> tuple[str, list[str]]:
    if now > permit.valid_to:
        return "flag", ["Permit past its validity window — OISD-STD-105 requires shift-scoped revalidation, not indefinite validity."]

    gas_check = ZONE_GAS_CHECK.get(permit.zone_id)
    if not gas_check:
        return "approve", []
    source_zone, tag = gas_check
    tier = all_zone_tag_tiers.get(source_zone, {}).get(tag, "normal")
    if tier == "critical":
        return "block_recommend", [f"{tag} in Critical range since this permit was approved — the gas test at issuance no longer reflects live conditions."]
    if tier == "warning":
        return "flag", [f"{tag} has drifted to Warning since this permit was approved — re-test required before work continues."]
    return "approve", []


def _check_confined_space_entry(permit: Permit, all_zone_tag_tiers: dict, now: dt.datetime) -> tuple[str, list[str]]:
    if now > permit.valid_to:
        return "flag", ["Permit past its validity window."]

    n2_confirmed = bool(permit.extra_fields.get("n2_purge_confirmed", False))
    n2_tier = all_zone_tag_tiers.get("K", {}).get("N2-PURGE", "normal") if permit.zone_id == "K" else "normal"

    if not n2_confirmed and n2_tier != "normal":
        return "block_recommend", ["Nitrogen purge not confirmed complete, and live N2-PURGE status is not Normal (Factories Act s.36(2) gas-free prerequisite)."]
    if not n2_confirmed:
        return "flag", ["Nitrogen purge not confirmed complete in the permit record — verify before entry."]
    return "approve", []


def _check_electrical_work(permit: Permit, all_zone_tag_tiers: dict, now: dt.datetime) -> tuple[str, list[str]]:
    if not permit.extra_fields.get("isolation_confirmed", False):
        return "block_recommend", ["Electrical work permit active without confirmed isolation."]
    if permit.extra_fields.get("loto_status") != "applied":
        return "flag", ["LOTO not confirmed applied."]
    return "approve", []


def _check_working_at_height(permit: Permit, all_zone_tag_tiers: dict, now: dt.datetime) -> tuple[str, list[str]]:
    reasons = []
    if not permit.extra_fields.get("harness_inspected", False):
        reasons.append("Harness inspection not confirmed.")
    if not permit.extra_fields.get("scaffold_inspected", False):
        reasons.append("Scaffold inspection not confirmed.")
    return ("flag", reasons) if reasons else ("approve", [])


def _check_excavation(permit: Permit, all_zone_tag_tiers: dict, now: dt.datetime) -> tuple[str, list[str]]:
    # Step 6: "Low relevance — listed for completeness only."
    if not permit.extra_fields.get("utility_clearance_confirmed", False):
        return "flag", ["Utility clearance not confirmed."]
    return "approve", []


def _check_general_work(permit: Permit, all_zone_tag_tiers: dict, now: dt.datetime) -> tuple[str, list[str]]:
    # Step 6: "Control case — should not be flagged." Deliberately unconditional.
    return "approve", []


CHECKS = {
    "hot_work": _check_hot_work,
    "confined_space_entry": _check_confined_space_entry,
    "electrical_work": _check_electrical_work,
    "working_at_height": _check_working_at_height,
    "excavation": _check_excavation,
    "general_work": _check_general_work,
}


def evaluate_permit(permit: Permit, all_zone_tag_tiers: dict, now: dt.datetime) -> PermitFlag:
    check = CHECKS.get(permit.permit_type_id, _check_general_work)
    flag, reasons = check(permit, all_zone_tag_tiers, now)
    return PermitFlag(
        permit_id=permit.id, permit_type_id=permit.permit_type_id, zone_id=permit.zone_id,
        flag=flag, reasons=reasons, checked_at=now,
    )


def evaluate_active_permits(session: Session, all_zone_tag_tiers: dict, now: dt.datetime) -> list[PermitFlag]:
    active = session.query(Permit).filter(Permit.status == "approved", Permit.valid_to > now).all()
    return [evaluate_permit(p, all_zone_tag_tiers, now) for p in active]
