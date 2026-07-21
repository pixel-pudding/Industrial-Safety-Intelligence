import React from "react";
import { TIER } from "../../utils/tierColors.js";

/** Rendered as a plain HTML overlay (not SVG) so text stays crisp. All fields
 * come from the live heatmap entry for this zone (real, per-tick backend data). */
export default function ZoneTooltip({ zone, tier, heatmapEntry, x, y }) {
  if (!zone) return null;
  const t = TIER[tier] || TIER.normal;

  return (
    <div
      className="panel-shift"
      style={{
        position: "absolute", left: x, top: y, transform: "translate(-50%, -112%)",
        background: "#fff", borderRadius: 13, padding: "11px 13px", minWidth: 172,
        boxShadow: "var(--shadow-float)", border: `1px solid ${t.c}33`,
        pointerEvents: "none", zIndex: 20,
      }}
    >
      <div style={{ fontSize: 11.5, fontWeight: 700, marginBottom: 5 }}>{zone.short}</div>
      <Row label="Status" value={t.label} color={t.c} />
      <Row label="Risk Score" value={heatmapEntry ? `${Math.round(heatmapEntry.risk_score)}%` : "—"} />
      <Row label="Workers" value={heatmapEntry?.worker_count ?? "—"} />
      <Row label="Active Permits" value={heatmapEntry?.active_permits?.length ?? 0} />
      <div style={{ fontSize: 9, color: "var(--ink-faint)", marginTop: 4, paddingTop: 4, borderTop: "1px solid var(--border-soft)" }}>
        {zone.hazard}
      </div>
    </div>
  );
}

function Row({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, padding: "1.5px 0" }}>
      <span style={{ color: "var(--ink-sub)" }}>{label}</span>
      <span style={{ fontWeight: 600, color: color || "var(--ink)" }}>{value}</span>
    </div>
  );
}
