# SPSCL — AI-Powered Industrial Safety Intelligence Platform

**ET AI Hackathon 2026 — Problem Statement #1**
*AI-Powered Industrial Safety Intelligence for Zero-Harm Operations*

An intelligence layer over a simulated petrochemical facility (Sahyadri Petrochem & Specialty Chemicals Ltd.) that correlates SCADA/IoT sensors, permit-to-work logs, CMMS maintenance records, CCTV events, worker location, and shift logs to detect **compound risk conditions** no single sensor would flag alone — and recommends concrete interventions, with full reasoning and evidence, before conditions escalate.

> The AI is the product. The dashboard is only a visualization layer.

## What's inside

Six independently-testable AI agents, all built (not a narrowed subset of the problem statement's suggestions):

| Agent | What it does |
|---|---|
| **Compound Risk Detection Engine** | Rule-based scoring across 7 independent evidence categories, LLM reasoning only at Warning/Critical tier |
| **Digital Permit Intelligence Agent** | Cross-checks all 6 permit types against live plant conditions post-approval |
| **Incident Pattern Intelligence (RAG)** | Retrieves matching historical incidents + regulatory citations (OISD, Factories Act) from ChromaDB, with confidence bands |
| **Emergency Response Orchestrator** | Evacuation cascade, alert dispatch, evidence snapshot, preliminary report at Critical tier |
| **Geospatial Safety Heatmap** | Live zone-by-zone risk visualization |
| **Quality & Compliance Audit Agent** | Continuous compliance gap detection vs. OISD/Factory Act |

See [`docs/Detailed_Report.pdf`](docs/Detailed_Report.pdf) for the full architecture, design rationale, and judging-criteria alignment.

## Architecture

```
Simulated Digital Twin (tick engine, 10 scripted scenarios)
        │  WebSocket + REST
        ▼
FastAPI backend ── Compound Risk Detection Engine (hub)
        │               ├─ calls → Incident Pattern Intelligence (RAG)
        │               └─ calls → Emergency Response Orchestrator
        ├─ Digital Permit Intelligence (feeds back into scoring)
        ├─ Geospatial Heatmap (reshapes live state)
        └─ Compliance Audit (scheduled, independent)
        │
        ▼
React + Vite frontend — Digital Twin, AI Reasoning Panel, Live Heatmap, Safety Copilot
```

## Tech stack

- **Backend:** FastAPI, SQLAlchemy (SQLite), ChromaDB, LangGraph, Google Gemini (Flash, free tier) with a deterministic offline fallback
- **Frontend:** React 19, Vite, Tailwind CSS v4
- **Simulation:** Python asyncio tick loop over WebSocket, JSON-scripted scenario timelines

## Running it locally

```bash
git clone https://github.com/pixel-pudding/Industrial-Safety-Intelligence.git
cd Industrial-Safety-Intelligence
```

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate   # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env   # add GROQ_API_KEY if you have one — the system works without it
python -m seed.seed_reference
python -m seed.seed_incidents
python -m rag.ingest_incidents
python -m rag.ingest_regulatory
python -m simulator.seed_baseline_state
uvicorn main:app --reload --port 8010
```

The API is now live at `http://localhost:8010`. Key endpoints:

| Endpoint | Purpose |
|---|---|
| `GET /api/scenarios` | List the 10 demo scenarios |
| `POST /api/scenario/{id}/run` | Trigger a scenario |
| `POST /api/reset` | Reset to baseline before the next run |
| `GET /api/heatmap` | Live geospatial risk view |
| `GET /api/permits/flags` | Active permit risk flags |
| `GET /api/emergency-responses` | Emergency Response Orchestrator output |
| `POST /api/compliance-audit/run` | Trigger a compliance audit |
| `WS /ws` | Live tick stream (every 2s) — sensor readings, risk events with full evidence, permit flags, heatmap |

### Frontend

```bash
cd frontend
pnpm install   # or npm install
pnpm dev       # or npm run dev
```

Open the printed local URL. Trigger a scenario (Scenario 10 is the flagship full-cascade demo) and watch the Digital Twin, AI Reasoning Panel, and Live Alerts update in real time.

## Demo scenarios

10 scripted scenarios validate the system end-to-end, from a single-sensor baseline through a full 5-source compound cascade (Scenario 10) modeled on the fatal-incident pattern the problem statement cites. Full list and rationale in the detailed report.

## Known limitations (disclosed, not hidden)

- RAG retrieval precision among closely related incidents is noisier than it would be at production scale, given only 10 seeded historical incidents.
- Compliance Audit citations are lower-confidence for maintenance-interval gaps than for hot-work/confined-space gaps — the regulatory corpus was scoped toward the latter.
- CCTV events are scripted JSON, not real computer-vision inference (by design — the evaluation focus is reasoning over events, not perception accuracy).

## Submission

Submitted by **Aditi Anand Kumar** — ET AI Hackathon 2026, Problem Statement #1: *AI-Powered Industrial Safety Intelligence for Zero-Harm Operations*
Repository: [github.com/pixel-pudding/Industrial-Safety-Intelligence](https://github.com/pixel-pudding/Industrial-Safety-Intelligence)
