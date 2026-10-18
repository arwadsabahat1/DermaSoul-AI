from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from app.models.rag_document import RAGDocument
from app.services.rag_chunking_service import chunk_text
from app.services.rag_embedding_service import embed_text


def _knowledge_paths() -> list[tuple[str, Path]]:
    base = Path(__file__).resolve().parents[1] / "rag_knowledge"
    return [
        ("condition_knowledge", base / "condition_knowledge.json"),
        ("safe_otc_products", base / "safe_otc_products.json"),
    ]


def _row_to_text(source_type: str, row: dict[str, Any]) -> tuple[str, str, dict[str, Any]]:
    if source_type == "condition_knowledge":
        title = str(row.get("condition_name") or row.get("model_class") or "Condition")
        parts = [
            str(row.get("brief_overview") or ""),
            " ".join(row.get("common_signs") or []),
            " ".join(row.get("common_triggers_or_causes") or []),
            " ".join(row.get("general_care_guidance") or []),
            " ".join(row.get("what_to_avoid") or []),
            str(row.get("when_to_seek_doctor") or ""),
            str(row.get("professional_note") or ""),
        ]
        return title, " ".join(p for p in parts if p).strip(), {
            "model_class": row.get("model_class"),
            "category": row.get("category"),
        }

    title = str(row.get("category") or row.get("id") or "OTC Guidance")
    parts = [
        str(row.get("purpose") or ""),
        str(row.get("safety_note") or ""),
        " ".join(row.get("recommended_for_conditions") or []),
        " ".join(row.get("recommended_for_skin_types") or []),
    ]
    return title, " ".join(p for p in parts if p).strip(), {
        "product_type": row.get("product_type"),
        "id": row.get("id"),
    }


def reindex_rag_documents(db: Session) -> dict[str, int]:
    db.query(RAGDocument).delete()
    db.commit()

    inserted = 0
    for source_type, path in _knowledge_paths():
        if not path.exists():
            continue
        rows = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(rows, list):
            continue
        for row in rows:
            if not isinstance(row, dict):
                continue
            title, text, metadata = _row_to_text(source_type, row)
            chunks = chunk_text(text)
            source_id = str(row.get("model_class") or row.get("id") or row.get("condition_name") or title)
            for chunk in chunks:
                db.add(
                    RAGDocument(
                        source_type=source_type,
                        source_id=source_id,
                        title=title,
                        content=chunk.content,
                        chunk_index=chunk.chunk_index,
                        metadata_json=metadata,
                        embedding_json=embed_text(chunk.content),
                    )
                )
                inserted += 1
    db.commit()
    return {"inserted_chunks": inserted}
