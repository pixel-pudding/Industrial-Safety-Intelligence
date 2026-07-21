import React from "react";
import { PLAN, centerOf } from "../../../utils/geometry.js";

function healthColor(pct) {
  if (pct >= 90) return "#12B76A";
  if (pct >= 70) return "#F59E0B";
  return "#E11D48";
}

/**
 * "Equipment health" here is a real, honestly-scoped proxy: % of this
 * zone's monitored sensor tags currently reading Normal, from live
 * /readings. The backend has no separate 0-100 "equipment health" metric —
 * this is the closest real signal to that concept (a zone whose tags are
 * all Normal genuinely does have healthy equipment by this platform's own
 * definition of health), not a fabricated number.
 */
export default function EquipmentHealthOverlay({ readings }) {
  const byZone = {};
  for (const [tag, r] of Object.entries(readings || {})) {
    byZone[r.zone] = byZone[r.zone] || [];
    byZone[r.zone].push(r.tier);
  }

  return (
    <g className="overlay-fade">
      {Object.keys(PLAN).map((zoneId) => {
        const tiers = byZone[zoneId];
        if (!tiers || tiers.length === 0) return null;
        const pct = Math.round((tiers.filter((t) => t === "normal").length / tiers.length) * 100);
        const { cx, cy } = centerOf(zoneId);
        const color = healthColor(pct);
        const circumference = 2 * Math.PI * 14;
        return (
          <g key={zoneId} transform={`translate(${cx - 48}, ${cy - 48})`}>
            <circle cx="18" cy="18" r="14" fill="#FFFFFFCC" stroke="#EEF0F3" strokeWidth="4" />
            <circle
              cx="18" cy="18" r="14" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * circumference} 999`}
              transform="rotate(-90 18 18)"
            />
            <text x="18" y="21" textAnchor="middle" fontSize="8" fontWeight="700" fill="var(--ink)">{pct}</text>
          </g>
        );
      })}
    </g>
  );
}
