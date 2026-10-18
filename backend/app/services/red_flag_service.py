import re


RED_FLAG_RULES = {
    "rapidly_spreading": [
        "rapidly spreading",
        "spreading fast",
        "spreading quickly",
        "spread very fast",
    ],
    "fever_with_skin_issue": [
        "fever",
        "high temperature",
        "chills",
    ],
    "severe_pain": [
        "severe pain",
        "very painful",
        "unbearable pain",
        "extreme pain",
    ],
    "pus_or_infection": [
        "pus",
        "oozing",
        "yellow discharge",
        "green discharge",
        "infected",
    ],
    "bleeding_lesion": [
        "bleeding mole",
        "bleeding spot",
        "bleeding lesion",
        "bleeding skin",
    ],
    "changing_mole": [
        "changing mole",
        "mole changed",
        "irregular mole",
        "mole getting bigger",
        "mole changing color",
    ],
    "breathing_or_face_swelling": [
        "difficulty breathing",
        "shortness of breath",
        "swollen face",
        "face swelling",
        "swollen lips",
        "lip swelling",
    ],
    "open_wound": [
        "open wound",
        "deep wound",
        "skin ulcer",
        "ulcer",
    ],
}


HIGH_RISK_DISEASES = {
    "Skin Cancer",
    "Melanoma Warning Sign",
}


MODERATE_RISK_DISEASES = {
    "Eczema",
    "Psoriasis",
    "Rosacea",
    "Bullous",
    "Drug Eruption",
    "Vasculitis",
    "Lupus",
    "Tinea",
    "Candidiasis",
}


# A red-flag keyword is ignored only when the user explicitly denies it ("no fever", "not spreading quickly").
NEGATION_CUES = {"no", "not", "without", "never", "denies", "denied", "none", "dont", "doesnt", "didnt", "isnt"}
NEGATION_WINDOW_WORDS = 3
# Negation does not carry across sentence punctuation, commas or contrast words ("no pain, fever" / "no pain but fever").
NEGATION_SCOPE_BREAK = re.compile(r"[.;:!?,\n]|\b(?:but|however|although|though|except|yet)\b")


def _is_negated(text: str, keyword_start: int) -> bool:
    clause = NEGATION_SCOPE_BREAK.split(text[:keyword_start].replace("’", "'"))[-1]
    words = re.findall(r"[a-z]+(?:'[a-z]+)?", clause)[-NEGATION_WINDOW_WORDS:]
    return any(word in NEGATION_CUES or word.endswith("n't") for word in words)


def _mentions_without_negation(text: str, keyword: str) -> bool:
    start = text.find(keyword)
    while start != -1:
        if not _is_negated(text, start):
            return True
        start = text.find(keyword, start + 1)
    return False


def detect_red_flags(
    symptoms_text: str,
    medical_history: str | None = None
) -> list[str]:
    combined_text = " ".join(
        [symptoms_text or "", medical_history or ""]
    ).strip().lower()

    found_flags = []

    for flag_name, keywords in RED_FLAG_RULES.items():
        for keyword in keywords:
            if _mentions_without_negation(combined_text, keyword):
                found_flags.append(flag_name)
                break

    return sorted(list(set(found_flags)))


def calculate_risk_level(
    predicted_disease: str,
    disease_confidence: float,
    red_flags: list[str],
    inferred_severity: str | None
) -> str:
    if red_flags:
        return "High"

    if predicted_disease in HIGH_RISK_DISEASES:
        return "High"

    if inferred_severity == "severe":
        return "High"

    if predicted_disease in MODERATE_RISK_DISEASES:
        if disease_confidence >= 0.50:
            return "Moderate"

    if inferred_severity == "moderate":
        return "Moderate"

    if disease_confidence < 0.50:
        return "Uncertain"

    return "Low to Moderate"


def build_global_skin_safety_note() -> str:
    """
    Inclusive safety guidance across diverse skin types and tones.
    """
    return (
        " Avoid using steroid-mixed creams or over-the-counter combination creams without proper medical guidance, "
        "as they can worsen skin conditions and cause long-term damage. "
        "Avoid unverified bleaching/lightening products, as they may irritate skin and lead to pigmentation issues. "
        "On melanin-rich skin, irritation or inflammation may lead to dark marks (post-inflammatory hyperpigmentation), "
        "so avoid aggressive treatments and harsh products."
    )


def generate_doctor_warning(
    risk_level: str,
    red_flags: list[str],
    predicted_disease: str
) -> str:
    if risk_level == "High":
        return (
            "Some symptoms or prediction results may require urgent medical attention. "
            "Please consult a dermatologist or qualified doctor as soon as possible."
            + build_global_skin_safety_note()
        )

    if risk_level == "Moderate":
        return (
            "Please monitor the condition carefully. Consult a dermatologist if symptoms persist, "
            "spread, become painful, or do not improve."
            + build_global_skin_safety_note()
        )

    if risk_level == "Uncertain":
        return (
            "The prediction confidence is low or uncertain. Please upload a clearer image or consult "
            "a dermatologist for proper evaluation."
            + build_global_skin_safety_note()
        )

    return (
        "This result is AI-based support only. Consult a dermatologist if symptoms worsen, spread, "
        "become painful, or persist."
        + build_global_skin_safety_note()
    )