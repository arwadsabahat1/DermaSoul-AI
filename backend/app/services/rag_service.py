from typing import Any

from app.services.rag_loader_service import (
    get_condition_by_model_class,
    load_condition_knowledge,
)
from app.services.rag_retrieval_service import retrieve_semantic_context
from app.services.rag_rerank_service import rerank_context


def normalize_text(value: str | None) -> str:
    if not value:
        return ""

    return value.strip().lower()


def normalize_list(values: list[str] | None) -> list[str]:
    if not values:
        return []

    return [normalize_text(value) for value in values if value]


def normalize_symptom(value: str | None) -> str:
    # NLP canonical terms use underscores ("pus_or_discharge"); KB signs use spaces.
    return normalize_text(value).replace("_", " ")


# Minimum Path A score for a non-predicted condition to count as related
# (one exact sign match, or two partial matches).
RELATED_MIN_STRUCTURED_SCORE = 8
RELATED_MIN_SEMANTIC_SCORE = 0.6
LOW_DISEASE_CONFIDENCE = 0.5


def calculate_entry_score(
    entry: dict[str, Any],
    predicted_disease: str,
    extracted_symptoms: list[str],
    red_flags: list[str],
    risk_level: str,
) -> int:
    score = 0

    predicted_disease_normalized = normalize_text(predicted_disease)
    risk_level_normalized = normalize_text(risk_level)

    model_class = normalize_text(entry.get("model_class"))
    condition_name = normalize_text(entry.get("condition_name"))
    category = normalize_text(entry.get("category"))

    aliases = normalize_list(entry.get("aliases"))
    common_signs = normalize_list(entry.get("common_signs"))
    triggers = normalize_list(entry.get("common_triggers_or_causes"))
    entry_red_flags = normalize_list(entry.get("red_flags"))

    if model_class == predicted_disease_normalized:
        score += 100

    if condition_name == predicted_disease_normalized:
        score += 80

    if predicted_disease_normalized in aliases:
        score += 60

    for symptom in extracted_symptoms:
        symptom_normalized = normalize_symptom(symptom)
        if not symptom_normalized:
            continue

        if symptom_normalized in common_signs:
            score += 8

        for sign in common_signs:
            if symptom_normalized in sign or sign in symptom_normalized:
                score += 4

        for trigger in triggers:
            if symptom_normalized in trigger or trigger in symptom_normalized:
                score += 2

    for flag in red_flags:
        flag_text = normalize_text(flag).replace("_", " ")

        for entry_flag in entry_red_flags:
            if flag_text in entry_flag or entry_flag in flag_text:
                score += 6

    if risk_level_normalized == "high":
        if category in {
            "cancer_warning",
            "sun_damage_precancerous",
            "reaction",
            "blistering",
            "autoimmune",
            "vascular_inflammatory",
        }:
            score += 3

    return score


def retrieve_relevant_entries(
    predicted_disease: str,
    extracted_symptoms: list[str],
    red_flags: list[str],
    risk_level: str,
    top_k: int = 3,
) -> list[dict[str, Any]]:
    knowledge_entries = load_condition_knowledge()

    scored_entries = []

    for entry in knowledge_entries:
        score = calculate_entry_score(
            entry=entry,
            predicted_disease=predicted_disease,
            extracted_symptoms=extracted_symptoms,
            red_flags=red_flags,
            risk_level=risk_level,
        )

        if score > 0:
            scored_entries.append(
                {
                    **entry,
                    "retrieval_score": score,
                }
            )

    scored_entries.sort(
        key=lambda item: item["retrieval_score"],
        reverse=True,
    )

    return scored_entries[:top_k]


def match_symptoms_to_entry(
    extracted_symptoms: list[str],
    entry: dict[str, Any] | None,
) -> list[str]:
    if not entry:
        return []

    common_signs = normalize_list(entry.get("common_signs"))
    matched = []

    for symptom in extracted_symptoms:
        symptom_normalized = normalize_symptom(symptom)
        if not symptom_normalized:
            continue

        for sign in common_signs:
            if symptom_normalized in sign or sign in symptom_normalized:
                matched.append(symptom)
                break

    return matched


