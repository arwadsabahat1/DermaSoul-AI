from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.routers.auth_router import get_current_user
from app.schemas.diagnosis_schema import DiagnosisBaseResponse
from app.services.image_validation_service import validate_uploaded_image
from app.services.diagnosis_service import run_image_diagnosis
from app.services.nlp_service import analyze_symptom_text
from app.services.nlp_pipeline import refresh_urgency
from app.models.profile import Profile
from app.services.recommendation_service import generate_safe_recommendations
from app.services.rag_service import generate_structured_rag_assessment
from app.services.report_service import save_consultation_result
from app.services.red_flag_service import (
    calculate_risk_level,
    detect_red_flags,
    generate_doctor_warning,
)
from app.services.education_service import suggest_article_for_diagnosis
from app.services.image_storage_service import delete_uploaded_image, save_uploaded_image_bytes
from app.services.notification_service import send_high_risk_alert_email
from app.services.dermatologist_service import select_referral_dermatologists
from app.services.ai_orchestrator_service import generate_consultation_narrative
from app.services.evaluation_service import compute_retrieval_quality_metrics
from app.services.trace_service import log_trace_event, new_trace_id
from app.services.skin_detection_service import (
    validate_image_not_blurry,
    validate_visible_skin,
)

from app.services.melanin_context_service import build_melanin_context_note


router = APIRouter(
    prefix="/api/diagnosis",
    tags=["Diagnosis"]
)


ALLOWED_SEVERITY_VALUES = {
    "mild",
    "moderate",
    "severe",
    "unknown"
}


def clean_optional_text(value: str | None, max_length: int, field_name: str) -> str | None:
    if value is None:
        return None

    cleaned = value.strip()

    if cleaned == "":
        return None

    if len(cleaned) > max_length:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_name} must be less than {max_length} characters."
        )

    return cleaned


def validate_symptoms(symptoms: str) -> str:
    if symptoms is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Symptoms are required."
        )

    cleaned = symptoms.strip()

    if len(cleaned) < 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please describe your symptoms in at least 5 characters."
        )

    if len(cleaned) > 2000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Symptoms must be less than 2000 characters."
        )

    return cleaned


def validate_severity(severity: str | None) -> str | None:
    if severity is None:
        return None

    cleaned = severity.strip().lower()

    if cleaned == "":
        return None

    if cleaned not in ALLOWED_SEVERITY_VALUES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Severity must be one of: mild, moderate, severe, unknown."
        )

    return cleaned


