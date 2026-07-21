import React from "react";
import { PLAN } from "../../../utils/geometry.js";
import { MAINTENANCE_OVERDUE_DAYS } from "../../../utils/overlayData.js";

export default function MaintenanceStatusOverlay() {
  return (
    <g className="overlay-fade">
      {Object.entries(MAINTENANCE_OVERDUE_DAYS).map(([id, days]) => {
        if (days === 0) return null;
        const s = PLAN[id];
        const color = days > 90 ? "#DC3B33" : days > 20 ? "#D98A0E" : "#94A3B8";
        return (
          <g key={id} transform={`translate(${s.x + 8}, ${s.y + s.h - 22})`}>
            <rect width="58" height="16" rx="8" fill="#FFFFFF" stroke={color} strokeWidth="1" />
            <text x="29" y="11" textAnchor="middle" fontSize="7.5" fontWeight="700" fill={color}>{days}d overdue</text>
          </g>
        );
      })}
    </g>
  );
}
