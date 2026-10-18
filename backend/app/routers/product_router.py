from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.routers.auth_router import get_admin_user, get_current_user
from app.schemas.product_schema import (
    ProductCreateRequest,
    ProductResponse,
    ProductUpdateRequest,
)
from app.services.product_service import (
    create_product,
    delete_product,
    get_product_by_id,
    list_products,
    update_product,
)


router = APIRouter(
    prefix="/api/products",
    tags=["Products"]
)


@router.get("", response_model=list[ProductResponse])
def get_products(
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return list_products(db)


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: str,
    _: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_product_by_id(db, product_id)


@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED
)
def add_product(
    data: ProductCreateRequest,
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    return create_product(db, data)


@router.put("/{product_id}", response_model=ProductResponse)
def edit_product(
    product_id: str,
    data: ProductUpdateRequest,
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    return update_product(db, product_id, data)


@router.delete("/{product_id}")
def remove_product(
    product_id: str,
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    delete_product(db, product_id)
    return {"message": "Product deleted successfully."}
