from pydantic import BaseModel, Field
from typing import Optional


class ProfileResponse(BaseModel):
    id: str
    user_id: str
    full_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    known_allergies: Optional[str] = None
    medical_history: Optional[str] = None
    skin_concerns: Optional[str] = None
    current_products: Optional[str] = None

    class Config:
        from_attributes = True


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=100
    )

    age: Optional[int] = Field(
        default=None,
        ge=1,
        le=120
    )

    gender: Optional[str] = Field(
        default=None,
        max_length=30
    )

    phone: Optional[str] = Field(
        default=None,
        max_length=30
    )

    known_allergies: Optional[str] = Field(
        default=None,
        max_length=1000
    )

    medical_history: Optional[str] = Field(
        default=None,
        max_length=2000
    )

    skin_concerns: Optional[str] = Field(
        default=None,
        max_length=1000
    )

    current_products: Optional[str] = Field(
        default=None,
        max_length=1000
    )