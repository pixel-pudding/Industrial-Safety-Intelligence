"""
AI Safety Copilot chat.

Scoped, explicit exception to "don't touch backend/" made during Track 4
frontend recovery (not Track 3 — logged in backend/README.md so this
doesn't need rediscovering later): the frontend's Safety Copilot panel has
no other way to be genuinely LLM-backed, since every other Track 3 agent is
tick-driven or REST, not conversational. Reuses llm_client.py's model
config and graceful-fallback discipline rather than duplicating the Groq
call or its degradation behavior.

Rate-limit discipline, same reasoning as tick_engine.py's "only call the
LLM on an actual tier transition": this endpoint draws from the same Groq
free-tier quota as the Compound Risk Detection Engine's Warning/Critical
reasoning calls. A chat message must not compete with an in-progress
scenario's agent invocations for no reason. So the LLM is only called as a
last resort — most questions (zone status, active permits, "why is this
critical", "show evidence") are answered directly from structured context
already in the database, no LLM call at all. Only genuinely open-ended
questions the local matcher can't classify fall through to Groq, and only
if a key is configured.
"""

from __future__ import annotations

import os
import re

from sqlalchemy.orm import Session

from agents.llm_client import call_llm
from app.models import Permit, Zone
from app.models import RiskEvent as RiskEventModel


def _load_context(session: Session, zone_id: str | None) -> dict:
    """Structured context, not pre-formatted text — local handlers and the
    LLM prompt both build off the same underlying data, not off each
    other's formatting."""
    if not zone_id:
        return {"zone": None}

    zone = session.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        return {"zone": None, "unknown_zone_id": zone_id}

    latest_event = (
        session.query(RiskEventModel)
        .filter(RiskEventModel.zone_id == zone_id)
        .order_by(RiskEventModel.id.desc())
        .first()
    )
    permits = session.query(Permit).filter(Permit.zone_id == zone_id, Permit.status == "approved").all()

    return {
        "zone": zone,
        "latest_event": latest_event,
        "permits": permits,
    }


def _context_text(ctx: dict) -> str:
    if not ctx.get("zone"):
        if ctx.get("unknown_zone_id"):
            return f"Unknown zone '{ctx['unknown_zone_id']}'."
        return "No specific zone selected — answer generally about the SPSCL facility if relevant."

    zone = ctx["zone"]
    lines = [f"Zone {zone.id} — {zone.name}. Hazard classification: {zone.possible_hazards}."]

    latest_event = ctx.get("latest_event")
    if latest_event:
        lines.append(f"Latest risk assessment: {latest_event.tier} tier, score {latest_event.risk_score}.")
        signals = ", ".join(s.get("description", "") for s in (latest_event.contributing_signals or []))
        if signals:
            lines.append(f"Contributing signals: {signals}")
    else:
        lines.append("No risk events recorded for this zone yet — nominal.")

    permits = ctx.get("permits") or []
    if permits:
        lines.append("Active permits: " + "; ".join(f"{p.permit_type_id} (permit#{p.id})" for p in permits))
    else:
        lines.append("No active permits in this zone.")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Local intent matching — resolved without an LLM call whenever possible.
# Known limitation: RiskEventModel persists contributing_signals only, not
# the full Evidence object (reasoning / matched incident / regulatory
# citation) that the Compound Risk Detection Engine generates transiently
# over WebSocket — Evidence was never added as a persisted column, so a
# "show evidence" question here answers from raw signals, not the LLM's
# original synthesized reasoning. Widening RiskEvent's schema to persist
# Evidence was out of scope for this endpoint's authorization.
# ---------------------------------------------------------------------------

_INTENTS = [
    ("risk_status", re.compile(r"\b(risk score|how risky|current risk|status of|dangerous|explosion risk)\b", re.I)),
    ("permits", re.compile(r"\bpermits?\b", re.I)),
    ("evidence", re.compile(r"\bevidence\b|\bwhy\b.*\b(critical|warning|flagged)\b|\bsignals?\b", re.I)),
]


def _classify(message: str) -> str | None:
    for intent, pattern in _INTENTS:
        if pattern.search(message):
            return intent
    return None


def _answer_locally(intent: str, ctx: dict) -> str | None:
    zone = ctx.get("zone")
    if not zone:
        return None  # no zone context to answer any of these intents from

    latest_event = ctx.get("latest_event")
    permits = ctx.get("permits") or []

    if intent == "permits":
        if not permits:
            return f"No active permits in Zone {zone.id} ({zone.name}) right now."
        listing = "; ".join(f"{p.permit_type_id} (permit#{p.id}, valid to {p.valid_to:%Y-%m-%d %H:%M})" for p in permits)
        return f"Zone {zone.id} has {len(permits)} active permit(s): {listing}."

    if intent == "risk_status":
        if not latest_event:
            return f"Zone {zone.id} ({zone.name}) is currently Normal — no risk events recorded."
        return (
            f"Zone {zone.id} ({zone.name}) is at {latest_event.tier.title()} tier, "
            f"risk score {latest_event.risk_score}, from {len(latest_event.contributing_signals or [])} "
            f"contributing signal(s)."
        )

    if intent == "evidence":
        if not latest_event or not latest_event.contributing_signals:
            return f"No active contributing signals for Zone {zone.id} — nothing to show evidence for right now."
        lines = [f"Evidence behind Zone {zone.id}'s current {latest_event.tier} tier:"]
        for s in latest_event.contributing_signals:
            lines.append(f"- [{s.get('category')}] {s.get('description')}")
        return "\n".join(lines)

    return None


def _deterministic_fallback(context_text: str, reason: str = "no_key") -> str:
    # Two genuinely different situations were sharing one hardcoded message —
    # "no key configured" and "key present but the call failed" (e.g. a
    # transient provider error under load) look identical to the user
    # otherwise, which is actively misleading when a real key is in place.
    # Caught by directly testing a freshly-configured key and being misled
    # by this exact message into first suspecting the key wasn't loading.
    if reason == "no_key":
        preamble = "Safety Copilot is running in offline mode (no GROQ_API_KEY configured in backend/.env)."
    else:
        preamble = "The LLM is temporarily unavailable (the API call failed — this is usually transient, e.g. free-tier rate limits or a momentary outage). Falling back to live data."
    return f"{preamble} Here is the current live data for context:\n\n{context_text}"


def chat(session: Session, message: str, zone_id: str | None) -> str:
    ctx = _load_context(session, zone_id)

    intent = _classify(message)
    if intent:
        local_answer = _answer_locally(intent, ctx)
        if local_answer:
            return local_answer

    context_text = _context_text(ctx)
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key:
        return _deterministic_fallback(context_text)

    prompt = f"""You are the AI Safety Copilot for SPSCL, an industrial safety intelligence platform at a
petrochemical plant. Answer the user's question grounded ONLY in the live context below — do not invent
sensor readings, permits, or incidents not mentioned. Be concise (2-4 sentences), professional, and
safety-focused. If the context doesn't cover the question, say so plainly rather than guessing.

LIVE CONTEXT:
{context_text}

USER QUESTION: {message}"""
    answer = call_llm(prompt, max_tokens=300)
    if not answer:
        return _deterministic_fallback(context_text, reason="api_error")
    return answer.strip()
