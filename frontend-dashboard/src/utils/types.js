/**
 * Central shape definitions for the facility model. Kept as JSDoc typedefs so
 * editors get autocomplete/type-checking without adding a TypeScript build step.
 */

/**
 * @typedef {"normal" | "warning" | "critical"} RiskTier
 */

/**
 * @typedef {"live" | "riskHeatmap" | "gasDispersion" | "workerDensity" | "equipmentHealth" | "cameraCoverage" | "maintenanceStatus"} OverlayMode
 */

/**
 * @typedef {Object} Zone
 * @property {string} id
 * @property {string} name
 * @property {string} short
 * @property {string} hazard
 */

/**
 * @typedef {Object} RiskEvent
 * @property {string} id
 * @property {string} zone
 * @property {RiskTier} tier
 * @property {string} note
 * @property {string} time
 */

/**
 * @typedef {Object} Intervention
 * @property {string} text
 * @property {"done" | "progress" | "pending"} status
 * @property {string} owner
 * @property {"critical" | "high" | "medium" | "low"} pri
 */

/**
 * @typedef {Object} Evidence
 * @property {number} confidence
 * @property {number} score
 * @property {string[]} signals
 * @property {string} matched
 */

export {};
