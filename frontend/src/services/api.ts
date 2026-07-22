/**
 * Thin REST + WebSocket client for backend/main.py (port 8010). Every type
 * below mirrors backend/app/schemas.py field-for-field — no renamed keys, no
 * invented fields. Where the backend's persisted REST shape differs from the
 * WS tick shape (risk-events has no `evidence`; the tick payload does), both
 * shapes are typed separately rather than papered over with an optional field.
 */

const API_BASE = "http://localhost:8010";
const WS_URL = "ws://localhost:8010/ws";

export type Tier = "normal" | "warning" | "critical";
export type ConfidenceBand = "high" | "moderate" | "low";

export interface BackendZone {
  id: string;
  name: string;
  purpose: string;
  possible_hazards: string;
}

export interface ScenarioStep {
  t: number;
  action: string;
  note?: string;
  [key: string]: unknown;
}

export interface ScenarioSummary {
  id: string;
  name: string;
  description: string;
  purpose: string;
  steps: ScenarioStep[];
}

export interface ContributingSignal {
  category: string;
  source: string;
  description: string;
  severity_weight: number;
}

export interface Evidence {
  confidence: number;
  matched_incident_ids: string[];
  matched_incident_summary: string | null;
  matched_incident_confidence: ConfidenceBand | null;
  matched_regulatory_ids: string[];
  regulatory_citation: string | null;
  reasoning: string | null;
  recommended_interventions: string[];
  llm_backed: boolean;
}

/** Shape as it arrives on the WS tick payload — includes `evidence`. */
export interface TickRiskEvent {
  zone: string;
  timestamp: string;
  risk_score: number;
  tier: Tier;
  contributing_signals: ContributingSignal[];
  triggered_agents: string[];
  evidence: Evidence | null;
}

/** Shape as returned by GET /api/risk-events — NO `evidence` field; the
 * persisted RiskEvent row never stores it. Typed separately on purpose so
 * a caller can't accidentally read `.evidence` off a REST-fetched event. */
export interface PersistedRiskEvent {
  id: number;
  zone: string;
  timestamp: string;
  risk_score: number;
  tier: Tier;
  contributing_signals: ContributingSignal[];
  triggered_agents: string[];
}

export interface PermitRecord {
  id: number;
  permit_type_id: string;
  zone: string;
  status: string;
  issued_at: string;
  valid_to: string;
  gas_test_pass: boolean | null;
  extra_fields: Record<string, unknown>;
}

export interface PermitFlag {
  permit_id: number;
  permit_type_id: string;
  zone_id: string;
  flag: "approve" | "flag" | "block_recommend";
  reasons: string[];
  checked_at: string;
}

export interface AlertRecipient {
  role: string;
  zone: string;
  message: string;
}

export interface EmergencyResponseResult {
  id?: number;
  risk_event_id?: number;
  zone: string;
  triggered_at: string;
  evacuation_zones: string[];
  alert_recipients: AlertRecipient[];
  evidence_snapshot?: Record<string, unknown>;
  preliminary_report: string;
  status: "dispatched" | "acknowledged" | "resolved";
}

export interface ZoneHeatmapEntry {
  zone_id: string;
  zone_name: string;
  hazard_classification: string;
  risk_tier: Tier;
  risk_score: number;
  worker_count: number;
  active_permits: { permit_id: number; permit_type_id: string; flag: string }[];
  signal_categories: string[];
}

export interface Heatmap {
  timestamp: string;
  zones: ZoneHeatmapEntry[];
}

export interface ComplianceGap {
  category: string;
  zone_id: string;
  source: string;
  description: string;
  regulatory_match: { citation: string; confidence_band: ConfidenceBand; excerpt: string } | null;
}

export interface ComplianceAuditReport {
  id?: number;
  run_at: string;
  triggered_by: "manual" | "scheduled" | "anomaly";
  gaps: ComplianceGap[];
  gap_count: number;
  summary: string;
}

export interface ReportsSummary {
  generated_at: string;
  active_scenario_id: string | null;
  scenario_running: boolean;
  sim_time: number;
  total_risk_events: number;
  events_by_tier: Record<string, number>;
  events_by_zone: Record<string, number>;
  emergency_responses_count: number;
  latest_emergency_response: {
    id: number; zone: string; triggered_at: string; status: string; preliminary_report: string;
  } | null;
  latest_compliance_audit: { run_at: string; gap_count: number; summary: string } | null;
  elevated_zones: { zone_id: string; zone_name: string; risk_tier: Tier; risk_score: number }[];
}

