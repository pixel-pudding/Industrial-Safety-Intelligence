import React from "react";
import { Bell } from "lucide-react";
import Card from "../common/Card.jsx";
import { TIER } from "../../utils/tierColors.js";
import { useFacility } from "../../hooks/useFacilityState.jsx";

export default function Notifications() {
  const { notifications, setSelectedZone } = useFacility();

  return (
    <Card title="Live Alerts" icon={Bell} right={notifications.length > 0 && (
      <span style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)" }}>View All →</span>
    )}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4, maxHeight: 220, overflowY: "auto" }}>
        {notifications.length === 0 && (
          <div style={{ fontSize: 11, color: "var(--ink-sub)", padding: 4 }}>
            No active alerts — run a scenario to populate.
          </div>
        )}
        {notifications.slice(0, 6).map((n) => (
          <button
            key={n.id}
            onClick={() => setSelectedZone(n.zone)}
            className="panel-shift"
            style={{
              padding: 10, borderRadius: 12, background: TIER[n.tier].bg, border: "none", textAlign: "left",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: TIER[n.tier].c }}>
                Zone {n.zone} · {TIER[n.tier].label}
              </span>
              <span style={{ fontSize: 9, color: "var(--ink-sub)" }}>{n.time}</span>
            </div>
            <div style={{ fontSize: 10, marginTop: 3, color: "#4B5563", lineHeight: 1.4 }}>{n.text}</div>
          </button>
        ))}
      </div>
    </Card>
  );
}
