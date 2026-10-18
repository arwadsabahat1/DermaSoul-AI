from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class ConsultationListItemResponse(BaseModel):
    id: str
    image_filename: Optional[str] = None

    predicted_disease: str
    disease_confidence: float
    disease_confidence_level: str

    predicted_skin_type: str
    skin_type_confidence: float
    skin_type_confidence_level: str

    risk_level: str
    created_at: datetime

    class Config:
        from_attributes = True


class ConsultationPaginatedListResponse(BaseModel):
    items: list[ConsultationListItemResponse]
    total: int
    limit: int = Field(..., ge=1)
    offset: int = Field(..., ge=0)


class ConsultationDetailResponse(BaseModel):
    id: str
    user_id: str
    image_filename: Optional[str] = None

    symptoms: str
    duration: Optional[str] = None
    severity: Optional[str] = None
    medical_history: Optional[str] = None

    skin_tone: Optional[str] = None
    fitzpatrick_type: Optional[str] = None
    ethnicity_region: Optional[str] = None
    melanin_context_note: Optional[str] = None
    skin_tone_considerations: Optional[list[str]] = None

    predicted_disease: str
    disease_confidence: float
    disease_confidence_level: str

    predicted_skin_type: str
    skin_type_confidence: float
    skin_type_confidence_level: str

    extracted_symptoms: Optional[list[str]] = None
    symptom_keyword_hits: Optional[dict[str, list[str]]] = None
    clinical_entities: Optional[list[dict[str, Any]]] = None
    negated_entities: Optional[list[str]] = None
    extracted_duration: Optional[str] = None
    inferred_severity: Optional[str] = None
    severity_rationale: Optional[str] = None
    severity_confidence: Optional[float] = None
    urgency_class: Optional[str] = None
    urgency_confidence: Optional[float] = None
    urgency_rationale: Optional[str] = None
    followup_candidates: Optional[list[str]] = None
    nlp_model_version: Optional[str] = None

    red_flags: Optional[list[str]] = None
    risk_level: str
    doctor_warning: str

    assessment_summary: Optional[str] = None
    condition_explanation: Optional[str] = None
    symptom_context: Optional[str] = None
    skin_type_context: Optional[str] = None

    general_care_guidance: Optional[list[str]] = None
    otc_support_guidance: Optional[list[str]] = None
    what_to_avoid: Optional[list[str]] = None
    safety_precautions: Optional[list[str]] = None

    when_to_seek_doctor: Optional[str] = None
    professional_note: Optional[str] = None
    ai_limitations: Optional[str] = None

    retrieved_knowledge: Optional[list[str]] = None
    knowledge_sources: Optional[list[dict[str, Any]]] = None
    retrieval_trace: Optional[list[dict[str, Any]]] = None
    retrieval_confidence: Optional[float] = None
    retrieval_metrics: Optional[dict[str, float]] = None

    recommendations: Optional[list[dict[str, Any]]] = None
    recommendation_safety_note: Optional[str] = None
    recommendation_source: Optional[str] = None
    allergy_filter_applied: Optional[str] = None
    llm_summary: Optional[str] = None
    llm_differential_notes: Optional[list[str]] = None
    llm_next_steps: Optional[list[str]] = None
    llm_followup_questions: Optional[list[str]] = None
    llm_confidence_statement: Optional[str] = None
    llm_generation_mode: Optional[str] = None
    trace_id: Optional[str] = None
    referred_dermatologists: Optional[list[dict[str, Any]]] = None
    referral_note: Optional[str] = None

    created_at: datetime

    class Config:
        from_attributes = True


class AdminConsultationDetailResponse(ConsultationDetailResponse):
    user_email: str