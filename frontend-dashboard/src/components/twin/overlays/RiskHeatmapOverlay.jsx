import React from "react";
import { PLAN, centerOf } from "../../../utils/geometry.js";
import { RAW_TIER_HEX } from "../../../utils/tierColors.js";

/** Weather-radar-style glow, faked with a Gaussian blur filter + opacity — no computation. */
export default function RiskHeatmapOverlay({ tiers }) {
  return (
    <g className="overlay-fade">
      {Object.keys(PLAN).map((id) => {
        const t = tiers[id];
        if (!t || t === "normal") return null;
        const { cx, cy } = centerOf(id);
        return <circle key={id} cx={cx} cy={cy} r="105" fill={RAW_TIER_HEX[t]} opacity="0.18" filter="url(#blur)" />;
      })}
    </g>
  );
}
