from __future__ import annotations

from typing import Any

from app.services.nlp_classification_service import classify_severity, classify_urgency
from app.services.nlp_entities_service import extract_medical_entities_with_source
from app.services.nlp_negation_service import detect_negated_terms
from app.services.nlp_normalization_service import deduplicate_canonical

URGENCY_FOLLOWUP = "Any fever, discharge, bleeding, or breathing symptoms right now?"


def _extract_duration(text: str) -> str | None:
    import re

    lowered = (text or "").lower()
    patterns = [
        r"(\d+)\s*(days?)\b",
        r"(\d+)\s*(weeks?)\b",
        r"(\d+)\s*(months?)\b",
        r"(\d+)\s*(years?)\b",
    ]
    for pattern in patterns:
        match = re.search(pattern, lowered)
        if match:
            return f"{match.group(1)} {match.group(2)}"
    return None


def run_nlp_pipeline(
    *,
    symptoms_text: str,
    medical_history: str | None,
    supplied_duration: str | None,
    supplied_severity: str | None,
    risk_level: str,
    red_flags: list[str],
    conversation_turns: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    merged = " ".join([symptoms_text or "", medical_history or ""]).strip()
    entities, model_used = extract_medical_entities_with_source(merged)

    symptom_terms = [
        entity["text"]
        for entity in entities
        if str(entity.get("label", "")).upper() in {"SYMPTOM", "ENTITY"}
    ]
    negated = detect_negated_terms(merged, symptom_terms)

    extracted_symptoms = deduplicate_canonical(
        [
            str(entity.get("normalized") or entity.get("text") or "")
            for entity in entities
            if str(entity.get("label", "")).upper() in {"SYMPTOM", "ENTITY"}
            and str(entity.get("text") or "").lower() not in {n.lower() for n in negated}
        ]
    )

    severity = classify_severity(merged, extracted_symptoms)
    urgency = classify_urgency(merged, red_flags, risk_level)

    final_severity = (supplied_severity or "").strip().lower() or severity.label
    model_duration = next((e["text"] for e in entities if e["label"] == "DURATION"), None)
    extracted_duration = supplied_duration or _extract_duration(merged) or model_duration

    followup_candidates: list[str] = []
    if not extracted_duration:
        followup_candidates.append("How long has this been present and is it getting worse?")
    if not any(e["label"] == "BODY_PART" for e in entities):
        followup_candidates.append("Which exact body area is affected?")
    if urgency.label in {"high", "moderate"}:
        followup_candidates.append(URGENCY_FOLLOWUP)

    return {
        "extracted_symptoms": extracted_symptoms,
        "symptom_keyword_hits": {
            symptom: [symptom] for symptom in extracted_symptoms
        },
        "clinical_entities": entities,
        "negated_entities": sorted(list(negated)),
        "extracted_duration": extracted_duration,
        "inferred_severity": final_severity if final_severity else "unknown",
        "severity_rationale": severity.rationale,
        "severity_confidence": round(severity.confidence, 3),
        "urgency_class": urgency.label,
        "urgency_confidence": round(urgency.confidence, 3),
        "urgency_rationale": urgency.rationale,
        "followup_candidates": followup_candidates,
        "conversation_turn_count": len(conversation_turns or []),
        "nlp_model_version": "biomedical-ner+rules-v2" if model_used else "rule-fallback-v2",
    }


def refresh_urgency(
    nlp_result: dict[str, Any],
    *,
    text: str,
    red_flags: list[str],
    risk_level: str,
) -> dict[str, Any]:
    """Re-classifies urgency once the final risk level is known (NLP runs before risk)."""
    urgency = classify_urgency(text, red_flags, risk_level)
    followups = [q for q in nlp_result.get("followup_candidates") or [] if q != URGENCY_FOLLOWUP]
    if urgency.label in {"high", "moderate"}:
        followups.append(URGENCY_FOLLOWUP)
    nlp_result.update(
        {
            "urgency_class": urgency.label,
            "urgency_confidence": round(urgency.confidence, 3),
            "urgency_rationale": urgency.rationale,
            "followup_candidates": followups,
        }
    )
    return nlp_result
