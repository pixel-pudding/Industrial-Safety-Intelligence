import React, { useEffect, useState } from "react";
import { CheckCircle2, Circle, ClipboardCheck, Clock, Radio, Siren, Users2 } from "lucide-react";
import Card from "../common/Card.jsx";
import { useFacility } from "../../hooks/useFacilityState.jsx";

const STATUS_ICON = {
  done: { Icon: CheckCircle2, color: "var(--tier-normal)" },
  progress: { Icon: Clock, color: "var(--tier-warning)" },
  pending: { Icon: Circle, color: "#C4C9D2" },
};

/**
 * Two distinct real data sources, not one: evidence.recommended_interventions
 * (the Detection Engine's Gemini/rule-based reasoning — "what should happen")
 * and, when present, the Emergency Response Orchestrator's actual dispatch
 * record for this zone (evacuation zones + alert recipients + status —
 * "what was actually dispatched"). The Orchestrator's output was completely
 * absent from the UI before this pass; it belongs here specifically because
 * it's causally the same moment as the recommended interventions below it.
 */
export default function Interventions() {
  const { interventions, selectedZone, emergencyResponses } = useFacility();
  const [statusById, setStatusById] = useState({});

  useEffect(() => setStatusById({}), [selectedZone]);

  const toggle = (i) => {
    setStatusById((prev) => {
      const current = prev[i] || "pending";
      const next = current === "pending" ? "progress" : current === "progress" ? "done" : "pending";
      return { ...prev, [i]: next };
    });
  };

  const dispatch = emergencyResponses.find((er) => er.zone === selectedZone);

  return (
    <Card title="Recommended Interventions" icon={ClipboardCheck}>
      {dispatch && (
        <div className="fade-slide-up" style={{
          marginBottom: "var(--space-3)", padding: "var(--space-3)", borderRadius: "var(--radius-sm)",
          background: "var(--tier-critical-bg)", border: "1px solid var(--tier-critical)33", minWidth: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--tier-critical)" }}>
            <Siren size={13} /> Emergency Response Dispatched
          </div>
          <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4, fontSize: "var(--text-2xs)", color: "#7A1B32" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Users2 size={11} /> Evacuation: Zone{dispatch.evacuation_zones.length > 1 ? "s" : ""} {dispatch.evacuation_zones.join(", ")}
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 5 }}>
              <Radio size={11} style={{ marginTop: 1, flexShrink: 0 }} />
              <span>Alerted: {[...new Set(dispatch.alert_recipients.map((r) => r.role.replace(/_/g, " ")))].join(", ")}</span>
            </div>
            <div style={{ fontWeight: 700, textTransform: "uppercase", fontSize: "var(--text-2xs)", letterSpacing: "0.03em" }}>
              Status: {dispatch.status}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        {interventions.length === 0 && !dispatch && (
          <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-sub)", padding: "4px 0" }}>
            No intervention required — nominal.
          </div>
        )}
        {interventions.map((iv, i) => {
          const status = statusById[i] || "pending";
          const { Icon, color } = STATUS_ICON[status];
          return (
            <button
              key={i}
              onClick={() => toggle(i)}
              className="panel-shift"
              style={{
                display: "flex", alignItems: "center", gap: 9, fontSize: "var(--text-xs)", padding: "6px 4px",
                background: "none", border: "none", textAlign: "left", cursor: "pointer", borderRadius: 8, minWidth: 0,
              }}
            >
              <Icon size={14} style={{ color, flexShrink: 0 }} />
              <span style={{
                flex: "1 1 auto", minWidth: 0, color: status === "pending" ? "var(--ink)" : "var(--ink-sub)",
                textDecoration: status === "done" ? "line-through" : "none",
              }}>
                {iv.text}
              </span>
              <span style={{
                fontSize: "var(--text-2xs)", fontWeight: 700, padding: "2px 7px", borderRadius: 999, whiteSpace: "nowrap", flexShrink: 0,
                color: iv.pri === "critical" ? "var(--tier-critical)" : "var(--accent)",
                background: iv.pri === "critical" ? "var(--tier-critical-bg)" : "var(--accent-soft)",
              }}>
                {iv.owner}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
