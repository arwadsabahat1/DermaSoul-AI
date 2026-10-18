"""Admin (database) products must follow the same high-risk and red-flag rules as the curated product list."""

import unittest

from app.models.product import Product
from app.services.recommendation_service import generate_safe_recommendations, product_type_from_category


class _FakeQuery:
    def __init__(self, rows):
        self.rows = rows

    def order_by(self, *args):
        return self

    def all(self):
        return self.rows


class _FakeSession:
    def __init__(self, rows):
        self.rows = rows

    def query(self, model):
        return _FakeQuery(self.rows)


RETINOID = Product(id="db-retinoid", name="Adapalene gel", category="pharmacist-guided-otc",
                   supported_conditions="Acne", suitable_skin_types="oily")
ACTIVE = Product(id="db-active", name="Benzoyl peroxide wash", category="otc-active",
                 supported_conditions="Acne", suitable_skin_types="oily")
CLEANSER = Product(id="db-cleanser", name="Gentle cleanser", category="supportive-skincare",
                   supported_conditions="Acne", suitable_skin_types="oily")


class ProductTypeMappingTests(unittest.TestCase):
    def test_categories_map_to_product_types(self):
        self.assertEqual(product_type_from_category("pharmacist-guided-otc"), "pharmacist_guided_otc")
        self.assertEqual(product_type_from_category("otc-active"), "otc_active")
        self.assertEqual(product_type_from_category("Preventive Skincare"), "preventive_skincare")
        self.assertEqual(product_type_from_category("cleanser"), "supportive_skincare")
        self.assertEqual(product_type_from_category(None), "supportive_skincare")


class DatabaseProductSafetyTests(unittest.TestCase):
    def _categories(self, risk_level, red_flags):
        # Check the product's real category: the bug was that `product_type` itself was mislabelled.
        result = generate_safe_recommendations(
            predicted_disease="Acne", predicted_skin_type="oily", risk_level=risk_level, red_flags=red_flags,
            db=_FakeSession([RETINOID, ACTIVE, CLEANSER]),
        )
        return {item["category"] for item in result["recommendations"]}

    def test_high_risk_blocks_active_and_pharmacist_guided_database_products(self):
        categories = self._categories("High", [])
        self.assertNotIn("otc-active", categories)
        self.assertNotIn("pharmacist-guided-otc", categories)
        self.assertIn("supportive-skincare", categories)

    def test_red_flag_blocks_database_otc_actives(self):
        self.assertNotIn("otc-active", self._categories("Low to Moderate", ["pus_or_infection"]))


if __name__ == "__main__":
    unittest.main()
