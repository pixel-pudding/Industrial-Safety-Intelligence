import React from "react";
import {
  AlertTriangle, BarChart3, Box, ClipboardList, LayoutDashboard,
  MessageSquare, Settings, ShieldCheck, Wrench,
} from "lucide-react";
import { useFacility } from "../../hooks/useFacilityState.jsx";

export default function Sidebar() {
  const { notifications, permitFlags } = useFacility();
  const criticalCount = notifications.filter((n) => n.tier === "critical").length;
  const permitCount = permitFlags.length;

  const NAV = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "twin", label: "Digital Twin", icon: Box },
    { id: "incidents", label: "Incidents", icon: AlertTriangle, badge: criticalCount || null },
    { id: "copilot", label: "Safety Copilot", icon: MessageSquare },
    { id: "maintenance", label: "Maintenance", icon: Wrench },
    { id: "permits", label: "Permits", icon: ClipboardList, badge: permitCount || null },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div style={{
      width: 224, background: "var(--bg-card)", borderRight: "1px solid var(--border-soft)",
      minHeight: "100vh", display: "flex", flexDirection: "column", flexShrink: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "22px 20px 18px" }}>
        <div style={{
          width: 36, height: 36, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center",
          backgroundImage: "var(--accent-grad)", boxShadow: "var(--shadow-accent)", flexShrink: 0,
        }}>
          <ShieldCheck size={19} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 800, lineHeight: 1.1, color: "var(--ink)" }}>SPSCL</div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", color: "var(--ink-sub)" }}>AI SAFETY INTELLIGENCE</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 3, padding: "0 12px", marginTop: 6 }}>
        {NAV.map((n) => {
          const active = n.id === "dashboard";
          return (
            <button
              key={n.id}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12,
                fontSize: 13.5, textAlign: "left", border: "none", minWidth: 0,
                backgroundImage: active ? "var(--accent-grad-soft)" : "none",
                color: active ? "var(--accent)" : "#4B5563",
                fontWeight: active ? 700 : 500,
                transition: "background 0.15s",
              }}
            >
              <n.icon size={16} />
              {n.label}
              {n.badge != null && (
                <span style={{
                  marginLeft: "auto", fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 999,
                  background: "var(--tier-critical-bg)", color: "var(--tier-critical)",
                }}>
                  {n.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: "auto", margin: 14, padding: 14, borderRadius: 14, background: "var(--bg-card-sunken)", border: "1px solid var(--border-soft)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, fontWeight: 700, color: "var(--ink)" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--tier-normal)" }} className="pulse" />
          All Systems Online
        </div>
        <div style={{ fontSize: 10, marginTop: 5, color: "var(--ink-sub)" }}>Compound Risk Detection Engine active</div>
      </div>
    </div>
  );
}