export interface AnalyticsSummary {
  total_risk_events_analyzed: number;
  signal_category_frequency: Record<string, number>;
  agent_trigger_frequency: Record<string, number>;
  zone_frequency: Record<string, number>;
  top_zones: { zone_id: string; count: number }[];
  compliance_audits_run: number;
  compliance_gap_category_frequency: Record<string, number>;
}

export interface SystemStatus {
  llm_provider: string;
  llm_model: string;
  llm_api_key_configured: boolean;
  tick_interval_seconds: number;
  zone_count: number;
  scenario_count: number;
  historical_incident_count: number;
  sim_time: number;
  scenario_running: boolean;
  active_scenario_id: string | null;
  connected_ws_clients: number;
}

export interface HistoricalIncident {
  incident_number: number;
  title: string;
  zone: string;
  zones_involved: string[];
  severity: string;
  narrative_summary: string;
  narrative_doc_ref: string;
}

export interface SensorReadingTick {
  value: number | string;
  zone: string;
  tier: Tier;
}

export interface TickPayload {
  type: "tick";
  sim_time: number;
  scenario_running: boolean;
  active_scenario_id: string | null;
  readings: Record<string, SensorReadingTick>;
  notes: string[];
  risk_events: TickRiskEvent[];
  permit_flags: PermitFlag[];
  emergency_responses: EmergencyResponseResult[];
  heatmap: Heatmap;
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export const fetchZones = () => apiGet<BackendZone[]>("/api/zones");
export const fetchScenarios = () => apiGet<ScenarioSummary[]>("/api/scenarios");
export const runScenario = (scenarioId: string, speed = 1.0) =>
  apiPost<{ status: string; scenario_id: string; name: string }>(`/api/scenario/${scenarioId}/run?speed=${speed}`);
export const resetSimulation = () => apiPost<{ status: string }>("/api/reset");
export const fetchRiskEvents = (limit = 50, zone?: string) =>
  apiGet<PersistedRiskEvent[]>(`/api/risk-events?limit=${limit}${zone ? `&zone=${zone}` : ""}`);
export const fetchPermits = (zone?: string, status?: string) => {
  const params = new URLSearchParams();
  if (zone) params.set("zone", zone);
  if (status) params.set("status", status);
  const qs = params.toString();
  return apiGet<PermitRecord[]>(`/api/permits${qs ? `?${qs}` : ""}`);
};
export const fetchPermitFlags = () => apiGet<PermitFlag[]>("/api/permits/flags");
export const fetchEmergencyResponses = (limit = 20) =>
  apiGet<EmergencyResponseResult[]>(`/api/emergency-responses?limit=${limit}`);
export const fetchHeatmap = () => apiGet<Heatmap>("/api/heatmap");
export const runComplianceAudit = () => apiPost<ComplianceAuditReport>("/api/compliance-audit/run");
export const fetchComplianceAudits = (limit = 10) => apiGet<ComplianceAuditReport[]>(`/api/compliance-audit?limit=${limit}`);
export const fetchIncidents = () => apiGet<HistoricalIncident[]>("/api/incidents");
export const fetchReportsSummary = () => apiGet<ReportsSummary>("/api/reports/summary");
export const fetchAnalyticsSummary = () => apiGet<AnalyticsSummary>("/api/analytics/summary");
export const fetchSystemStatus = () => apiGet<SystemStatus>("/api/system/status");
export const askCopilot = (message: string, zoneId: string | null) =>
  apiPost<{ reply: string }>("/api/copilot/chat", { message, zone_id: zoneId });

/**
 * WS tick stream with auto-reconnect (same backoff pattern used across this
 * project's other frontend build) — the dashboard should recover on its own
 * if the backend isn't up yet or drops, not require a manual page reload.
 */
export function connectTickStream(handlers: {
  onTick: (payload: TickPayload) => void;
  onOpen?: () => void;
  onClose?: () => void;
}): () => void {
  let socket: WebSocket | null = null;
  let closedByCaller = false;
  let retryDelay = 1000;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  function connect() {
    socket = new WebSocket(WS_URL);

    socket.onopen = () => {
      retryDelay = 1000;
      handlers.onOpen?.();
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as TickPayload;
        if (payload.type === "tick") handlers.onTick(payload);
      } catch {
        // malformed frame — ignore rather than crash the socket handler
      }
    };

    socket.onclose = () => {
      handlers.onClose?.();
      if (closedByCaller) return;
      retryTimer = setTimeout(connect, retryDelay);
      retryDelay = Math.min(retryDelay * 1.6, 15000);
    };

    socket.onerror = () => {
      socket?.close();
    };
  }

  connect();

  return () => {
    closedByCaller = true;
    if (retryTimer) clearTimeout(retryTimer);
    socket?.close();
  };
}
