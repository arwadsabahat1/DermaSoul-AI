from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.routers.auth_router import get_admin_user, get_current_user
from app.schemas.dermatologist_schema import (
    DermatologistCreateRequest,
    DermatologistResponse,
    DermatologistUpdateRequest,
)
from app.services.dermatologist_service import (
    create_dermatologist,
    delete_dermatologist,
    list_dermatologists,
    update_dermatologist,
)

router = APIRouter(
    prefix="/api/dermatologists",
    tags=["Dermatologists"]
)


@router.get("", response_model=list[DermatologistResponse])
def get_dermatologists(
    include_inactive: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Inactive directory entries are visible to admins only.
    show_inactive = include_inactive and current_user.role == "admin"
    return list_dermatologists(db, only_active=not show_inactive)


@router.post("", response_model=DermatologistResponse, status_code=status.HTTP_201_CREATED)
def add_dermatologist(
    payload: DermatologistCreateRequest,
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    return create_dermatologist(db, payload)


@router.put("/{doctor_id}", response_model=DermatologistResponse)
def edit_dermatologist(
    doctor_id: str,
    payload: DermatologistUpdateRequest,
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    doctor = update_dermatologist(db, doctor_id, payload)
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dermatologist not found.")
    return doctor


@router.delete("/{doctor_id}")
def remove_dermatologist(
    doctor_id: str,
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    if not delete_dermatologist(db, doctor_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dermatologist not found.")
    return {"message": "Dermatologist deleted successfully."}
