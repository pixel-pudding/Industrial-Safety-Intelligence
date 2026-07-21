import React, { useRef, useState } from "react";
import { Box, Circle, Video, Users, Truck, Zap } from "lucide-react";
import Card from "../common/Card.jsx";
import ZoneNode from "./ZoneNode.jsx";
import ZoneTooltip from "./ZoneTooltip.jsx";
import ProcessPiping from "./ProcessPiping.jsx";
import OverlayToggle from "./OverlayToggle.jsx";
import RiskHeatmapOverlay from "./overlays/RiskHeatmapOverlay.jsx";
import GasDispersionOverlay from "./overlays/GasDispersionOverlay.jsx";
import WorkerDensityOverlay from "./overlays/WorkerDensityOverlay.jsx";
import EquipmentHealthOverlay from "./overlays/EquipmentHealthOverlay.jsx";
import CameraCoverageOverlay from "./overlays/CameraCoverageOverlay.jsx";
import MaintenanceStatusOverlay from "./overlays/MaintenanceStatusOverlay.jsx";
import { PLAN, zoneById } from "../../utils/geometry.js";
import { useFacility } from "../../hooks/useFacilityState.js";

const VIEW_W = 640, VIEW_H = 380;

const OVERLAY_COMPONENTS = {
  riskHeatmap: RiskHeatmapOverlay,
  gasDispersion: GasDispersionOverlay,
  workerDensity: WorkerDensityOverlay,
  equipmentHealth: EquipmentHealthOverlay,
  cameraCoverage: CameraCoverageOverlay,
  maintenanceStatus: MaintenanceStatusOverlay,
  // "live" mode intentionally renders no overlay — base twin + status pulses only
};

export default function DigitalTwin() {
  const { tiers, selectedZone, setSelectedZone, hoveredZone, setHoveredZone, overlayMode, setOverlayMode, activeCorrelation, scenarioRunning, runScenario } = useFacility();
  const containerRef = useRef(null);
  const [tooltipPos, setTooltipPos] = useState(null);

  const handleHover = (zoneId, e) => {
    setHoveredZone(zoneId);
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const s = PLAN[zoneId];
    const scaleX = rect.width / VIEW_W;
    const scaleY = rect.height / VIEW_H;
    setTooltipPos({ x: (s.x + s.w / 2) * scaleX, y: s.y * scaleY });
  };

  const OverlayComp = OVERLAY_COMPONENTS[overlayMode];

  return (
    <Card
      title="Interactive Digital Twin"
      icon={Box}
      pad={false}
      accent
      right={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <OverlayToggle mode={overlayMode} onChange={setOverlayMode} />
          <button
            onClick={runScenario}
            disabled={scenarioRunning}
            style={{
              display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700,
              padding: "8px 14px", borderRadius: 10, border: "none", color: "#fff",
              backgroundImage: scenarioRunning ? "none" : "var(--accent-grad)",
              background: scenarioRunning ? "#D8D5F5" : undefined,
            }}
          >
            <Zap size={12} /> {scenarioRunning ? "Running…" : "Run Scenario 10"}
          </button>
        </div>
      }
    >
      <div
        ref={containerRef}
        style={{ position: "relative", margin: "0 20px 20px", borderRadius: 16, overflow: "hidden", height: 440, backgroundImage: "linear-gradient(180deg,#F3F6FC 0%,#EDF1F9 100%)" }}
      >
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <defs>
            <filter id="blur"><feGaussianBlur stdDeviation="24" /></filter>
            <marker id="flow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#AEB8C4" />
            </marker>
          </defs>

          <ProcessPiping activeCorrelation={activeCorrelation} />
          {OverlayComp && <OverlayComp tiers={tiers} />}

          {/* access road + lightweight truck shuttle near the loading bay */}
          <path d="M524,266 L524,340 L610,340" fill="none" stroke="#DDE3ED" strokeWidth="10" strokeLinecap="round" />
          <path d="M524,266 L524,340 L610,340" fill="none" stroke="#FFFFFF" strokeWidth="1.2" strokeDasharray="5 5" />
          <g className="truck-shuttle" transform="translate(575,340)">
            <rect x="-14" y="-8" width="28" height="14" rx="2" fill="#9CA9B8" />
            <rect x="6" y="-11" width="10" height="9" rx="1.5" fill="#7C8A9A" />
            <circle cx="-8" cy="7" r="3" fill="#4B5563" />
            <circle cx="10" cy="7" r="3" fill="#4B5563" />
          </g>

          {Object.entries(PLAN).map(([id, s]) => (
            <ZoneNode
              key={id}
              zone={zoneById(id)}
              s={s}
              tier={tiers[id]}
              isSelected={selectedZone === id}
              onSelect={setSelectedZone}
              onHover={handleHover}
              onLeave={() => setHoveredZone(null)}
            />
          ))}
        </svg>

        {hoveredZone && tooltipPos && (
          <ZoneTooltip zone={zoneById(hoveredZone)} tier={tiers[hoveredZone]} x={tooltipPos.x} y={tooltipPos.y} />
        )}

        <div style={{ position: "absolute", bottom: 12, left: 16, display: "flex", alignItems: "center", gap: 16, fontSize: 10, fontWeight: 500, padding: "6px 12px", borderRadius: 10, background: "#FFFFFFCC", color: "#4B5563", backdropFilter: "blur(6px)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Circle size={7} fill="var(--tier-normal)" color="var(--tier-normal)" /> Sensors</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Video size={11} /> Cameras</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Users size={11} /> Workers</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Truck size={11} /> Loading</span>
        </div>
      </div>
    </Card>
  );
}
