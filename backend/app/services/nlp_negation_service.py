from __future__ import annotations

import re

NEGATION_CUES = {
    "no",
    "not",
    "without",
    "denies",
    "never",
}


def detect_negated_terms(text: str, terms: list[str]) -> set[str]:
    lowered = (text or "").lower()
    negated: set[str] = set()
    for term in terms:
        escaped = re.escape(term.lower())
        # Capture compact local negation windows, e.g., "no pain", "not itchy".
        pattern = rf"\b(?:no|not|without|denies|never)\b[\w\s,]{{0,20}}\b{escaped}\b"
        if re.search(pattern, lowered):
            negated.add(term)
    return negated
