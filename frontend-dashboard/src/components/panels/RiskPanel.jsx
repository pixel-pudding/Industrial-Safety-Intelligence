import React from "react";
import { AlertTriangle } from "lucide-react";
import Card from "../common/Card.jsx";
import Pill from "../common/Pill.jsx";
import { RAW_TIER_HEX } from "../../utils/tierColors.js";
import { zoneById } from "../../utils/geometry.js";
import { useFacility } from "../../hooks/useFacilityState.js";

export default function RiskPanel() {
  const { selectedZone, tier, evidence, score } = useFacility();
  const zone = zoneById(selectedZone);
  const circumference = 2 * Math.PI * 34;

  return (
    <Card title="AI Risk Intelligence" icon={AlertTriangle} right={<Pill tier={tier} />} accent>
      <div className="panel-shift" key={selectedZone} style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 4 }}>
        <svg width="80" height="80" viewBox="0 0 80 80">
          <defs>
            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={RAW_TIER_HEX[tier]} stopOpacity="1" />
              <stop offset="100%" stopColor="#22D3EE" stopOpacity={tier === "critical" ? 0.35 : 0.7} />
            </linearGradient>
          </defs>
          <circle cx="40" cy="40" r="34" fill="none" stroke="#F1F2F6" strokeWidth="8" />
          <circle
            cx="40" cy="40" r="34" fill="none" stroke="url(#scoreGrad)" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${(score / 100) * circumference} ${circumference}`}
            transform="rotate(-90 40 40)"
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
          <text x="40" y="37" textAnchor="middle" fontSize="16" fontWeight="800" fill="var(--ink)">{score}%</text>
          <text x="40" y="49" textAnchor="middle" fontSize="7" fill="var(--ink-sub)">RISK SCORE</text>
        </svg>
        <div style={{ fontSize: 11, flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
            {tier === "critical" ? "Explosion Risk" : tier === "warning" ? "Elevated Risk" : "Nominal"}
          </div>
          <Row label="Confidence" value={evidence ? `${evidence.confidence}%` : "—"} />
          <Row label="Zone" value={`${selectedZone} — ${zone?.short}`} />
          <Row label="Escalation" value={tier === "critical" ? "8 min" : "—"} />
        </div>
      </div>
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
