import json
from functools import lru_cache
from pathlib import Path
from typing import Any
from sqlalchemy.orm import Session

from app.models.product import Product


HIGH_RISK_SUPPORTIVE_PRODUCT_IDS = {
    "gentle_cleanser",
    "fragrance_free_moisturizer",
    "broad_spectrum_sunscreen",
    "cold_compress",
}


HIGH_RISK_BLOCKED_PRODUCT_TYPES = {
    "otc_active",
    "pharmacist_guided_otc",
}


KNOWN_PRODUCT_TYPES = {
    "barrier_support",
    "non_medicine_support",
    "otc_active",
    "pharmacist_guided_otc",
    "preventive_skincare",
    "supportive_skincare",
    "symptom_support",
}


def product_type_from_category(category: str | None) -> str:
    """Map an admin product category (e.g. "pharmacist-guided-otc") to its product type, so the
    high-risk and red-flag rules apply to database products exactly as they do to the curated list."""
    key = (category or "").strip().lower().replace("-", "_").replace(" ", "_")
    return key if key in KNOWN_PRODUCT_TYPES else "supportive_skincare"


def normalize_text(value: str | None) -> str:
    if not value:
        return ""

    return value.strip().lower()


def normalize_list(values: list[str] | None) -> list[str]:
    if not values:
        return []

    return [normalize_text(value) for value in values if value]


def split_user_allergies(value: str | None) -> list[str]:
    if not value:
        return []

    separators = [",", ";", "|", "\n"]
    normalized = value

    for separator in separators:
        normalized = normalized.replace(separator, ",")

    return [
        item.strip().lower()
        for item in normalized.split(",")
        if item.strip()
    ]


def get_products_file_path() -> Path:
    current_file = Path(__file__).resolve()
    app_dir = current_file.parent.parent
    return app_dir / "rag_knowledge" / "safe_otc_products.json"


@lru_cache(maxsize=1)
def load_safe_otc_products() -> list[dict[str, Any]]:
    product_path = get_products_file_path()

    if not product_path.exists():
        raise FileNotFoundError(
            f"Safe OTC product knowledge file not found at: {product_path}"
        )

    with product_path.open("r", encoding="utf-8") as file:
        products = json.load(file)

    if not isinstance(products, list):
        raise ValueError("Safe OTC product knowledge must be a list.")

    return products


def has_allergy_conflict(
    product: dict[str, Any],
    known_allergies: list[str],
) -> bool:
    avoid_allergens = normalize_list(product.get("avoid_if_allergic_to", []))

    for allergy in known_allergies:
        for avoid_item in avoid_allergens:
            if allergy in avoid_item or avoid_item in allergy:
                return True

    return False


def has_red_flag_conflict(
    product: dict[str, Any],
    red_flags: list[str],
) -> bool:
    product_red_flag_blocks = normalize_list(product.get("avoid_if_red_flags", []))
    normalized_red_flags = normalize_list(red_flags)

    for flag in normalized_red_flags:
        for blocked_flag in product_red_flag_blocks:
            if flag == blocked_flag:
                return True

    return False


def is_condition_match(
    product: dict[str, Any],
    predicted_disease: str,
) -> bool:
    recommended_conditions = normalize_list(
        product.get("recommended_for_conditions", [])
    )

    disease = normalize_text(predicted_disease)
    return disease in recommended_conditions


def is_skin_type_match(
    product: dict[str, Any],
    predicted_skin_type: str,
) -> bool:
    recommended_skin_types = normalize_list(
        product.get("recommended_for_skin_types", [])
    )

    skin_type = normalize_text(predicted_skin_type)
    return skin_type in recommended_skin_types


def is_condition_blocked(
    product: dict[str, Any],
    predicted_disease: str,
) -> bool:
    avoid_conditions = normalize_list(product.get("avoid_for_conditions", []))
    disease = normalize_text(predicted_disease)
    return disease in avoid_conditions


def calculate_product_score(
    product: dict[str, Any],
    predicted_disease: str,
    predicted_skin_type: str,
    risk_level: str,
    red_flags: list[str],
) -> int:
    score = 0

    product_id = product.get("id")
    product_type = normalize_text(product.get("product_type"))
    risk = normalize_text(risk_level)

    if is_condition_match(product, predicted_disease):
        score += 50

    if is_skin_type_match(product, predicted_skin_type):
        score += 20

    if product_type in {
        "supportive_skincare",
        "preventive_skincare",
        "non_medicine_support",
        "barrier_support",
    }:
        score += 10

    if risk == "high":
        if product_id in HIGH_RISK_SUPPORTIVE_PRODUCT_IDS:
            score += 15

        if product_type in HIGH_RISK_BLOCKED_PRODUCT_TYPES:
            score -= 100

    if red_flags and product_type == "otc_active":
        score -= 100

    return score


