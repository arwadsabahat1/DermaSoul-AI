import re
import json
from functools import lru_cache
from pathlib import Path

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.education import EducationArticle
from app.schemas.education_schema import (
    EducationArticleCreateRequest,
    EducationArticleUpdateRequest,
)


def _normalize_optional_text(value: str | None) -> str | None:
    if value is None:
        return None

    cleaned = value.strip()
    if cleaned == "":
        return None

    return cleaned


def _slugify(value: str) -> str:
    slug = value.lower().strip()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s_-]+", "-", slug)
    slug = re.sub(r"^-+|-+$", "", slug)
    return slug


@lru_cache(maxsize=1)
def _load_condition_knowledge_rows() -> list[dict]:
    fp = Path(__file__).resolve().parents[1] / "rag_knowledge" / "condition_knowledge.json"
    try:
        raw = json.loads(fp.read_text(encoding="utf-8"))
    except Exception:
        return []
    return raw if isinstance(raw, list) else []


@lru_cache(maxsize=1)
def _knowledge_by_slug() -> dict[str, dict]:
    by_slug: dict[str, dict] = {}
    for row in _load_condition_knowledge_rows():
        if not isinstance(row, dict):
            continue
        model_class = row.get("model_class")
        condition_name = row.get("condition_name")
        if isinstance(model_class, str) and model_class.strip():
            by_slug[_slugify(model_class)] = row
        if isinstance(condition_name, str) and condition_name.strip():
            by_slug[_slugify(condition_name)] = row
    return by_slug


def _build_summary(content: str, fallback_summary: str | None) -> str | None:
    summary = _normalize_optional_text(fallback_summary)
    if summary:
        return summary

    normalized_content = _normalize_optional_text(content)
    if not normalized_content:
        return None

    return normalized_content[:220] + ("..." if len(normalized_content) > 220 else "")


def _ensure_unique_slug(db: Session, slug: str, current_id: str | None = None) -> str:
    base_slug = slug
    index = 2

    while True:
        query = db.query(EducationArticle).filter(EducationArticle.slug == slug)
        if current_id:
            query = query.filter(EducationArticle.id != current_id)

        if not query.first():
            return slug

        slug = f"{base_slug}-{index}"
        index += 1


def list_education_articles(
    db: Session,
    category: str | None = None,
    search: str | None = None,
    limit: int = 20,
    offset: int = 0
) -> list[EducationArticle]:
    query = db.query(EducationArticle)

    if category:
        query = query.filter(EducationArticle.category.ilike(category.strip()))

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                EducationArticle.title.ilike(search_term),
                EducationArticle.summary.ilike(search_term),
                EducationArticle.content.ilike(search_term),
                EducationArticle.category.ilike(search_term),
            )
        )

    return query.order_by(EducationArticle.updated_at.desc()).offset(offset).limit(limit).all()


def get_education_by_slug(db: Session, slug: str) -> EducationArticle:
    article = db.query(EducationArticle).filter(EducationArticle.slug == slug).first()

    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Education article not found."
        )

    return article


def list_related_articles(
    db: Session,
    slug: str,
    limit: int = 3
) -> list[EducationArticle]:
    article = get_education_by_slug(db, slug)

    return db.query(EducationArticle).filter(
        EducationArticle.category == article.category,
        EducationArticle.slug != article.slug
    ).order_by(
        EducationArticle.updated_at.desc()
    ).limit(limit).all()


def get_condition_knowledge_by_slug(slug: str) -> dict:
    row = _knowledge_by_slug().get(_slugify(slug))
    if row:
        return row

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Condition knowledge not found.",
    )


def suggest_article_for_diagnosis(
    db: Session,
    predicted_disease: str
) -> EducationArticle | None:
    normalized = _normalize_optional_text(predicted_disease)
    if not normalized:
        return None

    slug_candidate = _slugify(normalized)

    exact_slug_match = db.query(EducationArticle).filter(
        EducationArticle.slug == slug_candidate
    ).first()
    if exact_slug_match:
        return exact_slug_match

    search_term = f"%{normalized}%"
    return db.query(EducationArticle).filter(
        or_(
            EducationArticle.title.ilike(search_term),
            EducationArticle.content.ilike(search_term),
            EducationArticle.category.ilike(search_term),
        )
    ).order_by(EducationArticle.updated_at.desc()).first()


def create_education_article(
    db: Session,
    data: EducationArticleCreateRequest
) -> EducationArticle:
    raw_slug = _normalize_optional_text(data.slug)
    requested_slug = _slugify(raw_slug) if raw_slug else _slugify(data.title)
    unique_slug = _ensure_unique_slug(db, requested_slug)

    article = EducationArticle(
        title=data.title.strip(),
        slug=unique_slug,
        category=data.category.strip().lower(),
        summary=_build_summary(data.content, data.summary),
        content=data.content.strip(),
        warnings=_normalize_optional_text(data.warnings),
        precautions=_normalize_optional_text(data.precautions),
        when_to_seek_doctor=_normalize_optional_text(data.when_to_seek_doctor),
        source_urls=_normalize_optional_text(data.source_urls),
    )

    db.add(article)
    db.commit()
    db.refresh(article)

    return article


def update_education_article(
    db: Session,
    slug: str,
    data: EducationArticleUpdateRequest
) -> EducationArticle:
    article = get_education_by_slug(db, slug)
    update_data = data.model_dump(exclude_unset=True)

    if "title" in update_data and isinstance(update_data["title"], str):
        update_data["title"] = update_data["title"].strip()

    if "category" in update_data and isinstance(update_data["category"], str):
        update_data["category"] = update_data["category"].strip().lower()

    if "slug" in update_data:
        raw_slug = _normalize_optional_text(update_data["slug"])
        if raw_slug:
            update_data["slug"] = _ensure_unique_slug(db, _slugify(raw_slug), current_id=article.id)
        else:
            update_data["slug"] = _ensure_unique_slug(db, _slugify(article.title), current_id=article.id)

    for field, value in update_data.items():
        if isinstance(value, str):
            value = _normalize_optional_text(value)
        setattr(article, field, value)

    article.summary = _build_summary(article.content, article.summary)

    db.commit()
    db.refresh(article)

    return article


def delete_education_article(db: Session, slug: str) -> None:
    article = get_education_by_slug(db, slug)
    db.delete(article)
    db.commit()
