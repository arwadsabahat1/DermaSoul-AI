# DermaSoul-AI: Stage-Wise Development Roadmap

**Documentation refreshed:** 8 May 2026

## Authoritative current state (read this first)

Older sections below were written as a **forward-looking implementation plan**. Several subsections still say files are “EMPTY” or stages are “NEXT”—that is **obsolete** for the repository as of May 2026. **Use this block as source of truth**; use historical stages for background only.

### What the codebase actually includes today

- **Full stack:** React 19 + Vite + TypeScript SPA; FastAPI + PostgreSQL backend.  
- **Vision:** EfficientNet-B3 disease classifier + EfficientNet-B1 skin-type classifier; OpenCV blur and skin-heuristic gates.  
- **Text:** NLP pipeline with optional Hugging Face **token-classification NER** (`biomedical-ner-all` path in settings) and **rule-based** severity/urgency; negation handling.  
- **RAG:** Curated `condition_knowledge.json` scoring + optional **SentenceTransformers** embeddings against `RAGDocument` rows. Settings include **`RAG_RERANKER_MODEL`** but the service layer **does not run** a cross-encoder—only score-based resorting.  
- **Narrative / “LLM” DB fields:** Filled by **`generate_consultation_narrative`** — **deterministic**, not generative.  
- **Consultation follow-up UI:** **FAQs** at `/app/consultations/:id/faq` (curated per condition). **No** chat `…/messages` API; **no** conversational LLM stack in-app.  
- **PDF:** Implemented (`pdf_report_service.py`, download route on consultation router).  
- **Images:** Stored via `image_storage_service`; consultation routes serve image bytes.  
- **Products, education, admin, dermatologists:** Routers registered in `app/main.py`.  
- **Optional:** SMTP alerts for high-risk cases; Redis/Celery in dependencies for future/async patterns.

### Documentation map

- Canonical architecture and requirements: **`README.md`** (repository root).  
- Condensed current snapshot: **`PROJECT_DOCUMENTATION.md`**.  
- PDF-only deep dive: **`backend/PDF_DOCUMENTATION_INDEX.md`**.

---

**Historical snapshot (superseded):** Stage 1 Complete | Transitioning to Stage 2

---

## 📋 Executive Summary (archival — status lines below are outdated; see [Authoritative current state](#authoritative-current-state-read-this-first))

```
STAGE 1 (FOUNDATION):        ✅ COMPLETE (historically accurate)
STAGE 2 (FEATURES):          ✅ MOSTLY COMPLETE IN REPO (PDF, image API, products, education)
STAGE 3 (ADMIN):             ✅ IMPLEMENTED (admin_router + dashboards)
STAGE 4 (PRODUCTION):        ⚠️ PARTIAL (SMTP exists when enabled; rate limits/CI optional)
STAGE 5 (FRONTEND):          ✅ REACT SPA PRESENT (not Next.js; Vite)

Removed from product: conversational LLM + consultation chat API (May 2026) — replaced by deterministic narrative + curated FAQs
```

Legend: the ASCII tree below is **not updated** line-by-line; prefer the boxed summary above.

---

---

# STAGE 1: FOUNDATION ✅ COMPLETE (110 hours)

## What Was Done in Stage 1

### **1.1 Project Setup & Infrastructure** ✅
```
✅ Python/FastAPI project structure
✅ PostgreSQL database configuration
✅ Virtual environment setup
✅ Requirements.txt with dependencies
✅ Environment variables (.env) management
✅ Git repository initialized
```

**Files Created:**
- `app/main.py` - FastAPI app initialization
- `app/config.py` - Configuration management
- `app/database.py` - Database connection & session management
- `.env` - Environment variables
- `requirements.txt` - Python dependencies

**Technologies:**
- FastAPI framework
- SQLAlchemy ORM
- PostgreSQL database
- Python 3.12

---

### **1.2 Authentication System** ✅
```
✅ User registration endpoint
✅ User login endpoint
✅ JWT token generation & validation
✅ Password hashing with bcrypt
✅ Bearer token authentication middleware
✅ Role-based access control (user/admin)
✅ Get current user endpoint
```

**Files Created:**
- `app/routers/auth_router.py` - All auth endpoints
- `app/services/auth_service.py` - Auth business logic
- `app/utils/security.py` - JWT & password utilities
- `app/schemas/auth_schema.py` - Request/response schemas
- `app/models/user.py` - User database model

**Endpoints:**
```
POST   /api/auth/register        ← User signup
POST   /api/auth/login           ← User login
GET    /api/auth/me              ← Get current user
```

**Features:**
- Email validation & uniqueness check
- Password strength validation
- JWT token with 60-minute expiry
- Auto-profile creation on signup

---

### **1.3 Database Models** ✅
```
✅ User model (5 fields)
✅ Profile model (11 fields)
✅ Consultation model (40+ fields)
✅ Product model (11 fields)
✅ Education model (7 fields)
✅ All relationships configured
✅ Cascade deletes set up
```

