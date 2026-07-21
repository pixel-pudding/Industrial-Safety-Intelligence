/**
 * Every timestamp from the backend is Python's `datetime.utcnow()` — naive
 * UTC, no offset suffix in the JSON (e.g. "2026-07-21T10:17:14.123456", no
 * trailing "Z"). JavaScript's Date parser treats an offset-less ISO string
 * as LOCAL time, not UTC — so every "time since" / formatted-clock display
 * across the app was silently shifted by the browser's UTC offset (caught
 * during Track 4 visual QA: a risk event that fired seconds earlier showed
 * "In this state: 5h 30m", exactly India's UTC+5:30 offset). Route every
 * backend timestamp through this before handing it to `Date`.
 */
export function parseBackendTimestamp(isoString) {
  if (!isoString) return null;
  const hasZone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(isoString);
  return new Date(hasZone ? isoString : `${isoString}Z`);
}

export function timeSince(isoString) {
  const date = parseBackendTimestamp(isoString);
  if (!date) return "—";
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 60) return `${diffSec}s`;
  const min = Math.floor(diffSec / 60);
  return min < 60 ? `${min}m` : `${Math.floor(min / 60)}h ${min % 60}m`;
}

export function formatClockTime(isoString) {
  const date = parseBackendTimestamp(isoString);
  return date ? date.toLocaleTimeString("en-IN", { hour12: false }) : "—";
}
