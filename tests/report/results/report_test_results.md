# DermaSoul AI — report test results

Run at 2026-10-18T16:50:37: **146/146 passed**, 0 failed. Database changes rolled back; test uploads removed.

## Unit Testing 1: Email validation (Pydantic EmailStr)

| No. | Test case | Attribute and value | Expected result | Actual result | Result |
|---|---|---|---|---|---|
| 1 | Run EmailStr validation with valid email | "user@example.com" | True | True | Pass |
| 2 | Run EmailStr validation with invalid email | "userexample.com" | False | False | Pass |
| 3 | Run EmailStr validation with empty string | "" | False | False | Pass |
| 4 | Run EmailStr validation with subdomain email | "user@mail.company.co.uk" | True | True | Pass |
| 5 | Run EmailStr validation with email containing space | "user@exam ple.com" | False | False | Pass |

## Unit Testing 2: Password Hashing and Verification

| No. | Test case | Attribute and value | Expected result | Actual result | Result |
|---|---|---|---|---|---|
| 1 | Hash valid password | "SecurePass123!" | Non-empty bcrypt hash | $2b$12$… (60 chars) | Pass |
| 2 | Verify correct password | "SecurePass123!" | True | True | Pass |
| 3 | Verify incorrect password | "WrongPass123" | False | False | Pass |
| 4 | Verify empty password | "" | False | False | Pass |
| 5 | Hash same password twice | "SecurePass123!" | Different hashes (salt) | different hashes | Pass |

## Unit Testing 3: JWT Token Generation and Verification

| No. | Test case | Attribute and value | Expected result | Actual result | Result |
|---|---|---|---|---|---|
| 1 | Generate JWT token | User ID | Token generated | eyJhbGciOiJIUzI1… | Pass |
| 2 | Check JWT structure | Generated token | Header, payload and signature | 3 parts | Pass |
| 3 | Verify valid token | Valid token | Payload returned (user ID) | user-123 | Pass |
| 4 | Verify tampered token | Tampered token | Rejected | rejected | Pass |
| 5 | Verify expired token | Expired token | Rejected | rejected | Pass |

## Unit Testing 4: Image Quality Validation

| No. | Test case | Attribute and value | Expected result | Actual result | Result |
|---|---|---|---|---|---|
| 1 | Validate a sharp skin photo | Eczema test image | Passes the blur check | Passed (blur score 553.4) | Pass |
| 2 | Validate a blurred photo | Gaussian blur radius 3 | Rejected as blurry | Image appears blurry. Blur score: 4.41. Please upload a clearer photo of the affected skin area. | Pass |
| 3 | Validate a high-resolution photo | Resized to 3000 px | Passes (size-independent) | Passed (blur score 521.9) | Pass |
| 4 | Validate a non-skin screenshot | Synthetic 800x600 UI image | Rejected, no visible skin | No visible skin area detected. Please upload a clear photo of the affected skin area. | Pass |
| 5 | Validate an unsupported format | GIF image | Rejected | Only JPG, JPEG, and PNG images are allowed. | Pass |
| 6 | Validate a low-resolution image | 100x100 JPG | Rejected | Image resolution is too low. Uploaded image size is 100x100. Please upload an image of at least 128x128 pixels. | Pass |
| 7 | Validate a corrupted file | Non-image bytes named .jpg | Rejected | Invalid or corrupted image file. | Pass |

## Unit Testing 5: NLP Symptom Analysis

| No. | Test case | Attribute and value | Expected result | Actual result | Result |
|---|---|---|---|---|---|
| 1 | Extract symptoms, negation and duration | itchy, red, burning rash, 2 weeks, no pain | itching, redness, burning, rash; pain negated; 2 weeks | itching, redness, burning, rash; negated ['pain']; 2 weeks | Pass |
| 2 | Handle negated warning terms | Itchy red rash but no fever and no pus | fever and pus negated | negated ['fever', 'pus']; extracted ['itching', 'redness', 'rash'] | Pass |
| 3 | Recognise Roman-Urdu terms | khujli aur jalan on my arm | itching, burning | ['itching', 'burning'] | Pass |
| 4 | Extract descriptive symptoms | bumps, scaly patches, 3 months | bumps, scaling, patches; 3 months | ['bumps', 'scaling', 'patches']; 3 months | Pass |
| 5 | Fallback when the NER model is unavailable | itchy rash on my arm (model disabled) | Rule-based extraction still works | ['itching', 'rash']; version rule-fallback-v2 | Pass |