def build_recommendation_safety_note(
    risk_level: str,
    red_flags: list[str],
) -> str:
    if normalize_text(risk_level) == "high":
        return (
            "Because red-flag symptoms or high-risk indicators are present, recommendations are limited to basic supportive care. "
            "Do not rely on OTC products as treatment. Please consult a dermatologist or qualified doctor as soon as possible."
        )

    if red_flags:
        return (
            "Some warning indicators were detected. Use only gentle supportive care and seek professional medical advice if symptoms persist or worsen."
        )

    return (
        "These are general OTC/supportive product categories, not prescriptions. Patch test new skincare products, avoid known allergens, "
        "and consult a pharmacist or dermatologist if unsure."
    )


def build_melanin_recommendation_note(
    skin_tone: str | None = None,
    fitzpatrick_type: str | None = None,
    ethnicity_region: str | None = None,
) -> str:
    if not skin_tone and not fitzpatrick_type and not ethnicity_region:
        return ""

    return (
        " For melanin-rich or pigmentation-prone skin, avoid harsh bleaching/lightening creams, steroid-mixed combination creams, "
        "and aggressive exfoliation because irritation may worsen pigmentation or leave dark marks. "
        "Daily sunscreen is especially important when dealing with acne marks, hyperpigmentation, melasma, "
        "or inflammation-related dark spots."
    )


def generate_safe_recommendations(
    predicted_disease: str,
    predicted_skin_type: str,
    risk_level: str,
    red_flags: list[str],
    known_allergies_text: str | None = None,
    skin_tone: str | None = None,
    fitzpatrick_type: str | None = None,
    ethnicity_region: str | None = None,
    max_recommendations: int = 4,
    db: Session | None = None,
) -> dict[str, Any]:
    products = load_safe_otc_products()
    recommendation_source = "json"

    if db is not None:
        db_products = db.query(Product).order_by(Product.updated_at.desc()).all()
        if db_products:
            transformed_db_products = []
            for product in db_products:
                transformed_db_products.append(
                    {
                        "id": product.id,
                        "category": product.category or "General",
                        "product_type": product_type_from_category(product.category),
                        "purpose": (
                            product.supported_conditions
                            or "Supportive skincare option based on condition and skin type."
                        ),
                        "safety_note": (
                            product.contraindications
                            or "Patch test first and avoid if irritation occurs."
                        ),
                        "recommended_for_conditions": split_user_allergies(product.supported_conditions),
                        "recommended_for_skin_types": split_user_allergies(product.suitable_skin_types),
                        "avoid_if_allergic_to": split_user_allergies(product.avoid_if_allergic_to),
                        "avoid_for_conditions": [],
                        "avoid_if_red_flags": [],
                    }
                )

            products = transformed_db_products + products
            recommendation_source = "hybrid"

    known_allergies = split_user_allergies(known_allergies_text)

    eligible_products = []

    for product in products:
        if is_condition_blocked(product, predicted_disease):
            continue

        if has_allergy_conflict(product, known_allergies):
            continue

        if has_red_flag_conflict(product, red_flags):
            continue

        score = calculate_product_score(
            product=product,
            predicted_disease=predicted_disease,
            predicted_skin_type=predicted_skin_type,
            risk_level=risk_level,
            red_flags=red_flags,
        )

        if score <= 0:
            continue

        eligible_products.append(
            {
                "category": product["category"],
                "product_type": product["product_type"],
                "purpose": product["purpose"],
                "safety_note": product["safety_note"],
                "score": score,
            }
        )

    eligible_products.sort(
        key=lambda item: item["score"],
        reverse=True,
    )

    final_recommendations = []

    for item in eligible_products[:max_recommendations]:
        item.pop("score", None)
        final_recommendations.append(item)

    recommendation_safety_note = (
        build_recommendation_safety_note(
            risk_level=risk_level,
            red_flags=red_flags,
        )
        + build_melanin_recommendation_note(
            skin_tone=skin_tone,
            fitzpatrick_type=fitzpatrick_type,
            ethnicity_region=ethnicity_region,
        )
    )

    return {
        "recommendations": final_recommendations,
        "recommendation_safety_note": recommendation_safety_note,
        "allergy_filter_applied": bool(known_allergies),
        "recommendation_source": recommendation_source,
    }