def select_related_conditions(
    primary_entry: dict[str, Any] | None,
    structured_entries: list[dict[str, Any]],
    semantic_hits: list[dict[str, Any]],
    top_n: int = 2,
) -> list[dict[str, Any]]:
    """
    Hybrid ranking of conditions other than the predicted one: Path A symptom/red-flag
    scores plus Path B vector similarity. Returns validated KB entries, never raw chunks.
    """
    primary_class = normalize_text((primary_entry or {}).get("model_class"))
    combined: dict[str, float] = {}

    for entry in structured_entries:
        model_class = normalize_text(entry.get("model_class"))
        score = float(entry.get("retrieval_score", 0))
        if model_class and model_class != primary_class and score >= RELATED_MIN_STRUCTURED_SCORE:
            combined[model_class] = combined.get(model_class, 0.0) + min(score, 40.0) / 40.0

    best_semantic: dict[str, float] = {}
    for hit in semantic_hits:
        model_class = normalize_text((hit.get("metadata") or {}).get("model_class"))
        score = float(hit.get("retrieval_score", 0.0))
        if model_class and model_class != primary_class and score >= RELATED_MIN_SEMANTIC_SCORE:
            best_semantic[model_class] = max(best_semantic.get(model_class, 0.0), score)
    for model_class, score in best_semantic.items():
        combined[model_class] = combined.get(model_class, 0.0) + score

    ranked = sorted(combined.items(), key=lambda item: item[1], reverse=True)

    related = []
    for model_class, _ in ranked:
        entry = get_condition_by_model_class(model_class)
        if entry:
            related.append(entry)
        if len(related) >= top_n:
            break

    return related


def format_percentage(score: float) -> str:
    return f"{round(score * 100, 2)}%"


def format_symptom_text(extracted_symptoms: list[str]) -> str:
    if not extracted_symptoms:
        return "No specific symptom keywords were extracted from the text."

    extracted_symptoms = [symptom.replace("_", " ") for symptom in extracted_symptoms]

    if len(extracted_symptoms) == 1:
        return extracted_symptoms[0]

    if len(extracted_symptoms) == 2:
        return f"{extracted_symptoms[0]} and {extracted_symptoms[1]}"

    return ", ".join(extracted_symptoms[:-1]) + f", and {extracted_symptoms[-1]}"


def merge_unique_lists(*lists: list[str]) -> list[str]:
    seen = set()
    merged = []

    for values in lists:
        for value in values:
            cleaned = value.strip()

            if not cleaned:
                continue

            key = cleaned.lower()

            if key not in seen:
                seen.add(key)
                merged.append(cleaned)

    return merged


def build_melanin_adjustment_context(
    predicted_disease: str,
    skin_tone: str | None = None,
    fitzpatrick_type: str | None = None,
    ethnicity_region: str | None = None,
) -> str:
    if not skin_tone and not fitzpatrick_type and not ethnicity_region:
        return ""

    tone = normalize_text(skin_tone)
    fitzpatrick = (fitzpatrick_type or "").strip().upper()
    region = ethnicity_region or "different"

    note = (
        f"For {region} skin tones, {predicted_disease} may appear differently. "
        "Redness may be less visible, inflammation may look brown, grey, purple, or darker, "
        "and pigmentation changes may be more noticeable."
    )

    if (
        "brown" in tone
        or "deep" in tone
        or "medium" in tone
        or fitzpatrick in {"III", "IV", "V", "VI"}
    ):
        note += (
            " Post-inflammatory hyperpigmentation can occur after acne, irritation, scratching, "
            "or harsh product use, so dark marks should be monitored along with itching, pain, scaling, and spreading."
        )

    return note


def build_melanin_care_guidance(
    skin_tone: str | None = None,
    fitzpatrick_type: str | None = None,
    ethnicity_region: str | None = None,
) -> list[str]:
    if not skin_tone and not fitzpatrick_type and not ethnicity_region:
        return []

    return [
        "Consider pigmentation risk: inflammation or acne may leave dark marks on melanin-rich skin.",
        "Use daily broad-spectrum sunscreen, especially when treating acne marks, hyperpigmentation, melasma, or sun-related damage.",
        "Avoid harsh bleaching creams, steroid-mixed creams, strong scrubs, and unknown local products unless prescribed by a clinician.",
        "Do not judge severity by redness alone; also monitor pain, itching, swelling, scaling, spreading, discharge, or color darkening.",
    ]


def build_assessment_summary(
    predicted_disease: str,
    disease_confidence: float,
    disease_confidence_level: str,
    predicted_skin_type: str,
    skin_type_confidence: float,
    skin_type_confidence_level: str,
    extracted_symptoms: list[str],
    risk_level: str,
) -> str:
    symptom_text = format_symptom_text(extracted_symptoms)

    return (
        f"The image model suggests {predicted_disease} with "
        f"{disease_confidence_level} confidence ({format_percentage(disease_confidence)}). "
        f"The predicted skin type is {predicted_skin_type} with "
        f"{skin_type_confidence_level} confidence ({format_percentage(skin_type_confidence)}). "
        f"The reported symptom context includes {symptom_text}. "
        f"The current risk level is classified as {risk_level}."
    )


