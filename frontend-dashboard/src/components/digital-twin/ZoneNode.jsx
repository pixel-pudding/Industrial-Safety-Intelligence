import React from "react";
import ZoneGlyph from "./ZoneGlyph.jsx";
import { TIER, RAW_TIER_HEX } from "../../utils/tierColors.js";

export default function ZoneNode({ zone, s, tier, isSelected, isCorrelated, onSelect, onHover, onLeave }) {
  const fillC = tier === "critical" ? TIER.critical.bg : tier === "warning" ? TIER.warning.bg : "#FFFFFF";
  const rawStroke = isSelected ? "#5B4FE0" : tier === "critical" ? RAW_TIER_HEX.critical : tier === "warning" ? RAW_TIER_HEX.warning : "#E1E5F0";

  return (
    <g
      onClick={() => onSelect(zone.id)}
      onMouseEnter={(e) => onHover(zone.id, e)}
      onMouseLeave={onLeave}
      style={{ cursor: "pointer" }}
    >
      {/* soft drop shadow */}
      <rect x={s.x} y={s.y + 5} width={s.w} height={s.h} rx="16" fill="#101B3D0D" />

      {isCorrelated && (
        <rect
          x={s.x - 4} y={s.y - 4} width={s.w + 8} height={s.h + 8} rx="18"
          fill="none" stroke={RAW_TIER_HEX.critical} strokeWidth="1.5" opacity="0.55"
          className="risk-ring-expand"
        />
      )}

      <rect
        x={s.x} y={s.y} width={s.w} height={s.h} rx="16"
        fill={fillC} stroke={rawStroke} strokeWidth={isSelected ? 2.4 : 1.4}
        style={{ transition: "stroke 0.2s, fill 0.3s" }}
      />

      <ZoneGlyph id={zone.id} s={s} tier={tier} />

      {tier !== "normal" && (
        <circle className="pulse" cx={s.x + s.w - 13} cy={s.y + 13} r="4.5" fill={tier === "critical" ? RAW_TIER_HEX.critical : RAW_TIER_HEX.warning} />
      )}

      <text x={s.x + 12} y={s.y + s.h - 11} fontSize="10.5" fontWeight="700" fill="var(--ink)">{zone.short}</text>

      {tier !== "normal" && (
        <g transform={`translate(${Math.min(s.x + 10, 500)}, ${s.y - 24})`} className="panel-shift">
          <rect width="140" height="20" rx="7" fill="#FFFFFF"
            stroke={tier === "critical" ? RAW_TIER_HEX.critical : RAW_TIER_HEX.warning} strokeWidth="1"
            style={{ filter: "drop-shadow(0 2px 6px rgba(16,24,40,0.16))" }} />
          <circle cx="12" cy="10" r="3.5" fill={tier === "critical" ? RAW_TIER_HEX.critical : RAW_TIER_HEX.warning} />
          <text x="21" y="13.5" fontSize="8.5" fontWeight="700" fill={tier === "critical" ? RAW_TIER_HEX.critical : RAW_TIER_HEX.warning}>
            {tier.toUpperCase()} {isCorrelated ? "· COMPOUND" : "DETECTED"}
          </text>
        </g>
      )}
    </g>
  );
}
