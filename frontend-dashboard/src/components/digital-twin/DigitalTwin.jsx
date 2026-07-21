import React, { useRef, useState } from "react";
import { Box, Circle, ClipboardList, Maximize2, Minus, Plus, RotateCcw, Truck, Users, Video, Wifi, WifiOff, Zap } from "lucide-react";
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
import { PLAN, VIEW_W, VIEW_H, zoneById } from "../../utils/geometry.js";
import { useFacility } from "../../hooks/useFacilityState.jsx";

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
  const {
    tiers, heatmap, readings, complianceAudits, selectedZone, setSelectedZone,
    hoveredZone, setHoveredZone, overlayMode, setOverlayMode, activeCorrelation,
    scenarioRunning, runScenario, resetSimulation, scenarios, connected,
  } = useFacility();

  const containerRef = useRef(null);
  const [tooltipPos, setTooltipPos] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pickedScenario, setPickedScenario] = useState("scenario_10");

  const handleHover = (zoneId, e) => {
    setHoveredZone(zoneId);
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const s = PLAN[zoneId];
    const scaleX = (rect.width / VIEW_W) * zoom;
    const scaleY = (rect.height / VIEW_H) * zoom;
    setTooltipPos({ x: (s.x + s.w / 2) * scaleX, y: s.y * scaleY });
  };

  const OverlayComp = OVERLAY_COMPONENTS[overlayMode];
  const overlayProps = { heatmap, readings, complianceAudits };
  const hoveredHeatmapEntry = heatmap?.zones?.find((z) => z.zone_id === hoveredZone) ?? null;

  const workersTotal = heatmap?.zones?.reduce((sum, z) => sum + (z.worker_count || 0), 0) ?? 0;
  const permitsTotal = heatmap?.zones?.reduce((sum, z) => sum + (z.active_permits?.length || 0), 0) ?? 0;
  const sensorsTotal = Object.keys(readings || {}).length;

  return (
    <Card
      title="Interactive Digital Twin"
      icon={Box}
      pad={false}
      accent
      glowColor={activeCorrelation ? "var(--tier-critical)" : null}
      // Title row stays compact and fixed-content (connection status only) —
      // everything variable-width (overlay tabs, scenario picker, buttons)
      // lives in `subheader` on its own full-width row instead of fighting
      // the title for space. This ordering is the actual fix for the
      // overflow bug found during Track 4 verification: the toolbar no
      // longer shares a row with anything it could be squeezed by.
      right={
        <span
          title={connected ? "Live backend connection" : "Backend unreachable"}
          style={{
            display: "flex", alignItems: "center", gap: 5, fontSize: "var(--text-2xs)", fontWeight: 700,
            padding: "3px 9px", borderRadius: 999, flexShrink: 0,
            color: connected ? "var(--tier-normal)" : "var(--tier-critical)",
            background: connected ? "var(--tier-normal-bg)" : "var(--tier-critical-bg)",
          }}
        >
          {connected ? <Wifi size={10} /> : <WifiOff size={10} />}
          {connected ? "Live" : "Offline"}
        </span>
      }
      subheader={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap", minWidth: 0 }}>
          <OverlayToggle mode={overlayMode} onChange={setOverlayMode} />

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexShrink: 0, flexWrap: "wrap" }}>
            <select
              value={pickedScenario}
              onChange={(e) => setPickedScenario(e.target.value)}
              disabled={scenarioRunning}
              style={{
                fontSize: "var(--text-xs)", fontWeight: 600, padding: "8px 10px", borderRadius: 10,
                border: "1px solid var(--border-soft)", background: "var(--bg-card)", color: "var(--ink)",
                maxWidth: 176, minWidth: 0,
              }}
            >
              {(scenarios.length ? scenarios : [{ id: "scenario_10", name: "Full Compound Cascade" }]).map((sc) => (
                <option key={sc.id} value={sc.id}>{sc.name}</option>
              ))}
            </select>
            <button
              onClick={() => runScenario(pickedScenario)}
              disabled={scenarioRunning || !connected}
              style={{
                display: "flex", alignItems: "center", gap: 6, fontSize: "var(--text-xs)", fontWeight: 700,
                padding: "8px 14px", borderRadius: 10, border: "none", color: "#fff", whiteSpace: "nowrap", flexShrink: 0,
                backgroundImage: scenarioRunning || !connected ? "none" : "var(--accent-grad)",
                background: scenarioRunning || !connected ? "#D8D5F5" : undefined,
                boxShadow: scenarioRunning || !connected ? "none" : "var(--shadow-accent)",
                cursor: scenarioRunning || !connected ? "default" : "pointer",
              }}
            >
              <Zap size={12} /> {scenarioRunning ? "Running…" : "Run Scenario"}
            </button>
            <button
              onClick={resetSimulation}
              title="Reset to baseline"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 10,
                border: "1px solid var(--border-soft)", background: "var(--bg-card)", flexShrink: 0,
              }}
            >
              <RotateCcw size={13} style={{ color: "var(--ink-sub)" }} />
            </button>
          </div>
        </div>
      }
    >
      <div
        ref={containerRef}
        style={{
          position: "relative", margin: "0 20px 20px", borderRadius: 18, overflow: "hidden", height: 460,
          backgroundImage: "linear-gradient(165deg, #F5F7FD 0%, #ECF0FA 60%, #E7EDFA 100%)",
          border: "1px solid var(--border-soft)",
        }}
      >
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} preserveAspectRatio="xMidYMid meet"
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            transform: `scale(${zoom})`, transformOrigin: "center center", transition: "transform 0.2s ease",
          }}
        >
          <defs>
            <filter id="blur"><feGaussianBlur stdDeviation="26" /></filter>
            <marker id="flow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#AEB8C4" />
            </marker>
            <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#DCE2F0" strokeWidth="0.6" />
            </pattern>
          </defs>

          <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="url(#grid)" opacity="0.5" />

          <ProcessPiping tiers={tiers} />
          {OverlayComp && <OverlayComp {...overlayProps} />}

          {/* yard road + shuttle, purely decorative context */}
          <path d="M556,238 L556,352 L640,352" fill="none" stroke="#DDE3ED" strokeWidth="11" strokeLinecap="round" />
          <path d="M556,238 L556,352 L640,352" fill="none" stroke="#FFFFFF" strokeWidth="1.2" strokeDasharray="5 5" />
          <g className="truck-shuttle" transform="translate(600,352)">
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
              isCorrelated={activeCorrelation && tiers[id] === "critical"}
              onSelect={setSelectedZone}
              onHover={handleHover}
              onLeave={() => setHoveredZone(null)}
            />
          ))}
        </svg>

        {hoveredZone && tooltipPos && (
          <ZoneTooltip zone={zoneById(hoveredZone)} tier={tiers[hoveredZone]} heatmapEntry={hoveredHeatmapEntry} x={tooltipPos.x} y={tooltipPos.y} />
        )}

        {/* zoom controls */}
        <div style={{ position: "absolute", top: 14, right: 14, display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            { icon: Plus, action: () => setZoom((z) => Math.min(z + 0.15, 1.8)) },
            { icon: Minus, action: () => setZoom((z) => Math.max(z - 0.15, 0.7)) },
            { icon: Maximize2, action: () => setZoom(1) },
          ].map(({ icon: Icon, action }, i) => (
            <button
              key={i} onClick={action}
              style={{
                width: 28, height: 28, borderRadius: 9, border: "1px solid var(--border-soft)",
                background: "#FFFFFFEE", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(16,24,40,0.08)",
              }}
            >
              <Icon size={13} style={{ color: "var(--ink-sub)" }} />
            </button>
          ))}
        </div>

        {/* live legend */}
        <div
          className="scroll-x-thin"
          style={{
            position: "absolute", bottom: 12, left: 16, right: 14, display: "flex", alignItems: "center", gap: 14,
            fontSize: "var(--text-2xs)", fontWeight: 600, padding: "7px 13px", borderRadius: 11, background: "#FFFFFFDD",
            color: "#4B5563", backdropFilter: "blur(8px)", boxShadow: "0 2px 10px rgba(16,24,40,0.06)",
            width: "fit-content", maxWidth: "calc(100% - 30px)",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}><Circle size={7} fill="var(--tier-normal)" color="var(--tier-normal)" /> {sensorsTotal} Sensors</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}><Video size={11} /> Cameras</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}><Users size={11} /> {workersTotal} Workers</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}><ClipboardList size={11} /> {permitsTotal} Permits</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}><Truck size={11} /> Loading</span>
        </div>
      </div>
    </Card>
  );
}
