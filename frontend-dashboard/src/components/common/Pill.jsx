import React from "react";
import { TIER } from "../../utils/tierColors.js";

export default function Pill({ tier }) {
  const t = TIER[tier];
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 10px",
        borderRadius: 999,
        color: t.c,
        background: t.bg,
      }}
    >
      {t.label}
    </span>
  );
}