## Unit Testing 6: Red-Flag Detection and Risk Level

| No. | Test case | Attribute and value | Expected result | Actual result | Result |
|---|---|---|---|---|---|
| 1 | Detect red flags in text | rash is rapidly spreading with fever | Fever and rapid-spreading flags | ['fever_with_skin_issue', 'rapidly_spreading'] | Pass |
| 2 | Red flag overrides the model | Acne, 0.99, flags ['rapidly_spreading'], severity mild | High | High | Pass |
| 3 | High-risk condition | Skin Cancer, 0.99, flags none, severity mild | High | High | Pass |
| 4 | Severe symptoms | Acne, 0.9, flags none, severity severe | High | High | Pass |
| 5 | Moderate-risk condition | Eczema, 0.5, flags none, severity mild | Moderate | Moderate | Pass |
| 6 | Low model confidence | Acne, 0.3, flags none, severity mild | Uncertain | Uncertain | Pass |
| 7 | Confident mild case | Acne, 0.9, flags none, severity mild | Low to Moderate | Low to Moderate | Pass |
| 8 | Denied warning signs are ignored | Itchy red rash but no fever and no pus | No red flags | no red flags | Pass |
| 9 | Warning sign after 'but' is still flagged | No itching, but fever since yesterday | fever_with_skin_issue | ['fever_with_skin_issue'] | Pass |
| 10 | Denied breathing problem is ignored | Patient denies difficulty breathing | No red flags | no red flags | Pass |

## Unit Testing 7: RAG Assessment

| No. | Test case | Attribute and value | Expected result | Actual result | Result |
|---|---|---|---|---|---|
| 1 | Confident prediction with matching symptoms | Eczema, 0.90, itching and redness | Only Eczema sources, no related conditions | sources ['Eczema'] | Pass |
| 2 | Low-confidence prediction | Tinea, 0.30, itching, dryness, scaling | Related conditions added | sources ['Eczema', 'Infestations/Bites', 'Tinea'] | Pass |
| 3 | Warning signs of a changing mole | Tinea, 0.35, bleeding and changing mole | Skin Cancer shown as a related condition | sources ['Skin Cancer', 'Tinea', 'Vascular Tumors'] | Pass |
| 4 | Retrieval trace | Eczema, 0.90, itching | Condition chunks only, confidence between 0 and 1 | 5 chunks ['condition_knowledge']; retrieval confidence 0.6709 | Pass |

## Unit Testing 8: Skin-Type Classification

| No. | Test case | Attribute and value | Expected result | Actual result | Result |
|---|---|---|---|---|---|
| 1 | Predict skin type for three test images | Eczema, Acne, Psoriasis images | One of dry, normal or oily for each image | dry, dry, dry | Pass |
| 2 | Confidence score and band | Same three predictions | Confidence between 0 and 1 with a matching band | 0.63 (medium), 0.41 (low), 0.61 (medium) | Pass |
| 3 | Repeat prediction on the same image | Eczema image twice | Identical result | dry 0.6257 | Pass |
| 4 | Image with a different size and shape | Eczema image resized to 1600x500 | Valid prediction (resized to 240x240) | dry (0.62) | Pass |

## Unit Testing 9: Clinical Safety Guardrail

| No. | Test case | Attribute and value | Expected result | Actual result | Result |
|---|---|---|---|---|---|
| 1 | Remove an unsafe treatment claim | "This cream is a guaranteed cure for your rash." | Replaced with a safe educational statement | This assessment is educational support and not a definitive diagnosis. Please seek license | Pass |
| 2 | Detect advice to skip a doctor | "There is no need to see a doctor." | Flagged as unsafe | True | Pass |
| 3 | Keep safe guidance unchanged | "Keep the area clean and moisturise regularly." | Text unchanged | Keep the area clean and moisturise regularly. | Pass |

## Functional Testing 1: User Registration Flow

| No. | Test case | Attribute and value | Expected result | Actual result | Result |
|---|---|---|---|---|---|
| 1 | Register with valid credentials | Email: report-new@example.com, Password: SecurePass123! | Account is created | 200; role user | Pass |
| 2 | Register with duplicate email | Email already exists | Error message is displayed | 400 An account with this email already exists. | Pass |
| 3 | Register with invalid email | Email: invalid.email | Registration is rejected | 422 validation error | Pass |
| 4 | Register with weak password | Password: 123 | Registration is rejected | 422 validation error | Pass |
| 5 | Register with empty fields | Email: "", Password: "" | Required field error | 422 validation error | Pass |

