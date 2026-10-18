from __future__ import annotations

from dataclasses import dataclass


@dataclass
class ClassificationResult:
    label: str
    confidence: float
    rationale: str


SEVERE_TERMS = {
    "unbearable",
    "severe pain",
    "difficulty breathing",
    "rapidly spreading",
    "bleeding",
    "high fever",
}
MODERATE_TERMS = {
    "painful",
    "burning",
    "swelling",
    "pus",
    "oozing",
    "moderate",
}

URGENT_TERMS = {
    "difficulty breathing",
    "face swelling",
    "lip swelling",
    "high fever",
    "rapidly spreading",
    "bleeding",
}


def classify_severity(text: str, extracted_symptoms: list[str]) -> ClassificationResult:
    lowered = (text or "").lower()
    if any(term in lowered for term in SEVERE_TERMS):
        return ClassificationResult("severe", 0.88, "Detected severe symptom phrases in narrative.")
    if any(term in lowered for term in MODERATE_TERMS) or extracted_symptoms:
        return ClassificationResult("moderate", 0.7, "Detected moderate risk indicators or symptom evidence.")
    return ClassificationResult("unknown", 0.45, "Insufficient signal to infer severity confidently.")


def classify_urgency(text: str, red_flags: list[str], risk_level: str) -> ClassificationResult:
    lowered = (text or "").lower()
    if red_flags or risk_level.lower() == "high" or any(term in lowered for term in URGENT_TERMS):
        return ClassificationResult("high", 0.9, "Red-flag or urgent-risk indicators detected.")
    if risk_level.lower() in {"moderate", "uncertain"}:
        return ClassificationResult("moderate", 0.68, "Follow-up advised due to moderate/uncertain risk profile.")
    return ClassificationResult("low", 0.75, "No urgent narrative or rule-based escalation indicators detected.")