**Files Created:**
- `app/models/user.py`
- `app/models/profile.py`
- `app/models/consultation.py`
- `app/models/product.py`
- `app/models/education.py`

**Database:**
```
Users (5)
├─ id, email, hashed_password, role, is_active, timestamps
Profiles (11)
├─ id, user_id, full_name, age, gender, phone, allergies,
│  medical_history, skin_concerns, current_products, timestamps
Consultations (40+)
├─ id, user_id, predictions, extracted_data, risk_assessment,
│  medical_knowledge, recommendations, timestamps
Products (11)
├─ id, name, brand, category, ingredients, skin_types,
│  supported_conditions, price, availability, url, timestamps
EducationArticles (7)
├─ id, title, slug, category, content, warnings, timestamps
```

---

### **1.4 Profile Management** ✅
```
✅ Get user profile
✅ Update user profile
✅ Profile auto-creation on signup
✅ Text validation (max lengths)
✅ Gender validation (4 options)
✅ Allergy storage for filtering
✅ Medical history storage
```

**Files Created:**
- `app/routers/profile_router.py`
- `app/schemas/profile_schema.py`

**Endpoints:**
```
GET    /api/profile/me
PUT    /api/profile/me
```

**Data Captured:**
- Full name, age, gender, phone
- Known allergies
- Medical history
- Skin concerns
- Current products

---

### **1.5 ML Models Integration** ✅
```
✅ EfficientNet-B3 for disease classification
✅ EfficientNet-B1 for skin type classification
✅ Model loading from disk
✅ GPU/CPU support
✅ Batch inference capability
✅ Confidence scoring
✅ 22 disease classes
✅ 3 skin type classes
```

**Files Created:**
- `app/ml/disease_model.py` - Disease classifier
- `app/ml/skin_type_model.py` - Skin type classifier
- `app/ml/preprocessing.py` - Image preprocessing
- `app/ml/class_labels.py` - Class definitions

**Model Details:**
```
Disease Model:
- Base: EfficientNet-B3
- Input: 300x300 RGB image
- Output: 22 disease classes
- File: diagnosis_model_optimized.pth (43.5 MB)
- Accuracy: ~87% on test set

Skin Type Model:
- Base: EfficientNet-B1
- Input: 240x240 RGB image
- Output: 3 classes (dry/normal/oily)
- File: skin_type_model.pth (26.5 MB)
- Accuracy: ~82% on test set
```

**Fixed Issue:**
- ✅ Model paths corrected in Stage 1.5
- Before: Relative paths causing 404 errors
- After: Absolute file paths using Path() object

---

### **1.6 Image Validation** ✅
```
✅ File format validation (JPEG, PNG only)
✅ File size validation (max 10MB)
✅ File corruption detection
✅ Image can be opened & read
✅ Comprehensive error messages
```

**Files Created:**
- `app/services/image_validation_service.py`

**Checks:**
```
1. File provided (not None)
2. File not empty (has bytes)
3. File size < 10MB
4. Content-type in (image/jpeg, image/png)
5. File extension in (jpg, jpeg, png)
6. Image can be opened (PIL)
7. Not corrupted
```

---

### **1.7 Image Quality Assessment** ✅
```
✅ Blur detection using Laplacian variance
✅ Skin visibility detection using color histograms
✅ Face/body detection
✅ Quality scoring
```

**Files Created:**
- `app/services/skin_detection_service.py`

**Methods:**
```
1. Blur Detection
   - Calculate Laplacian variance
   - Threshold: 30
   - If > 30 → Image is clear
   - If < 30 → Image is blurry (reject)

2. Skin Visibility
   - Analyze color histogram
   - Detect skin tone ranges
   - Minimum threshold: 40% skin visible
   - Detect faces/body parts
```

---

### **1.8 NLP for Symptom Extraction** ✅
```
✅ Symptom keyword extraction (14 symptoms)
✅ Duration parsing (regex patterns)
✅ Severity inference (word-based)
✅ Text normalization
✅ Medical history analysis
```

**Files Created:**
- `app/services/nlp_service.py`

**Symptoms Tracked (14):**
1. itching
2. redness
3. burning
4. pain
5. swelling
6. rash
7. dryness
8. scaling
9. pimples
10. pus
11. bleeding
12. dark_spot
13. white_patch
14. mole_change

**Duration Parsing:**
- Regex patterns for days, weeks, months, years
- Fuzzy matches: "few days", "few weeks", "long time"

**Severity Inference:**
- Severe: "severe", "unbearable", "extreme"
- Moderate: "moderate", "painful", "burning"
- Mild: "mild", "slight", "minor"

---

### **1.9 Risk Assessment & Red Flags** ✅
```
✅ 8 red flag patterns detected
✅ Risk level calculation (Low/Moderate/High/Critical)
✅ Doctor warning generation
✅ High-risk disease detection
```

