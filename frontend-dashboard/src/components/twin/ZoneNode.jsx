import React from "react";
import ZoneGlyph from "./ZoneGlyph.jsx";
import { TIER } from "../../utils/tierColors.js";

export default function ZoneNode({ zone, s, tier, isSelected, onSelect, onHover, onLeave }) {
  const fillC = tier === "critical" ? TIER.critical.bg : tier === "warning" ? TIER.warning.bg : "#FFFFFF";
  // resolve to raw hex for SVG stroke reliability (CSS var() works in SVG presentation attrs
  // in modern browsers, but we keep this explicit for consistency and easy theming later)
  const rawStroke = isSelected ? "#5B4FE0" : tier === "critical" ? "#DC3B33" : tier === "warning" ? "#D98A0E" : "#E7EAF0";

  return (
    <g
      onClick={() => onSelect(zone.id)}
      onMouseEnter={(e) => onHover(zone.id, e)}
      onMouseLeave={onLeave}
      style={{ cursor: "pointer" }}
    >
      <rect x={s.x} y={s.y + 4} width={s.w} height={s.h} rx="14" fill="#00000008" />
      <rect
        x={s.x} y={s.y} width={s.w} height={s.h} rx="14"
        fill={fillC} stroke={rawStroke} strokeWidth={isSelected ? 2.2 : 1.4}
        style={{ transition: "stroke 0.2s, fill 0.3s" }}
      />

      <ZoneGlyph id={zone.id} s={s} tier={tier} />

      {tier !== "normal" && (
        <circle className="pulse" cx={s.x + s.w - 12} cy={s.y + 12} r="4" fill={tier === "critical" ? "#DC3B33" : "#D98A0E"} />
      )}

      <text x={s.x + 10} y={s.y + s.h - 10} fontSize="9.5" fontWeight="700" fill="var(--ink)">{zone.short}</text>

      {tier !== "normal" && (
        <g transform={`translate(${Math.min(s.x + s.w + 8, 500)}, ${s.y})`} className="panel-shift">
          <rect width="126" height="28" rx="8" fill="#FFFFFF" stroke={tier === "critical" ? "#DC3B33" : "#D98A0E"} strokeWidth="1" style={{ filter: "drop-shadow(0 2px 4px rgba(16,24,40,0.12))" }} />
          <circle cx="12" cy="14" r="4" fill={tier === "critical" ? "#DC3B33" : "#D98A0E"} />
          <text x="22" y="17" fontSize="8" fontWeight="700" fill={tier === "critical" ? "#DC3B33" : "#D98A0E"}>
            {tier.toUpperCase()} DETECTED
          </text>
        </g>
      )}
    </g>
  );
}
