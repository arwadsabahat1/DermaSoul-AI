from typing import Any, Optional

from pydantic import BaseModel


class DiagnosisBaseResponse(BaseModel):
    message: str
    consultation_id: str
    image_filename: str

    symptoms: str
    duration: Optional[str] = None
    severity: Optional[str] = None
    medical_history: Optional[str] = None

    # Optional context for more inclusive guidance
    skin_tone: Optional[str] = None
    fitzpatrick_type: Optional[str] = None
    ethnicity_region: Optional[str] = None

    # Inclusive context output
    melanin_context_note: str
    skin_tone_considerations: list[str]

    blur_score: float
    skin_check: dict

    predicted_disease: str
    disease_confidence: float
    disease_confidence_level: str

    predicted_skin_type: str
    skin_type_confidence: float
    skin_type_confidence_level: str

    extracted_symptoms: list[str]
    symptom_keyword_hits: dict[str, list[str]]
    clinical_entities: list[dict[str, Any]]
    negated_entities: list[str]
    extracted_duration: Optional[str] = None
    inferred_severity: str
    severity_rationale: str
    severity_confidence: float
    urgency_class: str
    urgency_confidence: float
    urgency_rationale: str
    followup_candidates: list[str]
    nlp_model_version: str

    red_flags: list[str]
    risk_level: str
    doctor_warning: str

    assessment_summary: str
    condition_explanation: str
    symptom_context: str
    skin_type_context: str
    general_care_guidance: list[str]
    otc_support_guidance: list[str]
    what_to_avoid: list[str]
    safety_precautions: list[str]
    when_to_seek_doctor: str
    professional_note: str
    ai_limitations: str
    retrieved_knowledge: list[str]
    knowledge_sources: list[dict[str, Any]]
    recommendations: list[dict[str, Any]]
    recommendation_safety_note: str
    recommendation_source: Optional[str] = None
    allergy_filter_applied: bool
    retrieval_trace: list[dict[str, Any]]
    retrieval_confidence: float
    retrieval_metrics: dict[str, float]
    llm_summary: Optional[str] = None
    llm_differential_notes: list[str]
    llm_next_steps: list[str]
    llm_followup_questions: list[str]
    llm_confidence_statement: Optional[str] = None
    llm_generation_mode: Optional[str] = None
    trace_id: Optional[str] = None
    referred_dermatologists: list[dict[str, Any]]
    referral_note: Optional[str] = None
    suggested_education_slug: Optional[str] = None
    suggested_education_title: Optional[str] = None