**Files Created:**
- `app/services/red_flag_service.py`

**Red Flags (8):**
1. rapidly_spreading
2. fever_with_skin_issue
3. severe_pain
4. pus_or_infection
5. bleeding_lesion
6. changing_mole
7. breathing_or_face_swelling
8. open_wound

**Risk Levels:**
```
HIGH    → Red flags found OR severe disease OR severe symptoms
MODERATE → Moderate disease confirmed OR moderate symptoms
LOW     → No flags, low confidence, mild disease
UNCERTAIN → Low confidence prediction
```

---

### **1.10 Medical Knowledge Base (RAG)** ✅
```
✅ 20+ skin condition entries
✅ Relevance scoring algorithm
✅ Knowledge retrieval & matching
✅ Symptom-based matching
✅ Red flag correlation
✅ Risk-level aware retrieval
```

**Files Created:**
- `app/rag_knowledge/condition_knowledge.json` - Knowledge base
- `app/services/rag_service.py` - Retrieval logic
- `app/services/rag_loader_service.py` - Knowledge loading

**Knowledge Per Condition:**
- Condition name & aliases
- Model class
- Category (inflammatory, cancer_warning, etc.)
- Common signs & symptoms
- Triggers & causes
- General care guidance
- OTC support guidance
- Things to avoid
- Safety precautions
- Red flags
- When to seek doctor
- Professional notes
- Source citations

**Conditions Covered (20+):**
1. Acne
2. Actinic Keratosis
3. Benign Tumors
4. Bullous
5. Candidiasis
6. Drug Eruption
7. Eczema
8. Infestations/Bites
9. Lichen
10. Lupus
11. Moles
12. Psoriasis
13. Rosacea
14. Seborrheic Keratoses
15. Skin Cancer
16. Sun/Sunlight Damage
17. Tinea
18. Unknown/Normal
19. Vascular Tumors
20. Vasculitis
21. Vitiligo
22. Warts

---

### **1.11 OTC Product Recommendations** ✅
```
✅ Product database (50+ OTC items)
✅ Condition-based filtering
✅ Allergy-aware filtering
✅ Skin type compatibility
✅ High-risk product blocking
✅ Safety precautions
```

**Files Created:**
- `app/rag_knowledge/safe_otc_products.json` - Product database
- `app/services/recommendation_service.py` - Recommendation engine

**Filtering Logic:**
```
1. Filter by condition (supported_conditions)
2. Filter by skin type (suitable_skin_types)
3. Remove allergic products (avoid_if_allergic_to)
4. Block high-risk ingredients (for high-risk cases)
5. Return safe recommendations with explanations
```

**Product Categories:**
- Cleansers
- Moisturizers
- Sunscreen
- Acne treatments
- Anti-inflammatory
- Hydrating products
- Exfoliants
- Serums
- Masks
- And more...

---

### **1.12 Consultation Storage** ✅
```
✅ Complete consultation recording (40+ fields)
✅ Consultation retrieval by ID
✅ Consultation history listing
✅ Consultation deletion
✅ User ownership verification
✅ Timestamped records
```

**Files Created:**
- `app/routers/consultation_router.py`
- `app/services/report_service.py`
- `app/schemas/consultation_schema.py`

**Endpoints:**
```
GET    /api/consultations              - List user's consultations
GET    /api/consultations/{id}         - Get consultation details
DELETE /api/consultations/{id}         - Delete consultation
```

**Stored Per Consultation:**
- User ID & image filename
- Symptoms, duration, severity, medical history
- ML predictions & confidence scores
- Extracted symptoms, duration, severity
- Red flags & risk assessment
- Doctor warnings
- Medical assessment & knowledge
- OTC recommendations
- Professional disclaimers
- Timestamps

---

### **1.13 Core Diagnosis Endpoint** ✅
```
✅ Single POST endpoint for complete diagnosis
✅ Multi-part file upload support
✅ Image + text input handling
✅ Sequential processing pipeline
✅ Comprehensive error handling
✅ Complete response with 40+ fields
```

**Files Created:**
- `app/routers/diagnosis_router.py`

**Endpoint:**
```
POST /api/diagnosis/analyze

Input:
- image: binary file (required)
- symptoms: text (required)
- duration: text (optional)
- severity: text (optional)
- medical_history: text (optional)

Output:
- Complete diagnosis with 40+ fields
- ML predictions
- Risk assessment
- Medical knowledge
- OTC recommendations
- Professional disclaimers

Time: ~2-3 seconds per request
```

**Pipeline:**
```
1. Image validation (format, size, corruption)
2. Image quality checks (blur, skin visibility)
3. Text validation (lengths, formats)
4. ML inference (disease + skin type)
5. NLP processing (symptoms, duration, severity)
6. Red flag detection
7. Risk calculation
8. Knowledge retrieval (RAG)
9. OTC recommendations (with allergy filtering)
10. Database storage
11. Response formatting & return
```

