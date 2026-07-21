import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ZONES } from "../utils/geometry.js";
import * as scenarioService from "../services/scenarioService.js";
import { askCopilot } from "../services/copilotService.js";

const INITIAL_TIERS = Object.fromEntries(ZONES.map((z) => [z.id, "normal"]));
const NOTIFICATION_CAP = 30;
const RISK_EVENT_CAP = 60;

const OWNER_RULES = [
  [/permit|stop-work|block/i, "Safety Team"],
  [/maintenance|work order/i, "Maintenance"],
  [/headcount|evacuat/i, "All Workers"],
  [/security|fire/i, "Security/Fire Team"],
  [/utility|zone f/i, "Operations"],
  [/escalat/i, "Shift Supervisor"],
];
function inferOwner(text) {
  for (const [pattern, owner] of OWNER_RULES) {
    if (pattern.test(text)) return owner;
  }
  return "Control Room";
}

const FacilityContext = createContext(null);

/**
 * Single provider for all cross-panel state. Real backend integration
 * (Track 4) — the internal mechanism is a WebSocket tick stream + REST
 * triggers against backend/main.py, not a scripted setTimeout replay.
 * The PUBLIC CONTRACT (every key below `value`) is kept stable so every
 * consuming panel didn't need to change: selecting a zone still instantly
 * updates the Risk Panel, Reasoning Flow, Interventions, Timeline,
 * Notifications, and Copilot context from this one place.
 */
