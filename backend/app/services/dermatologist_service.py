from sqlalchemy.orm import Session

from app.models.dermatologist import Dermatologist
from app.schemas.dermatologist_schema import (
    DermatologistCreateRequest,
    DermatologistUpdateRequest,
)


def list_dermatologists(db: Session, only_active: bool = True) -> list[Dermatologist]:
    query = db.query(Dermatologist)
    if only_active:
        query = query.filter(Dermatologist.is_active.is_(True))
    return query.order_by(
        Dermatologist.years_experience.desc().nullslast(),
        Dermatologist.full_name.asc(),
    ).all()


def create_dermatologist(db: Session, payload: DermatologistCreateRequest) -> Dermatologist:
    doctor = Dermatologist(**payload.model_dump())
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor


def update_dermatologist(db: Session, doctor_id: str, payload: DermatologistUpdateRequest) -> Dermatologist | None:
    doctor = db.query(Dermatologist).filter(Dermatologist.id == doctor_id).first()
    if not doctor:
        return None

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(doctor, field, value)

    db.commit()
    db.refresh(doctor)
    return doctor


def delete_dermatologist(db: Session, doctor_id: str) -> bool:
    doctor = db.query(Dermatologist).filter(Dermatologist.id == doctor_id).first()
    if not doctor:
        return False
    db.delete(doctor)
    db.commit()
    return True


def select_referral_dermatologists(
    db: Session,
    risk_level: str,
    predicted_disease: str | None = None,
    urgency_class: str | None = None,
    preferred_city: str | None = None,
    preferred_country: str | None = None,
    preferred_language: str | None = None,
    limit: int = 3,
) -> list[dict]:
    normalized = (risk_level or "").strip().lower()
    if normalized not in {"high", "moderate", "low to moderate", "uncertain"}:
        return []
    if normalized not in {"high", "moderate"}:
        return []

    doctors = (
        db.query(Dermatologist)
        .filter(Dermatologist.is_active.is_(True))
        .all()
    )
    disease = (predicted_disease or "").strip().lower()
    city = (preferred_city or "").strip().lower()
    country = (preferred_country or "").strip().lower()
    language = (preferred_language or "").strip().lower()
    urgency = (urgency_class or "").strip().lower()

    ranked: list[dict] = []
    for doctor in doctors:
        score = 0.0
        reasons: list[str] = []
        exp = float(doctor.years_experience or 0)
        score += min(exp / 40.0, 1.0) * 0.25
        if exp:
            reasons.append(f"{int(exp)} years experience")

        specialties = (doctor.supported_conditions or "") + " " + (doctor.specialty_tags or "") + " " + (doctor.specialties or "")
        specialties_l = specialties.lower()
        if disease and disease in specialties_l:
            score += 0.35
            reasons.append("specialty match")
        if doctor.emergency_available and urgency == "high":
            score += 0.2
            reasons.append("emergency availability")
        if doctor.telemedicine_available:
            score += 0.08
            reasons.append("telemedicine support")
        if city and city in (doctor.city or "").lower():
            score += 0.08
            reasons.append("city match")
        if country and country in (doctor.country or "").lower():
            score += 0.06
            reasons.append("country match")
        if language and language in (doctor.languages or "").lower():
            score += 0.08
            reasons.append("language match")

        ranked.append(
            {
                "doctor": doctor,
                "score": round(score, 4),
                "reasons": reasons or ["general dermatology referral"],
            }
        )

    ranked.sort(key=lambda x: x["score"], reverse=True)
    return ranked[:limit]
