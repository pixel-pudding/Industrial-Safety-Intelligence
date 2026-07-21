import React from "react";
import { Gauge, Users, Activity, Video, ClipboardList, Wrench, AlertTriangle } from "lucide-react";
import Card from "../common/Card.jsx";
import { useFacility } from "../../hooks/useFacilityState.js";

const STATS = [
  { label: "Active Workers", value: "142", icon: Users, bg: "#EEF2FF", fg: "#4F46E5" },
  { label: "Online Sensors", value: "312/312", icon: Activity, bg: "var(--tier-normal-bg)", fg: "var(--tier-normal)" },
  { label: "CCTV Cameras", value: "86/86", icon: Video, bg: "#F4EEFD", fg: "#8B5CF6" },
  { label: "Active Permits", value: "7", icon: ClipboardList, bg: "#EAF3FF", fg: "#2B6CB0" },
  { label: "Equipment Health", value: "96%", icon: Wrench, bg: "var(--tier-warning-bg)", fg: "var(--tier-warning)" },
];

export default function FactoryOverview() {
  const { riskEvents } = useFacility();
  const activeCritical = riskEvents.some((e) => e.tier === "critical");

  const stats = [
    ...STATS,
    {
      label: "Active Incidents",
      value: activeCritical ? "1 Critical" : "0",
      icon: AlertTriangle,
      bg: activeCritical ? "var(--tier-critical-bg)" : "#F3F4F6",
      fg: activeCritical ? "var(--tier-critical)" : "var(--ink-sub)",
    },
  ];

  return (
    <Card title="Factory Overview" icon={Gauge}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 10px", borderRadius: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: s.bg }}>
              <s.icon size={16} style={{ color: s.fg }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "var(--ink-sub)" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
