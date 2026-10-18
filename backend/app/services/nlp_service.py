import re

from app.services.nlp_pipeline import run_nlp_pipeline

SYMPTOM_KEYWORDS = {
    "itching": ["itch", "itchy", "itching", "khujli"],
    "redness": ["red", "redness", "reddish", "laal", "lal"],
    "burning": ["burn", "burning", "jalan"],
    "pain": ["pain", "painful", "sore", "tender", "dard"],
    "swelling": ["swelling", "swollen", "soojan"],
    "rash": ["rash", "rashes", "danay", "daane"],
    "dryness": ["dry", "dryness", "flaky", "flaking", "rough", "khushk"],
    "scaling": ["scales", "scaling", "scaly", "peeling"],
    "pimples": ["pimple", "pimples", "acne", "breakout", "breakouts", "spots"],
    "pus": ["pus", "oozing", "discharge", "yellow fluid"],
    "bleeding": ["bleeding", "bleed", "blood"],
    "dark_spot": [
        "dark spot",
        "dark spots",
        "black spot",
        "black spots",
        "pigmentation",
        "hyperpigmentation",
        "dark marks",
        "acne marks",
    ],
    "white_patch": ["white patch", "white patches", "depigmentation"],
    "mole_change": [
        "changing mole",
        "mole changed",
        "changed mole",
        "irregular mole",
        "mole getting bigger",
        "mole changing color",
    ],
    "skin_peeling": ["skin peeling", "peeling skin", "skin is peeling"],
    "blister": ["blister", "blisters", "fluid filled"],
    "sun_sensitivity": ["sunburn", "sun burn", "sun sensitivity", "sun damage"],
}


DURATION_PATTERNS = [
    r"(\d+)\s*(day|days)",
    r"(\d+)\s*(week|weeks)",
    r"(\d+)\s*(month|months)",
    r"(\d+)\s*(year|years)",
]


SEVERE_WORDS = [
    "severe",
    "very painful",
    "unbearable",
    "extreme",
    "spreading fast",
    "spreading quickly",
    "rapidly spreading",
    "worse quickly",
    "getting worse quickly",
    "high fever",
    "difficulty breathing",
    "swollen face",
    "swollen lips",
    "bleeding mole",
    "skin peeling",
]

MODERATE_WORDS = [
    "moderate",
    "painful",
    "burning",
    "swollen",
    "spreading",
    "getting worse",
    "oozing",
    "discharge",
    "pus",
]

MILD_WORDS = [
    "mild",
    "slight",
    "little",
    "minor",
    "not much",
    "small",
]


def normalize_text(text: str | None) -> str:
    if not text:
        return ""

    return text.strip().lower()


def contains_keyword(text: str, keyword: str) -> bool:
    """
    Uses word-boundary matching for single words and normal substring matching for phrases.
    This reduces false matches, e.g. 'red' inside unrelated words.
    """
    keyword = keyword.strip().lower()

    if not keyword:
        return False

    if " " in keyword:
        return keyword in text

    return re.search(rf"\b{re.escape(keyword)}\b", text) is not None


def extract_symptoms(text: str) -> list[str]:
    normalized = normalize_text(text)
    found_symptoms = []

    for symptom, keywords in SYMPTOM_KEYWORDS.items():
        for keyword in keywords:
            if contains_keyword(normalized, keyword):
                found_symptoms.append(symptom)
                break

    return sorted(list(set(found_symptoms)))


def extract_symptom_keyword_hits(text: str) -> dict[str, list[str]]:
    normalized = normalize_text(text)
    hits: dict[str, list[str]] = {}
    for symptom, keywords in SYMPTOM_KEYWORDS.items():
        matched = [keyword for keyword in keywords if contains_keyword(normalized, keyword)]
        if matched:
            hits[symptom] = sorted(list(set(matched)))
    return hits


