import React from "react";
import { Activity, AlertTriangle, CheckCircle2 } from "lucide-react";
import Card from "../common/Card.jsx";
import { TIER } from "../../utils/tierColors.js";
import { useFacility } from "../../hooks/useFacilityState.jsx";

export default function IncidentTimeline() {
  const { riskEvents, setSelectedZone, selectedZone } = useFacility();
  const ordered = riskEvents.slice().reverse().slice(-12); // chronological, most recent 12

  return (
    <Card
      title="Live Incident Timeline"
      icon={Activity}
      right={riskEvents.length > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)" }}>View Full Timeline →</span>}
    >
      {ordered.length === 0 ? (
        <div style={{ fontSize: 12, textAlign: "center", padding: "28px 0", color: "var(--ink-sub)" }}>
          No active risk events — run a scenario to populate the timeline.
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "flex-start", gap: 0, marginTop: 8, overflowX: "auto", paddingBottom: 4 }}>
          {ordered.map((e, i) => {
            const isSelected = e.zone === selectedZone;
            const isCritical = e.tier === "critical";
            const Icon = e.tier === "normal" ? CheckCircle2 : AlertTriangle;
            return (
              <React.Fragment key={`${e.zone}-${e.timestamp}-${i}`}>
                <button
                  onClick={() => setSelectedZone(e.zone)}
                  className="panel-shift"
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", width: 104,
                    flexShrink: 0, background: "none", border: "none", cursor: "pointer", padding: "4px 2px",
                    borderRadius: 10,
                    outline: isSelected ? "2px solid var(--accent)" : "none", outlineOffset: 2,
                  }}
                >
                  <div
                    className={isCritical ? "pulse" : ""}
                    style={{
                      width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      marginBottom: 6, background: TIER[e.tier].bg, color: TIER[e.tier].c,
                    }}
                  >
                    <Icon size={13} />
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 600, color: "var(--ink-sub)" }}>
                    {new Date(e.timestamp).toLocaleTimeString("en-IN", { hour12: false })}
                  </div>
                  <div style={{ fontSize: 10, marginTop: 2, color: "var(--ink)", fontWeight: isSelected ? 700 : 500 }}>
                    Zone {e.zone}
                  </div>
                  <div style={{ fontSize: 8.5, color: TIER[e.tier].c, fontWeight: 600 }}>{TIER[e.tier].label}</div>
                </button>
                {i < ordered.length - 1 && <div style={{ width: 20, height: 1, marginTop: 18, background: "var(--border-strong)", flexShrink: 0 }} />}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </Card>
  );
}