## Functional Testing 2: Login with Different Roles

| No. | Test case | Attribute and value | Expected result | Actual result | Result |
|---|---|---|---|---|---|
| 1 | Login as regular user | report-user@example.com | Logged in as user; Admin menu hidden | 200; role user | Pass |
| 2 | Login as admin | report-admin@example.com | Logged in as admin; Admin menu available | 200; role admin | Pass |
| 3 | Login with wrong password | Valid email, wrong password | Invalid credentials error | 401 Invalid email or password. | Pass |
| 4 | Login with non-existing email | ghost@example.com | Invalid credentials error | 401 Invalid email or password. | Pass |
| 5 | Token returned for future requests | Valid credentials | JWT token returned and accepted | token with 3 parts accepted | Pass |

## Functional Testing 3: Profile Operations

| No. | Test case | Attribute and value | Expected result | Actual result | Result |
|---|---|---|---|---|---|
| 1 | Get profile | Authenticated user token | User profile is returned | 200 | Pass |
| 2 | Update full name | Full Name: Updated Name | Full name is updated | Updated Name | Pass |
| 3 | Update age | Age: 28 | Age field is updated | 28 | Pass |
| 4 | Update allergies | Known Allergies: Penicillin | Allergies are saved | Penicillin | Pass |
| 5 | Access profile without token | No JWT token | Access denied | 401 | Pass |

## Functional Testing 4: Skin Analysis API

| No. | Test case | Attribute and value | Expected result | Actual result | Result |
|---|---|---|---|---|---|
| 1 | Analyze a valid image | Eczema image + "Itchy dry red patches on my arm for 3 weeks" | 200 with the full assessment | 200; Eczema (96.9%), risk Moderate, 67 response fields | Pass |
| 2 | Request without an image | Symptoms only | Request rejected | 422 validation error | Pass |
| 3 | Symptoms too short | Symptoms: "hi" | Validation error | 400 Please describe your symptoms in at least 5 characters. | Pass |
| 4 | Non-image file | Plain-text file | Rejected | 400 Only JPG, JPEG, and PNG images are allowed. | Pass |
| 5 | Blurry image | Blurred test image | Rejected | 400 Image appears blurry. Blur score: 6.11. Please upload a clearer photo of the affected skin area. | Pass |
| 6 | Screenshot | Synthetic UI image | Rejected | 400 No visible skin area detected. Please upload a clear photo of the affected skin area. | Pass |
| 7 | Request without a token | Valid request, no JWT | Access denied | 401 | Pass |

## Functional Testing 5: Safe Product Recommendations

| No. | Test case | Attribute and value | Expected result | Actual result | Result |
|---|---|---|---|---|---|
| 1 | Low-risk acne | Acne, oily skin, Low to Moderate | Up to 4 suitable products | preventive-skincare, supportive-skincare, supportive-skincare, preventive-skincare | Pass |
| 2 | High-risk case | Acne, oily skin, High | No active or pharmacist-guided products | gentle cleanser [supportive_skincare]; broad_spectrum sunscreen [preventive_skincare]; preventive_skincare [preventive_skincare]; supportive_skincare [supportive_skincare] | Pass |
| 3 | Red flag present | Acne, pus_or_infection flag | OTC actives and pharmacist-guided products removed | preventive_skincare [preventive_skincare]; supportive_skincare [supportive_skincare]; supportive_skincare [supportive_skincare]; preventive_skincare [preventive_skincare] | Pass |
| 4 | Known allergy | Eczema, allergy: fragrance | Products flagged for that allergy removed | allergy filter applied=True; conflicting items none | Pass |

## Functional Testing 6: Educational Content

| No. | Test case | Attribute and value | Expected result | Actual result | Result |
|---|---|---|---|---|---|
| 1 | List articles without logging in | GET /api/education | Public list of articles | 200; 5 articles | Pass |
| 2 | Search articles | search = "eczema" | Eczema article returned | ['eczema'] | Pass |
| 3 | Open an article | slug = eczema | Full article content returned | 200; Eczema: Flare Management and Skin Barrier Care | Pass |
| 4 | Open a missing article | slug = no-such-article | Not found | 404 | Pass |
| 5 | Related articles | slug = eczema (temporary article added in the same category) | Same-category article listed, the article itself excluded | 200; ['report-test-eczema-care'] | Pass |
| 6 | Article suggested after an analysis | Eczema analysis from Functional Testing 4 | Link to the Eczema article | eczema | Pass |

