from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.consultation import Consultation
from app.models.user import User
from app.routers.auth_router import get_admin_user
from app.schemas.consultation_schema import (
    AdminConsultationDetailResponse,
    ConsultationDetailResponse,
    ConsultationListItemResponse,
    ConsultationPaginatedListResponse,
)
from app.services.model_registry import get_model_registry_snapshot
from app.tasks.rag_tasks import run_rag_reindex_job


router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"]
)


@router.get("/stats")
def get_admin_stats(
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    total_users = db.query(func.count(User.id)).scalar() or 0
    active_users = db.query(func.count(User.id)).filter(User.is_active.is_(True)).scalar() or 0
    total_consultations = db.query(func.count(Consultation.id)).scalar() or 0
    high_risk_consultations = db.query(func.count(Consultation.id)).filter(
        Consultation.risk_level.ilike("high")
    ).scalar() or 0
    risk_rows = (
        db.query(Consultation.risk_level, func.count(Consultation.id))
        .group_by(Consultation.risk_level)
        .all()
    )

    return {
        "total_users": total_users,
        "active_users": active_users,
        "disabled_users": max(total_users - active_users, 0),
        "total_consultations": total_consultations,
        "high_risk_consultations": high_risk_consultations,
        "consultations_by_risk": {
            str(risk_level or "Unknown"): count
            for risk_level, count in risk_rows
        },
    }


@router.get("/users")
def list_users(
    search: str | None = Query(default=None),
    limit: int = Query(default=30, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if search:
        query = query.filter(User.email.ilike(f"%{search.strip()}%"))

    users = query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()
    return [
        {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active,
            "created_at": user.created_at,
        }
        for user in users
    ]


@router.get("/users/{user_id}/consultations", response_model=ConsultationPaginatedListResponse)
def list_user_consultations(
    user_id: str,
    limit: int = Query(default=20, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    query = db.query(Consultation).filter(Consultation.user_id == user_id)
    total = query.count()
    rows = query.order_by(Consultation.created_at.desc()).offset(offset).limit(limit).all()
    items = [ConsultationListItemResponse.model_validate(row) for row in rows]
    return ConsultationPaginatedListResponse(items=items, total=total, limit=limit, offset=offset)


@router.patch("/users/{user_id}/status")
def update_user_status(
    user_id: str,
    is_active: bool,
    current_admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    # The acting admin can never disable themselves, so at least one active admin always remains.
    if not is_active and user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot disable your own admin account."
        )

    user.is_active = is_active
    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
    }


@router.get("/consultations/flagged")
def get_flagged_consultations(
    risk_level: str | None = Query(default="High"),
    limit: int = Query(default=50, ge=1, le=200),
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    query = db.query(Consultation)
    if risk_level:
        query = query.filter(Consultation.risk_level.ilike(risk_level.strip()))

    consultations = query.order_by(Consultation.created_at.desc()).limit(limit).all()
    return [
        {
            "id": consultation.id,
            "user_id": consultation.user_id,
            "predicted_disease": consultation.predicted_disease,
            "risk_level": consultation.risk_level,
            "doctor_warning": consultation.doctor_warning,
            "created_at": consultation.created_at,
        }
        for consultation in consultations
    ]


@router.get("/consultations/{consultation_id}", response_model=AdminConsultationDetailResponse)
def admin_get_consultation_detail(
    consultation_id: str,
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    row = (
        db.query(Consultation, User.email)
        .join(User, Consultation.user_id == User.id)
        .filter(Consultation.id == consultation_id)
        .first()
    )
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultation not found.",
        )
    consultation, user_email = row
    detail = ConsultationDetailResponse.model_validate(consultation).model_dump()
    return AdminConsultationDetailResponse(user_email=user_email, **detail)


@router.get("/ai/model-registry")
def get_ai_model_registry(
    _: User = Depends(get_admin_user),
):
    return [
        {
            "name": item.name,
            "version": item.version,
            "loaded": item.loaded,
        }
        for item in get_model_registry_snapshot()
    ]


@router.post("/ai/reindex-rag")
def trigger_rag_reindex(
    _: User = Depends(get_admin_user),
):
    return run_rag_reindex_job()
