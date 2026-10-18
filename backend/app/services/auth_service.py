from datetime import timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.models.consultation import Consultation
from app.models.profile import Profile
from app.models.user import User
from app.schemas.auth_schema import UserLoginRequest, UserRegisterRequest
from app.services.image_storage_service import delete_uploaded_image
from app.utils.security import create_access_token, hash_password, verify_password


def register_user(db: Session, data: UserRegisterRequest) -> User:
    existing_user = db.query(User).filter(User.email == data.email.lower()).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    hashed = hash_password(data.password)

    user = User(
        email=data.email.lower(),
        hashed_password=hashed,
        role="user",
        is_active=True
    )

    db.add(user)
    db.flush()

    profile = Profile(
        user_id=user.id
    )

    db.add(profile)
    db.commit()
    db.refresh(user)

    return user


def login_user(db: Session, data: UserLoginRequest) -> str:
    user = db.query(User).filter(User.email == data.email.lower()).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is disabled."
        )

    access_token_expires = timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    token = create_access_token(
        subject=user.id,
        expires_delta=access_token_expires
    )

    return token


def change_user_password(
    db: Session,
    user: User,
    *,
    current_password: str,
    new_password: str,
) -> None:
    if not verify_password(current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect.",
        )

    user.hashed_password = hash_password(new_password)
    db.add(user)
    db.commit()


def delete_user_account(db: Session, user: User, password: str) -> None:
    if not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Password is incorrect.",
        )

    image_rows = (
        db.query(Consultation.image_filename)
        .filter(Consultation.user_id == user.id)
        .all()
    )

    db.delete(user)
    db.commit()

    # Remove the files only after the account is gone, so a failed commit never loses images.
    for (filename,) in image_rows:
        delete_uploaded_image(filename)
