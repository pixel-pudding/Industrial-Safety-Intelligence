/**
 * The ONE piece of static reference data in the overlay system. Everything
 * else the Digital Twin overlays render (risk tier, worker density, sensor
 * health, gas concentration, maintenance gaps) comes from live backend data
 * via useFacilityState.js — see each overlay component's own comment for
 * its real data source.
 *
 * CCTV coverage is the exception: the backend has no camera-placement
 * endpoint (CctvEvent logs discrete detections, not a static coverage map),
 * so this list is sourced directly from Foundation Design Step 8's CCTV
 * Coverage table — the same static-planning-data status as zone names and
 * hazard classifications in utils/geometry.js, not a live AI computation.
 */
export const CAMERA_ZONES = ["A", "B", "C", "D", "F", "G", "J", "K"];

// Gas-hazard sensor tags — drives the Gas Dispersion overlay, which
// deliberately visualizes ONLY these two tags' live tier (from
// useFacility().readings) rather than "any non-normal signal."
export const GAS_TAGS = ["VOC-CONC", "CL2-CONC"];
