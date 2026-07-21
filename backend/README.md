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

## Running

```
cd backend
python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -r requirements.txt
cp .env.example .env   # fill in GEMINI_API_KEY when Track 3 needs it
python seed/seed_reference.py
python seed/seed_incidents.py
python rag/ingest_regulatory.py
python rag/ingest_incidents.py
```
