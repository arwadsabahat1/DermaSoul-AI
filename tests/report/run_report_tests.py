"""Runs every test case documented in Chapter 5 of the SDS report against the real backend.

Each case is executed, compared with its expected result and recorded as PASS or FAIL together with the
actual result. Results are written to tests/report/results/ as JSON and Markdown.

Safety: every database change happens inside one outer transaction that is rolled back at the end,
e-mail alerts are disabled, and any uploaded image written during the run is deleted afterwards.
The real database, uploads folder and log file are left exactly as they were.

Run from the backend folder (with the backend venv active):
    $env:PYTHONPATH="."; python ..\\tests\\report\\run_report_tests.py
"""
from __future__ import annotations

import glob
import io
import json
import logging
import os
import sys
import threading
import time
from datetime import datetime, timedelta
from pathlib import Path
from unittest import mock

from fastapi import HTTPException, UploadFile
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw, ImageFilter
from sqlalchemy.orm import sessionmaker
from starlette.datastructures import Headers

from app.database import engine, get_db
from app.main import LOG_FILE, app
from app.models.consultation import Consultation
from app.models.user import User
from app.routers import diagnosis_router
from app.schemas.auth_schema import UserRegisterRequest
from app.services import nlp_entities_service
from app.services.clinical_guardrail_service import detect_unsafe_treatment_claims, sanitize_guardrail_violations
from app.services.dermatologist_service import select_referral_dermatologists
from app.services.diagnosis_service import run_skin_type_prediction
from app.services.image_validation_service import validate_uploaded_image
from app.services.nlp_service import analyze_symptom_text
from app.services.rag_service import generate_structured_rag_assessment
from app.services.recommendation_service import generate_safe_recommendations
from app.services.red_flag_service import calculate_risk_level, detect_red_flags
from app.services.skin_detection_service import validate_image_not_blurry, validate_visible_skin
from app.utils.security import create_access_token, decode_access_token, hash_password, verify_password

logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("dermasoul").setLevel(logging.CRITICAL)  # the deliberate REL-3 error must not reach the log

DATASET = os.environ.get(
    "DERMASOUL_TEST_IMAGES",
    r"C:\Users\Arwad Sabahat\Downloads\archive 22 class dataset\SkinDisease\SkinDisease\test",
)
OUT_DIR = Path(__file__).resolve().parent / "results"
UPLOADS = Path("app/uploads")
PASSWORD = "TestPass123!"

SECTIONS = {
    "UT1": "Unit Testing 1: Email validation (Pydantic EmailStr)",
    "UT2": "Unit Testing 2: Password Hashing and Verification",
    "UT3": "Unit Testing 3: JWT Token Generation and Verification",
    "UT4": "Unit Testing 4: Image Quality Validation",
    "UT5": "Unit Testing 5: NLP Symptom Analysis",
    "UT6": "Unit Testing 6: Red-Flag Detection and Risk Level",
    "UT7": "Unit Testing 7: RAG Assessment",
    "UT8": "Unit Testing 8: Skin-Type Classification",
    "UT9": "Unit Testing 9: Clinical Safety Guardrail",
    "FT1": "Functional Testing 1: User Registration Flow",
    "FT2": "Functional Testing 2: Login with Different Roles",
    "FT3": "Functional Testing 3: Profile Operations",
    "FT4": "Functional Testing 4: Skin Analysis API",
    "FT5": "Functional Testing 5: Safe Product Recommendations",
    "FT6": "Functional Testing 6: Educational Content",
    "FT7": "Functional Testing 7: Dermatologist Directory and Referrals",
    "FT8": "Functional Testing 8: Account Management",
    "BR": "Business Rules Testing (RBAC)",
    "IT1": "Integration Testing 1: Complete Authentication Flow",
    "IT2": "Integration Testing 2: Admin User Management Workflow",
    "IT3": "Integration Testing 3: Complete Analysis and Consultation Workflow",
    "IT4": "Integration Testing 4: Admin Content Management and Dashboard",
    "NFT": "Non-Functional Testing",
}
results: dict[str, list[dict]] = {key: [] for key in SECTIONS}


def case(section: str, test_case: str, attribute: str, expected: str, passed: bool, actual) -> None:
    row = {"no": len(results[section]) + 1, "test_case": test_case, "attribute": attribute,
           "expected": expected, "actual": str(actual), "result": "Pass" if passed else "FAIL"}
    results[section].append(row)
    print(f"[{section} {row['no']:>2}] {row['result']:<4} {test_case} -> {row['actual'][:150]}")


def raises_http(fn, *args, **kwargs):
    """Return (status_code, detail) if fn raises HTTPException, else (None, return value)."""
    try:
        return None, fn(*args, **kwargs)
    except HTTPException as exc:
        return exc.status_code, exc.detail


def jpg(image: Image.Image, fmt: str = "JPEG") -> bytes:
    buf = io.BytesIO()
    image.save(buf, fmt)
    return buf.getvalue()


def upload(name: str, data: bytes, content_type: str) -> UploadFile:
    return UploadFile(file=io.BytesIO(data), filename=name, headers=Headers({"content-type": content_type}))


def first_image(cls: str, index: int = 0) -> Image.Image:
    return Image.open(sorted(glob.glob(os.path.join(DATASET, cls, "*")))[index]).convert("RGB")


eczema, acne, psoriasis = first_image("Eczema"), first_image("Acne"), first_image("Psoriasis")
screenshot = Image.new("RGB", (800, 600), (30, 90, 200))
draw = ImageDraw.Draw(screenshot)
for y in range(0, 600, 40):
    draw.rectangle([20, y + 5, 780, y + 30], outline=(255, 255, 255), width=2)
    draw.text((30, y + 10), "Menu item settings", fill=(255, 255, 255))
GOOD_JPG = jpg(eczema)

uploads_before = set(os.listdir(UPLOADS))
log_size_before = LOG_FILE.stat().st_size if LOG_FILE.exists() else 0
started = datetime.now()

# ============================================================== unit tests (no HTTP)
# UT1 email validation
def email_ok(email: str) -> bool:
    try:
        UserRegisterRequest(email=email, password=PASSWORD)
        return True
    except Exception:
        return False


for label, value, want in [("valid email", "user@example.com", True), ("invalid email", "userexample.com", False),
                           ("empty string", "", False), ("subdomain email", "user@mail.company.co.uk", True),
                           ("email containing space", "user@exam ple.com", False)]:
    got = email_ok(value)
    case("UT1", f"Run EmailStr validation with {label}", f'"{value}"', str(want), got == want, got)