---

### **1.14 Configuration & Utilities** ✅
```
✅ Environment variable management
✅ Settings class with validation
✅ Confidence level formatting
✅ Response utilities
✅ Security utilities (JWT, password)
✅ File utilities
✅ Error handling
```

**Files Created:**
- `app/config.py` - Settings & configuration
- `app/utils/response_formatter.py`
- `app/utils/security.py`
- `app/utils/file_utils.py`

**Configuration:**
```
API_NAME: DermaSoul AI
API_VERSION: 1.0.0
DATABASE: PostgreSQL
JWT_SECRET: From .env
JWT_EXPIRY: 60 minutes
CORS_ORIGINS: http://localhost:5173
MAX_IMAGE: 10 MB
MAX_REPORT: 15 MB
MODEL_PATHS: Absolute paths
```

---

### **1.15 API Documentation** ✅
```
✅ Swagger documentation (auto-generated)
✅ OpenAPI schema
✅ Request/response examples
✅ Authentication documentation
✅ Error code documentation
```

**Auto-Generated:**
```
GET  /docs              - Swagger UI
GET  /redoc             - ReDoc
GET  /openapi.json      - OpenAPI schema
```

---

## Stage 1 Summary

| Item | Status | Files | Time |
|------|--------|-------|------|
| Project Setup | ✅ | 3 | 5h |
| Authentication | ✅ | 4 | 8h |
| Database Models | ✅ | 5 | 6h |
| Profile Management | ✅ | 2 | 4h |
| ML Models | ✅ | 4 | 20h |
| Image Validation | ✅ | 1 | 3h |
| Image Quality | ✅ | 1 | 4h |
| NLP Processing | ✅ | 1 | 6h |
| Risk Assessment | ✅ | 1 | 5h |
| Knowledge Base | ✅ | 3 | 12h |
| OTC Recommendations | ✅ | 2 | 8h |
| Consultation Storage | ✅ | 3 | 6h |
| Diagnosis Endpoint | ✅ | 1 | 10h |
| Config & Utils | ✅ | 4 | 4h |
| Documentation | ✅ | 1 | 5h |
| **STAGE 1 TOTAL** | ✅ | **36 files** | **~110 hours** |

---

---

# STAGE 2: CORE FEATURES (historical plan — **most items are implemented in the repo as of 2026**)

## What was planned for Stage 2

### **2.1 PDF Report Generation** (4 hours) — **✅ DONE**

**Current code:** `app/services/pdf_report_service.py` (ReportLab); `GET /api/consultations/{consultation_id}/download-pdf` in `consultation_router.py`. See `backend/PDF_DOCUMENTATION_INDEX.md`.

**Original “what to build” sketch (archival):**

```python
# app/services/pdf_report_service.py

class PDFReportGenerator:
    def generate_report(self, consultation: Consultation) -> bytes
        """
        Generate PDF from consultation data
        
        Sections:
        1. Cover Page
           - Patient info (anonymized)
           - Diagnosis date
           - DermaSoul-AI logo
        
        2. Executive Summary
           - Predicted disease
           - Confidence score
           - Risk level
           - Doctor warning (if applicable)
        
        3. Medical Analysis
           - Predicted disease & confidence
           - Skin type & confidence
           - Extracted symptoms
           - Risk assessment
           - Red flags (if any)
        
        4. Knowledge Base Section
           - Condition overview
           - Common signs
           - Common causes
           - Care guidance
           - Things to avoid
        
        5. Recommendations
           - OTC products (with explanations)
           - Safety precautions
           - General care guidance
        
        6. When to See Doctor
           - Red flags requiring attention
           - Professional consultation notes
        
        7. Disclaimers
           - AI limitations
           - Not a medical diagnosis
           - Consult healthcare professional
        
        8. Sources
           - Knowledge base citations
           - Medical references
        """
```

**Endpoints to Add:**
```
GET /api/consultations/{consultation_id}/download-pdf
    → Returns: PDF file (binary)
    → Headers: Content-Type: application/pdf
               Content-Disposition: attachment
    → Size: Max 15 MB (from config)
```

**Implementation:**
- Use `reportlab` or `pypdf` library
- Add to requirements.txt
- Create PDF generation service
- Add download endpoint in consultation_router.py
- Format data for PDF layout
- Add professional styling

**Files to Create/Modify:**
```
NEW:
✓ app/services/pdf_report_service.py

MODIFY:
✓ app/routers/consultation_router.py (add endpoint)
✓ requirements.txt (add reportlab or pypdf)
```

**Testing:**
- Generate PDF for sample consultation
- Verify all fields present
- Check file size < 15 MB
- Test download in browser

---

### **2.2 Image Storage & Retrieval** (3 hours)

**Currently:** ⚠️ Partially implemented (DB field exists, no file storage)

**What to Build:**

