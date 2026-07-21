import React from "react";
import { Search, Bell, Circle, Clock } from "lucide-react";
import { useLiveClock } from "../../hooks/useLiveClock.js";

export default function Header() {
  const time = useLiveClock();

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid var(--border-soft)", background: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, fontWeight: 600, color: "#374151" }}>
        <Circle size={7} fill="var(--tier-normal)" color="var(--tier-normal)" />
        Shift A (Morning)
        <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--ink-sub)", fontWeight: 500 }}>
          <Clock size={12} /> {time}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 12, background: "var(--bg-app)", flex: 1, maxWidth: 420, margin: "0 24px" }}>
        <Search size={14} style={{ color: "var(--ink-sub)" }} />
        <span style={{ fontSize: 12, color: "var(--ink-sub)" }}>Search platform…</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button style={{ position: "relative", background: "none", border: "none" }}>
          <Bell size={17} style={{ color: "#4B5563" }} />
          <span style={{ position: "absolute", top: -4, right: -4, width: 13, height: 13, borderRadius: "50%", background: "var(--tier-critical)", color: "#fff", fontSize: 8, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
            3
          </span>
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundImage: "var(--accent-grad-soft)", color: "var(--accent)", fontSize: 11, fontWeight: 700 }}>
            RD
          </div>
          <div style={{ fontSize: 12 }}>
            <div style={{ fontWeight: 600 }}>R. Deshpande</div>
            <div style={{ color: "var(--ink-sub)", fontSize: 10 }}>Safety Officer</div>
          </div>
        </div>
      </div>
    </div>
  );
}
