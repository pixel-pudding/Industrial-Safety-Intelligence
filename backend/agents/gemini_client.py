"""
Gemini Flash reasoning step — called ONLY when the rule engine (rule_engine.py)
has already crossed a zone into Warning/Critical, per Part II's rate-limit
design consequence (keeps continuous scoring inside the free-tier quota).

Free-tier model as of July 2026: gemini-3.5-flash (10 req/min, 1500/day) —
configurable via GEMINI_MODEL since Google's Flash lineup moves fast and
this may need bumping later.

Graceful degradation is deliberate, not a shortcut: with no GEMINI_API_KEY
configured (the default in .env.example) or on any API failure, this falls
back to a deterministic, signal-driven explanation rather than crashing the
tick loop or returning nothing — Evidence.llm_backed tells the frontend
which mode produced a given explanation.
"""

from __future__ import annotations

import json
import os

from app.schemas import ContributingSignal, Evidence, IncidentPatternResult

MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")

INTERVENTION_TEMPLATES = {
    "sensor": "Dispatch operator to verify {source} reading and confirm against redundant instrumentation.",
    "cross_zone_utility": "Check Zone F utility root cause before treating this as a zone-local fault.",
    "maintenance_overdue": "Escalate {source} maintenance work order to priority/emergency status.",
    "permit_drift": "Issue stop-work recommendation for {source} pending gas re-test.",
    "safety_barrier_gap": "Block permit {source} and require verified re-purge before any re-submission.",
    "worker_presence": "Confirm headcount and stage evacuation route for personnel in the affected zone.",
    "cctv_event": "Dispatch security/fire response to {source} for direct visual confirmation.",
    "shift_handover_gap": "Require formal written escalation of the carried-over condition before shift close.",
}


def _regulatory_citation(pattern: IncidentPatternResult) -> str | None:
    return pattern.matched_regulations[0].citation if pattern.matched_regulations else None


def _deterministic_fallback(
    zone_id: str, tier: str, signals: list[ContributingSignal], pattern: IncidentPatternResult,
) -> Evidence:
    categories = {s.category for s in signals}
    confidence = min(95, 50 + 8 * len(categories))

    reasoning_parts = [f"Zone {zone_id} reached {tier.title()} from {len(signals)} contributing signal(s):"]
    for s in signals:
        reasoning_parts.append(f"- {s.description}")
    if pattern.matched_incidents:
        top = pattern.matched_incidents[0]
        reasoning_parts.append(
            f"{pattern.summary} (severity: {top.severity})."
        )
    reasoning = "\n".join(reasoning_parts)

    interventions = []
    for s in signals:
        template = INTERVENTION_TEMPLATES.get(s.category)
        if template:
            interventions.append(template.format(source=s.source))

    top_incident = pattern.matched_incidents[0] if pattern.matched_incidents else None

    return Evidence(
        confidence=confidence,
        matched_incident_ids=[m.doc_id for m in pattern.matched_incidents],
        matched_incident_summary=top_incident.title if top_incident else None,
        matched_incident_confidence=top_incident.confidence_band if top_incident else None,
        matched_regulatory_ids=[m.doc_id for m in pattern.matched_regulations],
        regulatory_citation=_regulatory_citation(pattern),
        reasoning=reasoning,
        recommended_interventions=interventions or ["Continue monitoring — no standard intervention template matched."],
        llm_backed=False,
    )


def _build_prompt(zone_id: str, tier: str, signals: list[ContributingSignal], pattern: IncidentPatternResult) -> str:
    signal_lines = "\n".join(f"- [{s.category}] {s.description}" for s in signals)
    incident_lines = "\n\n".join(
        f"Incident #{m.incident_number} \"{m.title}\" ({m.severity}, retrieval confidence: {m.confidence_band}):\n{m.excerpt}"
        for m in pattern.matched_incidents
    )
    regulatory_lines = "\n\n".join(
        f"{m.citation}:\n{m.excerpt}" for m in pattern.matched_regulations
    )

    return f"""You are the reasoning layer of an industrial safety Compound Risk Detection Engine
for a petrochemical plant. A rule-based scoring layer has already determined Zone {zone_id}
is at {tier.upper()} tier from the signals below. Do not invent signals not listed.
Ground every claim in the provided signals, historical incidents, and regulatory excerpts only.
Note each incident's retrieval confidence (high/moderate/low) — a "low" confidence match is a
weak precedent, not a certainty, and your reasoning should reflect that honestly.

CONTRIBUTING SIGNALS:
{signal_lines}

RETRIEVED HISTORICAL INCIDENTS (structurally pre-filtered, then semantically matched):
{incident_lines or "None matched."}

RETRIEVED REGULATORY EXCERPTS:
{regulatory_lines or "None matched."}

Respond with strict JSON only, no markdown, matching exactly this shape:
{{"confidence": <int 0-100>, "reasoning": "<2-4 sentence explanation citing specific signals and the matched incident/regulation>", "recommended_interventions": ["<action 1>", "<action 2>", "..."]}}"""


def generate_reasoning(
    zone_id: str, tier: str, signals: list[ContributingSignal], pattern: IncidentPatternResult,
) -> Evidence:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return _deterministic_fallback(zone_id, tier, signals, pattern)

    try:
        from google import genai

        client = genai.Client(api_key=api_key)
        prompt = _build_prompt(zone_id, tier, signals, pattern)
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config={"response_mime_type": "application/json"},
        )
        parsed = json.loads(response.text)

        top_incident = pattern.matched_incidents[0] if pattern.matched_incidents else None

        return Evidence(
            confidence=int(parsed["confidence"]),
            matched_incident_ids=[m.doc_id for m in pattern.matched_incidents],
            matched_incident_summary=top_incident.title if top_incident else None,
            matched_incident_confidence=top_incident.confidence_band if top_incident else None,
            matched_regulatory_ids=[m.doc_id for m in pattern.matched_regulations],
            regulatory_citation=_regulatory_citation(pattern),
            reasoning=parsed["reasoning"],
            recommended_interventions=parsed.get("recommended_interventions", []),
            llm_backed=True,
        )
    except Exception as exc:  # noqa: BLE001 — any failure must degrade, never crash the tick loop
        print(f"[gemini_client] Gemini call failed ({exc!r}); falling back to deterministic reasoning.")
        return _deterministic_fallback(zone_id, tier, signals, pattern)
