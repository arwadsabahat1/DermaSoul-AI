from __future__ import annotations

from typing import Any


def validate_llm_response(payload: dict[str, Any]) -> dict[str, Any]:
    """
    Sanitizes and enforces expected contract for LLM outputs.
    """
    result = dict(payload)
    required_list_fields = ["differential_notes", "next_steps", "followup_questions", "citations"]
    for field in required_list_fields:
        if not isinstance(result.get(field), list):
            result[field] = []

    if not isinstance(result.get("summary"), str) or not result["summary"].strip():
        result["summary"] = "Unable to synthesize a complete summary from current context."
    if not isinstance(result.get("confidence_statement"), str):
        result["confidence_statement"] = "Confidence statement unavailable."

    if not isinstance(result.get("generation_mode"), str):
        result["generation_mode"] = "unknown"

    return result
