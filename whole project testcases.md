# Whole Project Test Cases — DermaSoul AI

## 7.1 Unit Testing

Unit testing verifies the smallest testable functions and validation rules independently. The cases below are based on implemented backend utilities, services, and schemas.

**Unit Testing Objective:** Confirm that isolated functions handle valid, invalid, boundary, and safety-related inputs as designed.

**Unit Testing 1: Core validation, security, AI-support, and file-handling functions**

| No. | Test case / Test script | Attribute and Value | Expected Result | Actual Result |
|---:|---|---|---|---|
| 1 | Call `validate_email_format()` with a valid email | `user@example.com` | Returns `True` | Not Run |
| 2 | Call `validate_email_format()` with invalid email formats | Missing `@`, empty string, multiple `@` symbols | Returns `False` for each invalid value | Not Run |
| 3 | Call `hash_password()` and `verify_password()` | Password `SecurePass123!`; verify with correct and incorrect values | Hash is not the plaintext; correct password verifies `True`; incorrect password verifies `False` | Not Run |
| 4 | Call `decode_access_token()` with valid and invalid JWTs | Valid token with `sub`; tampered/expired token | Returns the subject/user ID for valid token; returns `None` for invalid or expired token | Not Run |
| 5 | Call `get_confidence_level()` at threshold boundaries | Scores `0.49`, `0.50`, `0.75` | Returns `low`, `medium`, `high`, respectively | Not Run |
| 6 | Call `round_confidence()` | Score `0.823456` | Returns `0.8235` | Not Run |
| 7 | Call `validate_image_file_metadata()` | Valid JPEG/PNG; unsupported GIF; empty bytes; file over configured 10 MB limit | Accepts valid metadata; raises HTTP 400 for unsupported type, empty file, or oversized upload | Not Run |
| 8 | Call `open_and_validate_image()` | Corrupt image; valid image smaller than 128 × 128; valid image at least 128 × 128 | Rejects corrupt and too-small images with HTTP 400; returns a converted RGB image for a valid image | Not Run |
| 9 | Call `validate_image_not_blurry()` | Image with blur score below 20; image at or above 20 | Rejects a score below 20 with HTTP 400; returns the score for an accepted image | Not Run |
| 10 | Call `validate_visible_skin()` | Non-skin/screenshot-like image; image passing visible-skin checks | Rejects images meeting the configured no-skin/screenshot criteria; otherwise returns skin-ratio and edge-density metrics | Not Run |
| 11 | Call `extract_symptoms()` and `contains_keyword()` | Text `"itchy rash and red patches"`; unrelated word containing `red` as a substring | Extracts recognized symptoms without false single-word substring matches | Not Run |
| 12 | Call `extract_duration_from_text()` | `"rash for 2 weeks"`; text with no duration | Returns `2 weeks`; returns `None` when no supported duration is present | Not Run |
| 13 | Call `infer_severity_from_symptoms()` | `["bleeding"]`; `["itching"]`; `[]` | Returns `severe`; `mild`; `None`, respectively | Not Run |
| 14 | Call `detect_red_flags()` | Symptoms: `"The rash is rapidly spreading"`; then benign text | Includes `rapidly_spreading` for the first input; returns an empty list for the second | Not Run |
| 15 | Call `calculate_risk_level()` with risk rule boundary inputs | Red flag present; `Skin Cancer`; severe severity; `Eczema` at confidence `0.50`; confidence below `0.50` | Returns `High` for any of the first three applicable high-risk cases; `Moderate` for qualifying Eczema; `Uncertain` for low confidence when no earlier rule applies | Not Run |
| 16 | Call `generate_safe_recommendations()` with a matching allergy | Known allergy `fragrance`; product has `fragrance` in `avoid_if_allergic_to` | Excludes the conflicting product and sets `allergy_filter_applied` to `True` | Not Run |
| 17 | Call `generate_safe_recommendations()` with high risk or red flags | High risk with OTC-active product; red flags with OTC-active product | Filters/strongly penalizes unsafe OTC-active choices; returned recommendations respect the configured maximum (default 4) | Not Run |
| 18 | Call `retrieve_relevant_entries()` | Predicted disease `Acne`; matching condition knowledge; `top_k=2` | Returns no more than 2 scored entries, ordered by descending retrieval score | Not Run |
| 19 | Call `enforce_safety_policy()` | Risk `High`; empty `next_steps`; supplied doctor warning | Inserts the urgent in-person evaluation step, sets escalation flag `True`, and retains the supplied warning | Not Run |
| 20 | Call `delete_uploaded_image()` with unsafe path values | Filename containing `..`, `/`, or `\` | Does not delete files outside the upload directory | Not Run |
| 21 | Call `PDFReportGenerator._get_risk_color()` | Risk `High` and risk `Low` | Returns configured danger/red for High and primary/green for Low | Not Run |

**Existing automated test evidence:** `tests/backend/test_validators.py` has pytest cases for email validation. The other rows are proposed tests based on current implementation; their actual results are not claimed here.

---

## 7.2 Functional Testing

Functional testing validates complete user-facing features through the web application or API.

**Functional Testing Objective:** Verify that each implemented public, authenticated-user, and administrator feature accepts the correct inputs, returns the correct information, and handles invalid or unauthorized requests appropriately.

**Functional Testing 1: Public pages, authentication, and account/profile management**

| No. | Test Case | Attribute and Value | Expected Result | Actual Result | Result |
|---:|---|---|---|---|---|
| 1 | Open public Home and About pages | Visit `/` and `/about` without logging in | Public pages render without requiring authentication | Not Run | Not Run |
| 2 | Register a new user | Valid email; password of 8–100 characters | `POST /api/auth/register` creates a lowercase-email `user` account and its initial profile; response does not expose the password hash | Not Run | Not Run |
| 3 | Register with invalid or duplicate details | Malformed email; password under 8 characters; already-registered email | Invalid schema values are rejected; duplicate email returns HTTP 400 with duplicate-account message | Not Run | Not Run |
| 4 | Log in with valid credentials | Registered email and correct password | `POST /api/auth/login` returns `access_token` and bearer token type | Not Run | Not Run |
| 5 | Log in with invalid password or disabled account | Wrong password; then disabled user with correct password | Wrong credentials return HTTP 401; disabled account returns HTTP 403 | Not Run | Not Run |
| 6 | View current-user information with a bearer token | Valid token; then missing, invalid, or expired token | `GET /api/auth/me` returns the current user for a valid token; invalid/missing token is rejected | Not Run | Not Run |
| 7 | Change password | Correct current password and new password at least 8 characters; repeat with wrong current password | Correct change returns success; wrong current password returns HTTP 401; new password works for next login | Not Run | Not Run |
| 8 | Delete account with password confirmation | Correct password; repeat with incorrect password | Correct password deletes account, dependent profile/consultations and uploaded consultation images; wrong password returns HTTP 401 | Not Run | Not Run |
| 9 | View and update profile | Authenticated user; name, age, gender, allergies, history and concerns | `GET/PUT /api/profile/me` returns/saves profile; blank text is normalized to null; accepted gender is one of the configured values | Not Run | Not Run |
| 10 | Submit invalid profile values | Age `0` or `121`; full name shorter than 2 characters; invalid gender | Schema or route validation rejects invalid values; invalid gender returns HTTP 400 | Not Run | Not Run |

**Functional Testing 2: Skin analysis, consultations, and PDF reports**

| No. | Test Case | Attribute and Value | Expected Result | Actual Result | Result |
|---:|---|---|---|---|---|
| 11 | Submit a skin analysis | Authenticated user; valid JPG/PNG, at least 128 × 128 and within configured 10 MB limit; symptoms 5–2000 characters | `POST /api/diagnosis/analyze` returns prediction/confidence, skin type, extracted symptom and risk information, guidance, safety note, recommendations, and saved consultation ID | Not Run | Not Run |
| 12 | Submit unsupported, empty, corrupt, oversized, or too-small image | GIF; empty bytes; corrupt file; over 10 MB; dimensions below 128 × 128 | Request is rejected with HTTP 400 and an applicable validation message | Not Run | Not Run |
| 13 | Submit invalid symptoms, severity, or long optional text | Symptoms shorter than 5 or over 2000 chars; severity `critical`; optional field beyond its limit | Request is rejected with HTTP 400; accepted severity values are `mild`, `moderate`, `severe`, or `unknown` | Not Run | Not Run |
| 14 | Submit analysis with optional skin context | Skin tone, Fitzpatrick type, or ethnicity/region supplied | Response includes applicable melanin context/guidance and preserves supplied context in the saved consultation | Not Run | Not Run |
| 15 | View consultation history with pagination | Authenticated user; default list, then `limit`/`offset` | `GET /api/consultations` returns only the current user’s records, newest first, with total/limit/offset and selected page | Not Run | Not Run |
| 16 | Test consultation pagination bounds | `limit=1` and `limit=100`; then `limit=0` or `101`, negative offset | Valid bounds are accepted; out-of-range query values are rejected by API validation | Not Run | Not Run |
| 17 | Open consultation details and stored image | Owned consultation ID; image available | Detail endpoint returns saved analysis; image endpoint returns the owned stored image | Not Run | Not Run |
| 18 | Download consultation PDF | Authenticated owner and existing consultation ID | PDF download streams `application/pdf` with attachment filename and report content for the consultation | Not Run | Not Run |
| 19 | Delete consultation | Authenticated owner; consultation with stored image | API confirms deletion; record and stored image are removed | Not Run | Not Run |
| 20 | Request another user’s consultation or an unavailable image | Valid token for user A; record belongs to user B; or record has missing image | Resource is not disclosed; API returns not found for non-owned consultation or unavailable stored image | Not Run | Not Run |

**Functional Testing 3: Education, products, dermatologists, and Admin console**

| No. | Test Case | Attribute and Value | Expected Result | Actual Result | Result |
|---:|---|---|---|---|---|
| 21 | Browse and search the education library | Public `/conditions`; `GET /api/education` with category/search/limit/offset | Public article list is displayed; filters and pagination affect returned articles | Not Run | Not Run |
| 22 | Open education detail, related articles, and condition knowledge | Existing slug; related endpoint; knowledge endpoint | Article detail, related articles, or matching condition knowledge is returned for that slug | Not Run | Not Run |
| 23 | View product shelf | Authenticated user; `GET /api/products` and product detail | Product list and selected product details are displayed | Not Run | Not Run |
| 24 | View dermatologist directory | Authenticated user; default active-only query | Active dermatologist records are displayed; inactive entries are excluded by default | Not Run | Not Run |
| 25 | Open admin routes as a regular user | Authenticated role `user`; navigate `/app/admin` and call admin endpoints | Frontend redirects away from admin pages; API returns HTTP 403 for admin-only operations | Not Run | Not Run |
| 26 | View Admin dashboard and user list | Admin token; stats and optional email search/pagination | Admin stats show totals; user list is newest first; search filters by email and pagination applies | Not Run | Not Run |
| 27 | Update a user’s active status and inspect that user’s consultations | Admin token; existing user ID; status toggle | Status is persisted; consultation list for that user is returned with pagination; unknown user consultation lookup returns HTTP 404 | Not Run | Not Run |
| 28 | Review flagged consultations and consultation details | Admin token; default High risk or another risk-level filter; existing consultation ID | Flagged list contains matching risk level; detail includes owning user email; unknown consultation returns HTTP 404 | Not Run | Not Run |
| 29 | View AI model registry and run RAG reindex | Admin token; `GET /api/admin/ai/model-registry`, `POST /api/admin/ai/reindex-rag` | Registry returns model name/version/loaded state; reindex endpoint returns ingestion counts | Not Run | Not Run |
| 30 | Create, update, and delete product as Admin | Valid product fields; then update and delete ID | Admin product mutations persist and return product data/success; invalid schema values are rejected; regular user is denied | Not Run | Not Run |
| 31 | Create, update, and delete education article as Admin | Valid article payload and slug; then update/delete | Admin changes persist and public article views reflect them; non-admin write operations are rejected | Not Run | Not Run |
| 32 | Create, edit, deactivate, reactivate, and delete dermatologist as Admin | Valid full name, optional contact/booking fields, active flag | Admin directory changes persist; normal user sees active-only entries; invalid booking URL/experience/name is rejected | Not Run | Not Run |

---

## 7.3 Business Rules Testing

Business-rule testing checks the rules governing risk assessment, safe product recommendations, input acceptance, ownership, and role permissions.

**Business Rules Testing Objective:** Ensure the application applies its implemented rules consistently and does not bypass high-risk warnings, validation, allergy exclusions, or access controls.

**Business Rules Testing 1: Risk and clinical-safety decision table**

| No. | Test Case / Condition | Attribute and Value | Expected Result | Actual Result | Result |
|---:|---|---|---|---|---|
| 1 | Red flag detected | Any detected red flag, such as `rapidly_spreading`, `fever_with_skin_issue`, or `breathing_or_face_swelling` | Risk is `High`; doctor warning advises prompt professional assessment | Not Run | Not Run |
| 2 | High-risk predicted disease | `Skin Cancer` or `Melanoma Warning Sign`; no red flag required | Risk is `High` | Not Run | Not Run |
| 3 | Severe inferred symptom severity | Severity `severe`; no red flags required | Risk is `High` | Not Run | Not Run |
| 4 | Configured moderate-risk disease with confidence at least 0.50 | Example `Eczema`, confidence `0.50`; no red flags and not severe | Risk is `Moderate` | Not Run | Not Run |
| 5 | Moderate inferred severity, with no earlier high-risk condition | Severity `moderate`; no red flags | Risk is `Moderate` | Not Run | Not Run |
| 6 | Low-confidence prediction where no earlier rule applies | Confidence `< 0.50`; no red flags, high-risk disease, severe severity, or qualifying moderate-risk disease | Risk is `Uncertain`; warning communicates uncertainty | Not Run | Not Run |
| 7 | No previous risk rule applies and confidence is at least 0.50 | Non-high/moderate disease; no red flags; non-severe/non-moderate severity | Risk is `Low to Moderate` | Not Run | Not Run |
| 8 | Red flags/high risk reach recommendation safety policy | Risk `High` or a non-empty red-flag list | Safety note limits recommendations to basic supportive care and tells user not to rely on OTC products as treatment | Not Run | Not Run |
| 9 | User has a known allergy matching product avoid-list | E.g. profile allergy `fragrance`; product blocks `fragrance` | Conflicting product is excluded; allergy filter indicator reflects that allergy text was provided | Not Run | Not Run |
| 10 | Product is blocked for predicted condition | Predicted disease appears in product `avoid_for_conditions` | Product is excluded even if condition/skin type otherwise match | Not Run | Not Run |
| 11 | High risk with OTC-active or pharmacist-guided candidate | Product type `otc_active` or `pharmacist_guided_otc`; risk `High` | High-risk score penalty prevents the candidate from entering the final positive-score recommendation list | Not Run | Not Run |
| 12 | Red flags with OTC-active candidate | Non-empty red flags; product type `otc_active` | Candidate receives negative score penalty and is not returned if its final score is non-positive | Not Run | Not Run |
| 13 | Severity input is allowed vs. unsupported | `MILD`, ` moderate `, `severe`, `unknown`; then `critical` | Allowed values normalize to lowercase; unsupported severity returns HTTP 400 | Not Run | Not Run |
| 14 | Image upload matches format/size/resolution rules | JPG/JPEG/PNG, matching filename extension and content type, non-empty and ≤ configured limit, ≥128 × 128 | Valid upload proceeds to image checks; each violated metadata/resolution rule is rejected with HTTP 400 | Not Run | Not Run |
| 15 | Symptoms and optional fields meet length limits | Symptoms 5–2000; duration ≤100; medical history ≤2000 characters | Valid data is trimmed and accepted; values outside limits are rejected | Not Run | Not Run |
| 16 | Registration, profile, product, and provider schema boundaries | Password 8–100; profile age 1–120; product name 2–150; doctor name 2–150 and experience 0–80 | Values inside bounds pass schema validation; values outside bounds are rejected | Not Run | Not Run |

**Business Rules Testing 2: Authorization, privacy, and data access decision table**

| No. | Test Case / Condition | Attribute and Value | Expected Result | Actual Result | Result |
|---:|---|---|---|---|---|
| 17 | Unauthenticated access to a protected route | No bearer token | Request is rejected; protected account, diagnosis, consultation, products, dermatologist, and admin endpoints do not return private data | Not Run | Not Run |
| 18 | Regular user calls an admin-only route | Role `user`; Admin products/articles/providers/users/AI routes | API returns HTTP 403; admin data and mutation operations remain inaccessible | Not Run | Not Run |
| 19 | User accesses another user’s consultation | User A token; User B’s detail, image, or PDF ID | Endpoint returns HTTP 404; consultation content is not disclosed | Not Run | Not Run |
| 20 | User lists own consultations | User A has records; User B has records | Response contains only User A’s records, ordered newest first | Not Run | Not Run |
| 21 | Admin filters flagged consultations | Risk filter `High`; then another supplied risk level | Returned records match the requested risk-level filter; default filter is High | Not Run | Not Run |
| 22 | User disables/deletes themselves only with required proof | Change password/delete-account request with wrong current password | Operation is rejected with HTTP 401; password/account data is not changed | Not Run | Not Run |

**Decision-rule note:** Risk order follows the implementation: red flags, configured high-risk disease, severe severity, qualifying moderate-risk disease, moderate severity, confidence below 0.50, then `Low to Moderate`. This is an application rule, not a claim of clinical diagnosis or medical efficacy.

---

## 7.4 Integration Testing

Integration testing verifies data flow among the frontend, FastAPI routers, database, image storage, ML/NLP/RAG services, recommendations, referral logic, and PDF generation.

**Integration Testing Objective:** Verify complete workflows across connected modules, including successful persistence, authorization, outputs, and cleanup.

**Integration Testing 1: End-to-end workflows across the whole project**

| No. | Test Case / Test Script | Attribute and Value | Expected Result | Actual Result | Result |
|---:|---|---|---|---|---|
| 1 | Start backend and check service health | Configured environment/database; start API; call `/` and `/health` | Startup creates database tables and upload directory; root returns service/version; health returns `healthy` | Not Run | Not Run |
| 2 | Register → database profile → login → authenticated session | Register unique email; log in; call `/api/auth/me` and `/api/profile/me` | User and initial profile persist; returned token identifies same account; protected routes return that user | Not Run | Not Run |
| 3 | Change password → login with new credentials | Change using correct current password; log in with new then old password | New password authenticates; old password fails; stored password remains hashed | Not Run | Not Run |
| 4 | Save profile allergies → run diagnosis → filter products | Save allergy matching a catalog product; analyze condition matching that product | Diagnosis reads profile allergy text; conflicting item is absent from response recommendations; allergy-filter flag is set | Not Run | Not Run |
| 5 | Analyze image through the entire diagnosis pipeline | Authenticated user, valid representative skin image, symptoms and optional context; model files/services available | Image validation, disease and skin-type inference, NLP, risk rules, RAG, safe recommendations, narrative, referrals, and consultation persistence complete; response has consultation ID | Not Run | Not Run |
| 6 | Diagnosis → consultation record → history and detail UI | Use successful analysis consultation ID | Persisted prediction/risk/context can be read in history and detail; frontend displays matching consultation information | Not Run | Not Run |
| 7 | Diagnosis image → authenticated image endpoint | Owned consultation with stored image | Image endpoint serves the stored image only to its owner; other user receives not found | Not Run | Not Run |
| 8 | Diagnosis risk → warning, support content, and referral selection | Red-flag case; active eligible dermatologist record and then no eligible record | High-risk warning appears; eligible referrals can be returned up to 3; empty referral result does not fabricate provider data | Not Run | Not Run |
| 9 | High-risk consultation → optional alert integration | High-risk diagnosis; SMTP enabled with test mail configuration, then SMTP disabled | With SMTP configured, alert attempt targets the user email; with SMTP disabled, diagnosis completes without requiring mail service | Not Run | Not Run |
| 10 | Consultation → PDF generation → web download | Existing owned consultation with diagnosis, warnings, recommendations, and knowledge fields | PDF bytes are returned as `application/pdf` attachment and browser downloads a PDF containing consultation report sections | Not Run | Not Run |
| 11 | Consultation delete → database and filesystem cleanup | Owned consultation with an existing stored image | API confirms deletion; database record and associated image are removed; later detail/image access returns not found | Not Run | Not Run |
| 12 | Account delete → related data and image cleanup | User with profile, consultations, and stored images; correct password | User deletion cascades related database records and service deletes owned uploaded images; subsequent login fails | Not Run | Not Run |
| 13 | Admin manage product → user product shelf and diagnosis catalog | Admin creates/updates/deletes product; authenticated user refreshes product list; diagnosis uses DB products if present | Product changes persist and appear in user-visible list; recommendation source becomes hybrid when DB products are used | Not Run | Not Run |
| 14 | Admin manage education article → public condition pages | Admin creates/updates article; request public article list/detail/related views | Database article changes are reflected in public education APIs and pages | Not Run | Not Run |
| 15 | Admin manage dermatologist → directory and referral matching | Admin creates/updates/deactivates/deletes provider; request directory and run eligible referral flow | Active filtering reflects status; eligible active providers may be considered by referral service; deleted/deactivated providers are not presented as active | Not Run | Not Run |
| 16 | Admin user controls → login and statistics | Admin disables user; that user attempts login; re-enable; refresh stats | Disabled account login is rejected with HTTP 403; active/disabled and total-user counts update after changes | Not Run | Not Run |
| 17 | Admin model registry and RAG reindex job | Admin token; request registry and start reindex with database and knowledge configuration available | Registry returns model state; reindex job returns counts and closes its database session on completion | Not Run | Not Run |
| 18 | Frontend authentication and route guards → backend authorization | Visit protected route logged out, as regular user, and as admin; make matching API calls | Logged-out user is redirected to login; regular user cannot access admin route/API; admin receives permitted console access | Not Run | Not Run |

### Test Environment / Preconditions

- Configure backend environment variables, database, upload path, and frontend API proxy for the test environment.
- Full diagnosis integration cases require the configured model files and NLP/RAG dependencies. Use a representative test image that passes upload, blur, and visible-skin checks; a 1 × 1 placeholder is invalid because image resolution must be at least 128 × 128.
- SMTP alert testing requires a test mail configuration; it is optional and disabled by default.
- Use isolated test accounts and synthetic/test data. Avoid real patient images or health information unless approved and protected.
- Record the observed response or behavior in **Actual Result** and mark **Result** as Pass or Fail only after execution. Every row currently says **Not Run**; this document specifies test cases and expected behavior and is not evidence that the full suite has passed.
