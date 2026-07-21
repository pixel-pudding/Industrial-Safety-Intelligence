"""
Incident Pattern Intelligence Agent (RAG).

Per Part II: triggered by the Compound Risk Detection Engine at Warning tier;
output is matching historical incident(s) + regulatory citation. Structural
filter runs BEFORE semantic search ("narrative_doc_ref bridges Postgres to
ChromaDB so the RAG agent can filter structurally first, then retrieve
semantically — faster and more accurate than pure vector search").

That ordering isn't a nice-to-have: Track 1's own verification found naive
semantic search over the incidents collection ranks Incident 04 (a single
hot-work near-miss) ahead of Incident 10 (the 5-signal fatal flagship) for a
query resembling the flagship's actual signal combination, because Incident
10's long narrative dilutes against a short query. The structural filter
below narrows the candidate pool by severity BEFORE semantic search runs,
using the number of distinct contributing-signal categories in the current
risk event as a proxy for "how compound is this."

Confidence bands (DISTANCE_BANDS below) are an empirical calibration from
distances actually observed testing this 10-document corpus with Chroma's
default embedding model (all-MiniLM-L6-v2) — a heuristic, not a principled
probability. They exist specifically so the frontend's Explainable AI
Reasoning panel can render "Incident #10 — moderate confidence" instead of
a bare, illegible "distance: 0.94". Recalibrate if the corpus grows or the
embedding model changes; a system prompt or judge asking "what does 0.94
mean" is worse UX than an honestly-approximate qualitative band.

This module owns all direct Chroma access for both incidents and regulatory
excerpts — the Compound Risk Detection Engine (compound_risk_engine.py)
calls analyze() rather than querying Chroma itself, the same call-not-
duplicate discipline used for Digital Permit Intelligence.
"""

from __future__ import annotations

import os
from pathlib import Path

import chromadb

from app.schemas import ContributingSignal, IncidentPatternResult, MatchedIncident, MatchedRegulation

PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", str(Path(__file__).resolve().parent.parent / "rag" / "chroma_store"))

# Upper distance bound per band; anything above the last bound is "low".
# Calibrated from distances observed in Track 1/3 testing (roughly 0.75-1.3
# across all real queries run against this corpus).
DISTANCE_BANDS: list[tuple[float, str]] = [(0.85, "high"), (1.05, "moderate")]

_client = None


def _get_client():
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path=PERSIST_DIR)
    return _client


def confidence_band(distance: float) -> str:
    for threshold, band in DISTANCE_BANDS:
        if distance <= threshold:
            return band
    return "low"


def _severity_filter(num_categories: int) -> dict | None:
    """The structural pre-filter: how compound the current event is gates which
    incident severities are even eligible before semantic ranking runs."""
    if num_categories >= 4:
        return {"severity": {"$in": ["fatal", "major", "moderate"]}}
    if num_categories >= 2:
        return {"severity": {"$in": ["fatal", "major", "moderate", "near_miss"]}}
    return None  # single-signal events: no severity gate, let semantic search roam freely


def _build_query_text(zone_id: str, signals: list[ContributingSignal]) -> str:
    parts = [f"Zone {zone_id} risk event."]
    for s in signals:
        parts.append(f"{s.category}: {s.description}")
    return " ".join(parts)


def _excerpt(document: str, length: int = 220) -> str:
    # Documents start with a "# Incident NN — Title" heading + metadata line;
    # skip to the narrative body so the excerpt is actual prose, not a header.
    body = document.split("## Narrative", 1)
    text = body[1] if len(body) > 1 else document
    text = " ".join(text.split())  # collapse markdown whitespace/newlines
    return (text[:length] + "…") if len(text) > length else text


def _lookup_incidents(zone_id: str, signals: list[ContributingSignal], n_results: int = 3) -> list[MatchedIncident]:
    categories = {s.category for s in signals}
    where = _severity_filter(len(categories))
    query_text = _build_query_text(zone_id, signals)

    collection = _get_client().get_collection("incidents")
    kwargs = dict(query_texts=[query_text], n_results=max(n_results, 5))
    if where:
        kwargs["where"] = where
    result = collection.query(**kwargs)

    if not result["ids"][0] and where:
        # Structural filter matched nothing (e.g. a genuinely novel combination) —
        # fall back to unfiltered semantic search rather than return empty evidence.
        result = collection.query(query_texts=[query_text], n_results=n_results)

    candidates = []
    for doc_id, dist, meta, doc in zip(
        result["ids"][0], result["distances"][0], result["metadatas"][0], result["documents"][0]
    ):
        zone_match = zone_id in (meta.get("zones_involved") or "").split(", ")
        candidates.append((doc_id, dist, meta, doc, zone_match))

    # Zone-overlap is a soft nudge, not a hard override — an earlier version used
    # zone_match as the primary sort key, which let ANY zone-tagged incident beat
    # a much better semantic match from another zone. A fixed nudge lets zone
    # relevance break near-ties without overriding genuinely closer matches.
    ZONE_MATCH_NUDGE = 0.1
    candidates.sort(key=lambda c: c[1] - (ZONE_MATCH_NUDGE if c[4] else 0))

    return [
        MatchedIncident(
            doc_id=doc_id, incident_number=meta["incident_number"], title=meta["title"], severity=meta["severity"],
            zones_involved=(meta.get("zones_involved") or "").split(", "),
            distance=round(dist, 4), confidence_band=confidence_band(dist), excerpt=_excerpt(doc),
        )
        for doc_id, dist, meta, doc, _ in candidates[:n_results]
    ]


def _lookup_regulatory(zone_id: str, signals: list[ContributingSignal], n_results: int = 2) -> list[MatchedRegulation]:
    query_text = _build_query_text(zone_id, signals)
    collection = _get_client().get_collection("regulatory")
    result = collection.query(query_texts=[query_text], n_results=n_results)

    return [
        MatchedRegulation(
            doc_id=doc_id, standard=meta["standard"], clause_topic=meta["clause_topic"],
            citation=f"{meta['standard']} — {meta['clause_topic']}", excerpt=_excerpt(doc),
        )
        for doc_id, meta, doc in zip(result["ids"][0], result["metadatas"][0], result["documents"][0])
    ]


def analyze(zone_id: str, signals: list[ContributingSignal]) -> IncidentPatternResult:
    incidents = _lookup_incidents(zone_id, signals)
    regulations = _lookup_regulatory(zone_id, signals)

    if incidents:
        top = incidents[0]
        summary = f"Closest match: Incident #{top.incident_number} \"{top.title}\" — {top.confidence_band} confidence"
    else:
        summary = "No historical precedent matched."

    return IncidentPatternResult(zone=zone_id, matched_incidents=incidents, matched_regulations=regulations, summary=summary)
