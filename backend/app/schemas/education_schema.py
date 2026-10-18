from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class EducationArticleBase(BaseModel):
    title: str = Field(..., min_length=4, max_length=200)
    slug: Optional[str] = Field(default=None, min_length=3, max_length=200)
    category: str = Field(..., min_length=2, max_length=100)
    summary: Optional[str] = Field(default=None, max_length=2000)
    content: str = Field(..., min_length=20, max_length=25000)
    warnings: Optional[str] = Field(default=None, max_length=3000)
    precautions: Optional[str] = Field(default=None, max_length=3000)
    when_to_seek_doctor: Optional[str] = Field(default=None, max_length=3000)
    source_urls: Optional[str] = Field(default=None, max_length=5000)


class EducationArticleCreateRequest(EducationArticleBase):
    pass


class EducationArticleUpdateRequest(BaseModel):
    title: Optional[str] = Field(default=None, min_length=4, max_length=200)
    slug: Optional[str] = Field(default=None, min_length=3, max_length=200)
    category: Optional[str] = Field(default=None, min_length=2, max_length=100)
    summary: Optional[str] = Field(default=None, max_length=2000)
    content: Optional[str] = Field(default=None, min_length=20, max_length=25000)
    warnings: Optional[str] = Field(default=None, max_length=3000)
    precautions: Optional[str] = Field(default=None, max_length=3000)
    when_to_seek_doctor: Optional[str] = Field(default=None, max_length=3000)
    source_urls: Optional[str] = Field(default=None, max_length=5000)


class EducationArticleListResponse(BaseModel):
    id: str
    title: str
    slug: str
    category: str
    summary: Optional[str] = None
    warnings: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True


class EducationArticleDetailResponse(BaseModel):
    id: str
    title: str
    slug: str
    category: str
    summary: Optional[str] = None
    content: str
    warnings: Optional[str] = None
    precautions: Optional[str] = None
    when_to_seek_doctor: Optional[str] = None
    source_urls: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EducationKnowledgeResponse(BaseModel):
    condition_name: str
    model_class: str
    aliases: list[str] = []
    category: str | None = None
    brief_overview: str | None = None
    common_signs: list[str] = []
    common_triggers_or_causes: list[str] = []
    general_care_guidance: list[str] = []
    otc_support_guidance: list[str] = []
    what_to_avoid: list[str] = []
    red_flags: list[str] = []
    when_to_seek_doctor: str | None = None
    professional_note: str | None = None
    source_names: list[str] = []
    source_urls: list[str] = []
