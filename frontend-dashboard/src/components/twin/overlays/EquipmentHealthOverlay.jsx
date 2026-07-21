import React from "react";
import { centerOf } from "../../../utils/geometry.js";
import { EQUIPMENT_HEALTH, healthColor } from "../../../utils/overlayData.js";

export default function EquipmentHealthOverlay() {
  return (
    <g className="overlay-fade">
      {Object.entries(EQUIPMENT_HEALTH).map(([id, pct]) => {
        const { cx, cy } = centerOf(id);
        const color = healthColor(pct);
        const circumference = 2 * Math.PI * 30;
        return (
          <g key={id} transform={`translate(${cx - 50}, ${cy - 50})`}>
            <circle cx="18" cy="18" r="14" fill="none" stroke="#EEF0F3" strokeWidth="4" />
            <circle
              cx="18" cy="18" r="14" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * circumference * 0.36} 999`}
              transform="rotate(-90 18 18)"
            />
            <text x="18" y="21" textAnchor="middle" fontSize="8" fontWeight="700" fill="var(--ink)">{pct}</text>
          </g>
        );
      })}
    </g>
  );
}
