from __future__ import annotations

import logging
import math
from typing import Any

from sqlalchemy.orm import Session

from app.models.rag_document import RAGDocument
from app.services.rag_embedding_service import embed_text

logger = logging.getLogger(__name__)


def _cosine(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    length = len(a)
    dot = sum(a[i] * b[i] for i in range(length))
    na = math.sqrt(sum(a[i] * a[i] for i in range(length))) or 1.0
    nb = math.sqrt(sum(b[i] * b[i] for i in range(length))) or 1.0
    return dot / (na * nb)


def retrieve_semantic_context(
    db: Session,
    query_text: str,
    *,
    top_k: int = 12,
    metadata_filter: dict[str, Any] | None = None,
    source_type: str | None = None,
) -> list[dict[str, Any]]:
    query_embedding = embed_text(query_text)
    query = db.query(RAGDocument)
    if source_type:
        query = query.filter(RAGDocument.source_type == source_type)
    rows = query.all()

    results: list[dict[str, Any]] = []
    skipped_dimension_mismatch = 0
    for row in rows:
        if len(row.embedding_json or []) != len(query_embedding):
            # Index built with a different embedding model; comparing would be meaningless.
            skipped_dimension_mismatch += 1
            continue
        metadata = row.metadata_json or {}
        if metadata_filter:
            blocked = False
            for key, value in metadata_filter.items():
                if value is None:
                    continue
                if str(metadata.get(key, "")).lower() != str(value).lower():
                    blocked = True
                    break
            if blocked:
                continue
        score = _cosine(query_embedding, row.embedding_json or [])
        results.append(
            {
                "id": row.id,
                "source_type": row.source_type,
                "source_id": row.source_id,
                "title": row.title,
                "content": row.content,
                "metadata": metadata,
                "retrieval_score": round(float(score), 6),
            }
        )

    if skipped_dimension_mismatch:
        logger.warning(
            "Skipped %d RAG documents with mismatched embedding size; reindex via /api/admin/ai/reindex-rag.",
            skipped_dimension_mismatch,
        )

    results.sort(key=lambda item: item["retrieval_score"], reverse=True)
    return results[:top_k]
