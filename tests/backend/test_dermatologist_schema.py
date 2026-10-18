"""Validation checks for optional dermatologist profile photos."""

import unittest

from pydantic import ValidationError

from app.schemas.dermatologist_schema import DermatologistCreateRequest, DermatologistUpdateRequest


class DermatologistProfileImageValidationTests(unittest.TestCase):
    def test_create_accepts_https_photo_url(self):
        doctor = DermatologistCreateRequest(
            full_name="Dr Example",
            profile_image_url="https://example.org/provider.jpg",
        )
        self.assertEqual(doctor.profile_image_url.scheme, "https")

    def test_create_rejects_insecure_http_photo_url(self):
        with self.assertRaises(ValidationError):
            DermatologistCreateRequest(
                full_name="Dr Example",
                profile_image_url="http://example.org/provider.jpg",
            )

    def test_update_rejects_insecure_http_photo_url(self):
        with self.assertRaises(ValidationError):
            DermatologistUpdateRequest(profile_image_url="http://example.org/provider.jpg")

    def test_photo_url_is_optional(self):
        doctor = DermatologistCreateRequest(full_name="Dr Example")
        self.assertIsNone(doctor.profile_image_url)


if __name__ == "__main__":
    unittest.main()