# UT2 password hashing
h1 = hash_password("SecurePass123!")
case("UT2", "Hash valid password", '"SecurePass123!"', "Non-empty bcrypt hash", h1.startswith("$2"), f"{h1[:7]}… ({len(h1)} chars)")
case("UT2", "Verify correct password", '"SecurePass123!"', "True", verify_password("SecurePass123!", h1), verify_password("SecurePass123!", h1))
case("UT2", "Verify incorrect password", '"WrongPass123"', "False", not verify_password("WrongPass123", h1), verify_password("WrongPass123", h1))
case("UT2", "Verify empty password", '""', "False", not verify_password("", h1), verify_password("", h1))
h2 = hash_password("SecurePass123!")
case("UT2", "Hash same password twice", '"SecurePass123!"', "Different hashes (salt)", h1 != h2, "different hashes" if h1 != h2 else "same hash")

# UT3 JWT
token = create_access_token("user-123")
case("UT3", "Generate JWT token", "User ID", "Token generated", bool(token), f"{token[:16]}…")
case("UT3", "Check JWT structure", "Generated token", "Header, payload and signature", token.count(".") == 2, f"{token.count('.') + 1} parts")
case("UT3", "Verify valid token", "Valid token", "Payload returned (user ID)", decode_access_token(token) == "user-123", decode_access_token(token))
tampered = token[:-4] + ("AAAA" if not token.endswith("AAAA") else "BBBB")
case("UT3", "Verify tampered token", "Tampered token", "Rejected", decode_access_token(tampered) is None, decode_access_token(tampered) or "rejected")
expired = create_access_token("user-123", expires_delta=timedelta(minutes=-1))
case("UT3", "Verify expired token", "Expired token", "Rejected", decode_access_token(expired) is None, decode_access_token(expired) or "rejected")

# UT4 image quality validation
code, val = raises_http(validate_image_not_blurry, eczema)
case("UT4", "Validate a sharp skin photo", "Eczema test image", "Passes the blur check", code is None, f"Passed (blur score {val:.1f})" if code is None else val)
code, val = raises_http(validate_image_not_blurry, eczema.filter(ImageFilter.GaussianBlur(3)))
case("UT4", "Validate a blurred photo", "Gaussian blur radius 3", "Rejected as blurry", code == 400, val)
big = eczema.resize((3000, int(eczema.height * 3000 / eczema.width)), Image.LANCZOS)
code, val = raises_http(validate_image_not_blurry, big)
case("UT4", "Validate a high-resolution photo", "Resized to 3000 px", "Passes (size-independent)", code is None, f"Passed (blur score {val:.1f})" if code is None else val)
code, val = raises_http(validate_visible_skin, screenshot)
case("UT4", "Validate a non-skin screenshot", "Synthetic 800x600 UI image", "Rejected, no visible skin", code == 400, val)
gif = jpg(eczema, "GIF")
code, val = raises_http(validate_uploaded_image, upload("a.gif", gif, "image/gif"), gif)
case("UT4", "Validate an unsupported format", "GIF image", "Rejected", code == 400, val)
tiny = jpg(eczema.resize((100, 100)))
code, val = raises_http(validate_uploaded_image, upload("t.jpg", tiny, "image/jpeg"), tiny)
case("UT4", "Validate a low-resolution image", "100x100 JPG", "Rejected", code == 400, val)
code, val = raises_http(validate_uploaded_image, upload("c.jpg", b"not an image at all", "image/jpeg"), b"not an image at all")
case("UT4", "Validate a corrupted file", "Non-image bytes named .jpg", "Rejected", code == 400, val)

# UT5 NLP
r = analyze_symptom_text("My face is very itchy and red with a burning rash on my cheek for 2 weeks, no pain")
case("UT5", "Extract symptoms, negation and duration", "itchy, red, burning rash, 2 weeks, no pain",
     "itching, redness, burning, rash; pain negated; 2 weeks",
     {"itching", "redness", "burning", "rash"} <= set(r["extracted_symptoms"]) and "pain" in r["negated_entities"]
     and "2 week" in (r["extracted_duration"] or ""),
     f"{', '.join(r['extracted_symptoms'])}; negated {r['negated_entities']}; {r['extracted_duration']}")
r = analyze_symptom_text("Itchy red rash but no fever and no pus")
case("UT5", "Handle negated warning terms", "Itchy red rash but no fever and no pus", "fever and pus negated",
     {"fever", "pus"} <= set(r["negated_entities"]), f"negated {r['negated_entities']}; extracted {r['extracted_symptoms']}")
r = analyze_symptom_text("khujli aur jalan on my arm")
case("UT5", "Recognise Roman-Urdu terms", "khujli aur jalan on my arm", "itching, burning",
     {"itching", "burning"} <= set(r["extracted_symptoms"]), r["extracted_symptoms"])
r = analyze_symptom_text("I have small bumps and scaly patches on my elbow that flake, started 3 months ago")
case("UT5", "Extract descriptive symptoms", "bumps, scaly patches, 3 months", "bumps, scaling, patches; 3 months",
     {"bumps", "scaling", "patches"} <= set(r["extracted_symptoms"]) and "3 month" in (r["extracted_duration"] or ""),
     f"{r['extracted_symptoms']}; {r['extracted_duration']}")
with mock.patch.object(nlp_entities_service, "_model_entities", return_value=None):
    r = analyze_symptom_text("itchy rash on my arm")
case("UT5", "Fallback when the NER model is unavailable", "itchy rash on my arm (model disabled)",
     "Rule-based extraction still works", {"itching", "rash"} <= set(r["extracted_symptoms"]) and r["nlp_model_version"] == "rule-fallback-v2",
     f"{r['extracted_symptoms']}; version {r['nlp_model_version']}")

# UT6 red flags and risk
flags = detect_red_flags("rash is rapidly spreading with fever")
case("UT6", "Detect red flags in text", "rash is rapidly spreading with fever", "Fever and rapid-spreading flags",
     set(flags) == {"fever_with_skin_issue", "rapidly_spreading"}, flags)
for label, args, want in [
    ("Red flag overrides the model", ("Acne", 0.99, ["rapidly_spreading"], "mild"), "High"),
    ("High-risk condition", ("Skin Cancer", 0.99, [], "mild"), "High"),
    ("Severe symptoms", ("Acne", 0.90, [], "severe"), "High"),
    ("Moderate-risk condition", ("Eczema", 0.50, [], "mild"), "Moderate"),
    ("Low model confidence", ("Acne", 0.30, [], "mild"), "Uncertain"),
    ("Confident mild case", ("Acne", 0.90, [], "mild"), "Low to Moderate"),
]:
    got = calculate_risk_level(*args)
    case("UT6", label, f"{args[0]}, {args[1]}, flags {args[2] or 'none'}, severity {args[3]}", want, got == want, got)
