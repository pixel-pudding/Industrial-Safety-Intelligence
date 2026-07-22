"""
LLM reasoning client — Groq (OpenAI-compatible REST), not Gemini.

Deviation from the original build's "Gemini only" constraint, made with
explicit user confirmation after Gemini's free tier turned out to cap at
20 requests/day on the available account/project — far too low to make it
through a single scenario run, let alone a demo. Groq's free tier
(llama-3.3-70b-versatile: 1,000 req/day, 30 RPM, no card) is a genuine
no-cost tier consistent with the project's original "no paid APIs"
requirement, just a different provider. Logged here and in
backend/README.md so this doesn't need rediscovering. Was named
gemini_client.py before this switch — renamed rather than left misleading.

Uses raw `requests` against Groq's OpenAI-compatible endpoint rather than
adding a new SDK dependency (`requests` was already a transitive dependency
via chromadb).

`call_llm()` is the single low-level entry point — both generate_reasoning()
(the Compound Risk Detection Engine's evidence step) and
agents/copilot_agent.py's chat() share it, rather than each having their
own HTTP call + degradation logic.
"""

from __future__ import annotations

import json
import os

import requests

from app.schemas import ContributingSignal, Evidence, IncidentPatternResult

MODEL_NAME = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

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


def call_llm(prompt: str, json_mode: bool = False, max_tokens: int = 600) -> str | None:
    """Low-level Groq call. Never raises — returns None on any failure (no
    key, network error, bad response) so every caller degrades gracefully
    instead of needing its own try/except around this."""
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key:
        return None
    try:
        body = {
            "model": MODEL_NAME,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3,
            "max_tokens": max_tokens,
        }
        if json_mode:
            body["response_format"] = {"type": "json_object"}
        resp = requests.post(
            GROQ_URL,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json=body,
            timeout=20,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]
    except Exception as exc:  # noqa: BLE001 — must degrade, never propagate
        print(f"[llm_client] Groq call failed ({exc!r}).")
        return None


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
        reasoning_parts.append(f"{pattern.summary} (severity: {top.severity}).")
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
    regulatory_lines = "\n\n".join(f"{m.citation}:\n{m.excerpt}" for m in pattern.matched_regulations)

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


def generate_reasoning(zone_id: str, tier: str, signals: list[ContributingSignal], pattern: IncidentPatternResult) -> Evidence:
    prompt = _build_prompt(zone_id, tier, signals, pattern)
    raw = call_llm(prompt, json_mode=True, max_tokens=500)
    if raw is None:
        return _deterministic_fallback(zone_id, tier, signals, pattern)

    try:
        parsed = json.loads(raw)
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
    except Exception as exc:  # noqa: BLE001 — malformed LLM output must degrade too
        print(f"[llm_client] Failed to parse Groq response ({exc!r}); falling back to deterministic reasoning.")
        return _deterministic_fallback(zone_id, tier, signals, pattern)
