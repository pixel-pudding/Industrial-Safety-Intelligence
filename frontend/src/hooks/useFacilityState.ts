import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as api from "../services/api";

const RISK_EVENT_CAP = 60;
const EMERGENCY_RESPONSE_CAP = 20;

const TIER_RANK: Record<api.Tier, number> = { normal: 0, warning: 1, critical: 2 };

/** WS tick risk_events carry `evidence` but no persisted id — this is the
 * only place that data exists (GET /api/risk-events never stores it), so
 * every tick's events get captured into state here as they arrive, per the
 * explicit requirement that evidence isn't retrievable after the fact. */
export interface LiveRiskEvent extends api.TickRiskEvent {
  id: string;
}

export function useFacilityState() {
  const [zones, setZones] = useState<api.BackendZone[]>([]);
  const [scenarios, setScenarios] = useState<api.ScenarioSummary[]>([]);
  const [heatmap, setHeatmap] = useState<api.Heatmap | null>(null);
  const [readings, setReadings] = useState<Record<string, api.SensorReadingTick>>({});
  const [riskEvents, setRiskEvents] = useState<LiveRiskEvent[]>([]);
  const [latestEventByZone, setLatestEventByZone] = useState<Record<string, LiveRiskEvent>>({});
  const [permitFlags, setPermitFlags] = useState<api.PermitFlag[]>([]);
  const [emergencyResponses, setEmergencyResponses] = useState<api.EmergencyResponseResult[]>([]);
  const [complianceAudits, setComplianceAudits] = useState<api.ComplianceAuditReport[]>([]);
  const [incidents, setIncidents] = useState<api.HistoricalIncident[]>([]);
  const [reportsSummary, setReportsSummary] = useState<api.ReportsSummary | null>(null);
  const [connected, setConnected] = useState(false);
  const [scenarioRunning, setScenarioRunning] = useState(false);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [simTime, setSimTime] = useState(0);

  const disconnectRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    api.fetchZones().then(setZones).catch(() => {});
    api.fetchScenarios().then(setScenarios).catch(() => {});
    api.fetchHeatmap().then(setHeatmap).catch(() => {});
    api.fetchPermitFlags().then(setPermitFlags).catch(() => {});
    api.fetchComplianceAudits().then(setComplianceAudits).catch(() => {});
    api.fetchIncidents().then(setIncidents).catch(() => {});
    api.fetchReportsSummary().then(setReportsSummary).catch(() => {});

    disconnectRef.current = api.connectTickStream({
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
          const withIds: LiveRiskEvent[] = payload.risk_events.map((e) => ({
            ...e,
            id: `${e.zone}-${e.timestamp}-${Math.random().toString(36).slice(2)}`,
          }));
          setRiskEvents((prev) => [...withIds.slice().reverse(), ...prev].slice(0, RISK_EVENT_CAP));
          setLatestEventByZone((prev) => {
            const next = { ...prev };
            for (const e of withIds) next[e.zone] = e;
            return next;
          });
          api.fetchReportsSummary().then(setReportsSummary).catch(() => {});
        }

        if (payload.emergency_responses?.length) {
          setEmergencyResponses((prev) => [...payload.emergency_responses, ...prev].slice(0, EMERGENCY_RESPONSE_CAP));
        }
      },
    });

    return () => disconnectRef.current?.();
  }, []);

  const triggerScenario = useCallback(async (scenarioId: string, speed = 1.0) => {
    setRiskEvents([]);
    setLatestEventByZone({});
    setEmergencyResponses([]);
    await api.runScenario(scenarioId, speed);
    // run_scenario() resets to baseline server-side before queuing the new
    // scenario's steps — without this fetch, the previous scenario's
    // heatmap (e.g. a zone still shown critical) stays on screen for up to
    // TICK_INTERVAL (2s) until the next WS tick happens to arrive.
    const [hm, pf] = await Promise.all([api.fetchHeatmap(), api.fetchPermitFlags()]);
    setHeatmap(hm);
    setPermitFlags(pf);
  }, []);

  const reset = useCallback(async () => {
    setRiskEvents([]);
    setLatestEventByZone({});
    setEmergencyResponses([]);
    await api.resetSimulation();
    const [hm, pf, rs] = await Promise.all([api.fetchHeatmap(), api.fetchPermitFlags(), api.fetchReportsSummary()]);
    setHeatmap(hm);
    setPermitFlags(pf);
    setReportsSummary(rs);
  }, []);

  const triggerComplianceAudit = useCallback(async () => {
    await api.runComplianceAudit();
    const audits = await api.fetchComplianceAudits();
    setComplianceAudits(audits);
  }, []);

  const sendCopilotMessage = useCallback(async (message: string, zoneId: string | null) => {
    const { reply } = await api.askCopilot(message, zoneId);
    return reply;
  }, []);

  // Decision 2: plant-wide "AI Confidence" = confidence of the most severe
  // currently-active event, not a fixed number. "Most severe" = highest tier,
  // ties broken by risk_score. null when every zone is nominal.
  const worstActiveEvent = useMemo(() => {
    const active = Object.values(latestEventByZone).filter((e) => e.tier !== "normal");
    if (active.length === 0) return null;
    return active.reduce((worst, e) => {
      if (TIER_RANK[e.tier] !== TIER_RANK[worst.tier]) return TIER_RANK[e.tier] > TIER_RANK[worst.tier] ? e : worst;
      return e.risk_score > worst.risk_score ? e : worst;
    }, active[0]);
  }, [latestEventByZone]);

  const plantWorstTier = useMemo<api.Tier>(() => {
    if (!heatmap) return "normal";
    return heatmap.zones.reduce<api.Tier>(
      (worst, z) => (TIER_RANK[z.risk_tier] > TIER_RANK[worst] ? z.risk_tier : worst),
      "normal",
    );
  }, [heatmap]);

  return {
    zones, scenarios, heatmap, readings, riskEvents, latestEventByZone, permitFlags,
    emergencyResponses, complianceAudits, incidents, reportsSummary, connected, scenarioRunning, activeScenarioId, simTime,
    worstActiveEvent, plantWorstTier,
    triggerScenario, reset, triggerComplianceAudit, sendCopilotMessage,
  };
}

export type FacilityState = ReturnType<typeof useFacilityState>;
