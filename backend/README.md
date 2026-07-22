# SPSCL Backend — Track 1 (Data Foundation)

SQLite (`safety_intelligence.db`, created by `seed/seed_reference.py`) +
ChromaDB (embedded, `rag/chroma_store/`). Schema in `app/models.py` follows
`SPSCL_Foundation_Design.md` Part II; deviations are documented in that
file's module docstring.

## `permits.extra_fields` — expected keys per `permit_type_id`

`permits` has core columns common to every permit (zone, time window,
gas test) plus one JSON column for the fields that only apply to specific
types (Step 6). Expected shape per type, for whoever builds the Digital
Permit Intelligence Agent against this table:

| `permit_type_id` | `extra_fields` keys | Notes |
|---|---|---|
| `hot_work` | `{ "work_description": str }` | Gas test lives in the core `gas_test_ppm`/`gas_test_pass` columns — Step 6's key detection case is re-checking these live against VOC/CL2 readings *after* issuance, not at issuance. |
| `confined_space_entry` | `{ "entrant_ids": [str], "standby_attendant": str, "n2_purge_confirmed": bool }` | `n2_purge_confirmed` is the field the Compound Risk Detection Engine cross-checks against the zone's live `N2-PURGE` sensor status — Step 6 names a gap here as a key detection target. |
| `electrical_work` | `{ "isolation_confirmed": bool, "loto_status": "applied" \| "pending" \| "removed" }` | |
| `excavation` | `{ "depth_meters": float, "utility_clearance_confirmed": bool }` | Descoped from active scenario logic per Step 6 ("low relevance — listed for completeness only"); table support kept for schema completeness. |
| `working_at_height` | `{ "harness_inspected": bool, "scaffold_inspected": bool }` | |
| `general_work` | `{ "task_description": str }` | Control case — should never be flagged. |

## Additions beyond Part II's table list

See the docstring at the top of `app/models.py` for `SensorTag`,
`PermitType`, `WorkerRole`, and `ShiftLog` — each maps to a specific
build-plan requirement (seeding reference data, or Scenario 9's shift
handover reasoning), not a speculative extension.

## Layout

```
backend/
  app/models.py          SQLAlchemy models (all tables)
  app/db.py               engine/session (SQLite)
  seed/seed_reference.py  zones, assets, sensor_tags, permit_types, worker_roles
  seed/seed_incidents.py  10 historical incidents (structured fields)
  seed/narratives/        incident_01..10.md — full text, RAG-ingested
  rag/ingest_regulatory.py  OISD/Factory Act/DGMS excerpts -> ChromaDB
  rag/ingest_incidents.py   incident narratives -> ChromaDB
```

## Track 4 deviation: `/api/copilot/chat`

Added during **Track 4 (frontend recovery)**, not Track 3 — flagging this
explicitly so it doesn't need rediscovering later. The original Track 3
agent roster (Compound Risk Detection Engine, Digital Permit Intelligence,
Incident Pattern Intelligence, Emergency Response Orchestrator, Geospatial
Safety Heatmap, Quality & Compliance Audit) has no conversational endpoint —
every agent is tick-driven or REST. When rebuilding the frontend's Safety
Copilot panel, there was no way to make it genuinely LLM-backed without one,
so `agents/copilot_agent.py` + `POST /api/copilot/chat` were added as a
narrowly-scoped, explicitly-confirmed exception to "don't touch backend/"
for that one task.

Design notes:
- **Local-first, the LLM as last resort.** Most questions (zone risk status,
  active permits, "show evidence") are pattern-matched and answered
  directly from `risk_events`/`permits` — no LLM call. This endpoint shares
  the same Groq free-tier quota as the Detection Engine's Warning/Critical
  reasoning calls, so it only calls out for genuinely open-ended questions
  the local matcher can't classify.
- **Same graceful-fallback discipline as `llm_client.py`** — with no
  `GROQ_API_KEY` configured, returns a deterministic context dump instead
  of erroring; upgrades to real LLM answers automatically once a key is
  added, no code change required.
- **Known limitation:** `risk_events` persists `contributing_signals` only,
  not the full `Evidence` object (reasoning / matched incident / regulatory
  citation) the Detection Engine generates transiently over WebSocket —
  Evidence was never added as a persisted column. So a "show evidence"
  answer here reflects raw signal descriptions, not the original LLM
  reasoning text. Widening `RiskEvent`'s schema to persist `Evidence` was
  out of scope for this endpoint's authorization; would be a reasonable
  follow-up if the Copilot's answer quality on that specific intent matters
  later.

## Deviation: LLM provider is Groq, not Gemini

The original design called for Gemini (free tier) as the only LLM provider,
used by `agents/llm_client.py` (Compound Risk Detection Engine's reasoning
step, once per Warning/Critical tier transition) and `agents/copilot_agent.py`
(Safety Copilot, last-resort fallback only). Switched to **Groq**
(`llama-3.3-70b-versatile`, OpenAI-compatible REST API) with explicit user
confirmation, after direct REST testing (bypassing the Python SDK) proved
the available Gemini API key/project was capped at **20 requests/day** —
`429 RESOURCE_EXHAUSTED, GenerateRequestsPerDayPerProjectPerModel-FreeTier,
limit: 20` — far too low to survive a single demo scenario, let alone
several. The key was valid, just tied to a project with an unusually low
quota (its `AQ.Ab8...` format doesn't match the standard `AIzaSy...` keys
minted via `aistudio.google.com/apikey`).

Groq's free tier (1,000 req/day, 30 RPM, no card required) is a genuine
no-cost tier consistent with the original "no paid APIs" constraint — just
a different provider. `agents/gemini_client.py` was deleted and replaced by
`agents/llm_client.py`, which calls Groq's OpenAI-compatible endpoint via
raw `requests` (no new SDK dependency — `requests` was already transitive
via `chromadb`). `google-genai` was dropped from `requirements.txt`.
Set `GROQ_API_KEY` (and optionally `GROQ_MODEL`) in `.env` instead of
`GEMINI_API_KEY`/`GEMINI_MODEL`. All graceful-degradation behavior
(deterministic fallback when no key is set or a call fails) is unchanged —
only the underlying provider moved.

## Running

```
cd backend
python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -r requirements.txt
cp .env.example .env   # fill in GROQ_API_KEY when Track 3 needs it
python seed/seed_reference.py
python seed/seed_incidents.py
python rag/ingest_regulatory.py
python rag/ingest_incidents.py
python -m uvicorn main:app --port 8010
```

**Port 8010, not 8000:** found during Track 4 verification that this
machine has other, unrelated services already bound across
0.0.0.0/127.0.0.1/::1 on port 8000 — `curl localhost:8000` was silently
answered by a completely different app via IPv6 resolution. 8010 was
confirmed free. `frontend-dashboard/src/services/{scenarioService,
copilotService}.js` both hardcode this same port — keep them in sync if
this ever changes.
