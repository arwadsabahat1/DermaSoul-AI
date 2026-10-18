#!/usr/bin/env python3
"""Quick PDF debug test"""
import sys
from io import BytesIO
from app.models.consultation import Consultation
from app.services.pdf_report_service import PDFReportGenerator

# Create a mock consultation object
consultation = Consultation(
    id="test-123",
    user_id="user-456",
    symptoms="Red itchy skin",
    duration="2 weeks",
    severity="medium",
    predicted_disease="Eczema",
    disease_confidence=0.85,
    disease_confidence_level="high",
    predicted_skin_type="Oily",
    skin_type_confidence=0.90,
    skin_type_confidence_level="high",
    risk_level="medium",
    doctor_warning="Consult dermatologist if worsens",
    condition_explanation="Eczema is an inflammatory skin condition...",
    symptom_context="Itching and redness are common...",
    general_care_guidance=["Keep skin moisturized", "Avoid irritants"],
    what_to_avoid=["Harsh soaps", "Excessive heat"],
    safety_precautions=["Patch test new products", "Avoid allergens"],
    recommendations=[
        {"name": "Gentle Cleanser", "category": "Skincare", "safety": "Hypoallergenic"},
        {"name": "Moisturizer", "category": "Skincare", "safety": "Fragrance-free"}
    ],
    when_to_seek_doctor="If symptoms worsen or spread",
    professional_note="Severe eczema requires professional care",
    ai_limitations="This is an AI assessment, not medical diagnosis",
    knowledge_sources=["Medical database"],
)

try:
    print("Generating PDF...")
    generator = PDFReportGenerator()
    pdf_bytes = generator.generate_report(consultation)
    print(f"✓ PDF generated successfully: {len(pdf_bytes)} bytes")
    
    # Save to file
    with open("test_output.pdf", "wb") as f:
        f.write(pdf_bytes)
    print("✓ PDF saved to test_output.pdf")
    
except Exception as e:
    print(f"✗ Error: {type(e).__name__}: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
