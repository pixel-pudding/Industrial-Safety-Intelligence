import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import { ZONES } from "../utils/geometry.js";
import { SCENARIO_10, evidenceFor, interventionsFor, scoreForTier } from "../services/scenarioService.js";
import { askCopilot } from "../services/copilotService.js";

const INITIAL_TIERS = Object.fromEntries(ZONES.map((z) => [z.id, "normal"]));

const FacilityContext = createContext(null);

/**
 * Single provider for all cross-panel state. This is what makes selecting a
 * zone on the Digital Twin instantly update the Risk Panel, Reasoning Flow,
 * Interventions, Timeline, Notifications, and Copilot context — they all read
 * from (and, where relevant, write to) this one place instead of keeping
 * their own local copies that could drift out of sync.
 */
export function FacilityProvider({ children }) {
  const [tiers, setTiers] = useState(INITIAL_TIERS);
  const [selectedZone, setSelectedZone] = useState("D");
  const [hoveredZone, setHoveredZone] = useState(null);
  const [overlayMode, setOverlayMode] = useState("riskHeatmap");
  const [riskEvents, setRiskEvents] = useState([]);
  const [flowSteps, setFlowSteps] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [scenarioRunning, setScenarioRunning] = useState(false);
  const [activeCorrelation, setActiveCorrelation] = useState(false);
  const [chatLog, setChatLog] = useState([
    { from: "ai", text: "Safety Copilot ready. Ask about any zone, permit, or historical pattern." },
  ]);

  const timeouts = useRef([]);
  const clearTimers = () => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
  };
  useEffect(() => () => clearTimers(), []);

  const runScenario = useCallback(() => {
    if (scenarioRunning) return;
    setScenarioRunning(true);
    setTiers(INITIAL_TIERS);
    setRiskEvents([]);
    setFlowSteps([]);
    setActiveCorrelation(false);
    clearTimers();

    SCENARIO_10.steps.forEach((step) => {
      const id = setTimeout(() => {
        setTiers((prev) => ({ ...prev, [step.zone]: step.tier }));
        setRiskEvents((prev) => [
          {
            id: `${Date.now()}-${Math.random()}`,
            zone: step.zone,
            tier: step.tier,
            note: step.note,
            time: new Date().toLocaleTimeString("en-IN", { hour12: false }),
          },
          ...prev,
        ]);
        setFlowSteps((prev) => [...prev, step.flow]);
        setNotifications((prev) => [
          {
            id: `${Date.now()}-${Math.random()}`,
            zone: step.zone,
            tier: step.tier,
            text: step.note,
            time: new Date().toLocaleTimeString("en-IN", { hour12: false }),
          },
          ...prev,
        ]);
        if (step.tier === "critical") {
          setActiveCorrelation(true);
          setSelectedZone(step.zone); // the twin drives selection — this is the sync in action
        }
      }, step.t);
      timeouts.current.push(id);
    });

    timeouts.current.push(setTimeout(() => setScenarioRunning(false), 8200));
  }, [scenarioRunning]);

  const sendChat = useCallback(async (text) => {
    if (!text.trim()) return;
    setChatLog((p) => [...p, { from: "user", text }]);
    const reply = await askCopilot(text);
    setChatLog((p) => [...p, { from: "ai", text: reply }]);
  }, []);

  const tier = tiers[selectedZone];
  const evidence = evidenceFor(selectedZone, tier);
  const interventions = interventionsFor(selectedZone, tier);
  const score = evidence ? evidence.score : scoreForTier(tier);

  const value = {
    tiers,
    selectedZone,
    setSelectedZone,
    hoveredZone,
    setHoveredZone,
    overlayMode,
    setOverlayMode,
    riskEvents,
    flowSteps,
    notifications,
    scenarioRunning,
    activeCorrelation,
    runScenario,
    chatLog,
    sendChat,
    // derived, always in sync with selectedZone — every panel reads these
    tier,
    evidence,
    interventions,
    score,
  };

  return <FacilityContext.Provider value={value}>{children}</FacilityContext.Provider>;
}

export function useFacility() {
  const ctx = useContext(FacilityContext);
  if (!ctx) throw new Error("useFacility must be used within a FacilityProvider");
  return ctx;
}