def build_symptom_context(
    predicted_disease: str,
    extracted_symptoms: list[str],
    condition_knowledge: dict[str, Any] | None,
    related_conditions: list[dict[str, Any]] | None = None,
) -> str:
    if not extracted_symptoms:
        return (
            "The symptom text did not contain clear recognizable symptom keywords. "
            "The assessment therefore relies more heavily on the image model and user-provided form fields."
        )

    related_note = ""
    if related_conditions:
        names = [entry["condition_name"] for entry in related_conditions]
        related_note = (
            f" The described symptoms also resemble {format_symptom_text(names)}, "
            "so these are worth discussing with a clinician."
        )

    if not condition_knowledge:
        return (
            f"The extracted symptoms were {format_symptom_text(extracted_symptoms)}. "
            f"They are considered as supporting context, but the system does not have a detailed knowledge profile for {predicted_disease}."
        ) + related_note

    matched_symptoms = match_symptoms_to_entry(extracted_symptoms, condition_knowledge)

    if matched_symptoms:
        return (
            f"The extracted symptoms ({format_symptom_text(matched_symptoms)}) overlap with common signs "
            f"listed for {condition_knowledge['condition_name']}. However, this overlap is not enough to confirm a diagnosis."
        ) + related_note

    return (
        f"The extracted symptoms were {format_symptom_text(extracted_symptoms)}. "
        f"They provide useful context, but they do not strongly match the common signs listed for {condition_knowledge['condition_name']}."
    ) + related_note


def build_skin_type_context(
    predicted_skin_type: str,
    skin_type_confidence: float,
) -> str:
    skin_type = normalize_text(predicted_skin_type)

    if skin_type == "dry":
        return (
            "The predicted dry skin type suggests the user may benefit from barrier-supportive, fragrance-free, "
            "non-irritating skincare. Harsh cleansers, hot water, and over-exfoliation may worsen dryness or irritation."
        )

    if skin_type == "oily":
        return (
            "The predicted oily skin type suggests the user may benefit from lightweight, non-comedogenic products "
            "and gentle oil control without over-drying the skin."
        )

    if skin_type == "normal":
        return (
            "The predicted normal skin type suggests the user may tolerate basic gentle skincare, but product choices "
            "should still consider symptoms, allergies, and the predicted condition."
        )

    return (
        f"The predicted skin type is {predicted_skin_type} with confidence {format_percentage(skin_type_confidence)}. "
        "Skincare choices should still be made carefully based on symptoms and tolerance."
    )


def build_general_care_guidance(
    primary_entry: dict[str, Any] | None,
    predicted_skin_type: str,
    skin_tone: str | None = None,
    fitzpatrick_type: str | None = None,
    ethnicity_region: str | None = None,
) -> list[str]:
    if primary_entry:
        guidance = primary_entry.get("general_care_guidance", [])
    else:
        guidance = [
            "Use gentle skincare.",
            "Avoid irritating products.",
            "Monitor symptoms carefully.",
        ]

    skin_type = normalize_text(predicted_skin_type)

    skin_type_guidance = []

    if skin_type == "dry":
        skin_type_guidance.append(
            "Prefer fragrance-free moisturizers and avoid harsh cleansers that may worsen dryness."
        )

    if skin_type == "oily":
        skin_type_guidance.append(
            "Prefer lightweight, non-comedogenic products and avoid heavy pore-clogging products."
        )

    if skin_type == "normal":
        skin_type_guidance.append(
            "Maintain a gentle routine and avoid unnecessary harsh active ingredients."
        )

    melanin_guidance = build_melanin_care_guidance(
        skin_tone=skin_tone,
        fitzpatrick_type=fitzpatrick_type,
        ethnicity_region=ethnicity_region,
    )

    return merge_unique_lists(guidance, skin_type_guidance, melanin_guidance)


def build_otc_support_guidance(
    primary_entry: dict[str, Any] | None,
) -> list[str]:
    if not primary_entry:
        return [
            "Use only basic supportive skincare unless a clinician confirms the condition.",
            "Avoid using strong medicated products without a clear diagnosis.",
        ]

    return merge_unique_lists(primary_entry.get("otc_support_guidance", []))


