/**
 * Real backend integration — replaces the old scripted-timeline mock.
 * Every function here calls the FastAPI service built in Tracks 1-3
 * (backend/main.py). No client-side scoring, no canned data: tier, risk
 * score, evidence, and interventions all come from the Compound Risk
 * Detection Engine and its five sibling agents, streamed over WebSocket
 * per tick and available on-demand via REST.
 *
 * Base URL is hardcoded to the default `uvicorn main:app` port — promote to
 * an env var (VITE_API_BASE) if this ever needs to point somewhere else.
 */

// Port 8010, not the more conventional 8000: this machine already has other,
// unrelated services bound across 0.0.0.0/127.0.0.1/::1 on 8000 (discovered
// during Track 4 verification — curl to "localhost:8000" was silently
// answered by a different app entirely via IPv6 resolution). 8010 was
// confirmed free. Keep backend/main.py's `uvicorn main:app --port 8010` in
// sync with this if either ever changes.
const API_BASE = "http://localhost:8010";
const WS_URL = "ws://localhost:8010/ws";

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json();
}

export const fetchZones = () => apiGet("/api/zones");
export const fetchScenarios = () => apiGet("/api/scenarios");
export const fetchRiskEvents = (limit = 50, zone) =>
  apiGet(`/api/risk-events?limit=${limit}${zone ? `&zone=${zone}` : ""}`);
export const fetchHeatmap = () => apiGet("/api/heatmap");
export const fetchPermitFlags = () => apiGet("/api/permits/flags");
export const fetchPermits = (zone, status) => {
  const params = new URLSearchParams();
  if (zone) params.set("zone", zone);
  if (status) params.set("status", status);
  const qs = params.toString();
  return apiGet(`/api/permits${qs ? `?${qs}` : ""}`);
};
export const fetchEmergencyResponses = (limit = 20) => apiGet(`/api/emergency-responses?limit=${limit}`);
export const fetchIncidents = () => apiGet("/api/incidents");
export const fetchComplianceAudits = (limit = 10) => apiGet(`/api/compliance-audit?limit=${limit}`);
export const runComplianceAudit = () => apiPost("/api/compliance-audit/run");

export const runScenario = (scenarioId, speed = 1.0) =>
  apiPost(`/api/scenario/${scenarioId}/run?speed=${speed}`);

export const resetSimulation = () => apiPost("/api/reset");

/**
 * WebSocket tick stream. Auto-reconnects with backoff if the backend isn't
 * up yet or drops — the dashboard should recover on its own once
 * `uvicorn main:app` is reachable, not require a manual page reload.
 */
export function connectTickStream({ onTick, onOpen, onClose }) {
  let socket = null;
  let closedByCaller = false;
  let retryDelay = 1000;
  let retryTimer = null;

  function connect() {
    socket = new WebSocket(WS_URL);

    socket.onopen = () => {
      retryDelay = 1000;
      onOpen?.();
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "tick") onTick?.(payload);
      } catch {
        // malformed frame — ignore rather than crash the socket handler
      }
    };

    socket.onclose = () => {
      onClose?.();
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
