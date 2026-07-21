"""
LangGraph wiring for the Compound Risk Detection Engine — the hub node in
Part II's orchestration model. Graph shape:

    rule_score --(normal)--> END
    rule_score --(warning/critical)--> rag_lookup --> gemini_reasoning --> END

Rule-based scoring always runs (cheap, every tick). RAG + Gemini only run on
a Warning/Critical crossing — this is both the rate-limit design consequence
(Part II) and the reason the structural pre-filter in
incident_pattern_intelligence.py has to be correct: everything downstream of
that filter runs only when it matters.

Note: at Critical tier, simulator/tick_engine.py additionally calls the
Emergency Response Orchestrator (agents/emergency_response.py) — NOT as a
node in this graph. That agent's DB row needs the just-persisted RiskEvent's
autoincrement id as a foreign key, and persistence deliberately happens in
tick_engine.py, not inside this graph, so the call has to happen there too,
after this graph returns. triggered_agents still ends up complete (tick_engine
appends "emergency_response_orchestrator" before persisting) — it's the
dispatch call site that differs, not the audit trail.
"""

from __future__ import annotations

import datetime as dt
from typing import TypedDict

from langgraph.graph import END, StateGraph
from sqlalchemy.orm import Session

from agents import gemini_client, incident_pattern_intelligence, rule_engine
from app.schemas import ContributingSignal, Evidence, IncidentPatternResult, RiskEvent


class GraphState(TypedDict):
    zone_id: str
    zone_tag_tiers: dict[str, str]
    all_zone_tag_tiers: dict[str, dict[str, str]]
    now: dt.datetime
    score: float
    tier: str
    signals: list[ContributingSignal]
    pattern_result: IncidentPatternResult | None
    evidence: Evidence | None
    triggered_agents: list[str]
    session: Session  # not persisted in risk_event — scratch dependency for node calls


def _rule_score_node(state: GraphState) -> GraphState:
    score, tier, signals = rule_engine.score_zone(
        state["session"], state["zone_id"], state["zone_tag_tiers"],
        state["all_zone_tag_tiers"], state["now"],
    )
    state["score"], state["tier"], state["signals"] = score, tier, signals
    state["triggered_agents"] = state.get("triggered_agents", []) + ["compound_risk_detection_engine"]
    return state


def _route_on_tier(state: GraphState) -> str:
    return "rag_lookup" if state["tier"] != "normal" else "end"


def _rag_lookup_node(state: GraphState) -> GraphState:
    state["pattern_result"] = incident_pattern_intelligence.analyze(state["zone_id"], state["signals"])
    state["triggered_agents"] = state["triggered_agents"] + ["incident_pattern_intelligence"]
    return state


def _gemini_reasoning_node(state: GraphState) -> GraphState:
    state["evidence"] = gemini_client.generate_reasoning(
        state["zone_id"], state["tier"], state["signals"], state["pattern_result"],
    )
    return state


def _build_graph():
    graph = StateGraph(GraphState)
    graph.add_node("rule_score", _rule_score_node)
    graph.add_node("rag_lookup", _rag_lookup_node)
    graph.add_node("gemini_reasoning", _gemini_reasoning_node)

    graph.set_entry_point("rule_score")
    graph.add_conditional_edges("rule_score", _route_on_tier, {"rag_lookup": "rag_lookup", "end": END})
    graph.add_edge("rag_lookup", "gemini_reasoning")
    graph.add_edge("gemini_reasoning", END)
    return graph.compile()


_compiled_graph = None


def get_graph():
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = _build_graph()
    return _compiled_graph


def evaluate_zone(
    session: Session, zone_id: str, zone_tag_tiers: dict[str, str],
    all_zone_tag_tiers: dict[str, dict[str, str]], now: dt.datetime,
) -> RiskEvent:
    initial_state: GraphState = {
        "zone_id": zone_id, "zone_tag_tiers": zone_tag_tiers,
        "all_zone_tag_tiers": all_zone_tag_tiers, "now": now,
        "score": 0.0, "tier": "normal", "signals": [],
        "pattern_result": None, "evidence": None,
        "triggered_agents": [], "session": session,
    }
    result = get_graph().invoke(initial_state)
    return RiskEvent(
        zone=zone_id, timestamp=now, risk_score=result["score"], tier=result["tier"],
        contributing_signals=result["signals"], triggered_agents=result["triggered_agents"],
        evidence=result["evidence"],
    )
