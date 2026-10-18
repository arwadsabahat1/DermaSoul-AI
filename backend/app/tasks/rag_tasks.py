from __future__ import annotations

from app.database import SessionLocal
from app.services.rag_ingestion_service import reindex_rag_documents


def run_rag_reindex_job() -> dict[str, int]:
    db = SessionLocal()
    try:
        return reindex_rag_documents(db)
    finally:
        db.close()
