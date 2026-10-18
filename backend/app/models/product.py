import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(
        String,
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    brand: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True
    )

    category: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    ingredients: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    suitable_skin_types: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    supported_conditions: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    avoid_if_allergic_to: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    contraindications: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    price_range: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )

    availability: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True
    )

    product_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )