"""Dependency-light regression tests for deterministic safety rules."""

import unittest

from app.services.red_flag_service import calculate_risk_level, detect_red_flags
from app.services.safety_policy_service import enforce_safety_policy


class RedFlagDetectionTests(unittest.TestCase):
    def test_detects_flags_case_insensitively_across_symptoms_and_history(self):
        flags = detect_red_flags(
            "The rash is RAPIDLY SPREADING",
            "There was also difficulty breathing yesterday.",
        )

        self.assertEqual(flags, ["breathing_or_face_swelling", "rapidly_spreading"])

    def test_deduplicates_flags_and_returns_empty_for_unmatched_text(self):
        flags = detect_red_flags(
            "Pus around the rash; yellow discharge is present.",
            "No other concerns.",
        )
        self.assertEqual(flags, ["pus_or_infection"])
        self.assertEqual(detect_red_flags("Dry skin for two days."), [])

    def test_ignores_red_flags_the_user_explicitly_denies(self):
        self.assertEqual(detect_red_flags("Itchy red rash but no fever and no pus"), [])
        self.assertEqual(detect_red_flags("It is not spreading quickly and I don't have chills"), [])
        self.assertEqual(detect_red_flags("Rash without pus, no high fever"), [])
        self.assertEqual(detect_red_flags("Dry patches", "Patient denies difficulty breathing"), [])
        self.assertEqual(detect_red_flags("It isn’t a bleeding mole and there is no changing mole"), [])

    def test_negation_does_not_hide_flags_in_a_separate_clause(self):
        self.assertEqual(detect_red_flags("No itching, but fever since yesterday"), ["fever_with_skin_issue"])
        self.assertEqual(detect_red_flags("No pain. The rash is rapidly spreading"), ["rapidly_spreading"])
        self.assertEqual(detect_red_flags("No fever at first, now high fever and pus"),
                         ["fever_with_skin_issue", "pus_or_infection"])
        self.assertEqual(detect_red_flags("rash is rapidly spreading with fever"),
                         ["fever_with_skin_issue", "rapidly_spreading"])


class RiskLevelTests(unittest.TestCase):
    def test_red_flags_and_high_risk_predictions_take_priority(self):
        self.assertEqual(
            calculate_risk_level("Acne", 0.99, ["rapidly_spreading"], "mild"),
            "High",
        )
        self.assertEqual(
            calculate_risk_level("Skin Cancer", 0.99, [], "mild"),
            "High",
        )

    def test_severity_and_confidence_boundaries(self):
        self.assertEqual(calculate_risk_level("Acne", 0.9, [], "severe"), "High")
        self.assertEqual(calculate_risk_level("Eczema", 0.50, [], "mild"), "Moderate")
        self.assertEqual(calculate_risk_level("Eczema", 0.49, [], "mild"), "Uncertain")
        self.assertEqual(calculate_risk_level("Acne", 0.49, [], "mild"), "Uncertain")
        self.assertEqual(calculate_risk_level("Acne", 0.75, [], "moderate"), "Moderate")
        self.assertEqual(calculate_risk_level("Acne", 0.75, [], "mild"), "Low to Moderate")


class SafetyPolicyTests(unittest.TestCase):
    def test_high_risk_escalates_and_preserves_existing_steps(self):
        payload = {"next_steps": ["Keep notes on changes."]}

        result = enforce_safety_policy(
            llm_payload=payload,
            risk_level=" HIGH ",
            red_flags=[],
            doctor_warning="Please seek prompt medical evaluation.",
        )

        self.assertTrue(result["safety_escalation_enforced"])
        self.assertEqual(result["doctor_warning"], "Please seek prompt medical evaluation.")
        self.assertEqual(len(result["next_steps"]), 2)
        self.assertIn("Keep notes on changes.", result["next_steps"])

    def test_red_flag_escalates_even_when_risk_label_is_not_high(self):
        result = enforce_safety_policy(
            llm_payload={"next_steps": []},
            risk_level="Low to Moderate",
            red_flags=["breathing_or_face_swelling"],
            doctor_warning="Seek urgent medical care.",
        )

        self.assertTrue(result["safety_escalation_enforced"])
        self.assertEqual(result["next_steps"][0], "Urgent in-person medical evaluation is recommended due to high-risk indicators.")

    def test_low_risk_does_not_add_escalation(self):
        payload = {"next_steps": ["Monitor for changes."]}
        result = enforce_safety_policy(
            llm_payload=payload,
            risk_level="Low to Moderate",
            red_flags=[],
            doctor_warning="General guidance.",
        )

        self.assertFalse(result["safety_escalation_enforced"])
        self.assertEqual(result["next_steps"], ["Monitor for changes."])

    def test_high_risk_does_not_mutate_the_input_payload(self):
        payload = {"next_steps": ["Keep notes on changes."]}
        original_steps = list(payload["next_steps"])

        enforce_safety_policy(
            llm_payload=payload,
            risk_level="High",
            red_flags=[],
            doctor_warning="Seek medical care.",
        )

        self.assertEqual(payload["next_steps"], original_steps)


if __name__ == "__main__":
    unittest.main()