for label, text, want in [
    ("Denied warning signs are ignored", "Itchy red rash but no fever and no pus", []),
    ("Warning sign after 'but' is still flagged", "No itching, but fever since yesterday", ["fever_with_skin_issue"]),
    ("Denied breathing problem is ignored", "Patient denies difficulty breathing", []),
]:
    got = detect_red_flags(text)
    case("UT6", label, text, ", ".join(want) or "No red flags", got == want, got or "no red flags")

# ============================================================== database-backed tests (rolled back)
connection = engine.connect()
outer = connection.begin()
SessionFactory = sessionmaker(bind=connection, join_transaction_mode="create_savepoint")
db = SessionFactory()


def override_get_db():
    yield db


app.dependency_overrides[get_db] = override_get_db
diagnosis_router.send_high_risk_alert_email = lambda *a, **k: None


@app.get("/__report_test_unexpected_error", include_in_schema=False)
def _deliberate_error():
    raise RuntimeError("deliberate report-test failure")


def assess(disease, conf, symptoms, flags=(), risk="Moderate"):
    return generate_structured_rag_assessment(
        predicted_disease=disease, disease_confidence=conf,
        disease_confidence_level="high" if conf >= 0.75 else "low",
        predicted_skin_type="dry", skin_type_confidence=0.6, skin_type_confidence_level="medium",
        extracted_symptoms=list(symptoms), red_flags=list(flags), risk_level=risk,
        doctor_warning="See a doctor.", db=db)


