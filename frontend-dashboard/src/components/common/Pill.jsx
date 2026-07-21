import React from "react";
import { TIER } from "../../utils/tierColors.js";

export default function Pill({ tier, label = null, size = "md" }) {
  const t = TIER[tier] || TIER.normal;
  const isSm = size === "sm";
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        fontSize: isSm ? 9.5 : 10.5, fontWeight: 700,
        padding: isSm ? "2px 8px" : "3px 11px",
        borderRadius: "var(--radius-pill)",
        color: t.c, background: t.bg,
        letterSpacing: "0.01em",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.c, flexShrink: 0 }} />
      {label ?? t.label}
    </span>
  );
}
