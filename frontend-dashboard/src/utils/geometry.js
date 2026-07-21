/**
 * Static layout for the Digital Twin canvas. Zone metadata mirrors the
 * backend's Zone table (backend/seed/seed_reference.py) so labels/hazards
 * match what the API returns — this file only adds what the backend has no
 * reason to know: pixel geometry for the SVG canvas.
 */

export const VIEW_W = 760;
export const VIEW_H = 460;

export const ZONES = [
  { id: "A", name: "Reactor Block", short: "Reactor Block", hazard: "Explosion/runaway, burns" },
  { id: "B", name: "Chlor-Alkali Unit", short: "Chlor-Alkali", hazard: "Toxic gas release" },
  { id: "C", name: "Tank Farm", short: "Tank Farm", hazard: "Overpressure, vapor explosion" },
  { id: "D", name: "Solvent Blending & Packaging", short: "Packaging Unit", hazard: "Fire, explosion" },
  { id: "E", name: "Surfactant/Resin Plant", short: "Resin Plant", hazard: "Thermal (low severity)" },
  { id: "F", name: "Utilities Block", short: "Utility Area", hazard: "Cascading utility failure" },
  { id: "G", name: "Loading Bay", short: "Loading Bay", hazard: "Static discharge, spill" },
  { id: "H", name: "Maintenance Workshop", short: "Maintenance Workshop", hazard: "Indirect (originates elsewhere)" },
  { id: "I", name: "Control Room/Admin", short: "Control Room", hazard: "Administrative zone" },
  { id: "J", name: "Main Gate/Security", short: "Main Gate", hazard: "Unauthorized access" },
  { id: "K", name: "Flare Stack & Nitrogen Inerting", short: "Flare & Inerting", hazard: "Uncontrolled venting" },
];

// x, y, w, h per zone — a loose plant-layout story: utilities/control up top
// feeding the process zones below them, tank farm bridging reactor and
// packaging, loading bay and gate at the yard edges.
export const PLAN = {
  I: { x: 24, y: 24, w: 150, h: 76 },
  F: { x: 200, y: 24, w: 150, h: 76 },
  K: { x: 560, y: 24, w: 176, h: 76 },

  H: { x: 24, y: 124, w: 150, h: 90 },
  A: { x: 200, y: 124, w: 150, h: 90 },
  C: { x: 376, y: 124, w: 360, h: 90 },

  B: { x: 24, y: 238, w: 150, h: 90 },
  D: { x: 200, y: 238, w: 150, h: 90 },
  G: { x: 376, y: 238, w: 360, h: 90 },

  J: { x: 24, y: 352, w: 150, h: 76 },
  E: { x: 200, y: 352, w: 150, h: 76 },
};

// Zone-to-zone piping/connector lines, drawn from real process relationships
// (Foundation Design Step 2/3 data-flow table) — not decorative.
export const PROCESS_FLOW = [
  ["F", "A"], ["F", "B"], ["A", "C"], ["C", "D"], ["C", "G"], ["A", "K"],
];

export function centerOf(zoneId) {
  const s = PLAN[zoneId];
  if (!s) return { cx: 0, cy: 0 };
  return { cx: s.x + s.w / 2, cy: s.y + s.h / 2 };
}

export function zoneById(zoneId) {
  return ZONES.find((z) => z.id === zoneId) || null;
}
