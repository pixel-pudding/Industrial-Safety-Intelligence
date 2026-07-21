# Build Plan & Task Breakdown
## SPSCL Industrial Safety Intelligence Platform — ET AI Hackathon 2026

Assumes the design in `SPSCL_Foundation_Design.md` is locked. This breaks the remaining work into buildable, roughly independent tracks so team members can work in parallel.

---

## Track 1 — Data Foundation (do this first, everything else depends on it)
- Set up PostgreSQL schema (all tables from Part II)
- Seed static reference data: zones, assets, permit types, worker roles
- Write the 10 historical incident records (structured fields) + matching narrative documents for ChromaDB
- Source and load real Safety Manuals/SOPs and regulatory excerpts (OISD/Factory Act/DGMS) into ChromaDB

**Owner profile:** whoever's most comfortable with SQL/data modeling. No AI/ML knowledge required — this can start immediately and in parallel with everything else.

## Track 2 — Industrial Digital Twin Simulator
- Baseline random-walk tick generator per sensor tag (Step 4 ranges)
- Scenario timeline engine (JSON-driven, manual trigger, playback speed control)
- Script all 10 demo scenarios as timeline files
- WebSocket publisher for live frontend updates

**Depends on:** Track 1 schema being final (writes into the same tables).

## Track 3 — Agent Implementation (the core AI work)
Build in this order — each agent is independently testable before the next:
1. **Compound Risk Detection Engine** — rule-based tier scoring first (cheap, fast), LLM call only at Warning/Critical for reasoning/confidence
2. **Digital Permit Intelligence Agent** — permit-vs-live-condition cross-check
3. **Incident Pattern Intelligence** — RAG retrieval against ChromaDB, triggered by Detection Engine
4. **Emergency Response Orchestrator** — intervention generation, triggered at Critical tier
5. **Geospatial Safety Heatmap** — mostly a data-shaping layer over existing risk scores + locations
6. **Quality & Compliance Audit Agent** — lowest priority; build only after 1–5 are demo-ready

**Depends on:** Track 1 (data) and Gemini API access set up early — confirm free-tier quota is sufficient for your test cadence before building against it.

## Track 4 — Frontend
- `dashboard.jsx` prototype already built with mock data — next step is replacing scripted mock state with real WebSocket + API data
- Wire the AI Safety Copilot to a real Gemini call (currently canned responses)
- Connect zone selection to live agent output instead of the two hardcoded evidence cases

**Depends on:** Track 3 agents emitting real risk_event objects; can be developed against the mock version in parallel until then.

## Track 5 — Demo Video & Deck
- Script follows Step 11 scenario progression: open with a Scenario 10 teaser, walk 1→9 to build credibility, close with full Scenario 10 detail
- Record Track 4 dashboard interactions once Track 3 agents are live
- Architecture diagram — derive directly from Part II of the foundation doc (agent roster + orchestration table translates cleanly into a diagram)

**Depends on:** everything else being demo-ready; start the script/storyboard early so recording isn't a last-minute scramble.

---

## Suggested sequencing (not a fixed calendar — adjust to your actual days remaining)
1. Track 1 (data foundation) — start immediately, short
2. Track 2 (simulator) + early Track 3 agent #1 (Detection Engine) in parallel
3. Remaining Track 3 agents, in priority order listed above
4. Track 4 integration (swap mock data for live agents)
5. Track 5 — record and edit last, once the full pipeline works end-to-end at least once

**Risk to flag now:** Track 3 agents 1–4 are what your judging score actually depends on (Innovation, Business Impact, Technical Excellence). If time runs short, protect that track first — a polished dashboard with weak agent reasoning behind it will read as hollow to a technical judge; a rough dashboard with genuinely strong compound-risk reasoning will not.
