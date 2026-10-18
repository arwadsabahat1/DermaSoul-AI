from __future__ import annotations

from typing import Any


def compute_retrieval_quality_metrics(retrieval_trace: list[dict[str, Any]]) -> dict[str, float]:
    if not retrieval_trace:
        return {
            "retrieval_avg_score": 0.0,
            "retrieval_max_score": 0.0,
            "citation_count": 0.0,
        }
    scores = [float(item.get("rerank_score", item.get("retrieval_score", 0.0))) for item in retrieval_trace]
    return {
        "retrieval_avg_score": round(sum(scores) / len(scores), 6),
        "retrieval_max_score": round(max(scores), 6),
        "citation_count": float(len(retrieval_trace)),
    }
