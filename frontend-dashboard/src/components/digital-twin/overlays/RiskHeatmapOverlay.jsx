import React from "react";
import { PLAN, centerOf } from "../../../utils/geometry.js";
import { RAW_TIER_HEX } from "../../../utils/tierColors.js";

/**
 * Weather-radar-style glow per zone, sized/opacity by the zone's LIVE
 * risk_score from /api/heatmap (real, every tick) — not just a tier flag,
 * so a zone climbing from 20 to 70 within Warning visibly gets a stronger
 * glow before it ever crosses into Critical.
 */
export default function RiskHeatmapOverlay({ heatmap }) {
  if (!heatmap) return null;
  return (
    <g className="overlay-fade">
      {heatmap.zones.map((z) => {
        if (z.risk_tier === "normal") return null;
        const { cx, cy } = centerOf(z.zone_id);
        const intensity = Math.min(z.risk_score / 100, 1);
        return (
          <circle
            key={z.zone_id} cx={cx} cy={cy} r={70 + intensity * 55}
            fill={RAW_TIER_HEX[z.risk_tier]} opacity={0.14 + intensity * 0.18} filter="url(#blur)"
          />
        );
      })}
    </g>
  );
}
