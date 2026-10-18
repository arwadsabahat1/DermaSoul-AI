from sqlalchemy.orm import Session

from app.models.consultation import Consultation


def save_consultation_result(
    db: Session,
    user_id: str,
    result: dict
) -> Consultation:
    consultation = Consultation(
        user_id=user_id,

        image_filename=result.get("image_filename"),

        symptoms=result.get("symptoms"),
        duration=result.get("duration"),
        severity=result.get("severity"),
        medical_history=result.get("medical_history"),

                skin_tone=result.get("skin_tone"),
        fitzpatrick_type=result.get("fitzpatrick_type"),
        ethnicity_region=result.get("ethnicity_region"),
        melanin_context_note=result.get("melanin_context_note"),
        skin_tone_considerations=result.get("skin_tone_considerations"),

        predicted_disease=result.get("predicted_disease"),
        disease_confidence=result.get("disease_confidence"),
        disease_confidence_level=result.get("disease_confidence_level"),

        predicted_skin_type=result.get("predicted_skin_type"),
        skin_type_confidence=result.get("skin_type_confidence"),
        skin_type_confidence_level=result.get("skin_type_confidence_level"),

        extracted_symptoms=result.get("extracted_symptoms"),
        symptom_keyword_hits=result.get("symptom_keyword_hits"),
        clinical_entities=result.get("clinical_entities"),
        negated_entities=result.get("negated_entities"),
        extracted_duration=result.get("extracted_duration"),
        inferred_severity=result.get("inferred_severity"),
        severity_rationale=result.get("severity_rationale"),
        severity_confidence=result.get("severity_confidence"),
        urgency_class=result.get("urgency_class"),
        urgency_confidence=result.get("urgency_confidence"),
        urgency_rationale=result.get("urgency_rationale"),
        followup_candidates=result.get("followup_candidates"),
        nlp_model_version=result.get("nlp_model_version"),

        red_flags=result.get("red_flags"),
        risk_level=result.get("risk_level"),
        doctor_warning=result.get("doctor_warning"),

        assessment_summary=result.get("assessment_summary"),
        condition_explanation=result.get("condition_explanation"),
        symptom_context=result.get("symptom_context"),
        skin_type_context=result.get("skin_type_context"),

        general_care_guidance=result.get("general_care_guidance"),
        otc_support_guidance=result.get("otc_support_guidance"),
        what_to_avoid=result.get("what_to_avoid"),
        safety_precautions=result.get("safety_precautions"),

        when_to_seek_doctor=result.get("when_to_seek_doctor"),
        professional_note=result.get("professional_note"),
        ai_limitations=result.get("ai_limitations"),

        retrieved_knowledge=result.get("retrieved_knowledge"),
        knowledge_sources=result.get("knowledge_sources"),
        retrieval_trace=result.get("retrieval_trace"),
        retrieval_confidence=result.get("retrieval_confidence"),
        retrieval_metrics=result.get("retrieval_metrics"),

        recommendations=result.get("recommendations"),
        recommendation_safety_note=result.get("recommendation_safety_note"),
        recommendation_source=result.get("recommendation_source"),
        allergy_filter_applied=str(result.get("allergy_filter_applied")),
        llm_summary=result.get("llm_summary"),
        llm_differential_notes=result.get("llm_differential_notes"),
        llm_next_steps=result.get("llm_next_steps"),
        llm_followup_questions=result.get("llm_followup_questions"),
        llm_confidence_statement=result.get("llm_confidence_statement"),
        llm_generation_mode=result.get("llm_generation_mode"),
        trace_id=result.get("trace_id"),
        referred_dermatologists=result.get("referred_dermatologists"),
        referral_note=result.get("referral_note"),
    )

    db.add(consultation)
    db.commit()
    db.refresh(consultation)

    return consultation