from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.profile import Profile
from app.models.user import User
from app.routers.auth_router import get_current_user
from app.schemas.profile_schema import ProfileResponse, ProfileUpdateRequest


router = APIRouter(
    prefix="/api/profile",
    tags=["Profile"]
)


ALLOWED_GENDERS = {
    "male",
    "female",
    "other",
    "prefer_not_to_say"
}


def normalize_optional_text(value: str | None) -> str | None:
    if value is None:
        return None

    cleaned = value.strip()

    if cleaned == "":
        return None

    return cleaned


@router.get("/me", response_model=ProfileResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter(
        Profile.user_id == current_user.id
    ).first()

    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    return profile


@router.put("/me", response_model=ProfileResponse)
def update_my_profile(
    data: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter(
        Profile.user_id == current_user.id
    ).first()

    if not profile:
        profile = Profile(user_id=current_user.id)
        db.add(profile)
        db.flush()

    update_data = data.model_dump(exclude_unset=True)

    if "gender" in update_data and update_data["gender"] is not None:
        gender = update_data["gender"].strip().lower()

        if gender not in ALLOWED_GENDERS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Gender must be one of: male, female, other, prefer_not_to_say."
            )

        update_data["gender"] = gender

    for field, value in update_data.items():
        if isinstance(value, str):
            value = normalize_optional_text(value)

        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)

    return profile