try:
    # UT7 RAG
    r = assess("Eczema", 0.90, ["itching", "redness"])
    conds = sorted({s.get("condition") for s in r["knowledge_sources"]})
    case("UT7", "Confident prediction with matching symptoms", "Eczema, 0.90, itching and redness",
         "Only Eczema sources, no related conditions", conds == ["Eczema"] and "also resemble" not in (r["symptom_context"] or ""),
         f"sources {conds}")
    r = assess("Tinea", 0.30, ["itching", "dryness", "scaling"])
    conds = sorted({s.get("condition") for s in r["knowledge_sources"]})
    case("UT7", "Low-confidence prediction", "Tinea, 0.30, itching, dryness, scaling", "Related conditions added",
         len(conds) > 1, f"sources {conds}")
    r = assess("Tinea", 0.35, ["changed_shape", "bleeding"], ["bleeding_lesion", "changing_mole"], "High")
    conds = sorted({s.get("condition") for s in r["knowledge_sources"]})
    case("UT7", "Warning signs of a changing mole", "Tinea, 0.35, bleeding and changing mole",
         "Skin Cancer shown as a related condition", "Skin Cancer" in conds, f"sources {conds}")
    r = assess("Eczema", 0.90, ["itching"])
    types = sorted({t.get("source_type") for t in r["retrieval_trace"]})
    case("UT7", "Retrieval trace", "Eczema, 0.90, itching", "Condition chunks only, confidence between 0 and 1",
         len(r["retrieval_trace"]) > 0 and 0 < r["retrieval_confidence"] <= 1,
         f"{len(r['retrieval_trace'])} chunks {types}; retrieval confidence {r['retrieval_confidence']}")

    # UT8 skin type
    outputs = [run_skin_type_prediction(img) for img in (eczema, acne, psoriasis)]
    case("UT8", "Predict skin type for three test images", "Eczema, Acne, Psoriasis images",
         "One of dry, normal or oily for each image",
         all(o["predicted_skin_type"] in {"dry", "normal", "oily"} for o in outputs),
         ", ".join(o["predicted_skin_type"] for o in outputs))
    case("UT8", "Confidence score and band", "Same three predictions",
         "Confidence between 0 and 1 with a matching band",
         all(0 <= o["skin_type_confidence"] <= 1 and o["skin_type_confidence_level"] ==
             ("high" if o["skin_type_confidence"] >= 0.75 else "medium" if o["skin_type_confidence"] >= 0.5 else "low")
             for o in outputs),
         ", ".join(f"{o['skin_type_confidence']:.2f} ({o['skin_type_confidence_level']})" for o in outputs))
    again = run_skin_type_prediction(eczema)
    case("UT8", "Repeat prediction on the same image", "Eczema image twice", "Identical result",
         again == outputs[0], f"{again['predicted_skin_type']} {again['skin_type_confidence']:.4f}")
    odd = run_skin_type_prediction(eczema.resize((1600, 500)))
    case("UT8", "Image with a different size and shape", "Eczema image resized to 1600x500",
         "Valid prediction (resized to 240x240)", odd["predicted_skin_type"] in {"dry", "normal", "oily"},
         f"{odd['predicted_skin_type']} ({odd['skin_type_confidence']:.2f})")

    # UT9 guardrail
    unsafe = "This cream is a guaranteed cure for your rash."
    out = sanitize_guardrail_violations(unsafe)
    case("UT9", "Remove an unsafe treatment claim", f'"{unsafe}"', "Replaced with a safe educational statement",
         "guaranteed cure" not in out.lower() and "not a definitive diagnosis" in out, out[:90])
    case("UT9", "Detect advice to skip a doctor", '"There is no need to see a doctor."', "Flagged as unsafe",
         detect_unsafe_treatment_claims("There is no need to see a doctor."), detect_unsafe_treatment_claims("There is no need to see a doctor."))
    safe = "Keep the area clean and moisturise regularly."
    case("UT9", "Keep safe guidance unchanged", f'"{safe}"', "Text unchanged",
         sanitize_guardrail_violations(safe) == safe, sanitize_guardrail_violations(safe))

    # FT5 recommendations
    def recs(**kw):
        return generate_safe_recommendations(db=db, **kw)

    def kinds(items):
        """Product kind from both fields: database products carry their real kind only in `category`."""
        return [f"{x.get('category')}".lower().replace("-", "_") + f" [{x.get('product_type')}]" for x in items]

    BLOCKED = ("otc_active", "pharmacist_guided_otc")
    r = recs(predicted_disease="Acne", predicted_skin_type="oily", risk_level="Low to Moderate", red_flags=[])
    case("FT5", "Low-risk acne", "Acne, oily skin, Low to Moderate", "Up to 4 suitable products",
         0 < len(r["recommendations"]) <= 4, ", ".join(x.get("category") for x in r["recommendations"]))
    r = recs(predicted_disease="Acne", predicted_skin_type="oily", risk_level="High", red_flags=[])
    got = kinds(r["recommendations"])
    case("FT5", "High-risk case", "Acne, oily skin, High", "No active or pharmacist-guided products",
         not any(k.startswith(BLOCKED) or BLOCKED[0] in k or BLOCKED[1] in k for k in got), "; ".join(got))
    r = recs(predicted_disease="Acne", predicted_skin_type="oily", risk_level="Low to Moderate", red_flags=["pus_or_infection"])
    got = kinds(r["recommendations"])
    case("FT5", "Red flag present", "Acne, pus_or_infection flag", "OTC actives and pharmacist-guided products removed",
         not any(BLOCKED[0] in k or BLOCKED[1] in k for k in got), "; ".join(got))
    r = recs(predicted_disease="Eczema", predicted_skin_type="dry", risk_level="Moderate", red_flags=[],
             known_allergies_text="fragrance")
    flagged = [str(x.get("product_name") or x.get("name")) for x in r["recommendations"]
               if "fragrance" in str(x.get("avoid_if_allergic_to", "")).lower()]
    case("FT5", "Known allergy", "Eczema, allergy: fragrance", "Products flagged for that allergy removed",
         r["allergy_filter_applied"] and not flagged, f"allergy filter applied={r['allergy_filter_applied']}; conflicting items {flagged or 'none'}")

    # ---------------------------------------------------------- HTTP tests
    user = User(email="report-user@example.com", hashed_password=hash_password(PASSWORD), role="user", is_active=True)
    other = User(email="report-other@example.com", hashed_password=hash_password(PASSWORD), role="user", is_active=True)
    admin = User(email="report-admin@example.com", hashed_password=hash_password(PASSWORD), role="admin", is_active=True)
    db.add_all([user, other, admin]); db.commit()
    H = {"Authorization": f"Bearer {create_access_token(user.id)}"}
    HO = {"Authorization": f"Bearer {create_access_token(other.id)}"}
    HA = {"Authorization": f"Bearer {create_access_token(admin.id)}"}

    with TestClient(app, raise_server_exceptions=False) as c:
        def analyze(symptoms="Itchy dry red patches on my arm for 3 weeks", image=("e.jpg", GOOD_JPG, "image/jpeg"),
                    headers=None, **extra):
            files = {"image": image} if image else {}
            return c.post("/api/diagnosis/analyze", files=files, data={"symptoms": symptoms, **extra},
                          headers=H if headers is None else headers)

        def login(email, password=PASSWORD):
            return c.post("/api/auth/login", json={"email": email, "password": password})

        def bearer(resp):
            return {"Authorization": f"Bearer {resp.json()['access_token']}"}

        # FT1 registration
        r = c.post("/api/auth/register", json={"email": "report-new@example.com", "password": "SecurePass123!"})
        case("FT1", "Register with valid credentials", "Email: report-new@example.com, Password: SecurePass123!",
             "Account is created", r.status_code == 200, f"{r.status_code}; role {r.json().get('role')}")
        r = c.post("/api/auth/register", json={"email": "report-new@example.com", "password": "SecurePass123!"})
        case("FT1", "Register with duplicate email", "Email already exists", "Error message is displayed",
             r.status_code == 400, f"{r.status_code} {r.json().get('detail')}")
        r = c.post("/api/auth/register", json={"email": "invalid.email", "password": "SecurePass123!"})
        case("FT1", "Register with invalid email", "Email: invalid.email", "Registration is rejected",
             r.status_code == 422, f"{r.status_code} validation error")
        r = c.post("/api/auth/register", json={"email": "weak@example.com", "password": "123"})
        case("FT1", "Register with weak password", "Password: 123", "Registration is rejected",
             r.status_code == 422, f"{r.status_code} validation error")
        r = c.post("/api/auth/register", json={"email": "", "password": ""})
        case("FT1", "Register with empty fields", 'Email: "", Password: ""', "Required field error",
             r.status_code == 422, f"{r.status_code} validation error")

        # FT2 login roles (API level; the UI menu is rendered from the returned role)
        r = login(user.email)
        me = c.get("/api/auth/me", headers=bearer(r)).json() if r.status_code == 200 else {}
        case("FT2", "Login as regular user", user.email, "Logged in as user; Admin menu hidden",
             r.status_code == 200 and me.get("role") == "user", f"{r.status_code}; role {me.get('role')}")
        r = login(admin.email)
        me = c.get("/api/auth/me", headers=bearer(r)).json() if r.status_code == 200 else {}
        case("FT2", "Login as admin", admin.email, "Logged in as admin; Admin menu available",
             r.status_code == 200 and me.get("role") == "admin", f"{r.status_code}; role {me.get('role')}")
        r = login(user.email, "WrongPass999")
        case("FT2", "Login with wrong password", "Valid email, wrong password", "Invalid credentials error",
             r.status_code == 401, f"{r.status_code} {r.json().get('detail')}")
        r = login("ghost@example.com")
        case("FT2", "Login with non-existing email", "ghost@example.com", "Invalid credentials error",
             r.status_code == 401, f"{r.status_code} {r.json().get('detail')}")
        r = login(user.email)
        tok = r.json().get("access_token", "")
        case("FT2", "Token returned for future requests", "Valid credentials", "JWT token returned and accepted",
             r.status_code == 200 and c.get("/api/auth/me", headers=bearer(r)).status_code == 200,
             f"token with {tok.count('.') + 1} parts accepted")

        # FT3 profile
        r = c.get("/api/profile/me", headers=H)
        case("FT3", "Get profile", "Authenticated user token", "User profile is returned", r.status_code == 200, r.status_code)
        r = c.put("/api/profile/me", json={"full_name": "Updated Name"}, headers=H)
        case("FT3", "Update full name", "Full Name: Updated Name", "Full name is updated",
             r.status_code == 200 and r.json().get("full_name") == "Updated Name", r.json().get("full_name"))
        r = c.put("/api/profile/me", json={"age": 28}, headers=H)
        case("FT3", "Update age", "Age: 28", "Age field is updated", r.status_code == 200 and r.json().get("age") == 28, r.json().get("age"))
        r = c.put("/api/profile/me", json={"known_allergies": "Penicillin"}, headers=H)
        case("FT3", "Update allergies", "Known Allergies: Penicillin", "Allergies are saved",
             r.status_code == 200 and r.json().get("known_allergies") == "Penicillin", r.json().get("known_allergies"))
        r = c.get("/api/profile/me")
        case("FT3", "Access profile without token", "No JWT token", "Access denied", r.status_code == 401, r.status_code)

        # FT4 analysis API
        r = analyze()
        body = r.json()
        cid = body.get("consultation_id")
        case("FT4", "Analyze a valid image", 'Eczema image + "Itchy dry red patches on my arm for 3 weeks"',
             "200 with the full assessment", r.status_code == 200 and body.get("predicted_disease") == "Eczema",
             f"{r.status_code}; {body.get('predicted_disease')} ({body.get('disease_confidence', 0) * 100:.1f}%), "
             f"risk {body.get('risk_level')}, {len(body)} response fields")
        suggested = body.get("suggested_education_slug")
        r = analyze(image=None)
        case("FT4", "Request without an image", "Symptoms only", "Request rejected", r.status_code == 422, f"{r.status_code} validation error")
        r = analyze(symptoms="hi")
        case("FT4", "Symptoms too short", 'Symptoms: "hi"', "Validation error", r.status_code == 400, f"{r.status_code} {r.json().get('detail')}")
        r = analyze(image=("n.txt", b"hello", "text/plain"))
        case("FT4", "Non-image file", "Plain-text file", "Rejected", r.status_code == 400, f"{r.status_code} {r.json().get('detail')}")
        r = analyze(image=("b.jpg", jpg(eczema.filter(ImageFilter.GaussianBlur(3))), "image/jpeg"))
        case("FT4", "Blurry image", "Blurred test image", "Rejected", r.status_code == 400, f"{r.status_code} {r.json().get('detail')}")
        r = analyze(image=("u.png", jpg(screenshot, "PNG"), "image/png"))
        case("FT4", "Screenshot", "Synthetic UI image", "Rejected", r.status_code == 400, f"{r.status_code} {r.json().get('detail')}")
        r = analyze(headers={})
        case("FT4", "Request without a token", "Valid request, no JWT", "Access denied", r.status_code == 401, r.status_code)

        # FT6 education
        r = c.get("/api/education")
        case("FT6", "List articles without logging in", "GET /api/education", "Public list of articles",
             r.status_code == 200 and len(r.json()) > 0, f"{r.status_code}; {len(r.json())} articles")
        r = c.get("/api/education", params={"search": "eczema"})
        slugs = [a["slug"] for a in r.json()]
        case("FT6", "Search articles", 'search = "eczema"', "Eczema article returned", "eczema" in slugs, slugs)
        r = c.get("/api/education/eczema")
        case("FT6", "Open an article", "slug = eczema", "Full article content returned",
             r.status_code == 200 and len(r.json().get("content", "")) > 20, f"{r.status_code}; {r.json().get('title')}")
        r = c.get("/api/education/no-such-article")
        case("FT6", "Open a missing article", "slug = no-such-article", "Not found", r.status_code == 404, r.status_code)
        eczema_category = c.get("/api/education/eczema").json().get("category")
        tmp = c.post("/api/education", json={"title": "Report Test Eczema Care", "category": eczema_category,
                                             "content": "Temporary related article used by the report tests."},
                     headers=HA).json()
        r = c.get("/api/education/eczema/related")
        related = [a["slug"] for a in r.json()]
        case("FT6", "Related articles", "slug = eczema (temporary article added in the same category)",
             "Same-category article listed, the article itself excluded",
             r.status_code == 200 and tmp.get("slug") in related and "eczema" not in related, f"{r.status_code}; {related}")
        c.delete(f"/api/education/{tmp.get('slug')}", headers=HA)
        case("FT6", "Article suggested after an analysis", "Eczema analysis from Functional Testing 4",
             "Link to the Eczema article", suggested == "eczema", suggested)

        # FT7 dermatologists
        doc = {"full_name": "Dr Report Test", "supported_conditions": "Skin Cancer, Eczema", "years_experience": 12,
               "city": "Islamabad", "is_active": True}
        r = c.post("/api/dermatologists", json=doc, headers=HA)
        did = r.json().get("id")
        case("FT7", "Admin adds a dermatologist", "Dr Report Test", "Created (201)", r.status_code == 201, r.status_code)
        r = c.post("/api/dermatologists", json={"city": "Lahore"}, headers=HA)
        case("FT7", "Add without a name", "Missing full_name", "Validation error", r.status_code == 422, r.status_code)
        names = [d["full_name"] for d in c.get("/api/dermatologists", headers=H).json()]
        case("FT7", "User browses the directory", "User token", "New active dermatologist listed", "Dr Report Test" in names, f"{len(names)} listed")
        refs = select_referral_dermatologists(db=db, risk_level="High", predicted_disease="Skin Cancer", limit=3)
        case("FT7", "Referral for a high-risk case", "High risk, Skin Cancer", "Matching dermatologist referred",
             any(x["doctor"].id == did for x in refs), [f"{x['doctor'].full_name} ({', '.join(x['reasons'])})" for x in refs])
        refs_low = select_referral_dermatologists(db=db, risk_level="Low to Moderate", predicted_disease="Acne", limit=3)
        case("FT7", "No referral for a low-risk case", "Low to Moderate, Acne", "No referral", refs_low == [], refs_low or "none")
        r = c.put(f"/api/dermatologists/{did}", json={"is_active": False}, headers=HA)
        names_user = [d["full_name"] for d in c.get("/api/dermatologists", params={"include_inactive": "true"}, headers=H).json()]
        names_admin = [d["full_name"] for d in c.get("/api/dermatologists", params={"include_inactive": "true"}, headers=HA).json()]
        case("FT7", "Disabled entry hidden from users", "Admin disables Dr Report Test",
             "Hidden from users (even with include_inactive), visible to admin",
             r.status_code == 200 and "Dr Report Test" not in names_user and "Dr Report Test" in names_admin,
             f"user sees it: {'Dr Report Test' in names_user}; admin sees it: {'Dr Report Test' in names_admin}")
        refs = select_referral_dermatologists(db=db, risk_level="High", predicted_disease="Skin Cancer", limit=3)
        case("FT7", "Disabled entry not referred", "High risk, Skin Cancer", "Not referred",
             all(x["doctor"].id != did for x in refs), "not referred" if all(x["doctor"].id != did for x in refs) else "referred")
        r = c.delete(f"/api/dermatologists/{did}", headers=HA)
        gone = all(d["id"] != did for d in c.get("/api/dermatologists", params={"include_inactive": "true"}, headers=HA).json())
        case("FT7", "Admin deletes the entry", "Dr Report Test", "Entry removed", r.status_code == 200 and gone, r.status_code)

        # FT8 account management
        acct = User(email="report-account@example.com", hashed_password=hash_password(PASSWORD), role="user", is_active=True)
        db.add(acct); db.commit()
        HC = {"Authorization": f"Bearer {create_access_token(acct.id)}"}
        r = c.post("/api/auth/change-password", json={"current_password": "Wrong123!", "new_password": "NewPass456!"}, headers=HC)
        case("FT8", "Change password with wrong current password", "Current: Wrong123!", "Rejected", r.status_code == 401, f"{r.status_code} {r.json().get('detail')}")
        r = c.post("/api/auth/change-password", json={"current_password": PASSWORD, "new_password": "short"}, headers=HC)
        case("FT8", "Change to a too-short password", "New: short", "Validation error", r.status_code == 422, r.status_code)
        r = c.post("/api/auth/change-password", json={"current_password": PASSWORD, "new_password": "NewPass456!"}, headers=HC)
        old_login, new_login = login(acct.email).status_code, login(acct.email, "NewPass456!").status_code
        case("FT8", "Change password correctly", "New: NewPass456!", "Old password rejected, new password works",
             r.status_code == 200 and old_login == 401 and new_login == 200, f"{r.status_code}; old login {old_login}, new login {new_login}")
        r2 = analyze(headers=HC)
        acct_file = r2.json().get("image_filename")
        r = c.post("/api/auth/delete-account", json={"password": "Wrong123!"}, headers=HC)
        case("FT8", "Delete account with wrong password", "Password: Wrong123!", "Rejected", r.status_code == 401, f"{r.status_code} {r.json().get('detail')}")
        r = c.post("/api/auth/delete-account", json={"password": "NewPass456!"}, headers=HC)
        after_login = login(acct.email, "NewPass456!").status_code
        case("FT8", "Delete account correctly", "Correct password", "Account, consultations and images removed",
             r.status_code == 200 and after_login == 401 and not (UPLOADS / str(acct_file)).exists(),
             f"{r.status_code}; login afterwards {after_login}; image file removed: {not (UPLOADS / str(acct_file)).exists()}")
        dis = User(email="report-disabled@example.com", hashed_password=hash_password(PASSWORD), role="user", is_active=True)
        db.add(dis); db.commit()
        HD = {"Authorization": f"Bearer {create_access_token(dis.id)}"}
        before = c.get("/api/auth/me", headers=HD).status_code
        c.patch(f"/api/admin/users/{dis.id}/status", params={"is_active": "false"}, headers=HA)
        r = c.get("/api/auth/me", headers=HD)
        case("FT8", "Disabled user with an existing token", "Token issued before the account was disabled",
             "Access denied", before == 200 and r.status_code == 403, f"before {before}, after {r.status_code} {r.json().get('detail')}")
        r = c.get("/api/auth/me", headers={"Authorization": f"Bearer {create_access_token(user.id, expires_delta=timedelta(minutes=-1))}"})
        case("FT8", "Expired token", "Token past its 60-minute lifetime", "Access denied", r.status_code == 401, f"{r.status_code} {r.json().get('detail')}")

        # BR access control
        for cond, hdr, route, method, want in [
            ("User is authenticated as normal user", H, "/api/profile/me", "get", 200),
            ("User is authenticated as normal user", H, "/api/admin/users", "get", 403),
            ("User is authenticated as admin", HA, "/api/admin/users", "get", 200),
            ("User is authenticated as admin", HA, "/api/profile/me", "get", 200),
            ("User is not authenticated", {}, "/api/profile/me", "get", 401),
            ("User sends invalid token", {"Authorization": "Bearer not.a.token"}, "/api/profile/me", "get", 401),
            ("User is authenticated as normal user", H, "/api/admin/ai/reindex-rag", "post", 403),
            ("User is authenticated as admin", HA, "/api/admin/ai/model-registry", "get", 200),
            ("User is authenticated as normal user", H, "/api/admin/consultations/flagged", "get", 403),
            ("User is authenticated as normal user", H, "/api/dermatologists", "post", 403),
            ("User is authenticated as admin", HA, f"/api/admin/users/{admin.id}/status?is_active=false", "patch", 400),
        ]:
            r = getattr(c, method)(route, headers=hdr, **({"json": {"full_name": "Dr X"}} if method == "post" and "dermatologists" in route else {}))
            label = {200: "Access allowed", 401: "Access denied", 403: "Access denied", 400: "Request refused"}[want]
            if want == 400:
                label = "Admin cannot disable own account"
            case("BR", cond, f"{method.upper()} {route.split('?')[0]}", label, r.status_code == want,
                 f"{r.status_code}" + (f" {r.json().get('detail')}" if r.status_code >= 400 else " OK"))

        # IT1 authentication flow
        r = c.post("/api/auth/register", json={"email": "report-flow@example.com", "password": "FlowPass123!"})
        case("IT1", "Register user", "Valid email and password", "User account is created", r.status_code == 200, r.status_code)
        r = login("report-flow@example.com", "FlowPass123!")
        flow_token = r.json().get("access_token", "")
        case("IT1", "Login with same credentials", "Registered email and password", "JWT token is returned",
             r.status_code == 200 and bool(flow_token), r.status_code)
        case("IT1", "Verify JWT format", "Returned token", "Valid JWT format", flow_token.count(".") == 2, f"{flow_token.count('.') + 1} parts")
        HF = {"Authorization": f"Bearer {flow_token}"}
        r = c.get("/api/profile/me", headers=HF)
        case("IT1", "Access protected profile route", "Authorization Bearer token", "Profile data is returned", r.status_code == 200, r.status_code)
        r = c.put("/api/profile/me", json={"age": 31, "known_allergies": "Fragrance"}, headers=HF)
        case("IT1", "Update profile", "Age and allergies", "Values saved", r.status_code == 200, r.status_code)
        r = c.get("/api/profile/me", headers=HF)
        case("IT1", "Retrieve updated profile", "Same token", "Updated values returned",
             r.json().get("age") == 31 and r.json().get("known_allergies") == "Fragrance",
             f"age {r.json().get('age')}, allergies {r.json().get('known_allergies')}")

        # IT2 admin user management
        r = login(admin.email)
        case("IT2", "Admin login", "Admin email and password", "Admin token is generated", r.status_code == 200, r.status_code)
        r = c.get("/api/admin/users", params={"limit": 200}, headers=HA)
        case("IT2", "List all users", "Admin JWT token", "List of users is returned",
             r.status_code == 200 and any(u["email"] == user.email for u in r.json()), f"{r.status_code}; {len(r.json())} users")
        r = c.get(f"/api/admin/users/{user.id}/consultations", headers=HA)
        case("IT2", "View a user's consultations", "Selected user ID", "User's consultation list is returned",
             r.status_code == 200 and r.json().get("total", 0) >= 1, f"{r.status_code}; {r.json().get('total')} consultations")
        r = c.patch(f"/api/admin/users/{other.id}/status", params={"is_active": "false"}, headers=HA)
        case("IT2", "Deactivate user", "User ID", "is_active becomes False", r.status_code == 200 and r.json()["is_active"] is False, r.json().get("is_active"))
        r = login(other.email)
        case("IT2", "Login as deactivated user", "Deactivated user credentials", "Login is denied", r.status_code == 403, f"{r.status_code} {r.json().get('detail')}")
        r = c.patch(f"/api/admin/users/{other.id}/status", params={"is_active": "true"}, headers=HA)
        case("IT2", "Reactivate user", "User ID", "is_active becomes True", r.status_code == 200 and r.json()["is_active"] is True, r.json().get("is_active"))
        r = login(other.email)
        case("IT2", "Login as reactivated user", "Reactivated user credentials", "Login succeeds", r.status_code == 200, r.status_code)

        # IT3 analysis and consultation workflow (consultation `cid` from FT4)
        r = c.get("/api/consultations", headers=H)
        case("IT3", "Run a skin analysis", "Valid image and symptoms", "Consultation saved and returned", bool(cid), f"consultation {str(cid)[:8]}…")
        case("IT3", "View consultation history", "Same user token", "New consultation listed",
             r.status_code == 200 and any(x["id"] == cid for x in r.json()["items"]), f"{r.status_code}; {r.json()['total']} listed")
        r = c.get(f"/api/consultations/{cid}", headers=H)
        case("IT3", "Open consultation detail", "Consultation ID", "Full assessment returned",
             r.status_code == 200 and bool(r.json().get("assessment_summary")), f"{r.status_code}; {r.json().get('predicted_disease')} with RAG assessment")
        r = c.get(f"/api/consultations/{cid}/download-pdf", headers=H)
        case("IT3", "Download PDF report", "Consultation ID", "PDF file returned",
             r.status_code == 200 and r.content.startswith(b"%PDF"), f"{r.status_code}, {r.headers.get('content-type')}, {len(r.content)} bytes")
        r = c.get(f"/api/consultations/{cid}/image", headers=H)
        case("IT3", "Retrieve uploaded image", "Consultation ID", "Image returned", r.status_code == 200, f"{r.status_code}, {r.headers.get('content-type')}")
        r = c.get(f"/api/consultations/{cid}", headers=HO)
        case("IT3", "Access by another user", "Other user's token", "Access denied", r.status_code == 404, r.status_code)
        r = c.get(f"/api/admin/consultations/{cid}", headers=HA)
        case("IT3", "Admin views the consultation", "Admin token", "Details returned", r.status_code == 200, r.status_code)
        r = c.delete(f"/api/consultations/{cid}", headers=H)
        case("IT3", "Delete the consultation", "Owner token", "Consultation deleted", r.status_code == 200, r.status_code)
        r = c.get(f"/api/consultations/{cid}", headers=H)
        case("IT3", "Open after deletion", "Same consultation ID", "Not found", r.status_code == 404, r.status_code)

        # IT4 admin content management and dashboard
        prod = {"name": "Report Test Cleanser", "category": "cleanser", "supported_conditions": "Acne"}
        r = c.post("/api/products", json=prod, headers=HA)
        pid = r.json().get("id")
        case("IT4", "Admin adds a product", "Report Test Cleanser", "Created (201)", r.status_code == 201, r.status_code)
        r = c.post("/api/products", json=prod, headers=H)
        case("IT4", "User tries to add a product", "User token", "Access denied", r.status_code == 403, r.status_code)
        r = c.put(f"/api/products/{pid}", json={"price_range": "PKR 500-800"}, headers=HA)
        case("IT4", "Admin updates the product", "price_range = PKR 500-800", "Product updated",
             r.status_code == 200 and r.json().get("price_range") == "PKR 500-800", r.json().get("price_range"))
        r = c.delete(f"/api/products/{pid}", headers=HA)
        gone = c.get(f"/api/products/{pid}", headers=HA).status_code
        case("IT4", "Admin deletes the product", "Product ID", "Product removed", r.status_code == 200 and gone == 404, f"{r.status_code}; afterwards {gone}")
        art = {"title": "Report Test Article", "category": "General", "content": "This is a test article used by the report tests."}
        r = c.post("/api/education", json=art, headers=HA)
        slug = r.json().get("slug")
        case("IT4", "Admin publishes an article", "Report Test Article", "Created with a URL slug", r.status_code == 201 and bool(slug), f"{r.status_code}; slug {slug}")
        r = c.put(f"/api/education/{slug}", json={"summary": "Updated summary"}, headers=HA)
        case("IT4", "Admin edits the article", "summary = Updated summary", "Article updated",
             r.status_code == 200 and r.json().get("summary") == "Updated summary", r.json().get("summary"))
        r = c.delete(f"/api/education/{slug}", headers=HA)
        gone = c.get(f"/api/education/{slug}").status_code
        case("IT4", "Admin deletes the article", f"slug {slug}", "Article removed", r.status_code == 200 and gone == 404, f"{r.status_code}; afterwards {gone}")
        r = analyze(symptoms="Red itchy rash on my arm, now with fever and pus")
        high_id = r.json().get("consultation_id")
        r = c.get("/api/admin/consultations/flagged", headers=HA)
        flagged_ids = [x["id"] for x in r.json()]
        case("IT4", "High-risk case appears in flagged list", "Analysis with fever and pus", "Listed as flagged (High risk)",
             high_id in flagged_ids and all(x["risk_level"].lower() == "high" for x in r.json()),
             f"{r.status_code}; listed: {high_id in flagged_ids}; all High: {all(x['risk_level'].lower() == 'high' for x in r.json())}")
        stats = c.get("/api/admin/stats", headers=HA).json()
        case("IT4", "Dashboard statistics", "Admin token", "Counts consistent with the database",
             stats["total_users"] == db.query(User).count() and stats["total_consultations"] == db.query(Consultation).count()
             and stats["active_users"] + stats["disabled_users"] == stats["total_users"],
             f"users {stats['total_users']} ({stats['active_users']} active), consultations {stats['total_consultations']}, high risk {stats['high_risk_consultations']}")
        c.delete(f"/api/consultations/{high_id}", headers=H)

        # NFT non-functional
        times = []
        for _ in range(3):
            t0 = time.perf_counter(); r = analyze(); times.append(time.perf_counter() - t0)
            c.delete(f"/api/consultations/{r.json().get('consultation_id')}", headers=H)
        case("NFT", "PER-2: Analysis response time", "3 full analyses of a valid image", "Under 20 seconds each",
             max(times) < 20, f"average {sum(times) / len(times):.2f} s, slowest {max(times):.2f} s")
        timing = {}

        def background_analysis():
            t0 = time.perf_counter(); rr = analyze(); timing["analysis"] = time.perf_counter() - t0
            timing["cid"] = rr.json().get("consultation_id")

        th = threading.Thread(target=background_analysis); th.start(); time.sleep(0.15)
        t0 = time.perf_counter(); hr = c.get("/health"); timing["health"] = time.perf_counter() - t0
        th.join()
        c.delete(f"/api/consultations/{timing.get('cid')}", headers=H)
        case("NFT", "Server stays responsive during an analysis", "Health check sent while an analysis runs",
             "Answered without waiting for the analysis", hr.status_code == 200 and timing["health"] < timing["analysis"] / 2,
             f"health check {timing['health'] * 1000:.0f} ms while analysis took {timing['analysis'] * 1000:.0f} ms")
        calls = []
        real_diag = diagnosis_router.run_image_diagnosis
        diagnosis_router.run_image_diagnosis = lambda img: (calls.append(1), real_diag(img))[1]
        try:
            for img in [("n.txt", b"hello", "text/plain"), ("c.jpg", b"not an image", "image/jpeg"),
                        ("b.jpg", jpg(eczema.filter(ImageFilter.GaussianBlur(3))), "image/jpeg"),
                        ("u.png", jpg(screenshot, "PNG"), "image/png")]:
                analyze(image=img)
        finally:
            diagnosis_router.run_image_diagnosis = real_diag
        case("NFT", "REL-2: Invalid images stopped before the AI model", "Text, corrupted, blurry and screenshot uploads",
             "AI model never runs", len(calls) == 0, f"model ran {len(calls)} times for 4 invalid uploads")
        t0 = time.perf_counter(); r = c.get("/__report_test_unexpected_error"); dt = time.perf_counter() - t0
        case("NFT", "REL-3: Unexpected server error", "Deliberate internal failure", "Clear error message, no endless loading",
             r.status_code == 500 and "detail" in r.json() and dt < 5, f"{r.status_code} \"{r.json().get('detail')}\" in {dt * 1000:.0f} ms")
        stored = db.query(User).filter(User.email == user.email).first().hashed_password
        case("NFT", "SEC-2: Password storage", "Stored password of a test user", "bcrypt hash, never plain text",
             stored.startswith("$2") and PASSWORD not in stored, f"{stored[:7]}… ({len(stored)} chars)")
        r = analyze(image=("fake.png", b"MZ\x90\x00 this is not really an image", "image/png"))
        case("NFT", "SEC-4: Disguised file upload", "Non-image bytes named .png", "Rejected", r.status_code == 400, f"{r.status_code} {r.json().get('detail')}")
        r = analyze(image=("huge.jpg", b"\xff\xd8\xff" + b"0" * (11 * 1024 * 1024), "image/jpeg"))
        case("NFT", "SEC-4: Oversized upload", "11 MB file", "Rejected (limit 10 MB)", r.status_code == 400, f"{r.status_code} {r.json().get('detail')}")
        r = c.get("/api/admin/users", params={"search": "' OR '1'='1"}, headers=HA)
        case("NFT", "SEC: SQL injection attempt", "Admin user search: ' OR '1'='1", "Treated as text, no users leaked",
             r.status_code == 200 and r.json() == [], f"{r.status_code}; {len(r.json())} users returned")
        r = analyze(duration="<b>2 weeks</para>")
        pdf_id = r.json().get("consultation_id")
        r = c.get(f"/api/consultations/{pdf_id}/download-pdf", headers=H)
        c.delete(f"/api/consultations/{pdf_id}", headers=H)
        case("NFT", "REL: PDF with unusual user text", "Duration: <b>2 weeks</para>", "PDF still generated",
             r.status_code == 200 and r.content.startswith(b"%PDF"), f"{r.status_code}, {len(r.content)} bytes")
