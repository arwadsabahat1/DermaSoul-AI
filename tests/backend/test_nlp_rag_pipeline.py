"""Regression tests for the NLP entity pipeline and the RAG assessment layer."""

import unittest
from unittest import mock

from app.services import nlp_entities_service
from app.services.nlp_pipeline import URGENCY_FOLLOWUP, refresh_urgency, run_nlp_pipeline
from app.services.rag_rerank_service import rerank_context
from app.services.rag_service import generate_structured_rag_assessment, select_related_conditions


def _run(text, **overrides):
    kwargs = dict(
        symptoms_text=text,
        medical_history=None,
        supplied_duration=None,
        supplied_severity=None,
        risk_level="Uncertain",
        red_flags=[],
    )
    kwargs.update(overrides)
    return run_nlp_pipeline(**kwargs)


class ModelLabelMappingTests(unittest.TestCase):
    def test_model_labels_map_to_pipeline_labels(self):
        self.assertEqual(nlp_entities_service._map_model_label("Sign_symptom", "rash"), "SYMPTOM")
        self.assertEqual(nlp_entities_service._map_model_label("Biological_structure", "elbow"), "BODY_PART")
        self.assertEqual(nlp_entities_service._map_model_label("Duration", "2_weeks"), "DURATION")

    def test_descriptors_only_count_for_known_skin_terms(self):
        self.assertEqual(nlp_entities_service._map_model_label("Color", "redness"), "SYMPTOM")
        self.assertEqual(nlp_entities_service._map_model_label("Detailed_description", "small"), "Detailed_description")


class EntityExtractionTests(unittest.TestCase):
    def test_model_failure_falls_back_to_rules(self):
        with mock.patch.object(nlp_entities_service, "_model_entities", return_value=None):
            entities, model_used = nlp_entities_service.extract_medical_entities_with_source("itchy rash on my arm")
        self.assertFalse(model_used)
        labels = {(e["label"], e["normalized"]) for e in entities}
        self.assertIn(("SYMPTOM", "itching"), labels)
        self.assertIn(("BODY_PART", "arm"), labels)

    def test_rule_entities_are_merged_with_model_entities(self):
        model_only = [{"text": "rash", "label": "SYMPTOM", "normalized": "rash", "confidence": 0.9,
                       "start": 6, "end": 10, "source": "model"}]
        with mock.patch.object(nlp_entities_service, "_model_entities", return_value=model_only):
            entities, model_used = nlp_entities_service.extract_medical_entities_with_source("itchy rash")
        self.assertTrue(model_used)
        self.assertEqual([e["normalized"] for e in entities], ["itching", "rash"])

    def test_roman_urdu_terms_are_recognised(self):
        with mock.patch.object(nlp_entities_service, "_model_entities", return_value=None):
            result = _run("khujli aur jalan on my arm")
        self.assertEqual(result["extracted_symptoms"], ["itching", "burning"])
        self.assertEqual(result["nlp_model_version"], "rule-fallback-v2")


class PipelineTests(unittest.TestCase):
    def test_negated_terms_are_excluded(self):
        result = _run("Itchy red rash but no fever and no pus")
        self.assertIn("itching", result["extracted_symptoms"])
        self.assertNotIn("fever", result["extracted_symptoms"])
        self.assertNotIn("pus_or_discharge", result["extracted_symptoms"])

    def test_duration_keeps_plural_unit(self):
        self.assertEqual(_run("rash for 2 weeks")["extracted_duration"], "2 weeks")

    def test_refresh_urgency_uses_final_risk(self):
        result = _run("dry skin on my hand")
        self.assertIn(URGENCY_FOLLOWUP, result["followup_candidates"])  # computed with "Uncertain"

        refresh_urgency(result, text="dry skin on my hand", red_flags=[], risk_level="Low to Moderate")
        self.assertEqual(result["urgency_class"], "low")
        self.assertNotIn(URGENCY_FOLLOWUP, result["followup_candidates"])

        refresh_urgency(result, text="dry skin on my hand", red_flags=["open_wound"], risk_level="High")
        self.assertEqual(result["urgency_class"], "high")
        self.assertEqual(result["followup_candidates"].count(URGENCY_FOLLOWUP), 1)


class RagTests(unittest.TestCase):
    def test_retrieval_confidence_is_raw_cosine(self):
        trace = rerank_context("q", [{"retrieval_score": 0.7}, {"retrieval_score": -0.2}])
        self.assertEqual([row["retrieval_confidence"] for row in trace], [0.7, 0.0])

    def test_related_conditions_exclude_primary_and_use_kb_entries(self):
        primary = {"model_class": "Tinea"}
        structured = [{"model_class": "Tinea", "retrieval_score": 120}, {"model_class": "Eczema", "retrieval_score": 12}]
        semantic = [{"metadata": {"model_class": "Psoriasis"}, "retrieval_score": 0.7},
                    {"metadata": {"model_class": "Tinea"}, "retrieval_score": 0.9}]
        related = select_related_conditions(primary, structured, semantic)
        self.assertEqual([entry["model_class"] for entry in related], ["Psoriasis", "Eczema"])
        self.assertIn("red_flags", related[0])

    def _assess(self, disease, confidence, symptoms):
        return generate_structured_rag_assessment(
            predicted_disease=disease, disease_confidence=confidence, disease_confidence_level="High",
            predicted_skin_type="dry", skin_type_confidence=0.6, skin_type_confidence_level="Medium",
            extracted_symptoms=symptoms, red_flags=[], risk_level="Moderate", doctor_warning="See a doctor.",
        )

    def test_confident_matching_prediction_has_no_related_conditions(self):
        result = self._assess("Eczema", 0.9, ["itching", "redness"])
        self.assertEqual({source["condition"] for source in result["knowledge_sources"]}, {"Eczema"})
        self.assertNotIn("also resemble", result["symptom_context"])

    def test_low_confidence_prediction_surfaces_related_conditions(self):
        result = self._assess("Tinea", 0.3, ["itching", "dryness", "scaling"])
        self.assertIn("also resemble", result["symptom_context"])
        self.assertGreater(len({source["condition"] for source in result["knowledge_sources"]}), 1)
        self.assertTrue(all(source["url"] for source in result["knowledge_sources"]))


if __name__ == "__main__":
    unittest.main()
