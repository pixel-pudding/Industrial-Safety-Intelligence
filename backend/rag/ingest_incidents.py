"""
Loads the 10 historical incident narratives (backend/seed/narratives/*.md)
into an embedded ChromaDB collection, attaching structured metadata pulled
from SQLite (historical_incidents) so the RAG agent can filter structurally
first (zone, hazard_category, severity) and then retrieve semantically —
per Part II's narrative_doc_ref bridge design.

Run after seed/seed_incidents.py.
"""

import os
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import chromadb
from dotenv import load_dotenv

from app.db import SessionLocal
from app.models import HistoricalIncident

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

NARRATIVES_DIR = Path(__file__).resolve().parent.parent / "seed" / "narratives"
PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", str(Path(__file__).resolve().parent / "chroma_store"))


def main():
    session = SessionLocal()
    incidents = {i.narrative_doc_ref: i for i in session.query(HistoricalIncident).all()}
    session.close()

    if not incidents:
        print("No rows in historical_incidents — run seed/seed_incidents.py first.")
        return

    client = chromadb.PersistentClient(path=PERSIST_DIR)
    collection = client.get_or_create_collection(
        name="incidents",
        metadata={"description": "SPSCL historical incident narratives — full text, RAG-retrievable"},
    )

    ids, documents, metadatas = [], [], []
    for path in sorted(NARRATIVES_DIR.glob("incident_*.md")):
        doc_ref = path.stem
        incident = incidents.get(doc_ref)
        if incident is None:
            print(f"Warning: {doc_ref} has no matching historical_incidents row — skipping.")
            continue

        ids.append(doc_ref)
        documents.append(path.read_text(encoding="utf-8"))
        metadatas.append({
            "incident_number": incident.incident_number,
            "title": incident.title,
            "date": incident.date.isoformat(),
            "zone_id": incident.zone_id or "",
            "zones_involved": ", ".join(incident.zones_involved),
            "hazard_category": incident.hazard_category,
            "severity": incident.severity,
            "contributing_factors": ", ".join(incident.contributing_factors),
        })

    collection.upsert(ids=ids, documents=documents, metadatas=metadatas)
    print(f"Ingested {len(ids)} incident narratives into ChromaDB collection 'incidents' at {PERSIST_DIR}")
    for i, m in zip(ids, metadatas):
        print(f"  - {i}: #{m['incident_number']} {m['title']} ({m['severity']})")


if __name__ == "__main__":
    main()
