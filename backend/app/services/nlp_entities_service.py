from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from functools import lru_cache
from typing import Any

from app.config import settings
from app.services.nlp_normalization_service import canonicalize_entity

logger = logging.getLogger(__name__)


@dataclass
class Entity:
    text: str
    label: str
    normalized: str
    confidence: float
    start: int
    end: int


# biomedical-ner-all emits its own label set; the pipeline expects the fallback's labels.
MODEL_LABEL_MAP: dict[str, str] = {
    "Sign_symptom": "SYMPTOM",
    "Disease_disorder": "SYMPTOM",
    "Biological_structure": "BODY_PART",
    "Medication": "MEDICATION",
    "Duration": "DURATION",
    "Date": "DURATION",
}

# Descriptor labels (e.g. "red" tagged as Color) only count as symptoms for known skin terms.
DESCRIPTOR_LABELS = {"Color", "Texture", "Detailed_description", "Shape", "Severity"}
SKIN_DESCRIPTOR_TERMS = {
    "itching", "redness", "burning", "dryness", "scaling", "flaking", "swelling",
    "skin_peeling", "blister", "crusty", "crusting", "rough", "bumpy",
}


def _map_model_label(model_label: str, normalized: str) -> str:
    if model_label in MODEL_LABEL_MAP:
        return MODEL_LABEL_MAP[model_label]
    if model_label in DESCRIPTOR_LABELS and normalized in SKIN_DESCRIPTOR_TERMS:
        return "SYMPTOM"
    return model_label


def _fallback_entities(text: str) -> list[Entity]:
    keyword_map = {
        "SYMPTOM": [
            "itch", "itchy", "itching", "rash", "red", "redness", "pain", "swelling", "swollen", "burning",
            "blister", "blisters", "peeling", "acne", "scaly", "flaky", "flaking", "bumps",
            # Roman-Urdu / Hindi terms (canonicalised in nlp_normalization_service)
            "khujli", "kharish", "jalan", "dard", "soojan", "sujan", "daane", "khushk", "laal",
        ],
        "BODY_PART": [
            "face", "cheek", "forehead", "chin", "neck", "arm", "leg", "back", "chest", "scalp", "lip", "lips",
            "eye", "hand", "hands", "foot", "feet", "elbow", "knee", "nose",
        ],
        "MEDICATION": ["cream", "ointment", "steroid", "retinoid", "antibiotic", "moisturizer", "cleanser"],
        "ALLERGY": ["allergy", "allergic", "allergic to", "reaction to"],
    }
    lowered = (text or "").lower()
    results: list[Entity] = []
    for label, keywords in keyword_map.items():
        for keyword in keywords:
            for match in re.finditer(rf"\b{re.escape(keyword)}\b", lowered):
                value = text[match.start():match.end()] if text else keyword
                results.append(
                    Entity(
                        text=value,
                        label=label,
                        normalized=canonicalize_entity(keyword),
                        confidence=0.62,
                        start=match.start(),
                        end=match.end(),
                    )
                )
    return results


@lru_cache(maxsize=1)
def _get_ner_pipeline():
    model_name = settings.NLP_ENTITY_MODEL
    if not model_name:
        return None

    from transformers import AutoTokenizer, pipeline  # type: ignore

    tokenizer = AutoTokenizer.from_pretrained(model_name)
    # "first" aggregates sub-word pieces into whole words ("it" + "##chy" -> "itchy").
    return pipeline(
        "token-classification",
        model=model_name,
        tokenizer=tokenizer,
        aggregation_strategy="first",
    )


def warmup_entity_ner_pipeline() -> None:
    """Loads the cached NER model once (e.g. at app startup when enabled)."""
    if settings.NLP_ENTITY_MODEL:
        _get_ner_pipeline()


def _truncate_for_model(ner, text: str) -> str:
    # The token-classification pipeline does not accept truncation kwargs, so cut the text
    # at the last character that fits in the configured token budget.
    max_length = max(8, int(settings.NLP_ENTITY_MAX_LENGTH))
    tokenizer_max = getattr(ner.tokenizer, "model_max_length", None)
    if isinstance(tokenizer_max, int) and 0 < tokenizer_max < 1_000_000:
        max_length = min(max_length, tokenizer_max)
    limit = max_length - 2  # room for [CLS] / [SEP]

    try:
        offsets = ner.tokenizer(text, add_special_tokens=False, return_offsets_mapping=True)["offset_mapping"]
    except Exception:
        return text[: limit * 4]
    if len(offsets) <= limit:
        return text
    return text[: offsets[limit - 1][1]]


def _model_entities(text: str) -> list[dict[str, Any]] | None:
    """Returns transformer entities, or None when the model is unavailable or fails."""
    if not settings.NLP_ENTITY_MODEL:
        return None
    try:
        ner = _get_ner_pipeline()
        if ner is None:
            return None
        model_text = _truncate_for_model(ner, text)
        entities = []
        for row in ner(model_text):
            start, end = int(row.get("start", 0)), int(row.get("end", 0))
            # Take the span from the original text; the model's "word" field is lower-cased word pieces.
            span = model_text[start:end].strip(" .,;:!?()[]\"'") if end > start else str(row.get("word", "")).strip()
            if not span:
                continue
            normalized = canonicalize_entity(span)
            entities.append(
                {
                    "text": span,
                    "label": _map_model_label(str(row.get("entity_group", "ENTITY")), normalized),
                    "normalized": normalized,
                    "confidence": float(row.get("score", 0.55)),
                    "start": start,
                    "end": end,
                    "source": "model",
                }
            )
        return entities
    except Exception as exc:
        logger.warning("Transformer NER unavailable, using fallback extractor: %s", exc)
        return None


def extract_medical_entities_with_source(text: str) -> tuple[list[dict[str, Any]], bool]:
    """
    Runs transformer NER (if configured) and always merges the deterministic keyword
    entities, so results never contain fewer terms than the fallback alone.
    Returns (entities, model_used).
    """
    if not (text or "").strip():
        return [], False

    model_entities = _model_entities(text)
    fallback = [
        {
            "text": entity.text,
            "label": entity.label,
            "normalized": entity.normalized,
            "confidence": entity.confidence,
            "start": entity.start,
            "end": entity.end,
            "source": "rules",
        }
        for entity in _fallback_entities(text)
    ]

    merged = list(model_entities or [])
    seen = {(entity["label"], entity["normalized"]) for entity in merged}
    for entity in fallback:
        key = (entity["label"], entity["normalized"])
        if key not in seen:
            seen.add(key)
            merged.append(entity)
    merged.sort(key=lambda entity: entity["start"])
    return merged, model_entities is not None


def extract_medical_entities(text: str) -> list[dict[str, Any]]:
    return extract_medical_entities_with_source(text)[0]
