import React from "react";
import {
  ShieldCheck, LayoutDashboard, Box, AlertTriangle, MessageSquare,
  Wrench, ClipboardList, BarChart3, Settings, Circle,
} from "lucide-react";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "twin", label: "Digital Twin", icon: Box },
  { id: "incidents", label: "Incidents", icon: AlertTriangle, badge: 1 },
  { id: "copilot", label: "Safety Copilot", icon: MessageSquare },
  { id: "maintenance", label: "Maintenance", icon: Wrench },
  { id: "permits", label: "Permits", icon: ClipboardList },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  return (
    <div style={{ width: 220, background: "#fff", borderRight: "1px solid var(--border-soft)", minHeight: "100vh", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 20px 16px" }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", backgroundImage: "var(--accent-grad)" }}>
          <ShieldCheck size={18} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.1 }}>SPSCL</div>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.04em", color: "var(--ink-sub)" }}>AI SAFETY INTELLIGENCE</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "0 12px", marginTop: 8 }}>
        {NAV.map((n) => (
          <button
            key={n.id}
            style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12,
              fontSize: 13.5, fontWeight: 500, textAlign: "left", border: "none",
              background: n.id === "dashboard" ? "var(--accent-soft)" : "transparent",
              color: n.id === "dashboard" ? "var(--accent)" : "#4B5563",
            }}
          >
            <n.icon size={16} />
            {n.label}
            {n.badge && (
              <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, padding: "0 6px", borderRadius: 999, background: "var(--tier-critical-bg)", color: "var(--tier-critical)" }}>
                {n.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ marginTop: "auto", margin: 12, padding: 12, borderRadius: 12, background: "#F8F9FB" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 600 }}>
          <Circle size={7} fill="var(--tier-normal)" color="var(--tier-normal)" />
          All Systems Online
        </div>
        <div style={{ fontSize: 10, marginTop: 4, color: "var(--ink-sub)" }}>98.7% uptime this shift</div>
      </div>
    </div>
  );
}