def build_what_to_avoid(
    primary_entry: dict[str, Any] | None,
    skin_tone: str | None = None,
    fitzpatrick_type: str | None = None,
    ethnicity_region: str | None = None,
) -> list[str]:
    if not primary_entry:
        avoid_list = [
            "Avoid harsh scrubs.",
            "Avoid self-diagnosis.",
            "Avoid using strong treatments without professional guidance.",
        ]
    else:
        avoid_list = primary_entry.get("what_to_avoid", [])

    melanin_avoidance = []

    if skin_tone or fitzpatrick_type or ethnicity_region:
        melanin_avoidance = [
            "Avoid harsh bleaching or whitening creams without dermatologist guidance.",
            "Avoid steroid-mixed combination creams unless prescribed by a qualified clinician.",
            "Avoid aggressive exfoliation because irritation can worsen pigmentation and dark marks.",
        ]

    return merge_unique_lists(avoid_list, melanin_avoidance)


def build_safety_precautions(
    primary_entry: dict[str, Any] | None,
    red_flags: list[str],
    risk_level: str,
    doctor_warning: str,
    related_conditions: list[dict[str, Any]] | None = None,
) -> list[str]:
    precautions = []

    if red_flags:
        precautions.append(
            f"Detected red-flag indicators: {', '.join(red_flags)}."
        )

    if normalize_text(risk_level) == "high":
        precautions.append(
            "Seek urgent medical care for rapidly spreading rash, fever, severe pain, pus, facial/lip swelling, breathing difficulty, skin peeling, or bleeding/changing lesions."
        )

    if primary_entry:
        precautions.extend(primary_entry.get("red_flags", []))

    for entry in related_conditions or []:
        entry_flags = entry.get("red_flags") or []
        if entry_flags:
            precautions.append(
                f"Warning signs for {entry['condition_name']}: {', '.join(entry_flags[:3])}."
            )

    precautions.append(doctor_warning)

    return merge_unique_lists(precautions)


def build_when_to_seek_doctor(
    primary_entry: dict[str, Any] | None,
    risk_level: str,
    doctor_warning: str,
) -> str:
    if normalize_text(risk_level) == "high":
        return doctor_warning

    if primary_entry:
        return primary_entry.get("when_to_seek_doctor", doctor_warning)

    return doctor_warning