## Functional Testing 7: Dermatologist Directory and Referrals

| No. | Test case | Attribute and value | Expected result | Actual result | Result |
|---|---|---|---|---|---|
| 1 | Admin adds a dermatologist | Dr Report Test | Created (201) | 201 | Pass |
| 2 | Add without a name | Missing full_name | Validation error | 422 | Pass |
| 3 | User browses the directory | User token | New active dermatologist listed | 2 listed | Pass |
| 4 | Referral for a high-risk case | High risk, Skin Cancer | Matching dermatologist referred | ['Dr Report Test (12 years experience, specialty match)', 'abdul munim (5 years experience)'] | Pass |
| 5 | No referral for a low-risk case | Low to Moderate, Acne | No referral | none | Pass |
| 6 | Disabled entry hidden from users | Admin disables Dr Report Test | Hidden from users (even with include_inactive), visible to admin | user sees it: False; admin sees it: True | Pass |
| 7 | Disabled entry not referred | High risk, Skin Cancer | Not referred | not referred | Pass |
| 8 | Admin deletes the entry | Dr Report Test | Entry removed | 200 | Pass |

## Functional Testing 8: Account Management

| No. | Test case | Attribute and value | Expected result | Actual result | Result |
|---|---|---|---|---|---|
| 1 | Change password with wrong current password | Current: Wrong123! | Rejected | 401 Current password is incorrect. | Pass |
| 2 | Change to a too-short password | New: short | Validation error | 422 | Pass |
| 3 | Change password correctly | New: NewPass456! | Old password rejected, new password works | 200; old login 401, new login 200 | Pass |
| 4 | Delete account with wrong password | Password: Wrong123! | Rejected | 401 Password is incorrect. | Pass |
| 5 | Delete account correctly | Correct password | Account, consultations and images removed | 200; login afterwards 401; image file removed: True | Pass |
| 6 | Disabled user with an existing token | Token issued before the account was disabled | Access denied | before 200, after 403 This account is disabled. | Pass |
| 7 | Expired token | Token past its 60-minute lifetime | Access denied | 401 Invalid or expired authentication token. | Pass |

## Business Rules Testing (RBAC)

| No. | Test case | Attribute and value | Expected result | Actual result | Result |
|---|---|---|---|---|---|
| 1 | User is authenticated as normal user | GET /api/profile/me | Access allowed | 200 OK | Pass |
| 2 | User is authenticated as normal user | GET /api/admin/users | Access denied | 403 Admin access required. | Pass |
| 3 | User is authenticated as admin | GET /api/admin/users | Access allowed | 200 OK | Pass |
| 4 | User is authenticated as admin | GET /api/profile/me | Access allowed | 200 OK | Pass |
| 5 | User is not authenticated | GET /api/profile/me | Access denied | 401 Not authenticated | Pass |
| 6 | User sends invalid token | GET /api/profile/me | Access denied | 401 Invalid or expired authentication token. | Pass |
| 7 | User is authenticated as normal user | POST /api/admin/ai/reindex-rag | Access denied | 403 Admin access required. | Pass |
| 8 | User is authenticated as admin | GET /api/admin/ai/model-registry | Access allowed | 200 OK | Pass |
| 9 | User is authenticated as normal user | GET /api/admin/consultations/flagged | Access denied | 403 Admin access required. | Pass |
| 10 | User is authenticated as normal user | POST /api/dermatologists | Access denied | 403 Admin access required. | Pass |
| 11 | User is authenticated as admin | PATCH /api/admin/users/33331234-c8e0-444b-a158-1b013be2c91e/status | Admin cannot disable own account | 400 You cannot disable your own admin account. | Pass |

## Integration Testing 1: Complete Authentication Flow

| No. | Test case | Attribute and value | Expected result | Actual result | Result |
|---|---|---|---|---|---|
| 1 | Register user | Valid email and password | User account is created | 200 | Pass |
| 2 | Login with same credentials | Registered email and password | JWT token is returned | 200 | Pass |
| 3 | Verify JWT format | Returned token | Valid JWT format | 3 parts | Pass |
| 4 | Access protected profile route | Authorization Bearer token | Profile data is returned | 200 | Pass |
| 5 | Update profile | Age and allergies | Values saved | 200 | Pass |
| 6 | Retrieve updated profile | Same token | Updated values returned | age 31, allergies Fragrance | Pass |

## Integration Testing 2: Admin User Management Workflow

