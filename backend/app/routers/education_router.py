from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.routers.auth_router import get_admin_user
from app.schemas.education_schema import (
    EducationArticleCreateRequest,
    EducationKnowledgeResponse,
    EducationArticleDetailResponse,
    EducationArticleListResponse,
    EducationArticleUpdateRequest,
)
from app.services.education_service import (
    create_education_article,
    delete_education_article,
    get_education_by_slug,
    get_condition_knowledge_by_slug,
    list_education_articles,
    list_related_articles,
    update_education_article,
)


router = APIRouter(
    prefix="/api/education",
    tags=["Education"]
)


@router.get("", response_model=list[EducationArticleListResponse])
def get_education_articles(
    category: str | None = Query(default=None),
    search: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db)
):
    return list_education_articles(
        db=db,
        category=category,
        search=search,
        limit=limit,
        offset=offset
    )


@router.get("/{slug}", response_model=EducationArticleDetailResponse)
def get_education_article(
    slug: str,
    db: Session = Depends(get_db)
):
    return get_education_by_slug(db, slug)


@router.get("/{slug}/related", response_model=list[EducationArticleListResponse])
def get_related_education_articles(
    slug: str,
    limit: int = Query(default=3, ge=1, le=20),
    db: Session = Depends(get_db)
):
    return list_related_articles(
        db=db,
        slug=slug,
        limit=limit
    )


@router.get("/{slug}/knowledge", response_model=EducationKnowledgeResponse)
def get_education_knowledge(slug: str):
    return get_condition_knowledge_by_slug(slug)


@router.post(
    "",
    response_model=EducationArticleDetailResponse,
    status_code=status.HTTP_201_CREATED
)
def add_education_article(
    data: EducationArticleCreateRequest,
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    return create_education_article(db, data)


@router.put("/{slug}", response_model=EducationArticleDetailResponse)
def edit_education_article(
    slug: str,
    data: EducationArticleUpdateRequest,
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    return update_education_article(db, slug, data)


@router.delete("/{slug}")
def remove_education_article(
    slug: str,
    _: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    delete_education_article(db, slug)
    return {"message": "Education article deleted successfully."}