```python
# app/services/image_storage_service.py

class ImageStorageService:
    def save_consultation_image(
        self, 
        user_id: str, 
        consultation_id: str, 
        image_data: bytes,
        filename: str
    ) -> str:
        """
        Save image file to disk
        
        Path structure:
        app/uploads/
        ├── {user_id}/
        │   ├── {consultation_id}_{timestamp}.jpg
        │   ├── {consultation_id}_{timestamp}.jpg
        │   └── ...
        │
        Store in database:
        - consultation.image_filename = "{user_id}/{consultation_id}_{timestamp}.jpg"
        - consultation.image_path = full absolute path
        """
    
    def get_consultation_image(
        self,
        consultation_id: str,
        current_user: User
    ) -> bytes:
        """
        Retrieve image file from disk
        - Verify user ownership
        - Return image bytes
        - Handle missing file errors
        """
    
    def delete_consultation_image(
        self,
        consultation_id: str
    ) -> bool:
        """
        Delete image file from disk
        - Called when consultation deleted
        - Clean up file system
        """
    
    def cleanup_old_images(days: int = 90):
        """
        Scheduled task to delete old images
        - Delete images older than 90 days
        - Free up storage space
        """
```

**Endpoints to Add:**
```
GET    /api/consultations/{consultation_id}/image
       → Returns: Image file (binary)
       → Headers: Content-Type: image/jpeg or image/png
       → Verify user owns consultation

DELETE /api/consultations/{consultation_id}/image
       → Delete image file
       → Returns: Success message
```

**Database Changes:**
```python
# Modify Consultation model:
class Consultation(Base):
    image_filename: str  # Already exists - "user_id/consult_id_timestamp.jpg"
    image_path: str      # NEW - absolute file path
    image_size: int      # NEW - file size in bytes
    image_uploaded_at: datetime  # NEW - when image was saved
```

**Storage Strategy - Option A (Local, Simple):**
```
app/uploads/
├── {user_id}/
│   ├── {consultation_id}_1714752600.jpg
│   ├── {consultation_id}_1714752625.jpg
│   └── ...
├── cleanup.py  # Scheduled cleanup script
└── .gitignore  # Ignore uploads folder
```

**Storage Strategy - Option B (Cloud, Recommended):**
```
# For future: AWS S3 or Azure Blob Storage
# Configuration in .env:
STORAGE_TYPE=s3  # or 'azure' or 'local'
S3_BUCKET_NAME=dermasoul-uploads
S3_REGION=us-east-1
S3_ACCESS_KEY=...
S3_SECRET_KEY=...

# Service handles abstraction
if STORAGE_TYPE == 's3':
    use S3Client
elif STORAGE_TYPE == 'azure':
    use AzureClient
else:
    use LocalStorage
```

**Files to Create/Modify:**
```
NEW:
✓ app/services/image_storage_service.py
✓ app/utils/file_cleanup.py

MODIFY:
✓ app/routers/consultation_router.py (add endpoints)
✓ app/models/consultation.py (add fields)
✓ app/services/report_service.py (save image path)
✓ app/services/diagnosis_service.py (update for new fields)
✓ requirements.txt (if using boto3 for S3)
```

**Testing:**
- Upload image → Save file → Verify exists
- Retrieve image → Match with original
- Delete image → Verify file deleted
- Ownership check → Prevent cross-user access

---

### **2.3 Product Management Router** (3 hours) — **✅ DONE**

**Current code:** `app/routers/product_router.py` and related schemas are implemented and mounted in `main.py`.

**Original scaffold (archival):**

```python
# app/routers/product_router.py

@router.get("/api/products", response_model=list[ProductResponse])
def list_products(
    condition: str | None = None,
    skin_type: str | None = None,
    category: str | None = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    List products with optional filters
    
    Query parameters:
    - condition: Filter by condition (e.g., "Acne")
    - skin_type: Filter by skin type (dry/normal/oily)
    - category: Filter by category (e.g., "Cleanser")
    - limit: Max results (default 50)
    - offset: Pagination offset
    
    Returns: List of products matching filters
    """
    query = db.query(Product)
    
    if condition:
        query = query.filter(Product.supported_conditions.ilike(f"%{condition}%"))
    
    if skin_type:
        query = query.filter(Product.suitable_skin_types.ilike(f"%{skin_type}%"))
    
    if category:
        query = query.filter(Product.category.ilike(f"%{category}%"))
    
    return query.limit(limit).offset(offset).all()


@router.get("/api/products/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: str,
    db: Session = Depends(get_db)
):
    """Get detailed product information"""
    product = db.query(Product).filter(Product.id == product_id).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return product


@router.post("/api/products", response_model=ProductResponse)
def create_product(
    data: ProductCreateRequest,
    current_user: User = Depends(get_current_user),
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Create new product (ADMIN ONLY)"""
    product = Product(
        name=data.name,
        brand=data.brand,
        category=data.category,
        ingredients=data.ingredients,
        suitable_skin_types=json.dumps(data.suitable_skin_types),
        supported_conditions=json.dumps(data.supported_conditions),
        avoid_if_allergic_to=json.dumps(data.avoid_if_allergic_to),
        price_range=data.price_range,
        availability=data.availability,
        product_url=data.product_url
    )
    
    db.add(product)
    db.commit()
    db.refresh(product)
    
    return product


@router.put("/api/products/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: str,
    data: ProductUpdateRequest,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Update product (ADMIN ONLY)"""
    product = db.query(Product).filter(Product.id == product_id).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = data.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(product, field, value)
    
    db.commit()
    db.refresh(product)
    
    return product


@router.delete("/api/products/{product_id}")
def delete_product(
    product_id: str,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Delete product (ADMIN ONLY)"""
    product = db.query(Product).filter(Product.id == product_id).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(product)
    db.commit()
    
    return {"message": "Product deleted successfully"}
```

