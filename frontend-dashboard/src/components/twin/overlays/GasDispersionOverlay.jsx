import React from "react";
import { centerOf } from "../../../utils/geometry.js";

/**
 * Fakes a gas cloud with layered semi-transparent circles animated via CSS
 * (see .gas-drift in index.css) rather than any dispersion simulation — per
 * the implementation principle of preferring a believable illusion.
 */
export default function GasDispersionOverlay({ tiers }) {
  const activeZones = Object.entries(tiers).filter(([, t]) => t !== "normal");
  if (activeZones.length === 0) return null;

  return (
    <g className="overlay-fade">
      {activeZones.map(([id, t]) => {
        const { cx, cy } = centerOf(id);
        const color = t === "critical" ? "#DC3B33" : "#D98A0E";
        return (
          <g key={id}>
            <circle className="gas-drift" cx={cx} cy={cy} r="60" fill={color} style={{ transformOrigin: `${cx}px ${cy}px` }} />
            <circle className="gas-drift" cx={cx} cy={cy} r="90" fill={color} opacity="0.5" style={{ transformOrigin: `${cx}px ${cy}px`, animationDelay: "0.6s" }} />
          </g>
        );
      })}
    </g>
  );
}
