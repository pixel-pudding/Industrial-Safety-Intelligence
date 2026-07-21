import React from "react";
import { TIER } from "../../utils/tierColors.js";
import { WORKER_DENSITY, EQUIPMENT_HEALTH, MAINTENANCE_OVERDUE_DAYS } from "../../utils/overlayData.js";

/** Rendered as a plain HTML overlay (not SVG) so text stays crisp and positioning is simple. */
export default function ZoneTooltip({ zone, tier, x, y }) {
  if (!zone) return null;
  return (
    <div
      className="panel-shift"
      style={{
        position: "absolute", left: x, top: y, transform: "translate(-50%, -110%)",
        background: "#fff", borderRadius: 12, padding: "10px 12px", minWidth: 160,
        boxShadow: "0 8px 24px rgba(16,24,40,0.14)", border: `1px solid ${TIER[tier].c}22`,
        pointerEvents: "none", zIndex: 20,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{zone.short}</div>
      <Row label="Status" value={TIER[tier].label} color={TIER[tier].c} />
      <Row label="Workers" value={WORKER_DENSITY[zone.id]} />
      <Row label="Equip. Health" value={`${EQUIPMENT_HEALTH[zone.id]}%`} />
      {MAINTENANCE_OVERDUE_DAYS[zone.id] > 0 && <Row label="Overdue" value={`${MAINTENANCE_OVERDUE_DAYS[zone.id]}d`} />}
    </div>
  );
}

function Row({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, padding: "1px 0" }}>
      <span style={{ color: "var(--ink-sub)" }}>{label}</span>
      <span style={{ fontWeight: 600, color: color || "var(--ink)" }}>{value}</span>
    </div>
  );
}
