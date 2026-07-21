import React from "react";
import { Activity, AlertTriangle } from "lucide-react";
import Card from "../common/Card.jsx";
import { TIER } from "../../utils/tierColors.js";
import { useFacility } from "../../hooks/useFacilityState.js";

export default function IncidentTimeline() {
  const { riskEvents, setSelectedZone } = useFacility();
  const ordered = riskEvents.slice().reverse();

  return (
    <Card
      title="Live Incident Timeline"
      icon={Activity}
      right={<span style={{ fontSize: 10, fontWeight: 600, color: "var(--accent)" }}>View Full Timeline →</span>}
    >
      {ordered.length === 0 ? (
        <div style={{ fontSize: 12, textAlign: "center", padding: "24px 0", color: "var(--ink-sub)" }}>
          No active risk events — run Scenario 10 to populate the timeline.
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginTop: 8, overflowX: "auto", paddingBottom: 4 }}>
          {ordered.map((e, i) => (
            <React.Fragment key={e.id}>
              <button
                onClick={() => setSelectedZone(e.zone)}
                className="panel-shift"
                style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", width: 92, flexShrink: 0, background: "none", border: "none" }}
              >
                <div style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 6, background: TIER[e.tier].bg, color: TIER[e.tier].c }} className={e.tier === "critical" ? "pulse" : ""}>
                  <AlertTriangle size={13} />
                </div>
                <div style={{ fontSize: 9, fontWeight: 600, color: "var(--ink-sub)" }}>{e.time}</div>
                <div style={{ fontSize: 10, marginTop: 2, color: "var(--ink)" }}>Zone {e.zone}</div>
              </button>
              {i < ordered.length - 1 && <div style={{ flex: 1, height: 1, marginTop: 13, background: "#E5E8EE" }} />}
            </React.Fragment>
          ))}
        </div>
      )}
    </Card>
  );
}
