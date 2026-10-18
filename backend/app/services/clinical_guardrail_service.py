from __future__ import annotations


def detect_unsafe_treatment_claims(text: str) -> bool:
    lowered = (text or "").lower()
    unsafe_patterns = [
        "guaranteed cure",
        "definitive diagnosis",
        "ignore medical advice",
        "no need to see a doctor",
    ]
    return any(pattern in lowered for pattern in unsafe_patterns)


def sanitize_guardrail_violations(summary: str) -> str:
    if detect_unsafe_treatment_claims(summary):
        return (
            "This assessment is educational support and not a definitive diagnosis. "
            "Please seek licensed medical evaluation for confirmation and treatment decisions."
        )
    return summary
