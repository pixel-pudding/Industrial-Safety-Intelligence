# Sahyadri Petrochem & Specialty Chemicals Ltd. (SPSCL)
## Foundation Design Document — AI-Powered Industrial Safety Intelligence Platform
### ET AI Hackathon 2026 — Problem Statement #1

---

## Guiding Principles

- The AI is the product; the dashboard is only a visualization layer.
- The AI correlates multiple independent signals to detect compound risk conditions that no single sensor would flag alone.
- The AI recommends concrete interventions, not just alerts.
- Every prediction includes evidence, reasoning, confidence, and supporting data (no black-box answers).
- **The plant is already digitally modernized**: SCADA, IoT sensors, CCTV, digital Permit-to-Work (ePTW), CMMS, worker location tracking, and shift management systems already exist. This project is an **intelligence layer sitting above these systems** — it does not replace them.
- SCADA is a primary data source (process variables, reactor/pump/valve status, pressure, temperature, flow rates), consumed alongside IoT sensors.
- Chemical engineering realism is kept simple — the goal is demonstrating AI reasoning, not process simulation.
- Everything is simulated except the Safety Manuals/SOPs and regulatory guidance, which are real public documents used for RAG.

---

## Step 1: Company Profile

**Company:** Sahyadri Petrochem & Specialty Chemicals Ltd. (SPSCL)
**Location (fictional):** Panvel–Raigad industrial belt, Maharashtra
**Industry:** Vertically integrated petrochemical intermediates + specialty chemicals

**Product lines:**
1. Ethylene Oxide (EO) → Ethylene Glycol (EG) — flammable, potentially explosive, exothermic catalytic reaction
2. Chlor-alkali: Caustic Soda + Chlorine gas — toxic (non-flammable) hazard class
3. Industrial solvents: Toluene, MEK — flammable vapor, tank-farm and blending hazards
4. Downstream specialty surfactants/resins (value-added from EO) — sold to paint/detergent/adhesive industries

**Why this plant exists:** Set up in the late 1990s as a basic EO/chlor-alkali producer, expanded in the mid-2010s into downstream specialties for higher margins. This is why a reactor block, toxic-gas storage, a solvent tank farm, and a utilities block all coexist on one campus — physically close enough for cross-hazard interactions.

**Why this design serves the hackathon:** Two distinct hazard classes (explosive/flammable vs. toxic) allow genuinely cross-hazard compound-risk scenarios; grounded in real Indian chemical-corridor precedent (Maharashtra/Gujarat).

---

## Step 2: Factory Layout & Data Flow (10 Zones)

| Zone | Purpose | Key data produced | Compound-risk relationships |
|---|---|---|---|
| **A — Reactor Block** | EO/EG production | Reactor temp/pressure, cooling flow, catalyst age, CCTV, operator presence | Fed by Zone F cooling; can propagate to Zone C (storage overpressure) |
| **B — Chlor-Alkali Unit** | Electrolysis → chlorine + caustic | Cell voltage, chlorine concentration, compressor vibration | Independent hazard class from A; fed by Zone F power/cooling |
| **C — Tank Farm** | EO/solvent storage | Tank level/pressure, vapor concentration | Bridge zone between A and D; receives product from A |
| **D — Solvent Blending & Packaging** | Blend/package toluene, MEK | Blend temp, grounding continuity | Primary source of "permit + maintenance" scenarios |
| **E — Surfactant/Resin Plant** | Downstream EO conversion | Dryer temp, batch status | Deliberate low-hazard "control" zone |
| **F — Utilities Block** | Boilers, compressors, cooling towers, generators | Boiler pressure, cooling tower outlet temp, compressor load | Single point of failure affecting multiple zones simultaneously |
| **G — Loading Bay** | Tanker loading | Loading flow rate, grounding continuity | External-party risk (drivers, static discharge) |
| **H — Maintenance Workshop** | CMMS + permit issuance origin | Work order status, permit issuance records | Upstream source of "maintenance overdue" flags site-wide |
| **I — Control Room/Admin** | SCADA aggregation, shift handover | Shift logs | Consumption point for all agents |
| **J — Main Gate/Security** | Access control, CCTV hub | Worker/contractor location, check-in/out | Source of worker-location and permit-context data |
| **K — Flare Stack & Nitrogen Inerting** | Emergency venting, vessel purging | Flare gas flow, N2 purge status | Silent failure point — only visible when cross-checked with permits |

