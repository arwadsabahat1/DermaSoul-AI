from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.product import Product
from app.schemas.product_schema import ProductCreateRequest, ProductUpdateRequest


def _normalize_optional_text(value: str | None) -> str | None:
    if value is None:
        return None

    cleaned = value.strip()
    if cleaned == "":
        return None

    return cleaned


def list_products(db: Session) -> list[Product]:
    return db.query(Product).order_by(Product.created_at.desc()).all()


def get_product_by_id(db: Session, product_id: str) -> Product:
    product = db.query(Product).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found."
        )

    return product


def create_product(db: Session, data: ProductCreateRequest) -> Product:
    product = Product(
        name=data.name.strip(),
        brand=_normalize_optional_text(data.brand),
        category=data.category.strip(),
        ingredients=_normalize_optional_text(data.ingredients),
        suitable_skin_types=_normalize_optional_text(data.suitable_skin_types),
        supported_conditions=_normalize_optional_text(data.supported_conditions),
        avoid_if_allergic_to=_normalize_optional_text(data.avoid_if_allergic_to),
        contraindications=_normalize_optional_text(data.contraindications),
        price_range=_normalize_optional_text(data.price_range),
        availability=_normalize_optional_text(data.availability),
        product_url=str(data.product_url) if data.product_url else None,
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    return product


def update_product(
    db: Session,
    product_id: str,
    data: ProductUpdateRequest
) -> Product:
    product = get_product_by_id(db, product_id)
    update_data = data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if field == "product_url":
            setattr(product, field, str(value) if value else None)
            continue

        if isinstance(value, str):
            value = _normalize_optional_text(value)

        setattr(product, field, value)

    db.commit()
    db.refresh(product)

    return product


def delete_product(db: Session, product_id: str) -> None:
    product = get_product_by_id(db, product_id)
    db.delete(product)
    db.commit()