**Endpoints to Add:**
```
GET    /api/products                    - List products (public)
GET    /api/products/{id}               - Get product (public)
POST   /api/products                    - Create product (admin)
PUT    /api/products/{id}               - Update product (admin)
DELETE /api/products/{id}               - Delete product (admin)
```

**Query Examples:**
```
GET /api/products?condition=Acne
GET /api/products?skin_type=oily
GET /api/products?category=Cleanser
GET /api/products?condition=Acne&skin_type=oily
```

**Schema to Create:**
```python
class ProductResponse(BaseModel):
    id: str
    name: str
    brand: str
    category: str
    ingredients: str
    suitable_skin_types: list[str]
    supported_conditions: list[str]
    avoid_if_allergic_to: list[str]
    price_range: str
    availability: str
    product_url: str

class ProductCreateRequest(BaseModel):
    name: str
    brand: str
    category: str
    ingredients: str
    suitable_skin_types: list[str]
    supported_conditions: list[str]
    avoid_if_allergic_to: list[str]
    price_range: str
    availability: str
    product_url: str
```

**Files to Create/Modify:**
```
NEW:
✓ app/routers/product_router.py
✓ app/schemas/product_schema.py

MODIFY:
✓ app/main.py (include product router)
✓ app/models/product.py (if needed)
```

**Testing:**
- List all products
- Filter by condition
- Filter by skin type
- Filter by combination
- Get single product
- Create product (as admin)
- Update product
- Delete product
- Verify non-admin can't create/update/delete

---

### **2.4 Education Router** (3 hours) — **✅ DONE**

**Current code:** `app/routers/education_router.py` implemented and mounted.

**Original scaffold (archival):**

```python
# app/routers/education_router.py

@router.get("/api/education/articles", response_model=list[ArticleListResponse])
def list_articles(
    category: str | None = None,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    List educational articles
    
    Query parameters:
    - category: Filter by category (e.g., "skincare", "acne")
    - limit: Max results (default 20)
    - offset: Pagination offset
    """
    query = db.query(EducationArticle)
    
    if category:
        query = query.filter(EducationArticle.category.ilike(f"%{category}%"))
    
    return query.order_by(EducationArticle.created_at.desc()).limit(limit).offset(offset).all()


@router.get("/api/education/articles/{slug}", response_model=ArticleDetailResponse)
def get_article(
    slug: str,
    db: Session = Depends(get_db)
):
    """Get full article by slug"""
    article = db.query(EducationArticle).filter(EducationArticle.slug == slug).first()
    
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    return article


@router.post("/api/education/articles", response_model=ArticleDetailResponse)
def create_article(
    data: ArticleCreateRequest,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Create educational article (ADMIN ONLY)"""
    
    # Verify slug is unique
    existing = db.query(EducationArticle).filter(EducationArticle.slug == data.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="Slug already exists")
    
    article = EducationArticle(
        title=data.title,
        slug=data.slug,
        category=data.category,
        content=data.content,
        warnings=data.warnings,
        precautions=data.precautions
    )
    
    db.add(article)
    db.commit()
    db.refresh(article)
    
    return article


@router.put("/api/education/articles/{slug}", response_model=ArticleDetailResponse)
def update_article(
    slug: str,
    data: ArticleUpdateRequest,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Update educational article (ADMIN ONLY)"""
    article = db.query(EducationArticle).filter(EducationArticle.slug == slug).first()
    
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    update_data = data.dict(exclude_unset=True)
    
    # If slug changed, verify new slug is unique
    if 'slug' in update_data and update_data['slug'] != slug:
        existing = db.query(EducationArticle).filter(
            EducationArticle.slug == update_data['slug']
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="New slug already exists")
    
    for field, value in update_data.items():
        setattr(article, field, value)
    
    db.commit()
    db.refresh(article)
    
    return article


@router.delete("/api/education/articles/{slug}")
def delete_article(
    slug: str,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Delete educational article (ADMIN ONLY)"""
    article = db.query(EducationArticle).filter(EducationArticle.slug == slug).first()
    
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    db.delete(article)
    db.commit()
    
    return {"message": "Article deleted successfully"}
```

