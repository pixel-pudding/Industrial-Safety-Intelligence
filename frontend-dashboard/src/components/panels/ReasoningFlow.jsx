import React from "react";
import {
  Activity, AlertTriangle, ArrowRight, ClipboardX, Clock, FileText,
  ShieldAlert, Share2, Users, Video, Wrench,
} from "lucide-react";
import Card from "../common/Card.jsx";
import { useFacility } from "../../hooks/useFacilityState.jsx";
import { confidenceLabel } from "../../utils/tierColors.js";

const CATEGORY_ICON = {
  sensor: Activity,
  cross_zone_utility: Share2,
  maintenance_overdue: Wrench,
  permit_drift: ClipboardX,
  safety_barrier_gap: ShieldAlert,
  worker_presence: Users,
  cctv_event: Video,
  shift_handover_gap: Clock,
};

const CATEGORY_LABEL = {
  sensor: "Sensor",
  cross_zone_utility: "Utility Cascade",
  maintenance_overdue: "Maintenance",
  permit_drift: "Permit Drift",
  safety_barrier_gap: "Safety Barrier",
  worker_presence: "Workers",
  cctv_event: "CCTV",
  shift_handover_gap: "Shift Gap",
};

/**
 * Horizontal reasoning chain, built entirely from
 * latestEvent.contributing_signals (real, per-zone, per-event evidence from
 * the Compound Risk Detection Engine) — the chain visual is presentation,
 * every node's content is live backend data, not scripted.
 */
export default function ReasoningFlow() {
  const { latestEvent, evidence, tier } = useFacility();
  const signals = latestEvent?.contributing_signals ?? [];

  return (
    <Card title="AI Reasoning Chain" icon={FileText}>
      {signals.length === 0 ? (
        <div style={{ fontSize: 11, color: "var(--ink-sub)", padding: "8px 0" }}>
          Run a scenario to see the AI's reasoning chain build up for the selected zone.
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 4, overflowX: "auto", padding: "6px 2px 10px" }}>
          {signals.map((s, i) => {
            const Icon = CATEGORY_ICON[s.category] || Activity;
            return (
              <React.Fragment key={i}>
                <div className="panel-shift" style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 96, flexShrink: 0, textAlign: "center" }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                    backgroundImage: "var(--accent-grad-soft)", marginBottom: 6,
                  }}>
                    <Icon size={16} style={{ color: "var(--accent)" }} />
                  </div>
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: "var(--ink)" }}>{CATEGORY_LABEL[s.category] || s.category}</div>
                  <div style={{ fontSize: 8.5, color: "var(--ink-sub)", marginTop: 2, lineHeight: 1.3 }}>{s.source}</div>
                </div>
                <ArrowRight size={13} style={{ color: "var(--ink-faint)", marginTop: 16, flexShrink: 0 }} />
              </React.Fragment>
            );
          })}
          <div className="panel-shift" style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 96, flexShrink: 0, textAlign: "center" }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
              background: tier === "critical" ? "var(--tier-critical-bg)" : "var(--tier-warning-bg)", marginBottom: 6,
            }}>
              <AlertTriangle size={16} style={{ color: tier === "critical" ? "var(--tier-critical)" : "var(--tier-warning)" }} />
            </div>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: tier === "critical" ? "var(--tier-critical)" : "var(--tier-warning)" }}>
              {tier.toUpperCase()}
            </div>
            <div style={{ fontSize: 8.5, color: "var(--ink-sub)", marginTop: 2 }}>Compound risk detected</div>
          </div>
        </div>
      )}

      {evidence?.matched_incident_summary && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border-soft)", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)" }}>MATCHED PATTERN</div>
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
          <div style={{ fontSize: 10.5, color: "#374151" }}>{evidence.matched_incident_summary}</div>
        </div>
      )}
    </Card>
  );
}
