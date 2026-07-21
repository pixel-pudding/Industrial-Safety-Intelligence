import React from "react";
import { Bell } from "lucide-react";
import Card from "../common/Card.jsx";
import { TIER } from "../../utils/tierColors.js";
import { useFacility } from "../../hooks/useFacilityState.js";

export default function Notifications() {
  const { notifications } = useFacility();

  return (
    <Card title="Live Alerts" icon={Bell}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
        {notifications.length === 0 && (
          <div style={{ fontSize: 11, color: "var(--ink-sub)", padding: 4 }}>
            No active alerts — run Scenario 10 to populate.
          </div>
        )}
        {notifications.slice(0, 5).map((n) => (
          <div key={n.id} className="panel-shift" style={{ padding: 10, borderRadius: 12, background: TIER[n.tier].bg }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: TIER[n.tier].c }}>
              Zone {n.zone} · {TIER[n.tier].label}
            </div>
            <div style={{ fontSize: 10, marginTop: 2, color: "#4B5563" }}>{n.text}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