---

## Step 3: Equipment (Selected Key Assets)

| Zone | Asset | Data generated | Influenced by | Propagates to |
|---|---|---|---|---|
| A | EO Reactor | Temp, pressure, catalyst feed | Zone F cooling, catalyst age | Zone C tank pressure, Zone K flare load |
| A | Reactor Cooling Jacket | Coolant flow/temp | Zone F cooling tower | Reactor (loss of cooling) |
| B | Electrolysis Cells | Cell voltage/current | Zone F power quality | Chlorine compressor load |
| B | Chlorine Compressor | Pressure, vibration | Zone F cooling water | Chlorine storage/release risk |
| C | EO Storage Tank | Level, pressure, vapor conc. | Zone A output rate | Zone D vapor drift, Zone G loading |
| D | Blending Vessel | Temp, agitator status | Zone C feed quality | Fire/explosion risk with hot work |
| D | Static Grounding Points | Continuity pass/fail | CMMS schedule | Ignition source risk |
| F | Cooling Towers | Outlet temp, fan status | Ambient weather | Zone A + Zone B cooling simultaneously |
| F | Boilers/Compressors | Pressure, load, run-hours | CMMS intervals | Steam/air supply to D, G |
| G | Loading Arm | Flow rate, coupling status | Tank pressure (C) | Spill/static discharge |
| H | CMMS Terminal | Work order/overdue flags | — (origin) | Feeds overdue status to every zone |
| K | Flare Stack | Gas flow, ignition status | Zone A off-gas rate | Uncontrolled venting |
| K | Nitrogen Inerting Manifold | Purge cycle status | CMMS service | Silent safety-barrier failure |

---

## Step 4: Sensors & SCADA Tags (3-Tier Thresholds)

| Zone | Tag | Parameter | Normal | Warning | Critical |
|---|---|---|---|---|---|
| A | RX-TEMP | Reactor temperature | 220–260°C | 260–280°C | >280°C |
| A | RX-PRESS | Reactor pressure | 8–12 bar | 12–15 bar | >15 bar |
| A | COOL-FLOW | Cooling jacket flow | 40–60 m³/hr | 20–40 m³/hr | <20 m³/hr |
| A | CAT-AGE | Catalyst service age | <90 days | 90–180 days | >180 days |
| B | CL2-CONC | Chlorine concentration | <0.5 ppm | 0.5–1 ppm | >1 ppm |
| B | CELL-VOLT | Cell voltage | 3.0–3.5 V | 3.5–4.0 V | >4.0 V |
| B | COMP-VIB | Compressor vibration | <2 mm/s | 2–7 mm/s | >7 mm/s |
| C | TK-LEVEL | Tank level | 30–85% | 85–95% | >95% |
| C | TK-PRESS | Tank pressure | 1–3 bar | 3–5 bar | >5 bar |
| C | VOC-CONC | Vapor concentration | <10% LEL | 10–25% LEL | >25% LEL |
| D | BLEND-TEMP | Blend vessel temp | 25–40°C | 40–55°C | >55°C |
| D | GND-CONT | Grounding continuity | Pass | — | Fail |
| E | DRY-TEMP | Dryer temperature | 60–90°C | 90–110°C | >110°C |
| F | BOIL-PRESS | Boiler pressure | 10–14 bar | 14–18 bar | >18 bar |
| F | CT-OUTTEMP | Cooling tower outlet temp | 28–32°C | 32–38°C | >38°C |
| F | COMP-LOAD | Air compressor load | 60–80% | 80–95% | >95% |
| G | LOAD-FLOW | Loading arm flow rate | 20–40 m³/hr | Erratic | Sudden drop to 0 |
| G | GND-CONT (bay) | Grounding continuity | Pass | — | Fail |
| K | FLARE-FLOW | Flare gas flow | ~0 baseline | Elevated sustained | Sustained high flow |
| K | N2-PURGE | Nitrogen purge status | Completed | Delayed | Skipped/failed |

**Cross-cutting signals (not zone-specific):** worker location (presence/count, not GPS precision), active permits (type/zone/time window), weather (ambient temp, wind direction/speed — relevant for Zone B chlorine dispersion).

---

## Step 5: Worker Roles

