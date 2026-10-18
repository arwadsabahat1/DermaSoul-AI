"""Seed/refresh education articles using rich, condition-specific knowledge.

Each article is generated from `app/rag_knowledge/condition_knowledge.json` so every
disease page has unique, informational content (overview, signs, causes, care,
what to avoid, red flags, when to seek a clinician, sources) instead of a single
generic template repeated across conditions.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from app.database import SessionLocal
from app.ml.class_labels import DISEASE_CLASS_LABELS
from app.models.education import EducationArticle
from app.schemas.education_schema import EducationArticleCreateRequest, EducationArticleUpdateRequest
from app.services.education_service import create_education_article, update_education_article


def _slugify(value: str) -> str:
    slug = value.lower().strip()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s_-]+", "-", slug)
    slug = re.sub(r"^-+|-+$", "", slug)
    return slug


CATEGORY_FOR_LABEL = {
    "Acne": "inflammatory",
    "Actinic Keratosis": "photodamage",
    "Benign Tumors": "benign-neoplasm",
    "Bullous": "blistering",
    "Candidiasis": "infection",
    "Drug Eruption": "reactive",
    "Eczema": "eczema",
    "Infestations/Bites": "infection",
    "Lichen": "inflammatory",
    "Lupus": "autoimmune",
    "Moles": "pigmented-lesions",
    "Psoriasis": "inflammatory",
    "Rosacea": "inflammatory",
    "Seborrheic Keratoses": "benign-lesions",
    "Skin Cancer": "oncology",
    "Sun/Sunlight Damage": "photodamage",
    "Tinea": "infection",
    "Unknown/Normal": "general",
    "Vascular Tumors": "vascular",
    "Vasculitis": "inflammatory-vascular",
    "Vitiligo": "pigmentary",
    "Warts": "infection",
}


def _knowledge_path() -> Path:
    return Path(__file__).resolve().parents[1] / "rag_knowledge" / "condition_knowledge.json"


def _load_knowledge_index() -> dict[str, dict[str, Any]]:
    try:
        rows = json.loads(_knowledge_path().read_text(encoding="utf-8"))
    except FileNotFoundError:
        return {}
    except json.JSONDecodeError:
        return {}
    if not isinstance(rows, list):
        return {}

    index: dict[str, dict[str, Any]] = {}
    for row in rows:
        if not isinstance(row, dict):
            continue
        for key in ("model_class", "condition_name"):
            value = row.get(key)
            if isinstance(value, str) and value.strip():
                index[_slugify(value)] = row
    return index


def _bullet_block(heading: str, items: list[str]) -> str:
    if not items:
        return ""
    cleaned = [str(it).strip() for it in items if str(it).strip()]
    if not cleaned:
        return ""
    body = "\n".join(f"- {item}" for item in cleaned)
    return f"{heading}\n{body}"


def _join_sections(sections: list[str]) -> str:
    return "\n\n".join(s for s in sections if s)


def _build_payload_from_knowledge(label: str, knowledge: dict[str, Any]) -> dict[str, Any]:
    slug = _slugify(label)
    category = CATEGORY_FOR_LABEL.get(label, knowledge.get("category") or "general")

    overview = str(knowledge.get("brief_overview") or "").strip()
    summary = overview or (
        f"{label} explained: how it can present, what to watch for, and when to seek in-person care."
    )

    overview_block = (
        f"What is {label}?\n{overview}" if overview else ""
    )
    signs_block = _bullet_block("Common signs to watch for", knowledge.get("common_signs") or [])
    causes_block = _bullet_block("Common triggers or causes", knowledge.get("common_triggers_or_causes") or [])
    care_block = _bullet_block("General care guidance", knowledge.get("general_care_guidance") or [])
    otc_block = _bullet_block("OTC support guidance", knowledge.get("otc_support_guidance") or [])
    avoid_block = _bullet_block("What to avoid", knowledge.get("what_to_avoid") or [])

    professional = str(knowledge.get("professional_note") or "").strip()
    professional_block = f"Clinical note\n{professional}" if professional else ""

    content = _join_sections(
        [overview_block, signs_block, causes_block, care_block, otc_block, avoid_block, professional_block]
    )

    if not content:
        content = (
            f"{label} is discussed clinically as part of a broader skin pattern. "
            "Use this page as preparation for a clinician visit when a confident diagnosis is needed."
        )

    red_flags = [str(rf).strip() for rf in (knowledge.get("red_flags") or []) if str(rf).strip()]
    if red_flags:
        warnings = "Seek prompt evaluation if you notice: " + "; ".join(red_flags) + "."
    else:
        warnings = (
            "Educational text only. Do not delay urgent evaluation if you have severe pain, fever, "
            "rapidly spreading rash, blistering, mucosal involvement, or non-healing lesions."
        )

    avoid_items = [str(a).strip() for a in (knowledge.get("what_to_avoid") or []) if str(a).strip()]
    if avoid_items:
        precautions = "Daily-care precautions: " + " ".join(avoid_items)
    else:
        precautions = (
            "Avoid combining unsupervised steroid creams, bleaching agents, or harsh peels on undiagnosed rashes; "
            "they can alter appearance and complicate medical assessment."
        )

    when_value = str(knowledge.get("when_to_seek_doctor") or "").strip()
    when_to_seek_doctor = when_value or (
        "Book an in-person dermatology or primary-care visit if a lesion is new, changing, painful, "
        "bleeding, non-healing, or significantly affects daily life."
    )

    sources = knowledge.get("source_urls") or []
    if isinstance(sources, list):
        source_urls = "\n".join(str(s).strip() for s in sources if str(s).strip())
    else:
        source_urls = str(sources).strip()
    if not source_urls:
        source_urls = "https://www.aad.org/public/diseases"

    return {
        "title": f"{label}: educational overview",
        "slug": slug,
        "category": category,
        "summary": summary,
        "content": content,
        "warnings": warnings,
        "precautions": precautions,
        "when_to_seek_doctor": when_to_seek_doctor,
        "source_urls": source_urls,
    }


def _generic_payload(label: str) -> dict[str, Any]:
    """Used only when no knowledge entry exists for a label."""
    slug = _slugify(label)
    cat = CATEGORY_FOR_LABEL.get(label, "general")
    summary = (
        f"Educational overview of {label.lower()} - how it is discussed clinically, why appearances vary, "
        "and when to seek in-person care."
    )
    content = (
        f"What is {label}?\n"
        f"{label} is a clinical label used to group certain skin patterns. It helps organize education, "
        "but it is not a final diagnosis by itself.\n\n"
        "How it can appear\n"
        "- Color, borders, and texture vary with skin tone, lighting, and camera quality.\n"
        "- The same condition can look different across people and body areas.\n"
        "- Early lesions and healing lesions may look very different from textbook images.\n\n"
        "Practical self-care while arranging care\n"
        "- Keep the area clean and avoid harsh scrubbing or picking.\n"
        "- Use gentle, fragrance-free moisturizer and sunscreen when relevant.\n"
        "- Avoid combining multiple strong active products at once.\n"
        "- Track onset date, spread, itch/pain level, and triggers to share with your clinician.\n\n"
        "Urgent red flags\n"
        "- Rapidly spreading rash\n"
        "- Severe pain, fever, confusion, or breathing difficulty\n"
        "- Eye, mouth, or genital involvement\n"
        "- Bleeding, skin peeling, pus, or non-healing lesions"
    )
    warnings = (
        "Educational text only. Do not delay urgent evaluation for symptoms that could indicate severe infection, "
        "Stevens-Johnson spectrum reactions, or other urgent conditions."
    )
    precautions = (
        "Avoid combining unsupervised steroid creams, bleaching agents, or harsh peels on undiagnosed rashes; "
        "they can alter appearance and complicate medical assessment."
    )
    when = (
        "Book an in-person dermatology or primary-care visit if a lesion is new or changing, bleeds easily, "
        "fails to heal, is painful, or affects your quality of life."
    )
    return {
        "title": f"{label}: educational overview",
        "slug": slug,
        "category": cat,
        "summary": summary,
        "content": content,
        "warnings": warnings,
        "precautions": precautions,
        "when_to_seek_doctor": when,
        "source_urls": "https://www.aad.org/public/diseases",
    }


def build_seed_rows() -> list[dict[str, Any]]:
    knowledge_index = _load_knowledge_index()
    rows: list[dict[str, Any]] = []
    for label in DISEASE_CLASS_LABELS:
        slug = _slugify(label)
        knowledge = knowledge_index.get(slug)
        if knowledge:
            rows.append(_build_payload_from_knowledge(label, knowledge))
        else:
            rows.append(_generic_payload(label))
    return rows


SEED_ARTICLES = build_seed_rows()


def main() -> None:
    db = SessionLocal()
    created = 0
    updated = 0
    try:
        for item in SEED_ARTICLES:
            existing = db.query(EducationArticle).filter(EducationArticle.slug == item["slug"]).first()
            if existing:
                update_education_article(db, item["slug"], EducationArticleUpdateRequest(**item))
                updated += 1
            else:
                create_education_article(db, EducationArticleCreateRequest(**item))
                created += 1
        print(f"Education seed complete. created={created}, updated={updated}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
