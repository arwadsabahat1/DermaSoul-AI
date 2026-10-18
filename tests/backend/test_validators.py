"""
Unit tests for email validation.
Registration validates the email with Pydantic's EmailStr (UserRegisterRequest); these tests check that rule
with various input scenarios.
"""

import unittest

from pydantic import ValidationError

from app.schemas.auth_schema import UserRegisterRequest


def validate_email_format(email: str) -> bool:
    """Return True when registration accepts the email, False when it is rejected."""
    try:
        UserRegisterRequest(email=email, password="SecurePass123!")
    except ValidationError:
        return False
    return True


class TestEmailValidation(unittest.TestCase):
    """Test suite for email validation functionality."""

    def test_valid_email_format(self):
        """Test standard valid email format."""
        self.assertTrue(validate_email_format("user@example.com"))

    def test_valid_email_with_subdomain(self):
        """Test email with subdomain in domain."""
        self.assertTrue(validate_email_format("user@mail.company.co.uk"))

    def test_invalid_email_no_at_symbol(self):
        """Test email without @ symbol."""
        self.assertFalse(validate_email_format("userexample.com"))

    def test_invalid_email_no_domain(self):
        """Test email with @ but no domain."""
        self.assertFalse(validate_email_format("user@"))

    def test_invalid_email_empty_string(self):
        """Test empty string input."""
        self.assertFalse(validate_email_format(""))

    def test_invalid_email_spaces_in_domain(self):
        """Test email with spaces in domain."""
        self.assertFalse(validate_email_format("user@exam ple.com"))

    def test_valid_email_plus_addressing(self):
        """Test valid email with plus addressing."""
        self.assertTrue(validate_email_format("user+tag@example.com"))

    def test_invalid_email_only_at_symbol(self):
        """Test string with only @ symbol."""
        self.assertFalse(validate_email_format("@"))

    def test_invalid_email_multiple_at_symbols(self):
        """Test email with multiple @ symbols."""
        self.assertFalse(validate_email_format("user@test@example.com"))

    def test_valid_email_with_numbers(self):
        """Test email with numbers in local part."""
        self.assertTrue(validate_email_format("user123@example.com"))


if __name__ == "__main__":
    unittest.main()
