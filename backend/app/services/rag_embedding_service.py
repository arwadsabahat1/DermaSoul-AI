from __future__ import annotations

import hashlib
import math
from functools import lru_cache

from app.config import settings


def _hash_embedding(text: str, dimensions: int = 384) -> list[float]:
    digest = hashlib.sha256(text.encode("utf-8")).digest()
    values = []
    for i in range(dimensions):
        b = digest[i % len(digest)]
        values.append((b / 255.0) - 0.5)
    norm = math.sqrt(sum(v * v for v in values)) or 1.0
    return [v / norm for v in values]


@lru_cache(maxsize=1)
def _get_sentence_transformer():
    model_name = settings.RAG_EMBEDDING_MODEL
    if not model_name:
        return None
    try:
        from sentence_transformers import SentenceTransformer  # type: ignore

        return SentenceTransformer(model_name)
    except Exception:
        return None


def embed_text(text: str) -> list[float]:
    model = _get_sentence_transformer()
    if model is None:
        return _hash_embedding(text)

    vector = model.encode(text, normalize_embeddings=True)
    return [float(v) for v in vector]
