import json
from functools import lru_cache
from pathlib import Path
from typing import Any


REQUIRED_FIELDS = {
    "condition_name",
    "model_class",
    "aliases",
    "category",
    "brief_overview",
    "common_signs",
    "common_triggers_or_causes",
    "general_care_guidance",
    "otc_support_guidance",
    "what_to_avoid",
    "red_flags",
    "when_to_seek_doctor",
    "professional_note",
    "source_names",
    "source_urls",
}


def get_knowledge_file_path() -> Path:
    current_file = Path(__file__).resolve()

    app_dir = current_file.parent.parent

    return app_dir / "rag_knowledge" / "condition_knowledge.json"


def validate_condition_entry(entry: dict[str, Any], index: int) -> None:
    missing_fields = REQUIRED_FIELDS - set(entry.keys())

    if missing_fields:
        raise ValueError(
            f"Knowledge entry at index {index} is missing fields: {sorted(missing_fields)}"
        )

    list_fields = [
        "aliases",
        "common_signs",
        "common_triggers_or_causes",
        "general_care_guidance",
        "otc_support_guidance",
        "what_to_avoid",
        "red_flags",
        "source_names",
        "source_urls",
    ]

    for field in list_fields:
        if not isinstance(entry[field], list):
            raise ValueError(
                f"Knowledge entry '{entry.get('condition_name')}' field '{field}' must be a list."
            )

    text_fields = [
        "condition_name",
        "model_class",
        "category",
        "brief_overview",
        "when_to_seek_doctor",
        "professional_note",
    ]

    for field in text_fields:
        if not isinstance(entry[field], str) or not entry[field].strip():
            raise ValueError(
                f"Knowledge entry '{entry.get('condition_name')}' field '{field}' must be a non-empty string."
            )


@lru_cache(maxsize=1)
def load_condition_knowledge() -> list[dict[str, Any]]:
    knowledge_path = get_knowledge_file_path()

    if not knowledge_path.exists():
        raise FileNotFoundError(
            f"RAG knowledge file not found at: {knowledge_path}"
        )

    with knowledge_path.open("r", encoding="utf-8") as file:
        knowledge_data = json.load(file)

    if not isinstance(knowledge_data, list):
        raise ValueError("RAG knowledge file must contain a list of condition entries.")

    for index, entry in enumerate(knowledge_data):
        if not isinstance(entry, dict):
            raise ValueError(f"Knowledge entry at index {index} must be an object.")

        validate_condition_entry(entry, index)

    return knowledge_data


def get_condition_by_model_class(model_class: str) -> dict[str, Any] | None:
    normalized_target = model_class.strip().lower()

    for entry in load_condition_knowledge():
        if entry["model_class"].strip().lower() == normalized_target:
            return entry

    return None