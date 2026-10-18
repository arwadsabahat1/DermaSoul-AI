#!/usr/bin/env python3
"""Test PDF endpoint with a real consultation from database"""
import requests
import json
from datetime import datetime, timedelta
from app.database import SessionLocal
from app.models.consultation import Consultation
from app.models.user import User
from sqlalchemy import text

BASE_URL = "http://127.0.0.1:8000"

# Get database session
db = SessionLocal()

try:
    # Get first user
    user = db.query(User).first()
    if not user:
        print("✗ No users found in database")
        exit(1)
    
    print(f"✓ Found user: {user.email}")
    
    # Get first consultation
    consultation = db.query(Consultation).filter(
        Consultation.user_id == user.id
    ).first()
    
    if not consultation:
        print("✗ No consultations found for this user")
        exit(1)
    
    print(f"✓ Found consultation: {consultation.id}")
    print(f"  - Disease: {consultation.predicted_disease}")
    print(f"  - Confidence: {consultation.disease_confidence}")
    
    # Login to get token
    print("\n1. Logging in...")
    login_resp = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": user.email, "password": "password123"}
    )
    
    if login_resp.status_code != 200:
        print(f"✗ Login failed: {login_resp.text}")
        exit(1)
    
    token = login_resp.json()["access_token"]
    print(f"✓ Token: {token[:20]}...")
    
    # Request PDF
    print("\n2. Requesting PDF...")
    headers = {"Authorization": f"Bearer {token}"}
    pdf_resp = requests.get(
        f"{BASE_URL}/api/consultations/{consultation.id}/download-pdf",
        headers=headers
    )
    
    print(f"Status: {pdf_resp.status_code}")
    
    if pdf_resp.status_code == 200:
        print(f"✓ PDF generated: {len(pdf_resp.content)} bytes")
        with open("downloaded_report.pdf", "wb") as f:
            f.write(pdf_resp.content)
        print("✓ Saved to downloaded_report.pdf")
    else:
        print(f"✗ Error: {pdf_resp.text}")
        
finally:
    db.close()