| No. | Test case | Attribute and value | Expected result | Actual result | Result |
|---|---|---|---|---|---|
| 1 | Admin login | Admin email and password | Admin token is generated | 200 | Pass |
| 2 | List all users | Admin JWT token | List of users is returned | 200; 24 users | Pass |
| 3 | View a user's consultations | Selected user ID | User's consultation list is returned | 200; 1 consultations | Pass |
| 4 | Deactivate user | User ID | is_active becomes False | False | Pass |
| 5 | Login as deactivated user | Deactivated user credentials | Login is denied | 403 This account is disabled. | Pass |
| 6 | Reactivate user | User ID | is_active becomes True | True | Pass |
| 7 | Login as reactivated user | Reactivated user credentials | Login succeeds | 200 | Pass |

## Integration Testing 3: Complete Analysis and Consultation Workflow

| No. | Test case | Attribute and value | Expected result | Actual result | Result |
|---|---|---|---|---|---|
| 1 | Run a skin analysis | Valid image and symptoms | Consultation saved and returned | consultation 9bf5ed91… | Pass |
| 2 | View consultation history | Same user token | New consultation listed | 200; 1 listed | Pass |
| 3 | Open consultation detail | Consultation ID | Full assessment returned | 200; Eczema with RAG assessment | Pass |
| 4 | Download PDF report | Consultation ID | PDF file returned | 200, application/pdf, 7166 bytes | Pass |
| 5 | Retrieve uploaded image | Consultation ID | Image returned | 200, image/jpeg | Pass |
| 6 | Access by another user | Other user's token | Access denied | 404 | Pass |
| 7 | Admin views the consultation | Admin token | Details returned | 200 | Pass |
| 8 | Delete the consultation | Owner token | Consultation deleted | 200 | Pass |
| 9 | Open after deletion | Same consultation ID | Not found | 404 | Pass |

## Integration Testing 4: Admin Content Management and Dashboard

| No. | Test case | Attribute and value | Expected result | Actual result | Result |
|---|---|---|---|---|---|
| 1 | Admin adds a product | Report Test Cleanser | Created (201) | 201 | Pass |
| 2 | User tries to add a product | User token | Access denied | 403 | Pass |
| 3 | Admin updates the product | price_range = PKR 500-800 | Product updated | PKR 500-800 | Pass |
| 4 | Admin deletes the product | Product ID | Product removed | 200; afterwards 404 | Pass |
| 5 | Admin publishes an article | Report Test Article | Created with a URL slug | 201; slug report-test-article | Pass |
| 6 | Admin edits the article | summary = Updated summary | Article updated | Updated summary | Pass |
| 7 | Admin deletes the article | slug report-test-article | Article removed | 200; afterwards 404 | Pass |
| 8 | High-risk case appears in flagged list | Analysis with fever and pus | Listed as flagged (High risk) | 200; listed: True; all High: True | Pass |
| 9 | Dashboard statistics | Admin token | Counts consistent with the database | users 24 (21 active), consultations 43, high risk 16 | Pass |

## Non-Functional Testing

| No. | Test case | Attribute and value | Expected result | Actual result | Result |
|---|---|---|---|---|---|
| 1 | PER-2: Analysis response time | 3 full analyses of a valid image | Under 20 seconds each | average 1.06 s, slowest 1.29 s | Pass |
| 2 | Server stays responsive during an analysis | Health check sent while an analysis runs | Answered without waiting for the analysis | health check 8 ms while analysis took 1215 ms | Pass |
| 3 | REL-2: Invalid images stopped before the AI model | Text, corrupted, blurry and screenshot uploads | AI model never runs | model ran 0 times for 4 invalid uploads | Pass |
| 4 | REL-3: Unexpected server error | Deliberate internal failure | Clear error message, no endless loading | 500 "An unexpected server error occurred. Please try again." in 3 ms | Pass |
| 5 | SEC-2: Password storage | Stored password of a test user | bcrypt hash, never plain text | $2b$12$… (60 chars) | Pass |
| 6 | SEC-4: Disguised file upload | Non-image bytes named .png | Rejected | 400 Invalid or corrupted image file. | Pass |
| 7 | SEC-4: Oversized upload | 11 MB file | Rejected (limit 10 MB) | 400 Image size must be less than 10MB. | Pass |
| 8 | SEC: SQL injection attempt | Admin user search: ' OR '1'='1 | Treated as text, no users leaked | 200; 0 users returned | Pass |
| 9 | REL: PDF with unusual user text | Duration: <b>2 weeks</para> | PDF still generated | 200, 7195 bytes | Pass |