| Role | Data generated | What the AI surfaces to them |
|---|---|---|
| Plant Operators | Shift logs, SCADA acknowledgments, location | Zone-specific risk, recommended process adjustments |
| Maintenance Engineers | CMMS status, service history, permit closures | Predictive maintenance flags, compounding-risk warnings |
| Safety Officers | Permit approvals, safety walk logs | Compound risk alerts, evacuation recommendations, evidence packages |
| Contractors | Check-in/out, permit assignment, location | Real-time stop-work alerts |
| Security Personnel | CCTV events, gate logs | Unauthorized access/zone entry alerts |
| Shift Supervisors | Handover records, worker allocation | Cross-shift risk continuity |

*(Plant manager / corporate HSE director roles deliberately excluded — organizational realism without data-generation/consumption relevance.)*

---

## Step 6: Permit-to-Work System

| Permit Type | Required when | Key data fields | Compound-risk interaction |
|---|---|---|---|
| Hot Work | Welding/cutting/grinding | Zone, time window, gas test at issuance | Cross-checked live against VOC/CL2 readings — conditions can drift after approval |
| Confined Space Entry | Entry into reactors/tanks | Entrant IDs, gas test, standby attendant | Should require N2-PURGE completion first — a gap here is a key detection target |
| Electrical Work | Live/isolated electrical work | Isolation confirmation, LOTO status | Interacts with electrical load/voltage tags |
| Excavation | Digging near utilities | Depth, utility clearance | Low relevance — listed for completeness only |
| Working at Height | Elevated tank/structure work | Harness/scaffold inspection | Interacts with evacuation planning |
| General Work | Routine non-hazardous tasks | Task description | Control case — should not be flagged |

**Core design principle:** permits are validated at issuance only; the AI's job is to detect when conditions drift dangerous *after* approval — this is the gap existing ePTW systems don't cover.

---

## Step 7: Maintenance System (CMMS)

**Scheduling types:** Preventive (time-based), Condition-based (SCADA/IoT-triggered), Reactive (breakdown-triggered).

**Record fields:** Asset ID, last service date, scheduled interval, overdue days, criticality rating, open work order status.

**Design rule:** overdue maintenance acts as a **risk multiplier/confidence booster** on top of sensor-driven risk scores — never an independent trigger on its own. An overdue asset with otherwise-normal readings should not fire a compound-risk alert.

---

## Step 8: CCTV Coverage

Detection categories: Helmet/PPE compliance, Fire, Smoke, Oil Leak, Worker Fallen, Restricted Area Entry.

| Zone | Placement | Key detections |
|---|---|---|
| A | Reactor platform | PPE, unauthorized presence during upset |
| B | Cell room, compressor area | PPE, worker clustering |
| C | Tank perimeter | Vapor/smoke cues, restricted entry |
| D | Blending/filling line | Fire/smoke, PPE, hot-work-adjacent presence |
| F | Boiler/compressor rooms | Fire/smoke, oil leak |
| G | Loading arm/parking | Vehicle presence, worker fallen |
| J | Gate/check-in | Contractor/vehicle ID, PPE at entry |
| K | Flare base | Fire/flame confirmation, unauthorized presence during purges |

*(Facial recognition/individual ID deliberately excluded — role-level presence is sufficient and avoids privacy scope creep.)*

---

## Step 9: Historical Incident Database

**Record structure:** Incident ID/date/zone (structured), hazard category (structured enum), contributing factors (structured multi-select), severity (structured), narrative summary (free text, RAG-retrievable), root cause/lessons learned (free text, RAG-retrievable).

**10 incident categories:**
1. Reactor Overheating Near-Miss (Zone A)
2. Chlorine Gas Minor Release (Zone B)
3. Tank Overpressure Event (Zone C)
4. Hot Work Ignition Near-Miss (Zone D)
5. Static Discharge Incident (Zone G)
6. Cooling Tower Failure Cascading Event (Zone F → A & B)
7. Skipped Inerting Cycle Near-Miss (Zone K)
8. Shift Changeover Communication Gap (cross-zone)
9. Contractor Unauthorized Zone Entry (Zone J → C)
10. **Fatal Explosion Scenario (Composite, Zones A/C/D)** — fictionalized reconstruction of the exact compound pattern this project targets, structurally mirroring the incident cited in the problem statement

*(Environmental/effluent incidents excluded — outside the worker-safety/zero-harm framing.)*

