"""
FastAPI entry point: starts the simulator tick loop as a background task,
broadcasts every tick over WebSocket, and exposes the REST surface Track 4
will wire scenarioService.js / copilotService.js against.
"""

import asyncio
import datetime as dt
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from agents import permit_intelligence
from app.db import SessionLocal
from app.models import EmergencyResponse as EmergencyResponseModel
from app.models import HistoricalIncident, Permit
from app.models import RiskEvent as RiskEventModel
from app.models import Zone
from app.ws_manager import ConnectionManager
from simulator.tick_engine import TICK_INTERVAL, TickEngine

manager = ConnectionManager()
engine = TickEngine()
_tick_task: asyncio.Task | None = None


async def _tick_loop():
    while True:
        payload = engine.tick()
        await manager.broadcast(payload)
        await asyncio.sleep(TICK_INTERVAL)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _tick_task
    _tick_task = asyncio.create_task(_tick_loop())
    yield
    _tick_task.cancel()


app = FastAPI(title="SPSCL Industrial Safety Intelligence API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)


@app.get("/api/zones")
def list_zones():
    session = SessionLocal()
    try:
        return [
            {"id": z.id, "name": z.name, "purpose": z.purpose, "possible_hazards": z.possible_hazards}
            for z in session.query(Zone).all()
        ]
    finally:
        session.close()


@app.get("/api/scenarios")
def list_scenarios():
    return TickEngine.list_scenarios()


@app.post("/api/scenario/{scenario_id}/run")
def run_scenario(scenario_id: str, speed: float = 1.0):
    scenario = engine.run_scenario(scenario_id, playback_speed=speed)
    return {"status": "started", "scenario_id": scenario_id, "name": scenario["name"]}


@app.post("/api/reset")
def reset():
    engine.reset_to_baseline()
    return {"status": "reset"}


@app.get("/api/risk-events")
def list_risk_events(limit: int = 50, zone: str | None = None):
    session = SessionLocal()
    try:
        query = session.query(RiskEventModel).order_by(RiskEventModel.id.desc())
        if zone:
            query = query.filter(RiskEventModel.zone_id == zone)
        rows = query.limit(limit).all()
        return [
            {
                "id": r.id, "zone": r.zone_id, "timestamp": r.timestamp.isoformat(),
                "risk_score": r.risk_score, "tier": r.tier,
                "contributing_signals": r.contributing_signals, "triggered_agents": r.triggered_agents,
            }
            for r in rows
        ]
    finally:
        session.close()


@app.get("/api/permits")
def list_permits(zone: str | None = None, status: str | None = None):
    session = SessionLocal()
    try:
        query = session.query(Permit).order_by(Permit.id.desc())
        if zone:
            query = query.filter(Permit.zone_id == zone)
        if status:
            query = query.filter(Permit.status == status)
        rows = query.limit(50).all()
        return [
            {
                "id": p.id, "permit_type_id": p.permit_type_id, "zone": p.zone_id, "status": p.status,
                "issued_at": p.issued_at.isoformat(), "valid_to": p.valid_to.isoformat(),
                "gas_test_pass": p.gas_test_pass, "extra_fields": p.extra_fields,
            }
            for p in rows
        ]
    finally:
        session.close()


@app.get("/api/permits/flags")
def permit_flags(only_active_concerns: bool = True):
    """Digital Permit Intelligence Agent — live re-check of every active permit,
    independent of whether any zone's overall risk tier has changed."""
    session = SessionLocal()
    try:
        now = dt.datetime.utcnow()
        tiers = engine.current_zone_tag_tiers()
        flags = permit_intelligence.evaluate_active_permits(session, tiers, now)
        if only_active_concerns:
            flags = [f for f in flags if f.flag != "approve"]
        return [f.model_dump(mode="json") for f in flags]
    finally:
        session.close()


@app.get("/api/emergency-responses")
def list_emergency_responses(limit: int = 20):
    session = SessionLocal()
    try:
        rows = session.query(EmergencyResponseModel).order_by(EmergencyResponseModel.id.desc()).limit(limit).all()
        return [
            {
                "id": r.id, "risk_event_id": r.risk_event_id, "zone": r.zone_id,
                "triggered_at": r.triggered_at.isoformat(), "evacuation_zones": r.evacuation_zones,
                "alert_recipients": r.alert_recipients, "preliminary_report": r.preliminary_report,
                "status": r.status,
            }
            for r in rows
        ]
    finally:
        session.close()


@app.get("/api/heatmap")
def heatmap():
    """Geospatial Safety Heatmap — live zone-by-zone view (risk tier/score,
    worker count, active permit overlaps, hazard classification)."""
    session = SessionLocal()
    try:
        return engine.current_heatmap(session).model_dump(mode="json")
    finally:
        session.close()


@app.get("/api/incidents")
def list_incidents():
    session = SessionLocal()
    try:
        rows = session.query(HistoricalIncident).order_by(HistoricalIncident.incident_number).all()
        return [
            {
                "incident_number": i.incident_number, "title": i.title, "zone": i.zone_id,
                "zones_involved": i.zones_involved, "severity": i.severity,
                "narrative_summary": i.narrative_summary, "narrative_doc_ref": i.narrative_doc_ref,
            }
            for i in rows
        ]
    finally:
        session.close()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()  # keep-alive; client payload content is ignored
    except WebSocketDisconnect:
        manager.disconnect(websocket)