export function FacilityProvider({ children }) {
  const [zones, setZones] = useState(ZONES);
  const [scenarios, setScenarios] = useState([]);
  const [heatmap, setHeatmap] = useState(null);
  const [readings, setReadings] = useState({});
  const [riskEvents, setRiskEvents] = useState([]);
  const [latestEventByZone, setLatestEventByZone] = useState({});
  const [permitFlags, setPermitFlags] = useState([]);
  const [emergencyResponses, setEmergencyResponses] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [complianceAudits, setComplianceAudits] = useState([]);

  const [selectedZone, setSelectedZone] = useState("D");
  const [hoveredZone, setHoveredZone] = useState(null);
  const [overlayMode, setOverlayMode] = useState("riskHeatmap");
  const [scenarioRunning, setScenarioRunning] = useState(false);
  const [activeScenarioId, setActiveScenarioId] = useState(null);
  const [connected, setConnected] = useState(false);
  const [simTime, setSimTime] = useState(0);

  const [chatLog, setChatLog] = useState([
    { from: "ai", text: "Safety Copilot ready. Ask about any zone, permit, or historical pattern." },
  ]);

  const disconnectRef = useRef(null);

  useEffect(() => {
    scenarioService.fetchZones().then((z) => z?.length && setZones(z)).catch(() => {});
    scenarioService.fetchScenarios().then(setScenarios).catch(() => {});
    scenarioService.fetchHeatmap().then(setHeatmap).catch(() => {});
    scenarioService.fetchPermitFlags().then(setPermitFlags).catch(() => {});
    scenarioService.fetchComplianceAudits().then(setComplianceAudits).catch(() => {});

    disconnectRef.current = scenarioService.connectTickStream({
      onOpen: () => setConnected(true),
      onClose: () => setConnected(false),
      onTick: (payload) => {
        setSimTime(payload.sim_time);
        setScenarioRunning(payload.scenario_running);
        setActiveScenarioId(payload.active_scenario_id);
        setReadings(payload.readings || {});
        if (payload.heatmap) setHeatmap(payload.heatmap);
        if (payload.permit_flags) setPermitFlags(payload.permit_flags);

        if (payload.risk_events?.length) {
          setRiskEvents((prev) => [...payload.risk_events.slice().reverse(), ...prev].slice(0, RISK_EVENT_CAP));

          setLatestEventByZone((prev) => {
            const next = { ...prev };
            for (const e of payload.risk_events) next[e.zone] = e;
            return next;
          });

          const newNotifications = payload.risk_events
            .filter((e) => e.tier !== "normal")
            .map((e) => ({
              id: `${e.zone}-${e.timestamp}-${Math.random()}`,
              zone: e.zone,
              tier: e.tier,
              text: e.evidence?.reasoning?.split("\n")[0] || `Zone ${e.zone} reached ${e.tier} tier.`,
              time: new Date(e.timestamp).toLocaleTimeString("en-IN", { hour12: false }),
            }));
          if (newNotifications.length) {
            setNotifications((prev) => [...newNotifications, ...prev].slice(0, NOTIFICATION_CAP));
          }
        }

        if (payload.emergency_responses?.length) {
          setEmergencyResponses((prev) => [...payload.emergency_responses, ...prev].slice(0, 20));
        }
      },
    });

    return () => disconnectRef.current?.();
  }, []);

  const runScenario = useCallback(async (scenarioId = "scenario_10", speed = 1.0) => {
    // Clean slate per take — the backend itself resets its DB state on a new
    // scenario run (simulator/seed_baseline_state.py::reset_instance_state),
    // so the frontend's accumulated view has to reset in step or it'd show
    // stale events from a previous take alongside the new one.
    setRiskEvents([]);
    setNotifications([]);
    setLatestEventByZone({});
    setEmergencyResponses([]);
    try {
      await scenarioService.runScenario(scenarioId, speed);
    } catch (err) {
      console.error("Failed to start scenario:", err);
    }
  }, []);

  const resetSimulation = useCallback(async () => {
    setRiskEvents([]);
    setNotifications([]);
    setLatestEventByZone({});
    setEmergencyResponses([]);
    try {
      await scenarioService.resetSimulation();
    } catch (err) {
      console.error("Failed to reset simulation:", err);
    }
  }, []);

  const runComplianceAudit = useCallback(async () => {
    try {
      await scenarioService.runComplianceAudit();
      const audits = await scenarioService.fetchComplianceAudits();
      setComplianceAudits(audits);
    } catch (err) {
      console.error("Failed to run compliance audit:", err);
    }
  }, []);

  const sendChat = useCallback(async (text) => {
    if (!text.trim()) return;
    setChatLog((p) => [...p, { from: "user", text }]);
    const reply = await askCopilot(text, selectedZone);
    setChatLog((p) => [...p, { from: "ai", text: reply }]);
  }, [selectedZone]);

  // ---- Derived state, always in sync with selectedZone/heatmap/events ----

  const tiers = useMemo(() => {
    const t = { ...INITIAL_TIERS };
    if (heatmap?.zones) for (const z of heatmap.zones) t[z.zone_id] = z.risk_tier;
    return t;
  }, [heatmap]);

  const tier = tiers[selectedZone] || "normal";
  const zoneHeatmapEntry = useMemo(
    () => heatmap?.zones?.find((z) => z.zone_id === selectedZone) ?? null,
    [heatmap, selectedZone]
  );
  const score = zoneHeatmapEntry ? Math.round(zoneHeatmapEntry.risk_score) : 0;

  const latestEvent = latestEventByZone[selectedZone] ?? null;
  const evidence = latestEvent?.evidence ?? null;

  const flowSteps = useMemo(() => {
    if (!latestEvent || !latestEvent.contributing_signals?.length) return [];
    const steps = latestEvent.contributing_signals.map((s) => s.description);
    if (evidence?.matched_incident_summary) steps.push(evidence.matched_incident_summary);
    steps.push(`${latestEvent.tier.toUpperCase()} — risk score ${Math.round(latestEvent.risk_score)}`);
    return steps;
  }, [latestEvent, evidence]);

  const interventions = useMemo(() => {
    if (!evidence?.recommended_interventions?.length) return [];
    return evidence.recommended_interventions.map((text) => ({
      text,
      status: "pending",
      owner: inferOwner(text),
      pri: latestEvent?.tier === "critical" ? "critical" : "high",
    }));
  }, [evidence, latestEvent]);

  // A zone is "correlated" (compound, not single-signal) when it's Critical
  // AND driven by 2+ distinct signal categories — this is what the twin's
  // correlation-line overlay and the pulsing card border key off.
  const activeCorrelation = useMemo(() => {
    if (!heatmap?.zones) return false;
    return heatmap.zones.some((z) => z.risk_tier === "critical" && (z.signal_categories?.length ?? 0) >= 2);
  }, [heatmap]);

  const value = {
    // reference/live data
    zones, scenarios, heatmap, readings, permitFlags, emergencyResponses, complianceAudits,
    simTime, connected,
    // twin/panel UI state
    tiers, selectedZone, setSelectedZone, hoveredZone, setHoveredZone, overlayMode, setOverlayMode,
    riskEvents, notifications, scenarioRunning, activeScenarioId, activeCorrelation,
    runScenario, resetSimulation, runComplianceAudit,
    // copilot
    chatLog, sendChat,
    // derived, always in sync with selectedZone — every panel reads these
    tier, evidence, interventions, score, flowSteps, latestEvent, zoneHeatmapEntry,
  };

  return <FacilityContext.Provider value={value}>{children}</FacilityContext.Provider>;
}

export function useFacility() {
  const ctx = useContext(FacilityContext);
  if (!ctx) throw new Error("useFacility must be used within a FacilityProvider");
  return ctx;
}