# A plain `def` endpoint: FastAPI runs it in a worker thread, so the CPU-heavy model inference
# below does not block the event loop (and every other request) while it runs.
@router.post("/analyze", response_model=DiagnosisBaseResponse)
def analyze_skin_image(
    image: UploadFile = File(...),
    symptoms: str = Form(...),
    duration: str | None = Form(None),
    severity: str | None = Form(None),
    medical_history: str | None = Form(None),

    # Optional context inputs for inclusive clinical guidance
    skin_tone: str | None = Form(
    None,
    description="Approximate skin tone, e.g. fair, medium, wheatish, brown, dark brown, deep.",
),
    fitzpatrick_type: str | None = Form(
    None,
    description=(
        "Fitzpatrick skin type describes how your skin reacts to sunlight. "
        "Choose one value: I = very fair, always burns/never tans; "
        "II = fair, burns easily/tans minimally; "
        "III = light brown or wheatish, sometimes burns/gradually tans; "
        "IV = brown or olive, rarely burns/tans easily; "
        "V = dark brown, very rarely burns; "
        "VI = deeply pigmented, never burns."
    ),
),  
    ethnicity_region: str | None = Form(
    None,
    description="Optional regional background context (e.g., European, African diaspora, Latino, Middle Eastern, South Asian).",
),

    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    image.file.seek(0)
    file_bytes = image.file.read()
    pil_image = validate_uploaded_image(image, file_bytes)

    blur_score = validate_image_not_blurry(pil_image)

    skin_check = validate_visible_skin(pil_image)

    cleaned_symptoms = validate_symptoms(symptoms)

    cleaned_duration = clean_optional_text(
        duration,
        max_length=100,
        field_name="Duration"
    )

    cleaned_severity = validate_severity(severity)

    cleaned_medical_history = clean_optional_text(
        medical_history,
        max_length=2000,
        field_name="Medical history"
    )

    red_flags = detect_red_flags(
        symptoms_text=cleaned_symptoms,
        medical_history=cleaned_medical_history,
    )

    diagnosis_result = run_image_diagnosis(pil_image)

    nlp_result = analyze_symptom_text(
        symptoms_text=cleaned_symptoms,
        duration_input=cleaned_duration,
        severity_input=cleaned_severity,
        medical_history=cleaned_medical_history,
        risk_level="Uncertain",
        red_flags=red_flags,
        conversation_turns=[],
    )

    risk_level = calculate_risk_level(
        predicted_disease=diagnosis_result["predicted_disease"],
        disease_confidence=diagnosis_result["disease_confidence"],
        red_flags=red_flags,
        inferred_severity=nlp_result["inferred_severity"],
    )

    # NLP ran before the risk level existed; recompute urgency with the real value.
    refresh_urgency(
        nlp_result,
        text=" ".join([cleaned_symptoms, cleaned_medical_history or ""]),
        red_flags=red_flags,
        risk_level=risk_level,
    )

    doctor_warning = generate_doctor_warning(
        risk_level=risk_level,
        red_flags=red_flags,
        predicted_disease=diagnosis_result["predicted_disease"],
    )

    rag_assessment = generate_structured_rag_assessment(
        predicted_disease=diagnosis_result["predicted_disease"],
        disease_confidence=diagnosis_result["disease_confidence"],
        disease_confidence_level=diagnosis_result["disease_confidence_level"],
        predicted_skin_type=diagnosis_result["predicted_skin_type"],
        skin_type_confidence=diagnosis_result["skin_type_confidence"],
        skin_type_confidence_level=diagnosis_result["skin_type_confidence_level"],
        extracted_symptoms=nlp_result["extracted_symptoms"],
        red_flags=red_flags,
        risk_level=risk_level,
        doctor_warning=doctor_warning,

        # Pass optional context into RAG and recommendation layers
        skin_tone=skin_tone,
        fitzpatrick_type=fitzpatrick_type,
        ethnicity_region=ethnicity_region,
        db=db,
    )
    trace_id = new_trace_id()
    log_trace_event(
        trace_id,
        "rag_assessment_completed",
        {
            "predicted_disease": diagnosis_result["predicted_disease"],
            "risk_level": risk_level,
            "retrieval_confidence": rag_assessment.get("retrieval_confidence"),
        },
    )

    profile = db.query(Profile).filter(
        Profile.user_id == current_user.id
    ).first()

    known_allergies_text = profile.known_allergies if profile else None

    recommendation_result = generate_safe_recommendations(
        predicted_disease=diagnosis_result["predicted_disease"],
        predicted_skin_type=diagnosis_result["predicted_skin_type"],
        risk_level=risk_level,
        red_flags=red_flags,
        known_allergies_text=known_allergies_text,
        skin_tone=skin_tone,
        fitzpatrick_type=fitzpatrick_type,
        ethnicity_region=ethnicity_region,
        db=db,
    )

    # Context layer for skin-tone-inclusive interpretation
    melanin_context = build_melanin_context_note(
        skin_tone=skin_tone,
        fitzpatrick_type=fitzpatrick_type,
        ethnicity_region=ethnicity_region,
    )

    referral_doctors = select_referral_dermatologists(
        db=db,
        risk_level=risk_level,
        predicted_disease=diagnosis_result["predicted_disease"],
        urgency_class=nlp_result.get("urgency_class"),
        preferred_language="english",
        limit=3,
    )
    referral_note = None
    if referral_doctors:
        referral_note = (
            "Based on the current risk assessment, consider a consultation with a licensed dermatologist."
        )

    referred_dermatologists = [
        {
            "id": item["doctor"].id,
            "full_name": item["doctor"].full_name,
            "clinic_name": item["doctor"].clinic_name,
            "city": item["doctor"].city,
            "country": item["doctor"].country,
            "languages": item["doctor"].languages,
            "specialties": item["doctor"].specialties,
            "years_experience": item["doctor"].years_experience,
            "contact_email": item["doctor"].contact_email,
            "contact_phone": item["doctor"].contact_phone,
            "booking_url": item["doctor"].booking_url,
            "telemedicine_available": item["doctor"].telemedicine_available,
            "emergency_available": item["doctor"].emergency_available,
            "referral_score": item["score"],
            "referral_reasons": item["reasons"],
        }
        for item in referral_doctors
    ]

    suggested_article = suggest_article_for_diagnosis(
        db=db,
        predicted_disease=diagnosis_result["predicted_disease"]
    )

    llm_narrative = generate_consultation_narrative(
        base_state={
            **diagnosis_result,
            **nlp_result,
            "risk_level": risk_level,
            "red_flags": red_flags,
            "doctor_warning": doctor_warning,
            "retrieval_trace": rag_assessment.get("retrieval_trace", []),
            "followup_candidates": nlp_result.get("followup_candidates", []),
            "assessment_summary": rag_assessment.get("assessment_summary"),
            "general_care_guidance": rag_assessment.get("general_care_guidance"),
            "when_to_seek_doctor": rag_assessment.get("when_to_seek_doctor"),
        },
    )
    retrieval_metrics = compute_retrieval_quality_metrics(
        rag_assessment.get("retrieval_trace", [])
    )

    # The image is stored only once every validation and analysis step has succeeded,
    # so rejected or failed requests leave no orphaned files behind.
    stored_filename, _stored_path = save_uploaded_image_bytes(file_bytes, image.filename)

    response_data = {
        "message": "Diagnosis analysis completed successfully.",
        "image_filename": stored_filename,

        "skin_tone": skin_tone,
        "fitzpatrick_type": fitzpatrick_type,
        "ethnicity_region": ethnicity_region,

        **melanin_context,

        "symptoms": cleaned_symptoms,
        "duration": cleaned_duration,
        "severity": cleaned_severity,
        "medical_history": cleaned_medical_history,
        "blur_score": round(blur_score, 2),
        "skin_check": skin_check,
        **diagnosis_result,
        **nlp_result,
        "red_flags": red_flags,
        "risk_level": risk_level,
        "doctor_warning": doctor_warning,
        **rag_assessment,
        **recommendation_result,
        "llm_summary": llm_narrative.get("summary"),
        "llm_differential_notes": llm_narrative.get("differential_notes", []),
        "llm_next_steps": llm_narrative.get("next_steps", []),
        "llm_followup_questions": llm_narrative.get("followup_questions", []),
        "llm_confidence_statement": llm_narrative.get("confidence_statement"),
        "llm_generation_mode": llm_narrative.get("generation_mode"),
        "retrieval_metrics": retrieval_metrics,
        "trace_id": trace_id,
        "referred_dermatologists": referred_dermatologists,
        "referral_note": referral_note,
        "suggested_education_slug": suggested_article.slug if suggested_article else None,
        "suggested_education_title": suggested_article.title if suggested_article else None,
    }

    try:
        consultation = save_consultation_result(
            db=db,
            user_id=current_user.id,
            result=response_data,
        )
    except Exception:
        delete_uploaded_image(stored_filename)
        raise

    response_data["consultation_id"] = consultation.id

    if risk_level.lower() == "high":
        send_high_risk_alert_email(
            recipient_email=current_user.email,
            consultation_id=consultation.id,
            predicted_disease=diagnosis_result["predicted_disease"],
            risk_level=risk_level,
        )

    return response_data