**Endpoints to Add:**
```
GET    /api/education/articles          - List articles (public)
GET    /api/education/articles/{slug}   - Get article (public)
POST   /api/education/articles          - Create article (admin)
PUT    /api/education/articles/{slug}   - Update article (admin)
DELETE /api/education/articles/{slug}   - Delete article (admin)
```

**Query Examples:**
```
GET /api/education/articles?category=skincare
GET /api/education/articles?category=acne&limit=10
GET /api/education/articles/how-to-treat-acne
```

**Schema to Create:**
```python
class ArticleListResponse(BaseModel):
    id: str
    title: str
    slug: str
    category: str
    created_at: datetime

class ArticleDetailResponse(BaseModel):
    id: str
    title: str
    slug: str
    category: str
    content: str
    warnings: str
    precautions: str
    created_at: datetime
    updated_at: datetime

class ArticleCreateRequest(BaseModel):
    title: str
    slug: str  # URL-friendly identifier
    category: str
    content: str
    warnings: str | None
    precautions: str | None

class ArticleUpdateRequest(BaseModel):
    title: str | None
    slug: str | None
    category: str | None
    content: str | None
    warnings: str | None
    precautions: str | None
```

**Initial Articles to Create (Seed Data):**
```
1. How to Treat Acne at Home
2. Understanding Eczema
3. Skincare Routine Basics
4. Sun Protection Tips
5. When to See a Dermatologist
... (more)
```

**Files to Create/Modify:**
```
NEW:
✓ app/routers/education_router.py
✓ app/schemas/education_schema.py

MODIFY:
✓ app/main.py (include education router)
✓ app/models/education.py (if needed)
```

**Testing:**
- List all articles
- Filter by category
- Get single article by slug
- Create article (as admin)
- Update article
- Delete article
- Verify slug uniqueness
- Verify non-admin can't create/update/delete

---

## Stage 2 Implementation Plan

| Item | Time | Priority | Dependencies |
|------|------|----------|--------------|
| PDF Reports | 4h | 🔴 High | Diagnosis endpoint ✅ |
| Image Storage | 3h | 🔴 High | File system, database |
| Product Router | 3h | 🟡 Medium | Product model ✅ |
| Education Router | 3h | 🟡 Medium | Education model ✅ |
| **TOTAL** | **13h** | | |

**Recommended Order:**
1. **PDF Reports** (highest user value)
2. **Image Storage** (complete diagnosis pipeline)
3. **Product Router** (enable content management)
4. **Education Router** (enable knowledge management)

---

---

# STAGE 3: ADMIN & MANAGEMENT 🔜 PHASE 3 (7 hours)

## What Needs to Be Done in Stage 3

### **3.1 Admin Router & Dashboard** (4 hours)

```python
# app/routers/admin_router.py

@router.get("/api/admin/users", response_model=list[UserManagementResponse])
def list_all_users(admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    """Admin view all users"""
    users = db.query(User).all()
    return users

@router.put("/api/admin/users/{user_id}/active")
def toggle_user_active(user_id: str, active: bool, admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    """Enable/disable user account"""
    pass

@router.put("/api/admin/users/{user_id}/role")
def change_user_role(user_id: str, new_role: str, admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    """Change user role (user → admin)"""
    pass

@router.delete("/api/admin/users/{user_id}")
def delete_user(user_id: str, admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    """Delete user (cascade deletes consultations)"""
    pass

@router.get("/api/admin/consultations")
def review_all_consultations(admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    """Review all consultations"""
    pass

@router.get("/api/admin/analytics")
def get_analytics(admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    """System analytics"""
    analytics = {
        "total_users": count(User),
        "active_users": count(User where is_active=True),
        "total_consultations": count(Consultation),
        "top_diagnosed_conditions": [...],
        "risk_level_distribution": {...},
        "avg_consultations_per_user": float,
    }
    return analytics
```

**Endpoints:**
```
GET    /api/admin/users                 - List all users
PUT    /api/admin/users/{id}/active     - Toggle user active
PUT    /api/admin/users/{id}/role       - Change user role
DELETE /api/admin/users/{id}            - Delete user

GET    /api/admin/consultations         - Review all consultations
GET    /api/admin/analytics             - System dashboard
GET    /api/admin/analytics/daily       - Daily statistics
```

---

### **3.2 Rate Limiting & Security** (2 hours)

```python
# Install slowapi
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

# Apply rate limits
@app.post("/api/diagnosis/analyze")
@limiter.limit("5/hour")  # 5 diagnoses per hour
async def analyze_skin_image(...):
    pass

@app.post("/api/auth/login")
@limiter.limit("10/hour")  # 10 login attempts per hour
async def login(...):
    pass

# Global rate limiting headers
app.add_middleware(
    CORSMiddleware,
    # ... existing config
    expose_headers=["X-RateLimit-Limit", "X-RateLimit-Remaining"]
)
```

