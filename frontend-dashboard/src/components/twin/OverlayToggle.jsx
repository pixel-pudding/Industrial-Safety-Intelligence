import React from "react";
import { Layers } from "lucide-react";

const MODES = [
  { id: "live", label: "Live Ops" },
  { id: "riskHeatmap", label: "Risk Heatmap" },
  { id: "gasDispersion", label: "Gas Dispersion" },
  { id: "workerDensity", label: "Worker Density" },
  { id: "equipmentHealth", label: "Equipment Health" },
  { id: "cameraCoverage", label: "Camera Coverage" },
  { id: "maintenanceStatus", label: "Maintenance" },
];

export default function OverlayToggle({ mode, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, background: "var(--bg-app)", borderRadius: 12, padding: 3 }}>
      <Layers size={12} style={{ color: "var(--ink-sub)", margin: "0 4px" }} />
      {MODES.map((m) => (
        <button
          key={m.id}
          onClick={() => onChange(m.id)}
          style={{
            fontSize: 9.5, fontWeight: 600, padding: "5px 8px", borderRadius: 8, border: "none",
            whiteSpace: "nowrap",
            backgroundImage: mode === m.id ? "var(--accent-grad)" : "none",
            background: mode === m.id ? undefined : "transparent",
            color: mode === m.id ? "#fff" : "#4B5563",
            transition: "background 0.15s",
          }}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
