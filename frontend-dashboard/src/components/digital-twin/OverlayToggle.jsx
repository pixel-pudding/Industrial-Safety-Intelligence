import React from "react";
import { Layers } from "lucide-react";

const MODES = [
  { id: "live", label: "Live" },
  { id: "riskHeatmap", label: "Risk Heatmap" },
  { id: "gasDispersion", label: "Gas Dispersion" },
  { id: "workerDensity", label: "Worker Density" },
  { id: "equipmentHealth", label: "Equipment Health" },
  { id: "cameraCoverage", label: "Camera Coverage" },
  { id: "maintenanceStatus", label: "Maintenance" },
];

export default function OverlayToggle({ mode, onChange }) {
  return (
    <div
      className="scroll-x-thin"
      style={{
        display: "flex", alignItems: "center", gap: 3, background: "var(--bg-card-sunken)",
        borderRadius: 12, padding: 3, border: "1px solid var(--border-soft)",
        minWidth: 0, maxWidth: "100%", width: "fit-content",
      }}
    >
      <Layers size={12} style={{ color: "var(--ink-sub)", margin: "0 5px", flexShrink: 0 }} />
      {MODES.map((m) => (
        <button
          key={m.id}
          onClick={() => onChange(m.id)}
          style={{
            fontSize: 9.5, fontWeight: 600, padding: "5px 9px", borderRadius: 8, border: "none",
            whiteSpace: "nowrap", flexShrink: 0,
            backgroundImage: mode === m.id ? "var(--accent-grad)" : "none",
            background: mode === m.id ? undefined : "transparent",
            color: mode === m.id ? "#fff" : "#4B5563",
            boxShadow: mode === m.id ? "var(--shadow-accent)" : "none",
            transition: "background 0.15s",
          }}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