---

### **3.3 Email Notifications** (1 hour setup)

```python
# app/services/email_service.py

from fastapi_mail import FastMail, MessageSchema

class EmailService:
    async def send_verification_email(user: User, token: str):
        """Send verification link"""
        pass
    
    async def send_password_reset(user: User, token: str):
        """Send password reset link"""
        pass
    
    async def send_consultation_email(user: User, consultation: Consultation, pdf: bytes):
        """Send consultation PDF"""
        pass
    
    async def send_risk_alert(user: User, consultation: Consultation):
        """Send high-risk alert"""
        pass
```

---

## Stage 3 Summary

| Item | Time | Priority |
|------|------|----------|
| Admin Router | 4h | 🔴 High |
| Rate Limiting | 2h | 🟡 Medium |
| Email Services (setup) | 1h | 🟢 Low |
| **TOTAL** | **7h** | |

---

---

# STAGE 4: PRODUCTION & DEPLOYMENT 📅 PHASE 4 (15 hours)

## What Needs to Be Done in Stage 4

### **4.1 Comprehensive Testing** (5 hours)
```
✓ Unit tests (services, models)
✓ Integration tests (endpoints)
✓ ML model tests
✓ Database tests
✓ Security tests
✓ Load testing
```

### **4.2 Logging & Monitoring** (3 hours)
```
✓ Request/response logging
✓ Error tracking (Sentry)
✓ Performance monitoring
✓ Database query logging
✓ ML inference timing
```

### **4.3 Documentation** (2 hours)
```
✓ API documentation
✓ Setup guide
✓ Deployment guide
✓ Configuration guide
✓ Troubleshooting guide
```

### **4.4 Deployment** (5 hours)
```
✓ Docker containerization
✓ Docker Compose
✓ Cloud deployment (AWS/Azure)
✓ Database migration
✓ Environment setup
```

---

---

# STAGE 5: FRONTEND 📅 PHASE 5 (40+ hours)

## What Needs to Be Built

**Technology:** React / Next.js

**Pages:**
```
✓ Landing page
✓ Registration page
✓ Login page
✓ Profile page
✓ Diagnosis flow (multi-step)
✓ Consultation results page
✓ Consultation history
✓ Settings page
✓ Admin dashboard
✓ Documentation pages
```

**Features:**
```
✓ Image upload with preview
✓ Form validation
✓ Authentication flows
✓ PDF download
✓ Responsive design
✓ Dark mode
✓ Mobile-first design
```

---

---

# QUICK EXECUTION GUIDE

## Next 24 Hours (Stage 2.1 - PDF Reports)

```
1. Install reportlab
   pip install reportlab
   
2. Create app/services/pdf_report_service.py
   - Implement PDFReportGenerator class
   - Implement generate_report() method
   - Test PDF generation locally
   
3. Add endpoint to app/routers/consultation_router.py
   GET /api/consultations/{id}/download-pdf
   
4. Test in Swagger
   - Generate sample PDF
   - Verify all fields present
   - Test download
   
5. Commit and document
```

## Next Week (Stage 2 - All Core Features)

```
Day 1-2: PDF Reports (4 hours)
Day 2-3: Image Storage (3 hours)
Day 4: Product Router (3 hours)
Day 5: Education Router (3 hours)

TOTAL: 13 hours = ~2 full days of work
```

## Then (Stages 3-5)

```
Week 2: Admin & Management (7 hours)
Week 3: Testing & Docs (7 hours)
Week 4-5: Frontend (40+ hours)
Week 6: Deployment & Launch
```

---

---

# COMPLETION TIMELINE (revised May 2026)

```
Core backend and frontend features described in historical Stages 1–3: implemented in repository.
Hardening (tests, rate limits, managed deployment): ongoing / project-specific.
```

---

## 📊 Overall progress (May 2026)

```
BACKEND FEATURE PARITY WITH HISTORICAL STAGE 2–3 PLAN: LARGELY COMPLETE (verify via app/main.py and /docs)
FRONTEND: React SPA IS PRESENT under frontend/
GENERATIVE CONSULTATION CHAT / LOCAL LLM DOWNLOADS: REMOVED FROM PRODUCT SCOPE
NEXT PRIORITIES: CI, Alembic, rate limiting, production hosting — see PROJECT_DOCUMENTATION.md §13
```

---

## 🎯 Next action (for maintainers)

1. Treat **`README.md`** and **`PROJECT_DOCUMENTATION.md`** as the authoritative specification.  
2. Run **`python -m uvicorn app.main:app --host 127.0.0.1 --port 8010`** and validate **`/docs`**.  
3. Close documentation gaps by **deleting or archiving** obsolete “EMPTY file” language in this file if it causes confusion — historical stages below are retained for context only.

---

**Historical closing prompt (superseded):** Ready to implement Stage 2? Let me know… 🚀
