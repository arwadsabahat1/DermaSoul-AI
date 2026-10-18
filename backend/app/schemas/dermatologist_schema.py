from datetime import datetime

from pydantic import BaseModel, Field, HttpUrl, field_validator


class DermatologistBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    clinic_name: str | None = Field(default=None, max_length=200)
    city: str | None = Field(default=None, max_length=120)
    country: str | None = Field(default=None, max_length=120)
    languages: str | None = Field(default=None, max_length=1000)
    specialties: str | None = Field(default=None, max_length=1500)
    supported_conditions: str | None = Field(default=None, max_length=2500)
    specialty_tags: str | None = Field(default=None, max_length=1500)
    regions_served: str | None = Field(default=None, max_length=1500)
    telemedicine_available: bool = False
    emergency_available: bool = False
    years_experience: int | None = Field(default=None, ge=0, le=80)
    contact_email: str | None = Field(default=None, max_length=255)
    contact_phone: str | None = Field(default=None, max_length=50)
    booking_url: HttpUrl | None = None
    profile_image_url: HttpUrl | None = None
    notes: str | None = Field(default=None, max_length=2000)
    is_active: bool = True

    @field_validator("profile_image_url")
    @classmethod
    def require_https_profile_image(cls, value: HttpUrl | None) -> HttpUrl | None:
        if value is not None and value.scheme != "https":
            raise ValueError("Profile image URL must use HTTPS.")
        return value


class DermatologistCreateRequest(DermatologistBase):
    pass


class DermatologistUpdateRequest(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=150)
    clinic_name: str | None = Field(default=None, max_length=200)
    city: str | None = Field(default=None, max_length=120)
    country: str | None = Field(default=None, max_length=120)
    languages: str | None = Field(default=None, max_length=1000)
    specialties: str | None = Field(default=None, max_length=1500)
    supported_conditions: str | None = Field(default=None, max_length=2500)
    specialty_tags: str | None = Field(default=None, max_length=1500)
    regions_served: str | None = Field(default=None, max_length=1500)
    telemedicine_available: bool | None = None
    emergency_available: bool | None = None
    years_experience: int | None = Field(default=None, ge=0, le=80)
    contact_email: str | None = Field(default=None, max_length=255)
    contact_phone: str | None = Field(default=None, max_length=50)
    booking_url: HttpUrl | None = None
    profile_image_url: HttpUrl | None = None
    notes: str | None = Field(default=None, max_length=2000)
    is_active: bool | None = None

    @field_validator("profile_image_url")
    @classmethod
    def require_https_profile_image(cls, value: HttpUrl | None) -> HttpUrl | None:
        if value is not None and value.scheme != "https":
            raise ValueError("Profile image URL must use HTTPS.")
        return value


class DermatologistResponse(DermatologistBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
