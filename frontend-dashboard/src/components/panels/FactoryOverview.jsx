import React from "react";
import { AlertTriangle, Gauge, ShieldCheck, Users, Video, Wrench } from "lucide-react";
import Card from "../common/Card.jsx";
import { useFacility } from "../../hooks/useFacilityState.jsx";
import { CAMERA_ZONES } from "../../utils/overlayData.js";

/**
 * Every number here is derived from live backend data (heatmap + readings),
 * not hardcoded — see useFacilityState.js for the derivation. CCTV coverage
 * is the one exception: it's static reference data (Foundation Design Step
 * 8's camera placement table), not a live feed — the backend has no CCTV
 * coverage endpoint, only discrete event logging. See utils/overlayData.js.
 */
export default function FactoryOverview() {
  const { heatmap, readings, notifications } = useFacility();

  const zoneEntries = heatmap?.zones ?? [];
  const activeWorkers = zoneEntries.reduce((sum, z) => sum + (z.worker_count || 0), 0);
  const activePermits = zoneEntries.reduce((sum, z) => sum + (z.active_permits?.length || 0), 0);
  const activeCritical = zoneEntries.filter((z) => z.risk_tier === "critical").length;

  const readingValues = Object.values(readings);
  const onlineSensors = readingValues.length;
  const normalSensors = readingValues.filter((r) => r.tier === "normal").length;
  const sensorHealthPct = onlineSensors > 0 ? Math.round((normalSensors / onlineSensors) * 100) : 100;

  const stats = [
    { label: "Active Workers", value: String(activeWorkers), icon: Users, bg: "#EEF2FF", fg: "#4F46E5" },
    { label: "Online Sensors", value: `${onlineSensors}/${onlineSensors}`, icon: Gauge, bg: "var(--tier-normal-bg)", fg: "var(--tier-normal)" },
    { label: "Zones with CCTV", value: `${CAMERA_ZONES.length}/${zoneEntries.length || 11}`, icon: Video, bg: "#F4EEFD", fg: "#8B5CF6" },
    { label: "Active Permits", value: String(activePermits), icon: ShieldCheck, bg: "#EAF3FF", fg: "#2B6CB0" },
    {
      label: "Sensor Health", value: `${sensorHealthPct}%`, icon: Wrench,
      bg: sensorHealthPct > 90 ? "var(--tier-normal-bg)" : "var(--tier-warning-bg)",
      fg: sensorHealthPct > 90 ? "var(--tier-normal)" : "var(--tier-warning)",
    },
    {
      label: "Active Incidents", value: activeCritical > 0 ? `${activeCritical} Critical` : "0", icon: AlertTriangle,
      bg: activeCritical > 0 ? "var(--tier-critical-bg)" : "#F3F4F6",
      fg: activeCritical > 0 ? "var(--tier-critical)" : "var(--ink-sub)",
    },
  ];

  return (
    <Card title="Factory Overview" icon={Gauge}>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 4 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "7px 9px", borderRadius: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: s.bg }}>
              <s.icon size={16} style={{ color: s.fg }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "var(--ink-sub)" }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>
      {notifications.length === 0 && (
        <div style={{ marginTop: 8, fontSize: 10, color: "var(--ink-faint)", textAlign: "center" }}>
          Nominal — run a scenario to see live compound risk detection.
        </div>
      )}
    </Card>
  );
}
