import uuid

from sqlalchemy import Column, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Consultation(Base):
    __tablename__ = "consultations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    user_id = Column(
        String,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    image_filename = Column(String, nullable=True)

    symptoms = Column(Text, nullable=False)
    duration = Column(String, nullable=True)
    severity = Column(String, nullable=True)
    medical_history = Column(Text, nullable=True)

    skin_tone = Column(String, nullable=True)
    fitzpatrick_type = Column(String, nullable=True)
    ethnicity_region = Column(String, nullable=True)

    melanin_context_note = Column(Text, nullable=True)
    skin_tone_considerations = Column(JSONB, nullable=True)

    predicted_disease = Column(String, nullable=False)
    disease_confidence = Column(Float, nullable=False)
    disease_confidence_level = Column(String, nullable=False)

    predicted_skin_type = Column(String, nullable=False)
    skin_type_confidence = Column(Float, nullable=False)
    skin_type_confidence_level = Column(String, nullable=False)

    extracted_symptoms = Column(JSONB, nullable=True)
    symptom_keyword_hits = Column(JSONB, nullable=True)
    clinical_entities = Column(JSONB, nullable=True)
    negated_entities = Column(JSONB, nullable=True)
    extracted_duration = Column(String, nullable=True)
    inferred_severity = Column(String, nullable=True)
    severity_rationale = Column(Text, nullable=True)
    severity_confidence = Column(Float, nullable=True)
    urgency_class = Column(String, nullable=True)
    urgency_confidence = Column(Float, nullable=True)
    urgency_rationale = Column(Text, nullable=True)
    followup_candidates = Column(JSONB, nullable=True)
    nlp_model_version = Column(String, nullable=True)

    red_flags = Column(JSONB, nullable=True)
    risk_level = Column(String, nullable=False)
    doctor_warning = Column(Text, nullable=False)

    assessment_summary = Column(Text, nullable=True)
    condition_explanation = Column(Text, nullable=True)
    symptom_context = Column(Text, nullable=True)
    skin_type_context = Column(Text, nullable=True)

    general_care_guidance = Column(JSONB, nullable=True)
    otc_support_guidance = Column(JSONB, nullable=True)
    what_to_avoid = Column(JSONB, nullable=True)
    safety_precautions = Column(JSONB, nullable=True)

    when_to_seek_doctor = Column(Text, nullable=True)
    professional_note = Column(Text, nullable=True)
    ai_limitations = Column(Text, nullable=True)

    retrieved_knowledge = Column(JSONB, nullable=True)
    knowledge_sources = Column(JSONB, nullable=True)
    retrieval_trace = Column(JSONB, nullable=True)
    retrieval_confidence = Column(Float, nullable=True)
    retrieval_metrics = Column(JSONB, nullable=True)

    recommendations = Column(JSONB, nullable=True)
    recommendation_safety_note = Column(Text, nullable=True)
    recommendation_source = Column(String, nullable=True)
    allergy_filter_applied = Column(String, nullable=True)
    llm_summary = Column(Text, nullable=True)
    llm_differential_notes = Column(JSONB, nullable=True)
    llm_next_steps = Column(JSONB, nullable=True)
    llm_followup_questions = Column(JSONB, nullable=True)
    llm_confidence_statement = Column(Text, nullable=True)
    llm_generation_mode = Column(String, nullable=True)
    trace_id = Column(String, nullable=True)
    referred_dermatologists = Column(JSONB, nullable=True)
    referral_note = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="consultations")