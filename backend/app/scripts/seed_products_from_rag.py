from app.database import SessionLocal
from app.models.product import Product
from app.services.recommendation_service import load_safe_otc_products


def _join(values: list[str] | None) -> str | None:
    if not values:
        return None
    cleaned = [v.strip() for v in values if isinstance(v, str) and v.strip()]
    if not cleaned:
        return None
    return ", ".join(cleaned)


def main() -> None:
    source_rows = load_safe_otc_products()
    db = SessionLocal()
    created = 0
    updated = 0
    try:
        for item in source_rows:
            name = str(item.get("category") or "").strip()
            if not name:
                continue

            existing = db.query(Product).filter(Product.name == name).first()
            payload = {
                "name": name,
                "brand": "RAG OTC Catalog",
                "category": str(item.get("product_type") or "supportive_skincare").replace("_", "-"),
                "ingredients": None,
                "suitable_skin_types": _join(item.get("recommended_for_skin_types")),
                "supported_conditions": _join(item.get("recommended_for_conditions")),
                "avoid_if_allergic_to": _join(item.get("avoid_if_allergic_to")),
                "contraindications": str(item.get("safety_note") or "").strip() or None,
                "price_range": "varies",
                "availability": "OTC / pharmacist-guided (region dependent)",
                "product_url": None,
            }

            if existing:
                for key, value in payload.items():
                    setattr(existing, key, value)
                updated += 1
            else:
                db.add(Product(**payload))
                created += 1

        db.commit()
        print(f"Product seed complete. created={created}, updated={updated}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
