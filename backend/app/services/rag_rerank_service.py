from __future__ import annotations

from typing import Any

from app.config import settings


def rerank_context(query_text: str, candidates: list[dict[str, Any]], top_n: int = 5) -> list[dict[str, Any]]:
    """
    Lightweight reranking stage.
    If cross-encoder is configured in future, plug it in here.
    """
    _ = query_text
    # Stable sort by retrieval score now; keep extension point for cross-encoder reranker.
    sorted_rows = sorted(candidates, key=lambda x: x.get("retrieval_score", 0.0), reverse=True)
    trimmed = sorted_rows[:top_n]
    for row in trimmed:
        score = float(row.get("retrieval_score", 0.0))
        row["rerank_score"] = round(score, 6)
        # Raw cosine clipped to [0, 1]; (score + 1) / 2 inflated every match to ~0.8+.
        row["retrieval_confidence"] = round(max(0.0, min(1.0, score)), 4)
    return trimmed
