from __future__ import annotations

from dataclasses import dataclass


@dataclass
class ModelInfo:
    name: str
    version: str
    loaded: bool


def get_model_registry_snapshot() -> list[ModelInfo]:
    return [
        ModelInfo(name="disease_model", version="efficientnet-b3", loaded=True),
        ModelInfo(name="skin_type_model", version="efficientnet-b1", loaded=True),
        ModelInfo(name="nlp_entity_model", version="pubmedbert-or-fallback", loaded=True),
        ModelInfo(name="embedding_model", version="bge-base-or-fallback", loaded=True),
    ]
