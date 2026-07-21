import React, { useState } from "react";
import { AlertTriangle, ChevronRight } from "lucide-react";
import Card from "../common/Card.jsx";
import Pill from "../common/Pill.jsx";
import { RAW_TIER_HEX, confidenceLabel } from "../../utils/tierColors.js";
import { zoneById } from "../../utils/geometry.js";
import { useFacility } from "../../hooks/useFacilityState.jsx";
import { timeSince } from "../../utils/time.js";

export default function RiskPanel() {
  const { selectedZone, tier, evidence, score, latestEvent } = useFacility();
  const [expanded, setExpanded] = useState(false);
  const zone = zoneById(selectedZone);
  const circumference = 2 * Math.PI * 34;

  const headline = tier === "critical"
    ? (zone?.hazard ? `${zone.hazard.split(",")[0]} Risk` : "Critical Risk")
    : tier === "warning" ? "Elevated Risk" : "Nominal";

  return (
    <Card title="AI Risk Intelligence" icon={AlertTriangle} right={<Pill tier={tier} />} accent glowColor={tier === "critical" ? "var(--tier-critical)" : null}>
      <div className="panel-shift" key={selectedZone} style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 4 }}>
        <svg width="82" height="82" viewBox="0 0 80 80" style={{ flexShrink: 0 }}>
          <defs>
            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={RAW_TIER_HEX[tier]} stopOpacity="1" />
              <stop offset="100%" stopColor="#22D3EE" stopOpacity={tier === "critical" ? 0.35 : 0.7} />
            </linearGradient>
          </defs>
          <circle cx="40" cy="40" r="34" fill="none" stroke="var(--bg-card-sunken)" strokeWidth="8" />
          <circle
            cx="40" cy="40" r="34" fill="none" stroke="url(#scoreGrad)" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${(Math.min(score, 100) / 100) * circumference} ${circumference}`}
            transform="rotate(-90 40 40)"
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
          <text x="40" y="37" textAnchor="middle" fontSize="16" fontWeight="800" fill="var(--ink)">{score}%</text>
          <text x="40" y="49" textAnchor="middle" fontSize="6.5" fill="var(--ink-sub)">RISK SCORE</text>
        </svg>
        <div style={{ fontSize: 11, flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 5, color: tier === "critical" ? "var(--tier-critical)" : "var(--ink)" }}>
            {headline}
          </div>
          <Row label="Confidence" value={evidence ? `${evidence.confidence}%` : "—"} />
          <Row label="Zone" value={`${selectedZone} — ${zone?.short}`} />
          <Row label="In this state" value={latestEvent ? timeSince(latestEvent.timestamp) : "—"} />
        </div>
      </div>

      {evidence && (
        <>
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 4, marginTop: 12, background: "none", border: "none",
              fontSize: 10.5, fontWeight: 700, color: "var(--accent)", padding: 0,
            }}
          >
            View Risk Details
            <ChevronRight size={12} style={{ transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
          </button>
          {expanded && (
            <div className="fade-slide-up" style={{ marginTop: 8, paddingTop: 10, borderTop: "1px solid var(--border-soft)", fontSize: 10.5, color: "#374151", lineHeight: 1.5 }}>
              <div style={{ whiteSpace: "pre-line" }}>{evidence.reasoning}</div>
              {evidence.matched_incident_summary && (
                <div style={{ marginTop: 8, fontSize: 9.5, color: "var(--ink-sub)", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span><strong style={{ color: "var(--accent)" }}>Matched incident:</strong> {evidence.matched_incident_summary}</span>
                  {evidence.matched_incident_confidence && (
                    <span style={{
                      fontSize: 8.5, fontWeight: 700, padding: "1px 7px", borderRadius: 999, flexShrink: 0,
                      color: evidence.matched_incident_confidence === "high" ? "var(--tier-normal)" : evidence.matched_incident_confidence === "moderate" ? "var(--tier-warning)" : "var(--ink-faint)",
                      background: evidence.matched_incident_confidence === "high" ? "var(--tier-normal-bg)" : evidence.matched_incident_confidence === "moderate" ? "var(--tier-warning-bg)" : "var(--bg-card-sunken)",
                    }}>
                      {confidenceLabel(evidence.matched_incident_confidence)}
                    </span>
                  )}
                </div>
              )}
              {evidence.regulatory_citation && (
                <div style={{ marginTop: 8, fontSize: 9.5, color: "var(--ink-sub)" }}>
                  <strong style={{ color: "var(--accent)" }}>Regulatory basis:</strong> {evidence.regulatory_citation}
                </div>
              )}
              {!evidence.llm_backed && (
                <div style={{ marginTop: 6, fontSize: 9, color: "var(--ink-faint)", fontStyle: "italic" }}>
                  Rule-based reasoning (no Gemini key configured) — deterministic, not LLM-generated.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
      <span style={{ color: "var(--ink-sub)" }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