def extract_duration_from_text(text: str) -> str | None:
    normalized = normalize_text(text)

    for pattern in DURATION_PATTERNS:
        match = re.search(pattern, normalized)
        if match:
            return f"{match.group(1)} {match.group(2)}"

    relative_durations = {
        "today": "today",
        "since morning": "since morning",
        "since yesterday": "since yesterday",
        "yesterday": "1 day",
        "few days": "few days",
        "couple of days": "few days",
        "few weeks": "few weeks",
        "couple of weeks": "few weeks",
        "long time": "long time",
        "many months": "many months",
        "for months": "months",
        "for years": "years",
    }

    for phrase, duration in relative_durations.items():
        if phrase in normalized:
            return duration

    return None


def infer_severity_from_text(text: str) -> str | None:
    normalized = normalize_text(text)

    for word in SEVERE_WORDS:
        if word in normalized:
            return "severe"

    for word in MODERATE_WORDS:
        if word in normalized:
            return "moderate"

    for word in MILD_WORDS:
        if word in normalized:
            return "mild"

    return None


def infer_severity_from_symptoms(extracted_symptoms: list[str]) -> str | None:
    severe_symptoms = {
        "bleeding",
        "mole_change",
        "skin_peeling",
        "blister",
    }

    moderate_symptoms = {
        "pus",
        "swelling",
        "pain",
        "burning",
        "rash",
    }

    if any(symptom in severe_symptoms for symptom in extracted_symptoms):
        return "severe"

    if any(symptom in moderate_symptoms for symptom in extracted_symptoms):
        return "moderate"

    if extracted_symptoms:
        return "mild"

    return None


def normalize_severity_input(severity_input: str | None) -> str | None:
    normalized = normalize_text(severity_input)

    if normalized in {"mild", "moderate", "severe", "unknown"}:
        return normalized

    return None


def analyze_symptom_text(
    symptoms_text: str,
    duration_input: str | None = None,
    severity_input: str | None = None,
    medical_history: str | None = None,
    risk_level: str = "Uncertain",
    red_flags: list[str] | None = None,
    conversation_turns: list[dict] | None = None,
) -> dict:
    # Try modern pipeline first; fallback to legacy rule-based logic on failure.
    try:
        return run_nlp_pipeline(
            symptoms_text=symptoms_text,
            medical_history=medical_history,
            supplied_duration=duration_input,
            supplied_severity=severity_input,
            risk_level=risk_level,
            red_flags=red_flags or [],
            conversation_turns=conversation_turns,
        )
    except Exception:
        combined_text = " ".join(
            [
                symptoms_text or "",
                medical_history or "",
            ]
        )

        extracted_symptoms = extract_symptoms(combined_text)
        symptom_keyword_hits = extract_symptom_keyword_hits(combined_text)

        extracted_duration = duration_input or extract_duration_from_text(combined_text)

        inferred_severity = (
            normalize_severity_input(severity_input)
            or infer_severity_from_text(combined_text)
            or infer_severity_from_symptoms(extracted_symptoms)
            or "unknown"
        )

        severity_rationale = "No strong severity terms detected."
        if inferred_severity == "severe":
            severity_rationale = "Severe-level wording or high-risk symptom patterns were detected in the provided text."
        elif inferred_severity == "moderate":
            severity_rationale = "Moderate severity indicators were detected in symptom wording."
        elif inferred_severity == "mild":
            severity_rationale = "Symptoms were detected but without strong severe-warning language."

        return {
            "extracted_symptoms": extracted_symptoms,
            "symptom_keyword_hits": symptom_keyword_hits,
            "clinical_entities": [],
            "negated_entities": [],
            "extracted_duration": extracted_duration,
            "inferred_severity": inferred_severity,
            "severity_rationale": severity_rationale,
            "severity_confidence": 0.55,
            "urgency_class": "unknown",
            "urgency_confidence": 0.5,
            "urgency_rationale": "Legacy rule fallback result.",
            "followup_candidates": [],
            "conversation_turn_count": len(conversation_turns or []),
            "nlp_model_version": "rule-fallback-v1",
        }