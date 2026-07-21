import React from "react";
import { centerOf } from "../../../utils/geometry.js";
import { GAS_TAGS } from "../../../utils/overlayData.js";
import { RAW_TIER_HEX } from "../../../utils/tierColors.js";

/**
 * Renders ONLY the two real gas-hazard tags (VOC-CONC, CL2-CONC) from live
 * readings — not "any active zone" like a generic risk glow. This is the
 * actual gas concentration sensor tier at its actual zone, animated via CSS
 * (see .gas-drift in index.css), no dispersion physics simulation.
 */
export default function GasDispersionOverlay({ readings }) {
  const active = GAS_TAGS
    .map((tag) => readings?.[tag])
    .filter((r) => r && r.tier !== "normal");

  if (active.length === 0) return null;

  return (
    <g className="overlay-fade">
      {active.map((r, i) => {
        const { cx, cy } = centerOf(r.zone);
        const color = RAW_TIER_HEX[r.tier];
        return (
          <g key={i}>
            <circle className="gas-drift" cx={cx} cy={cy} r="58" fill={color} style={{ transformOrigin: `${cx}px ${cy}px` }} />
            <circle className="gas-drift" cx={cx} cy={cy} r="86" fill={color} opacity="0.5" style={{ transformOrigin: `${cx}px ${cy}px`, animationDelay: "0.6s" }} />
          </g>
        );
      })}
    </g>
  );
}
