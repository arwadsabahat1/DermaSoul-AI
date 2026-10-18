#!/usr/bin/env python3
"""Simple PDF endpoint test with existing consultation"""
import requests
from app.database import SessionLocal
from app.models.user import User

BASE_URL = "http://127.0.0.1:8000"
API_PREFIX = "/api"

# Get database session
db = SessionLocal()

try:
    # Get first user
    user = db.query(User).first()
    if not user:
        print("✗ No users found in database")
        exit(1)
    
    user_email = user.email
    print(f"✓ Found test user: {user_email}")
    
    # Get consultations for this user
    consultations = [c for c in user.consultations] if hasattr(user, 'consultations') else []
    if not consultations:
        print("✗ No consultations found for this user")
        exit(1)
    
    consultation_id = consultations[0].id
    print(f"✓ Using consultation: {consultation_id}")
    print(f"  - Disease: {consultations[0].predicted_disease}")
    
    # NOTE: For testing, we need a user password. Since we don't know it,
    # we'll create a temporary test user instead
    print("\n" + "="*60)
    print("Creating test user for authentication...")
    print("="*60)
    
    test_email = f"pdf_test_{consultations[0].id[:8]}@example.com"
    test_password = "TestPassword123!"
    
    # Register test user
    print(f"\n1. Registering: {test_email}")
    reg_resp = requests.post(
        f"{BASE_URL}{API_PREFIX}/auth/register",
        json={
            "email": test_email,
            "password": test_password,
            "full_name": "PDF Test User"
        }
    )
    
    if reg_resp.status_code != 200:
        print(f"   ✗ Registration failed: {reg_resp.status_code}")
        print(f"   Response: {reg_resp.text}")
        exit(1)
    
    test_user_id = reg_resp.json().get("id")
    print(f"   ✓ Registered: {test_user_id}")
    
    # Login
    print(f"\n2. Logging in...")
    login_resp = requests.post(
        f"{BASE_URL}{API_PREFIX}/auth/login",
        json={"email": test_email, "password": test_password}
    )
    
    if login_resp.status_code != 200:
        print(f"   ✗ Login failed: {login_resp.status_code}")
        exit(1)
    
    token = login_resp.json().get("access_token")
    print(f"   ✓ Token obtained")
    
    # Create a test consultation for this user
    print(f"\n3. Creating test consultation for {test_user_id}...")
    from app.models.consultation import Consultation
    from datetime import datetime
    
    test_consultation = Consultation(
        user_id=test_user_id,
        symptoms="Test symptoms",
        predicted_disease="Atopic Dermatitis",
        disease_confidence=0.82,
        disease_confidence_level="high",
        predicted_skin_type="Combination",
        skin_type_confidence=0.75,
        skin_type_confidence_level="high",
        risk_level="medium",
        doctor_warning="Consult dermatologist if worsens",
        condition_explanation="Atopic dermatitis is a chronic inflammatory skin condition.",
        symptom_context="Common symptoms include itching and redness.",
        general_care_guidance=["Keep skin moisturized", "Avoid irritants"],
        what_to_avoid=["Harsh soaps"],
        safety_precautions=["Patch test products"],
        recommendations=[{"name": "Moisturizer", "safety": "Hypoallergenic"}],
        when_to_seek_doctor="If symptoms worsen",
        professional_note="Professional evaluation recommended",
        ai_limitations="AI assessment only, not medical diagnosis",
    )
    
    db.add(test_consultation)
    db.commit()
    db.refresh(test_consultation)
    
    consultation_id = test_consultation.id
    print(f"   ✓ Created: {consultation_id}")
    
    # Request PDF
    print(f"\n4. Requesting PDF download...")
    headers = {"Authorization": f"Bearer {token}"}
    
    pdf_resp = requests.get(
        f"{BASE_URL}{API_PREFIX}/consultations/{consultation_id}/download-pdf",
        headers=headers
    )
    
    print(f"   Status: {pdf_resp.status_code}")
    
    if pdf_resp.status_code == 200:
        print(f"   ✓ PDF generated: {len(pdf_resp.content)} bytes")
        
        # Save PDF
        pdf_file = f"test_report_{consultation_id[:8]}.pdf"
        with open(pdf_file, "wb") as f:
            f.write(pdf_resp.content)
        print(f"   ✓ Saved to: {pdf_file}")
        
        print("\n" + "="*60)
        print("✓ PDF FEATURE TEST PASSED!")
        print("="*60)
    else:
        print(f"   ✗ Error: {pdf_resp.status_code}")
        print(f"   Response: {pdf_resp.text}")
        exit(1)
        
finally:
    db.close()
