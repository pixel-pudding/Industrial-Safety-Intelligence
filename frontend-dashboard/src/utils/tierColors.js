/** Single semantic tier system shared by risk score, permit flags, and compliance status. */

export const TIER = {
  normal: { label: "Normal", c: "var(--tier-normal)", bg: "var(--tier-normal-bg)" },
  warning: { label: "Warning", c: "var(--tier-warning)", bg: "var(--tier-warning-bg)" },
  critical: { label: "Critical", c: "var(--tier-critical)", bg: "var(--tier-critical-bg)" },
};

// Raw hex fallback for SVG contexts (gradient stops, filters) where a CSS
// custom property read is inconvenient — kept in sync with index.css by hand.
export const RAW_TIER_HEX = {
  normal: "#12B76A",
  warning: "#F59E0B",
  critical: "#E11D48",
};

export function confidenceLabel(band) {
  if (band === "high") return "High confidence";
  if (band === "moderate") return "Moderate confidence";
  if (band === "low") return "Low confidence";
  return "Unknown confidence";
}