---

## Step 10: Hazard Map

| Zone | Possible hazards | Failure modes | Safety requirements |
|---|---|---|---|
| A | Explosion/runaway, burns | Cooling failure, catalyst degradation | Continuous monitoring, cooling redundancy |
| B | Toxic gas release | Compressor failure, seal degradation | Gas detection, PPE, evacuation plan |
| C | Overpressure, vapor explosion | Relief valve failure, overfill | Interlocks, vapor detection, hot-work restrictions |
| D | Fire, explosion | Static discharge, hot work near vapor | Grounding checks, gas testing before permits |
| E | Thermal (low severity) | Dryer overheat | Standard monitoring |
| F | Cascading utility failure | Cooling fouling, compressor overload | Redundant cooling, pressure relief |
| G | Static discharge, spill | Grounding/coupling failure | Grounding checks, containment |
| H | Indirect (originates elsewhere) | Backlog accumulation | CMMS compliance tracking |
| J | Unauthorized access | Check-in bypass | Escort requirements, access logging |
| K | Uncontrolled venting | Ignition failure, skipped purge | Mandatory purge verification |

---

## Step 11: Demo Scenarios

| # | Scenario | Data sources | Purpose |
|---|---|---|---|
| 1 | Single sensor breach (RX-TEMP → Warning) | 1 signal | Baseline alerting |
| 2 | Single breach, quick resolution | 1 signal + time | Avoids over-alarming on transients |
| 3 | Overdue maintenance alone | CMMS only | Confirms no false alert on this alone |
| 4 | Overdue maintenance + Warning reading | CMMS + 1 sensor | First compound signal |
| 5 | Hot-work permit approved safe, drifts dangerous | Permit + sensor drift | "Conditions changed post-approval" gap |
| 6 | Chlorine compressor vibration + workers nearby | Sensor + CCTV + location | Cross-hazard-type reasoning |
| 7 | Cooling tower degradation affecting Zones A & B | 1 utility → 2 zones | Clearest "no single sensor sees this" case |
| 8 | Skipped N2 purge + confined space request | CMMS + permit request | Proactive permit blocking |
| 9 | Shift changeover: flagged condition not escalated | Shift logs + sensor history | Temporal reasoning across shifts |
| 10 | **Full compound cascade** (VOC rising + hot-work permit + overdue maintenance + workers present + skipped inerting) | 5 independent sources | Flagship scenario — mirrors Incident #10 |

---

## Step 12: Alignment Review

| Problem-statement agent | Data support from this design |
|---|---|
| Compound Risk Detection Engine | Steps 2–4, Scenarios 4, 7, 10 |
| Digital Permit Intelligence Agent | Step 6, Scenarios 5, 8 |
| Incident Pattern Intelligence (RAG) | Step 9 (hybrid structured + narrative) |
| Geospatial Safety Heatmap | Steps 2, 5, 8 (zones, worker location, CCTV) |
| Emergency Response Orchestrator | Zones G, K — lightly touched, to be developed in architecture phase |
| Quality & Compliance Audit Agent | Zone F/CMMS — weakest coverage so far, to be developed in architecture phase |

**Decision:** Building all six agent types given available time — architecture phase must be designed for this scale from the outset.

**Explicitly descoped (do not build):** Excavation/Working-at-Height permit simulation, environmental/spill incidents, facial recognition, multi-tier alarms beyond 3 tiers, detailed spares inventory/vendor tracking, corporate hierarchy roles beyond those listed.

---

# PART II — Architecture

**Approach:** Independent specialized agents with a central orchestrator (not a single reasoning core with tool-calling), chosen for direct alignment with the problem statement's explicit "Agentic AI / Multi-Agent Systems" requirement, and because the demo scenarios require genuine agent-to-agent handoffs (e.g., Scenario 10: Detection → Incident Retrieval → Emergency Response).

## Agent Roster & Triggers

| Agent | Triggered by | Output |
|---|---|---|
| Compound Risk Detection Engine | Continuous — every SCADA/IoT tick | Risk score + evidence bundle per zone |
| Digital Permit Intelligence Agent | Permit issuance + continuous re-check | Permit risk flag (approve/flag/block-recommend) |
| Incident Pattern Intelligence (RAG) | Called by Detection Engine at Warning tier | Matching historical incident(s) + regulatory citation |
| Geospatial Safety Heatmap | Continuous — consumes location + risk scores | Live zone-by-zone visualization |
| Emergency Response Orchestrator | Called by Detection Engine at Critical tier | Evacuation protocol, alert dispatch, evidence preservation, preliminary report |
| Quality & Compliance Audit Agent | Scheduled (daily) + CMMS/permit anomaly triggers | Compliance gap report vs. OISD/Factory Act |

