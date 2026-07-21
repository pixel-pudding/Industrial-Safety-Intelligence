import React from "react";
import { Bell, Circle, Clock, Search, Wifi, WifiOff } from "lucide-react";
import { useLiveClock } from "../../hooks/useLiveClock.js";
import { useFacility } from "../../hooks/useFacilityState.jsx";

export default function Header() {
  const time = useLiveClock();
  const { connected, notifications } = useFacility();
  const criticalCount = notifications.filter((n) => n.tier === "critical").length;

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 28px", borderBottom: "1px solid var(--border-soft)",
      background: "rgba(255,255,255,0.85)", backdropFilter: "blur(10px)",
      position: "sticky", top: 0, zIndex: 30, minWidth: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12.5, fontWeight: 600, color: "#374151", flexShrink: 0 }}>
        <Circle size={7} fill="var(--tier-normal)" color="var(--tier-normal)" />
        Shift A (Morning)
        <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--ink-sub)", fontWeight: 500 }}>
          <Clock size={12} /> {time}
        </span>
        <span
          title={connected ? "Live backend connection" : "Backend unreachable — reconnecting…"}
          style={{
            display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, fontWeight: 700,
            padding: "3px 9px", borderRadius: 999,
            color: connected ? "var(--tier-normal)" : "var(--tier-critical)",
            background: connected ? "var(--tier-normal-bg)" : "var(--tier-critical-bg)",
          }}
        >
          {connected ? <Wifi size={11} /> : <WifiOff size={11} />}
          {connected ? "Live" : "Offline"}
        </span>
      </div>

      <div style={{
        display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 12,
        background: "var(--bg-card-sunken)", flex: "1 1 auto", minWidth: 0, maxWidth: 420, margin: "0 24px",
        border: "1px solid var(--border-soft)",
      }}>
        <Search size={14} style={{ color: "var(--ink-sub)", flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: "var(--ink-sub)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Search zones, permits, incidents…</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 18, flexShrink: 0 }}>
        <button style={{ position: "relative", background: "none", border: "none", padding: 4 }}>
          <Bell size={18} style={{ color: "#4B5563" }} />
          {criticalCount > 0 && (
            <span
              className="pulse"
              style={{
                position: "absolute", top: -2, right: -2, width: 14, height: 14, borderRadius: "50%",
                background: "var(--tier-critical)", color: "#fff", fontSize: 8.5, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {criticalCount}
            </span>
          )}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            backgroundImage: "var(--accent-grad)", color: "#fff", fontSize: 11.5, fontWeight: 700,
            boxShadow: "var(--shadow-accent)",
          }}>
            RD
          </div>
          <div style={{ fontSize: 12.5 }}>
            <div style={{ fontWeight: 700 }}>R. Deshpande</div>
            <div style={{ color: "var(--ink-sub)", fontSize: 10.5 }}>Safety Officer</div>
          </div>
        </div>
      </div>
    </div>
  );
}