finally:
    db.close()
    outer.rollback()
    connection.close()
    leftovers = set(os.listdir(UPLOADS)) - uploads_before
    for name in leftovers:
        os.remove(UPLOADS / name)
    if LOG_FILE.exists() and LOG_FILE.stat().st_size > log_size_before:
        for handler in logging.getLogger("dermasoul").handlers:
            handler.flush()
        with open(LOG_FILE, "r+", encoding="utf-8") as fh:
            fh.truncate(log_size_before)

# ============================================================== output
OUT_DIR.mkdir(parents=True, exist_ok=True)
total = sum(len(v) for v in results.values())
failed = [(s, r) for s, rows in results.items() for r in rows if r["result"] != "Pass"]
summary = {"run_at": started.isoformat(timespec="seconds"), "total": total, "passed": total - len(failed),
           "failed": len(failed), "database": "rolled back", "uploads_removed": len(leftovers)}
(OUT_DIR / "report_test_results.json").write_text(json.dumps({"summary": summary, "sections": results}, indent=1),
                                                    encoding="utf-8")
lines = [f"# DermaSoul AI — report test results", "",
         f"Run at {summary['run_at']}: **{summary['passed']}/{total} passed**, {summary['failed']} failed. "
         "Database changes rolled back; test uploads removed.", ""]
for key, title in SECTIONS.items():
    if not results[key]:
        continue
    lines += [f"## {title}", "", "| No. | Test case | Attribute and value | Expected result | Actual result | Result |",
              "|---|---|---|---|---|---|"]
    for r in results[key]:
        cells = [str(r["no"]), r["test_case"], r["attribute"], r["expected"], r["actual"], r["result"]]
        lines.append("| " + " | ".join(c.replace("|", "/").replace("\n", " ") for c in cells) + " |")
    lines.append("")
(OUT_DIR / "report_test_results.md").write_text("\n".join(lines), encoding="utf-8")
print(f"\n{summary['passed']}/{total} passed, {summary['failed']} failed | database rolled back | "
      f"{len(leftovers)} test upload(s) removed | results in {OUT_DIR}")
sys.exit(1 if failed else 0)
