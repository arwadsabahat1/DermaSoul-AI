from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, HttpUrl


class ProductBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    brand: Optional[str] = Field(default=None, max_length=150)
    category: str = Field(..., min_length=2, max_length=100)
    ingredients: Optional[str] = Field(default=None, max_length=4000)
    suitable_skin_types: Optional[str] = Field(default=None, max_length=1000)
    supported_conditions: Optional[str] = Field(default=None, max_length=2000)
    avoid_if_allergic_to: Optional[str] = Field(default=None, max_length=2000)
    contraindications: Optional[str] = Field(default=None, max_length=2000)
    price_range: Optional[str] = Field(default=None, max_length=100)
    availability: Optional[str] = Field(default=None, max_length=150)
    product_url: Optional[HttpUrl] = None


class ProductCreateRequest(ProductBase):
    pass


class ProductUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    brand: Optional[str] = Field(default=None, max_length=150)
    category: Optional[str] = Field(default=None, min_length=2, max_length=100)
    ingredients: Optional[str] = Field(default=None, max_length=4000)
    suitable_skin_types: Optional[str] = Field(default=None, max_length=1000)
    supported_conditions: Optional[str] = Field(default=None, max_length=2000)
    avoid_if_allergic_to: Optional[str] = Field(default=None, max_length=2000)
    contraindications: Optional[str] = Field(default=None, max_length=2000)
    price_range: Optional[str] = Field(default=None, max_length=100)
    availability: Optional[str] = Field(default=None, max_length=150)
    product_url: Optional[HttpUrl] = None


class ProductResponse(BaseModel):
    id: str
    name: str
    brand: Optional[str] = None
    category: str
    ingredients: Optional[str] = None
    suitable_skin_types: Optional[str] = None
    supported_conditions: Optional[str] = None
    avoid_if_allergic_to: Optional[str] = None
    contraindications: Optional[str] = None
    price_range: Optional[str] = None
    availability: Optional[str] = None
    product_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
