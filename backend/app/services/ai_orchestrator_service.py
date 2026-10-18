from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.services.clinical_guardrail_service import sanitize_guardrail_violations
from app.services.llm_response_validator import validate_llm_response
from app.services.safety_policy_service import enforce_safety_policy


def _deterministic_consultation_narrative(base_state: dict[str, Any]) -> dict[str, Any]:
    """Structured narrative assembled from deterministic fields (no conversational LLM)."""
    retrieval_trace = list(base_state.get("retrieval_trace") or [])
    top_sources: list[dict[str, Any]] = []
    for item in retrieval_trace[:5]:
        if not isinstance(item, dict):
            continue
        raw_score = item.get("rerank_score", item.get("retrieval_score", 0.0))
        try:
            score = float(raw_score if raw_score is not None else 0.0)
        except (TypeError, ValueError):
            score = 0.0
        top_sources.append(
            {
                "title": item.get("title"),
                "source_type": item.get("source_type"),
                "score": score,
            }
        )

    predicted = base_state.get("predicted_disease", "your skin concern")
    risk = base_state.get("risk_level", "Uncertain")

    summary = base_state.get("assessment_summary")
    if not isinstance(summary, str) or not summary.strip():
        summary = (
            f"The classifier highlights {predicted} with contextual risk summarized as {risk}. "
            "Image-based systems are probabilistic and should not substitute an in‑person dermatology visit."
        )

    differential_notes = [
        "Similar-looking conditions can resemble one another under different lighting and skin tones.",
        "Medications, recent products, travel, and systemic symptoms are not fully captured in a photo alone.",
    ]

    next_steps: list[str] = []
    gc = base_state.get("general_care_guidance")
    if isinstance(gc, list) and gc:
        next_steps = [str(x) for x in gc[:8] if x is not None]
    if not next_steps:
        next_steps = [
            "Use a gentle cleanser and moisturizer appropriate for your skin type unless your clinician advised otherwise.",
            "Protect skin from harsh sun and irritants; avoid picking or traumatizing lesions.",
        ]
    when = base_state.get("when_to_seek_doctor")
    if isinstance(when, str) and when.strip():
        next_steps.append(when.strip())

    followups = [
        str(x) for x in (base_state.get("followup_candidates") or []) if isinstance(x, str)
    ]

    return {
        "summary": summary,
        "differential_notes": differential_notes,
        "next_steps": next_steps,
        "followup_questions": followups,
        "confidence_statement": (
            "This narrative is generated from structured rules and your consultation context; "
            "no conversational language model is used."
        ),
        "citations": top_sources,
        "generation_mode": "deterministic_rules",
    }


def generate_consultation_narrative(
    *,
    db: Session | None = None,
    base_state: dict[str, Any],
) -> dict[str, Any]:
    _ = db  # Kept for call-site compatibility; unused after LLM removal.
    raw = _deterministic_consultation_narrative(base_state)
    validated = validate_llm_response(raw)
    safe = enforce_safety_policy(
        llm_payload=validated,
        risk_level=str(base_state.get("risk_level", "")),
        red_flags=list(base_state.get("red_flags") or []),
        doctor_warning=str(base_state.get("doctor_warning", "")),
    )
    safe["summary"] = sanitize_guardrail_violations(str(safe.get("summary", "")))
    return safe
