"""
Loads real OISD/Factories Act regulatory excerpts (backend/rag/regulatory/*.md)
into an embedded ChromaDB collection. Each file's YAML-style frontmatter
becomes document metadata so the Incident Pattern Intelligence agent can
cite a specific standard + clause, not just "a source" (see reg_*.md files
for the verbatim excerpts and where each was retrieved from).
"""

import os
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import chromadb
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

REGULATORY_DIR = Path(__file__).resolve().parent / "regulatory"
PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", str(Path(__file__).resolve().parent / "chroma_store"))

FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---\n\n(.*)$", re.DOTALL)


def parse_frontmatter(text: str) -> tuple[dict, str]:
    match = FRONTMATTER_RE.match(text)
    if not match:
        raise ValueError("Missing YAML-style frontmatter block")
    raw_meta, body = match.groups()

    meta = {}
    for line in raw_meta.splitlines():
        if not line.strip() or ":" not in line:
            continue
        key, _, value = line.partition(":")
        key, value = key.strip(), value.strip()
        if value.startswith("[") and value.endswith("]"):
            value = ", ".join(v.strip() for v in value[1:-1].split(","))
        meta[key] = value
    return meta, body.strip()


def main():
    client = chromadb.PersistentClient(path=PERSIST_DIR)
    collection = client.get_or_create_collection(
        name="regulatory",
        metadata={"description": "OISD / Factories Act 1948 excerpts — hot work, confined space, gas hazard management"},
    )

    files = sorted(REGULATORY_DIR.glob("*.md"))
    if not files:
        print(f"No regulatory documents found in {REGULATORY_DIR}")
        return

    ids, documents, metadatas = [], [], []
    for path in files:
        meta, body = parse_frontmatter(path.read_text(encoding="utf-8"))
        ids.append(path.stem)
        documents.append(body)
        metadatas.append(meta)

    collection.upsert(ids=ids, documents=documents, metadatas=metadatas)
    print(f"Ingested {len(ids)} regulatory documents into ChromaDB collection 'regulatory' at {PERSIST_DIR}")
    for i, m in zip(ids, metadatas):
        print(f"  - {i}: {m.get('standard')} — {m.get('clause_topic')}")


if __name__ == "__main__":
    main()
