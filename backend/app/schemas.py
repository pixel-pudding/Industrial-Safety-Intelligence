"""
Pydantic contracts shared between the simulator, the Compound Risk Detection
Engine, and (eventually) the WebSocket/REST surface Track 4 consumes.

RiskEvent mirrors the Part II handoff object exactly:
{ zone, timestamp, risk_score, tier, contributing_signals, triggered_agents }
"""

from __future__ import annotations

import datetime as dt
from typing import Any, Literal

from pydantic import BaseModel, Field

Tier = Literal["normal", "warning", "critical"]
ConfidenceBand = Literal["high", "moderate", "low"]


class SensorSnapshot(BaseModel):
    tag: str
    zone_id: str
    value: float | str
    tier: Tier
    timestamp: dt.datetime


class ContributingSignal(BaseModel):
    """One piece of evidence behind a risk score — this is the evidence trail."""

    category: Literal[
        "sensor", "sensor_trend", "maintenance_overdue", "permit_drift",
        "safety_barrier_gap", "worker_presence", "cctv_event", "cross_zone_utility",
        "shift_handover_gap",
    ]
    source: str  # e.g. "RX-TEMP", "D-GROUNDING-POINTS", "permit#14"
    description: str
    severity_weight: float


class MatchedIncident(BaseModel):
    """One historical-incident match from the Incident Pattern Intelligence agent.

    confidence_band is an empirical calibration off distances actually observed
    on this 10-document corpus with Chroma's default embedding model — see
    agents/incident_pattern_intelligence.py's module docstring. It exists so
    the frontend's Explainable AI Reasoning panel can render "moderate
    confidence" instead of an illegible raw distance number.
    """

    doc_id: str  # ChromaDB doc id, matches historical_incidents.narrative_doc_ref
    incident_number: int
    title: str
    severity: str
    zones_involved: list[str]
    distance: float
    confidence_band: ConfidenceBand
    excerpt: str


class MatchedRegulation(BaseModel):
    doc_id: str
    standard: str
    clause_topic: str
    citation: str  # "<standard> — <clause_topic>"
    excerpt: str
    distance: float
    confidence_band: ConfidenceBand


class IncidentPatternResult(BaseModel):
    """Incident Pattern Intelligence Agent's full output for one zone's risk event."""

    zone: str
    matched_incidents: list[MatchedIncident] = Field(default_factory=list)
    matched_regulations: list[MatchedRegulation] = Field(default_factory=list)
    summary: str  # e.g. "Closest match: Incident #10 \"Fatal Explosion...\" — moderate confidence"


class Evidence(BaseModel):
    """Populated once a risk event crosses into Warning/Critical and the RAG + Gemini step runs."""

    confidence: int  # 0-100, the Detection Engine's own confidence in its assessment
    matched_incident_ids: list[str] = Field(default_factory=list)
    matched_incident_summary: str | None = None
    matched_incident_confidence: ConfidenceBand | None = None  # top match's retrieval confidence band
    matched_regulatory_ids: list[str] = Field(default_factory=list)
    regulatory_citation: str | None = None
    reasoning: str | None = None
    recommended_interventions: list[str] = Field(default_factory=list)
    llm_backed: bool = False  # False when Gemini key is absent and a deterministic fallback was used


class PermitFlag(BaseModel):
    """Digital Permit Intelligence Agent output — Part II: 'Permit risk flag
    (approve/flag/block-recommend)', triggered by issuance + continuous re-check."""

    permit_id: int
    permit_type_id: str
    zone_id: str
    flag: Literal["approve", "flag", "block_recommend"]
    reasons: list[str] = Field(default_factory=list)
    checked_at: dt.datetime


class AlertRecipient(BaseModel):
    role: str
    zone: str
    message: str


class EmergencyResponseResult(BaseModel):
    """Emergency Response Orchestrator output — Part II: 'evacuation protocol,
    alert dispatch, evidence preservation, preliminary report', called by the
    Detection Engine at Critical tier."""

    zone: str
    triggered_at: dt.datetime
    evacuation_zones: list[str]
    alert_recipients: list[AlertRecipient]
    evidence_snapshot: dict[str, Any]
    preliminary_report: str
    status: Literal["dispatched", "acknowledged", "resolved"] = "dispatched"


class ZoneHeatmapEntry(BaseModel):
    """One zone's row in the Geospatial Safety Heatmap — pure reshaping of
    data other agents already computed, per Part II ("consumes location +
    risk scores") and the build plan ("mostly a data-shaping layer"). Nothing
    on this model is derived here; risk_tier/risk_score/signal_categories
    come from the Detection Engine's current-tick scoring snapshot, and
    active_permits comes from Digital Permit Intelligence's own flags."""

    zone_id: str
    zone_name: str
    hazard_classification: str
    risk_tier: Tier
    risk_score: float
    worker_count: int
    active_permits: list[dict[str, Any]] = Field(default_factory=list)
    signal_categories: list[str] = Field(default_factory=list)


class GeospatialHeatmap(BaseModel):
    timestamp: dt.datetime
    zones: list[ZoneHeatmapEntry]


class ComplianceGap(BaseModel):
    category: Literal["maintenance_overdue", "permit_expired_not_closed"]
    zone_id: str
    source: str  # asset id or permit id
    description: str
    regulatory_match: MatchedRegulation | None = None  # None/low-confidence is reported honestly, not hidden


class ComplianceAuditReport(BaseModel):
    """Quality & Compliance Audit Agent output — Part II: 'Compliance gap
    report vs. OISD/Factory Act', triggered by schedule + CMMS/permit anomaly,
    NOT continuously. See agents/compliance_audit.py."""

    run_at: dt.datetime
    triggered_by: Literal["manual", "scheduled", "anomaly"]
    gaps: list[ComplianceGap] = Field(default_factory=list)
    gap_count: int = 0
    summary: str


class RiskEvent(BaseModel):
    zone: str
    timestamp: dt.datetime
    risk_score: float
    tier: Tier
    contributing_signals: list[ContributingSignal]
    triggered_agents: list[str]
    evidence: Evidence | None = None

    def to_orm_kwargs(self) -> dict[str, Any]:
        return dict(
            zone_id=self.zone,
            timestamp=self.timestamp,
            risk_score=self.risk_score,
            tier=self.tier,
            contributing_signals=[s.model_dump() for s in self.contributing_signals],
            triggered_agents=self.triggered_agents,
        )