**Orchestration model:** hybrid — the Compound Risk Detection Engine acts as the hub, calling the Incident Pattern Intelligence and Emergency Response agents directly when its own risk score crosses tier thresholds. Permit Intelligence, Heatmap, and Compliance agents run semi-independently and feed back into the Detection Engine's scoring. Agents share a single **risk event object** as their handoff contract:

```
{ zone, timestamp, risk_score, tier, contributing_signals: [...], triggered_agents: [...] }
```

Deliberately avoided: a fully-meshed "every agent can call every agent" design — harder to debug, harder to diagram clearly for judges.

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Agent orchestration | LangGraph | Models the hub-and-spoke pattern directly; team has prior experience |
| LLM provider | **Google Gemini API (Flash, free tier)** | Only provider with a genuine sustained free tier (no card, no expiration) — Anthropic/OpenAI/IBM Granite require payment beyond small trial credits |
| Backend/API | FastAPI (Python) | Async-friendly for continuous SCADA-tick simulation |
| RAG vector store | ChromaDB (embedded) | Zero infra setup |
| Knowledge graph | NetworkX (in-process) | Demonstrates relationship reasoning without Neo4j deployment overhead |
| Structured data | **PostgreSQL** | Relational fit for SCADA/CMMS/permit schemas |
| Real-time simulation | Python asyncio tick loop + WebSockets | Powers the Industrial Digital Twin |
| Frontend | React + Recharts + Mapbox/Leaflet | Sensor trends + geospatial heatmap |
| CCTV | Scripted JSON events, not real CV | Evaluation focus is reasoning over events, not perception accuracy |

**Rate-limit design consequence:** Gemini free tier (~15 req/min) means continuous agents (Detection Engine, Heatmap) should do correlation/scoring with lightweight rule-based logic first, and only call the LLM when a tag crosses into Warning/Critical tier for the reasoning/explanation step.

## Data Schema (PostgreSQL)

Core tables: `zones`, `sensor_readings` (tag, value, tier, timestamp), `assets`, `maintenance_records` (CMMS), `permits` (ePTW), `worker_locations`, `cctv_events`, `risk_events` (the agent handoff object, JSONB signals), `historical_incidents` (structured fields + pointer to ChromaDB narrative document).

`sensor_readings.tier` encodes the Step 4 3-tier model directly. `historical_incidents.narrative_doc_ref` bridges Postgres to ChromaDB so the RAG agent can filter structurally first, then retrieve semantically — faster and more accurate than pure vector search.

## Industrial Digital Twin Simulator

Two modes, one engine: **Baseline mode** (random-walk within Normal range per tag, so the dashboard never looks frozen) and **Scenario mode** (scripted timeline JSON that ramps specific tags Normal → Warning → Critical on a controlled schedule, with a playback speed multiplier for recording flexibility).

Scenarios are **manually triggered**, not randomly auto-fired — chosen specifically because the deliverable is a demo video: manual trigger allows clean narration, re-recording of any scenario that doesn't play cleanly, and pacing control in post-production, while keeping the actual detection moments at real-time speed for lead-time credibility.

Ramps run over 30–60 seconds (never instant jumps) so the Warning→Critical gap is visible and demonstrable as a lead-time metric.

## Frontend Dashboard

Four core panels, each mapped to one of five required questions (what/where/why/evidence/action): **Interactive Digital Twin** (geospatial zone map with correlation-line overlays during compound events), **AI Risk Panel** + **Explainable AI Reasoning** (evidence, confidence, matched historical incident), **Live Incident Timeline**, **Recommended Interventions**, plus an **AI Safety Copilot** chat and a **Smart Notifications** feed. Quality & Compliance output is deliberately kept off the primary safety-critical view (secondary/settings-style panel) since it's a slower-cadence background function, not a real-time safety concern.

A working React prototype of this dashboard has been built (`dashboard.jsx`) with scripted mock data demonstrating Scenario 10's full cascade and correlation-line visualization.
