/**
 * Real backend integration for the Safety Copilot — calls
 * POST /api/copilot/chat (backend/agents/copilot_agent.py), added during
 * Track 4 as an explicitly-scoped exception so this panel could be
 * genuinely LLM-backed rather than a client-side canned-response mock.
 * See backend/README.md's "Track 4 deviation" section for the full context.
 */

// Kept in sync with scenarioService.js's API_BASE — see that file's comment
// for why this is 8010, not the more conventional 8000.
const API_BASE = "http://localhost:8010";

export const COPILOT_SUGGESTIONS = [
  "Why is this zone dangerous right now?",
  "What permits are active?",
  "Show evidence",
  "What's the current risk score?",
];

export async function askCopilot(message, zoneId) {
  try {
    const res = await fetch(`${API_BASE}/api/copilot/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, zone_id: zoneId ?? null }),
    });
    if (!res.ok) throw new Error(`Copilot request failed: ${res.status}`);
    const data = await res.json();
    return data.reply;
  } catch (err) {
    return `Safety Copilot is unreachable — is the backend running? (${err.message})`;
  }
}
