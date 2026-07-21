import React from "react";
import { PLAN } from "../../../utils/geometry.js";

const DAYS_RE = /(\d+)d overdue/;

/**
 * Sourced from the Quality & Compliance Audit Agent's own output
 * (/api/compliance-audit, gaps where category === "maintenance_overdue") —
 * reusing that agent's real findings rather than adding a new backend
 * endpoint. Audit-cadence, not tick-cadence, which matches Part II's design
 * for that agent (scheduled/anomaly-triggered, not continuous) — the badge
 * reflects "as of the last audit run," shown via the timestamp caption.
 */
export default function MaintenanceStatusOverlay({ complianceAudits }) {
  const latest = complianceAudits?.[0];
  const gaps = (latest?.gaps || []).filter((g) => g.category === "maintenance_overdue");

  if (gaps.length === 0) return null;

  return (
    <g className="overlay-fade">
      {gaps.map((gap, i) => {
        const s = PLAN[gap.zone_id];
        if (!s) return null;
        const match = gap.description.match(DAYS_RE);
        const days = match ? Number(match[1]) : null;
        const color = days && days > 30 ? "#E11D48" : "#F59E0B";
        return (
          <g key={i} transform={`translate(${s.x + 8}, ${s.y + s.h - 22})`}>
            <rect width="76" height="16" rx="8" fill="#FFFFFF" stroke={color} strokeWidth="1" />
            <text x="38" y="11" textAnchor="middle" fontSize="7.5" fontWeight="700" fill={color}>
              {days != null ? `${days}d overdue` : "Overdue"}
            </text>
          </g>
        );
      })}
    </g>
  );
}
