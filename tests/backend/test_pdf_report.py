"""PDF report generation must survive any text a user can type (ReportLab treats text as markup)."""

import unittest
from datetime import datetime

from app.models.consultation import Consultation
from app.services.pdf_report_service import PDFReportGenerator


def _consultation(**overrides) -> Consultation:
    fields = dict(
        id="0f6c2a9e-0000-0000-0000-000000000000",
        created_at=datetime(2026, 10, 18, 12, 0),
        symptoms="Itchy red patches",
        predicted_disease="Eczema",
        disease_confidence=0.91,
        disease_confidence_level="high",
        predicted_skin_type="dry",
        skin_type_confidence=0.7,
        risk_level="Moderate",
        doctor_warning="Please consult a dermatologist if symptoms persist.",
        extracted_symptoms=["itching", "redness"],
        extracted_duration="2 weeks",
        inferred_severity="mild",
        red_flags=[],
        condition_explanation="Eczema is a common inflammatory skin condition.",
        general_care_guidance=["Moisturize regularly."],
        recommendations=[],
    )
    fields.update(overrides)
    return Consultation(**fields)


class PdfReportTests(unittest.TestCase):
    def test_normal_consultation_produces_a_pdf(self):
        pdf = PDFReportGenerator().generate_report(_consultation())
        self.assertTrue(pdf.startswith(b"%PDF"))

    def test_markup_like_user_text_does_not_break_the_pdf(self):
        for text in ["<b>bold", "a </para> b", "pain <3 days & redness", "<font size=99>x</font>"]:
            with self.subTest(text=text):
                pdf = PDFReportGenerator().generate_report(_consultation(
                    extracted_duration=text,
                    extracted_symptoms=[text, "itching"],
                    inferred_severity=text,
                    doctor_warning=text,
                    condition_explanation=text,
                    symptom_context=text,
                    general_care_guidance=[text],
                    what_to_avoid=[text],
                    safety_precautions=[text],
                    when_to_seek_doctor=text,
                    professional_note=text,
                ))
                self.assertTrue(pdf.startswith(b"%PDF"))


if __name__ == "__main__":
    unittest.main()