def build_knowledge_sources(
    entries: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    sources = []
    seen = set()

    for entry in entries:
        source_names = entry.get("source_names", [])
        source_urls = entry.get("source_urls", [])

        for index, source_name in enumerate(source_names):
            source_url = source_urls[index] if index < len(source_urls) else None
            key = f"{source_name}|{source_url}"

            if key in seen:
                continue

            seen.add(key)

            sources.append(
                {
                    "name": source_name,
                    "url": source_url,
                    "condition": entry.get("condition_name"),
                }
            )

    return sources


def generate_structured_rag_assessment(
    predicted_disease: str,
    disease_confidence: float,
    disease_confidence_level: str,
    predicted_skin_type: str,
    skin_type_confidence: float,
    skin_type_confidence_level: str,
    extracted_symptoms: list[str],
    red_flags: list[str],
    risk_level: str,
    doctor_warning: str,
    skin_tone: str | None = None,
    fitzpatrick_type: str | None = None,
    ethnicity_region: str | None = None,
    db=None,
) -> dict[str, Any]:
    primary_entry = get_condition_by_model_class(predicted_disease)

    # Path A: structured scoring over the validated knowledge base.
    structured_entries = retrieve_relevant_entries(
        predicted_disease=predicted_disease,
        extracted_symptoms=extracted_symptoms,
        red_flags=red_flags,
        risk_level=risk_level,
        top_k=6,
    )

    # Path B: semantic search over condition chunks only (products are handled by the recommender).
    retrieval_trace: list[dict[str, Any]] = []
    if db is not None:
        query_text = " ".join(
            [
                predicted_disease,
                " ".join(normalize_symptom(symptom) for symptom in extracted_symptoms),
                f"{predicted_skin_type} skin",
            ]
        ).strip()
        candidates = retrieve_semantic_context(
            db=db,
            query_text=query_text,
            top_k=12,
            source_type="condition_knowledge",
        )
        retrieval_trace = rerank_context(query_text, candidates, top_n=5)

    # Related conditions are searched by symptoms and red flags alone; including the
    # predicted disease would bias results toward look-alikes of the prediction.
    symptom_query = " ".join(
        [normalize_symptom(symptom) for symptom in extracted_symptoms]
        + [normalize_symptom(flag) for flag in red_flags]
    ).strip()
    symptom_hits: list[dict[str, Any]] = []
    if db is not None and symptom_query:
        symptom_hits = retrieve_semantic_context(
            db=db,
            query_text=symptom_query,
            top_k=8,
            source_type="condition_knowledge",
        )

    # Related conditions are only surfaced when the image prediction is weak or the
    # symptoms don't fit it, so a clear-cut prediction keeps its focused answer.
    symptoms_fit_primary = bool(match_symptoms_to_entry(extracted_symptoms, primary_entry))
    related_conditions: list[dict[str, Any]] = []
    if disease_confidence < LOW_DISEASE_CONFIDENCE or (extracted_symptoms and not symptoms_fit_primary):
        related_conditions = select_related_conditions(
            primary_entry=primary_entry,
            structured_entries=structured_entries,
            semantic_hits=symptom_hits,
        )

    melanin_note = build_melanin_adjustment_context(
        predicted_disease=predicted_disease,
        skin_tone=skin_tone,
        fitzpatrick_type=fitzpatrick_type,
        ethnicity_region=ethnicity_region,
    )

    if primary_entry:
        condition_explanation = primary_entry["brief_overview"]
        professional_note = primary_entry["professional_note"]
    else:
        condition_explanation = (
            f"The model predicted {predicted_disease}, but no detailed knowledge entry was found for this class."
        )
        professional_note = (
            "The result should be treated as uncertain and reviewed by a qualified clinician if symptoms persist."
        )

    if melanin_note:
        condition_explanation += " " + melanin_note

    assessment_summary = build_assessment_summary(
        predicted_disease=predicted_disease,
        disease_confidence=disease_confidence,
        disease_confidence_level=disease_confidence_level,
        predicted_skin_type=predicted_skin_type,
        skin_type_confidence=skin_type_confidence,
        skin_type_confidence_level=skin_type_confidence_level,
        extracted_symptoms=extracted_symptoms,
        risk_level=risk_level,
    )

    if melanin_note:
        assessment_summary += " " + melanin_note

    symptom_context = build_symptom_context(
        predicted_disease=predicted_disease,
        extracted_symptoms=extracted_symptoms,
        condition_knowledge=primary_entry,
        related_conditions=related_conditions,
    )

    skin_type_context = build_skin_type_context(
        predicted_skin_type=predicted_skin_type,
        skin_type_confidence=skin_type_confidence,
    )

    general_care_guidance = build_general_care_guidance(
        primary_entry=primary_entry,
        predicted_skin_type=predicted_skin_type,
        skin_tone=skin_tone,
        fitzpatrick_type=fitzpatrick_type,
        ethnicity_region=ethnicity_region,
    )

    otc_support_guidance = build_otc_support_guidance(
        primary_entry=primary_entry,
    )

    what_to_avoid = build_what_to_avoid(
        primary_entry=primary_entry,
        skin_tone=skin_tone,
        fitzpatrick_type=fitzpatrick_type,
        ethnicity_region=ethnicity_region,
    )

    safety_precautions = build_safety_precautions(
        primary_entry=primary_entry,
        red_flags=red_flags,
        risk_level=risk_level,
        doctor_warning=doctor_warning,
        related_conditions=related_conditions,
    )

    when_to_seek_doctor = build_when_to_seek_doctor(
        primary_entry=primary_entry,
        risk_level=risk_level,
        doctor_warning=doctor_warning,
    )

    source_entries = ([primary_entry] if primary_entry else []) + related_conditions
    knowledge_sources = build_knowledge_sources(source_entries)

    retrieved_knowledge = merge_unique_lists(
        [entry["condition_name"] for entry in source_entries],
        [str(item.get("title") or "").strip() for item in retrieval_trace],
    )

    retrieval_confidence = 0.0
    if retrieval_trace:
        retrieval_confidence = float(
            sum(float(item.get("retrieval_confidence", 0.0)) for item in retrieval_trace) / len(retrieval_trace)
        )

    return {
        "assessment_summary": assessment_summary,
        "condition_explanation": condition_explanation,
        "symptom_context": symptom_context,
        "skin_type_context": skin_type_context,
        "general_care_guidance": general_care_guidance,
        "otc_support_guidance": otc_support_guidance,
        "what_to_avoid": what_to_avoid,
        "safety_precautions": safety_precautions,
        "when_to_seek_doctor": when_to_seek_doctor,
        "professional_note": professional_note,
        "ai_limitations": (
            "This system provides AI-based dermatology support only. It does not confirm a diagnosis, "
            "does not replace a dermatologist, and must not be used as the only basis for treatment decisions. "
            "Skin tone and lighting can affect how visible redness, pigmentation, and inflammation appear in images."
        ),
        "retrieved_knowledge": retrieved_knowledge,
        "knowledge_sources": knowledge_sources,
        "retrieval_trace": retrieval_trace,
        "retrieval_confidence": round(retrieval_confidence, 4),
    }