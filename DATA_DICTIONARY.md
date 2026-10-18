# DermaSoul AI - Data Dictionary

**Last Updated:** May 2026  
**Version:** 1.0.0  
**Scope:** Complete data model documentation for all database collections/tables

---

## Table of Contents

1. [User](#user)
2. [Profile](#profile)
3. [Consultation](#consultation)
4. [Product](#product)
5. [EducationArticle](#educationarticle)
6. [Dermatologist](#dermatologist)
7. [RAGDocument](#ragdocument)

---

## User

**Description:** Core user account entity. Stores authentication credentials, role information, and lifecycle timestamps.

| Collection | Attribute | Data Type | Nullable | Description |
|------------|-----------|-----------|----------|-------------|
| User | id | String (UUID) | No | Primary key - unique user identifier (auto-generated UUID) |
| User | email | String(255) | No | User email address (unique, indexed for fast lookup) |
| User | hashed_password | String(255) | No | bcrypt-hashed password for authentication |
| User | role | String(50) | No | User role - either "user" or "admin" (default: "user") |
| User | is_active | Boolean | No | Account active status (default: True) |
| User | created_at | DateTime | No | Account creation timestamp (auto-set UTC) |
| User | updated_at | DateTime | No | Last account update timestamp (auto-updated) |

**Relationships:**
- One-to-One: `profile` → Profile (cascade delete)
- One-to-Many: `consultations` → Consultation (cascade delete)

---

## Profile

**Description:** User extended profile information. Contains personal details, medical history, and skin-related preferences.

| Collection | Attribute | Data Type | Nullable | Description |
|------------|-----------|-----------|----------|-------------|
| Profile | id | String (UUID) | No | Primary key - unique profile identifier |
| Profile | user_id | String (UUID) | No | Foreign key to User (unique, cascade delete) |
| Profile | full_name | String(100) | Yes | User's full name |
| Profile | age | Integer | Yes | User's age in years |
| Profile | gender | String(30) | Yes | User's gender identity |
| Profile | phone | String(30) | Yes | User's contact phone number |
| Profile | known_allergies | Text | Yes | Comma-separated or formatted list of known allergies |
| Profile | medical_history | Text | Yes | User's relevant medical history and conditions |
| Profile | skin_concerns | Text | Yes | List of primary skin concerns or problems |
| Profile | current_products | Text | Yes | Skincare products currently being used |
| Profile | created_at | DateTime | No | Profile creation timestamp |
| Profile | updated_at | DateTime | No | Last profile update timestamp |

**Relationships:**
- One-to-One: `user` → User (back-reference)

---

## Consultation

**Description:** Main analysis record. Stores complete diagnostic assessment including image analysis, NLP results, RAG findings, risk stratification, and recommendations.

### Image & Input Data

| Collection | Attribute | Data Type | Nullable | Description |
|------------|-----------|-----------|----------|-------------|
| Consultation | id | String (UUID) | No | Primary key - unique consultation identifier |
| Consultation | user_id | String (UUID) | No | Foreign key to User (indexed, cascade delete) |
| Consultation | image_filename | String | Yes | Filename of uploaded skin image |

### User-Provided Context

| Collection | Attribute | Data Type | Nullable | Description |
|------------|-----------|-----------|----------|-------------|
| Consultation | symptoms | Text | No | User-described symptoms (required) |
| Consultation | duration | String | Yes | How long symptoms have been present |
| Consultation | severity | String | Yes | User-reported severity level |
| Consultation | medical_history | Text | Yes | Relevant medical history for this case |

### Skin Tone & Demographic Context

| Collection | Attribute | Data Type | Nullable | Description |
|------------|-----------|-----------|----------|-------------|
| Consultation | skin_tone | String | Yes | Reported skin tone (e.g., light, medium, dark) |
| Consultation | fitzpatrick_type | String | Yes | Fitzpatrick skin type classification (I-VI) |
| Consultation | ethnicity_region | String | Yes | User's ethnicity or geographic region |
| Consultation | melanin_context_note | Text | Yes | Additional notes on melanin considerations |
| Consultation | skin_tone_considerations | JSONB | Yes | Structured considerations for skin tone in diagnosis |

### Model Predictions - Disease

| Collection | Attribute | Data Type | Nullable | Description |
|------------|-----------|-----------|----------|-------------|
| Consultation | predicted_disease | String | No | Primary disease classification from EfficientNet-B3 |
| Consultation | disease_confidence | Float | No | Softmax confidence score (0.0-1.0) |
| Consultation | disease_confidence_level | String | No | Categorical confidence level (low/medium/high) |

### Model Predictions - Skin Type

| Collection | Attribute | Data Type | Nullable | Description |
|------------|-----------|-----------|----------|-------------|
| Consultation | predicted_skin_type | String | No | Skin type from EfficientNet-B1 (dry/normal/oily) |
| Consultation | skin_type_confidence | Float | No | Skin type confidence score (0.0-1.0) |
| Consultation | skin_type_confidence_level | String | No | Categorical confidence (low/medium/high) |

### NLP Extraction Results

| Collection | Attribute | Data Type | Nullable | Description |
|------------|-----------|-----------|----------|-------------|
| Consultation | extracted_symptoms | JSONB | Yes | Structured array of extracted symptoms from NLP |
| Consultation | symptom_keyword_hits | JSONB | Yes | Keyword matches found in symptom text |
| Consultation | clinical_entities | JSONB | Yes | Medical entities identified (optional HF NER) |
| Consultation | negated_entities | JSONB | Yes | Entities preceded by negation markers |
| Consultation | extracted_duration | String | Yes | Duration parsed from symptoms text |
| Consultation | inferred_severity | String | Yes | Severity level inferred from text analysis |
| Consultation | severity_rationale | Text | Yes | Explanation of how severity was determined |
| Consultation | severity_confidence | Float | Yes | Confidence score for severity classification |
| Consultation | urgency_class | String | Yes | Urgency level (routine/urgent/emergency) |
| Consultation | urgency_confidence | Float | Yes | Confidence in urgency classification |
| Consultation | urgency_rationale | Text | Yes | Reasoning for urgency classification |
| Consultation | followup_candidates | JSONB | Yes | Suggested follow-up topics from NLP |
| Consultation | nlp_model_version | String | Yes | Version identifier of NLP pipeline used |

### Risk Stratification & Red Flags

| Collection | Attribute | Data Type | Nullable | Description |
|------------|-----------|-----------|----------|-------------|
| Consultation | red_flags | JSONB | Yes | Array of detected red flags (warning signs) |
| Consultation | risk_level | String | No | Overall risk category (low/medium/high/critical) |
| Consultation | doctor_warning | Text | No | Clinical warning message for user |

### Consultation Narratives (Deterministic, Not Generative)

| Collection | Attribute | Data Type | Nullable | Description |
|------------|-----------|-----------|----------|-------------|
| Consultation | assessment_summary | Text | Yes | Structured summary of the assessment |
| Consultation | condition_explanation | Text | Yes | Educational explanation of predicted condition |
| Consultation | symptom_context | Text | Yes | How symptoms relate to the condition |
| Consultation | skin_type_context | Text | Yes | Skin type implications for treatment |
| Consultation | general_care_guidance | JSONB | Yes | General self-care recommendations |
| Consultation | otc_support_guidance | JSONB | Yes | OTC product usage guidance |
| Consultation | what_to_avoid | JSONB | Yes | Ingredients/products to avoid |
| Consultation | safety_precautions | JSONB | Yes | Important safety considerations |

### Professional Guidance & Referral

| Collection | Attribute | Data Type | Nullable | Description |
|------------|-----------|-----------|----------|-------------|
| Consultation | when_to_seek_doctor | Text | Yes | Conditions that warrant professional evaluation |
| Consultation | professional_note | Text | Yes | Medical professional escalation notes |
| Consultation | ai_limitations | Text | Yes | Disclaimer about AI analysis limitations |

### RAG - Knowledge Retrieval Results

| Collection | Attribute | Data Type | Nullable | Description |
|------------|-----------|-----------|----------|-------------|
| Consultation | retrieved_knowledge | JSONB | Yes | Array of retrieved knowledge base documents |
| Consultation | knowledge_sources | JSONB | Yes | Metadata about knowledge sources used |
| Consultation | retrieval_trace | JSONB | Yes | Detailed trace of retrieval process |
| Consultation | retrieval_confidence | Float | Yes | Confidence score for knowledge retrieval (0.0-1.0) |
| Consultation | retrieval_metrics | JSONB | Yes | Performance metrics from RAG pipeline |

### Recommendations & Products

| Collection | Attribute | Data Type | Nullable | Description |
|------------|-----------|-----------|----------|-------------|
| Consultation | recommendations | JSONB | Yes | Array of recommended OTC products/treatments |
| Consultation | recommendation_safety_note | Text | Yes | Safety disclaimer for recommendations |
| Consultation | recommendation_source | String | Yes | Source of product recommendations (curated/RAG) |
| Consultation | allergy_filter_applied | String | Yes | Whether allergy filtering was applied |

### Legacy LLM Fields (Deprecated - Now Deterministic)

| Collection | Attribute | Data Type | Nullable | Description |
|------------|-----------|-----------|----------|-------------|
| Consultation | llm_summary | Text | Yes | [DEPRECATED] Consultation summary |
| Consultation | llm_differential_notes | JSONB | Yes | [DEPRECATED] Differential diagnosis notes |
| Consultation | llm_next_steps | JSONB | Yes | [DEPRECATED] Recommended next steps |
| Consultation | llm_followup_questions | JSONB | Yes | [DEPRECATED] Follow-up questions |
| Consultation | llm_confidence_statement | Text | Yes | [DEPRECATED] Confidence statement |
| Consultation | llm_generation_mode | String | Yes | [DEPRECATED] LLM generation mode used |

### Tracing & Referral

| Collection | Attribute | Data Type | Nullable | Description |
|------------|-----------|-----------|----------|-------------|
| Consultation | trace_id | String | Yes | Unique trace ID for debugging and auditing |
| Consultation | referred_dermatologists | JSONB | Yes | Array of recommended dermatologists |
| Consultation | referral_note | Text | Yes | Notes about dermatologist referral |
| Consultation | created_at | DateTime | No | Consultation creation timestamp (server-default UTC) |

**Relationships:**
- Many-to-One: `user` → User (back-reference)

---

## Product

**Description:** OTC skincare products database. Stores product information, ingredients, suitability, and recommendations for conditions and skin types.

| Collection | Attribute | Data Type | Nullable | Description |
|------------|-----------|-----------|----------|-------------|
| Product | id | String (UUID) | No | Primary key - unique product identifier |
| Product | name | String(150) | No | Product name (required) |
| Product | brand | String(150) | Yes | Product brand/manufacturer |
| Product | category | String(100) | No | Product category (e.g., cleanser, moisturizer, sunscreen) |
| Product | ingredients | Text | Yes | Full ingredient list |
| Product | suitable_skin_types | Text | Yes | Comma-separated skin types (dry/normal/oily/combination) |
| Product | supported_conditions | Text | Yes | Conditions this product helps with |
| Product | avoid_if_allergic_to | Text | Yes | Common allergens in the product |
| Product | contraindications | Text | Yes | When NOT to use this product |
| Product | price_range | String(100) | Yes | Price category (e.g., budget/mid-range/premium) |
| Product | availability | String(150) | Yes | Where to purchase or availability status |
| Product | product_url | String(500) | Yes | Link to product page or e-commerce site |
| Product | created_at | DateTime | No | Product record creation timestamp |
| Product | updated_at | DateTime | No | Last product update timestamp |

---

## EducationArticle

**Description:** Curated educational content library. Provides evidence-based information on skin conditions, care routines, and health literacy.

| Collection | Attribute | Data Type | Nullable | Description |
|------------|-----------|-----------|----------|-------------|
| EducationArticle | id | String (UUID) | No | Primary key - unique article identifier |
| EducationArticle | title | String(200) | No | Article title (required, max 200 chars) |
| EducationArticle | slug | String(200) | No | URL-friendly slug (unique, indexed, auto-generated) |
| EducationArticle | category | String(100) | No | Article category (e.g., condition/skincare/prevention) |
| EducationArticle | summary | Text | Yes | Brief summary/abstract of article content |
| EducationArticle | content | Text | No | Full article content/body (required) |
| EducationArticle | warnings | Text | Yes | Important warnings or contraindications |
| EducationArticle | precautions | Text | Yes | Precautions users should take |
| EducationArticle | when_to_seek_doctor | Text | Yes | Conditions warranting professional evaluation |
| EducationArticle | source_urls | Text | Yes | Comma-separated URLs to reference materials |
| EducationArticle | created_at | DateTime | No | Article creation timestamp |
| EducationArticle | updated_at | DateTime | No | Last article update timestamp |

---

## Dermatologist

**Description:** Directory of dermatologists and specialists. Enables referrals and provider recommendations based on consultation analysis.

| Collection | Attribute | Data Type | Nullable | Description |
|------------|-----------|-----------|----------|-------------|
| Dermatologist | id | String (UUID) | No | Primary key - unique dermatologist identifier |
| Dermatologist | full_name | String(150) | No | Dermatologist's full name (required) |
| Dermatologist | clinic_name | String(200) | Yes | Associated clinic or practice name |
| Dermatologist | city | String(120) | Yes | City of practice location |
| Dermatologist | country | String(120) | Yes | Country of practice location |
| Dermatologist | languages | Text | Yes | Languages spoken (comma-separated) |
| Dermatologist | specialties | Text | Yes | Medical specialties (e.g., cosmetic, pediatric) |
| Dermatologist | supported_conditions | Text | Yes | Conditions they specialize in treating |
| Dermatologist | specialty_tags | Text | Yes | Tags for filtering/categorization |
| Dermatologist | regions_served | Text | Yes | Geographic regions they serve |
| Dermatologist | telemedicine_available | Boolean | No | Whether telemedicine consultations are offered |
| Dermatologist | emergency_available | Boolean | No | Whether emergency consultations available |
| Dermatologist | years_experience | Integer | Yes | Years in practice |
| Dermatologist | contact_email | String(255) | Yes | Professional email address |
| Dermatologist | contact_phone | String(50) | Yes | Professional phone number |
| Dermatologist | booking_url | String(500) | Yes | URL to booking system or website |
| Dermatologist | notes | Text | Yes | Additional professional notes |
| Dermatologist | is_active | Boolean | No | Whether profile is active (default: True) |
| Dermatologist | created_at | DateTime | No | Profile creation timestamp |
| Dermatologist | updated_at | DateTime | No | Last profile update timestamp |

---

## RAGDocument

**Description:** Retrieval-Augmented Generation (RAG) knowledge base. Stores chunked documents with embeddings for semantic search during consultations.

| Collection | Attribute | Data Type | Nullable | Description |
|------------|-----------|-----------|----------|-------------|
| RAGDocument | id | String (UUID) | No | Primary key - unique document chunk identifier |
| RAGDocument | source_type | String(50) | No | Type of knowledge source (e.g., "condition", "treatment") |
| RAGDocument | source_id | String(200) | Yes | Reference ID to source object (e.g., education article ID) |
| RAGDocument | title | String(300) | No | Title or heading of the document chunk |
| RAGDocument | content | Text | No | Full text content of the chunk |
| RAGDocument | chunk_index | Integer | No | Sequential index for multi-chunk documents (default: 0) |
| RAGDocument | metadata_json | JSONB | Yes | Structured metadata (tags, source info, etc.) |
| RAGDocument | embedding_json | JSONB (Float Array) | Yes | SentenceTransformer embedding vector (bge-base-en-v1.5) |
| RAGDocument | created_at | DateTime | No | Document ingestion timestamp |
| RAGDocument | updated_at | DateTime | No | Last document update timestamp |

---

## Key Design Patterns

### UUIDs
All primary keys use UUID (String) format for distributed system compatibility and privacy.

### Timestamps
- All tables include `created_at` and `updated_at` fields
- Server-side defaults for consistency
- UTC timezone enforcement

### JSONB Storage
PostgreSQL JSONB used for:
- Flexible nested structures (recommendations, metadata)
- Vector embeddings (RAGDocument)
- Array data (symptoms, red flags)

### Relationships
- User → Profile (one-to-one, cascade delete)
- User → Consultation (one-to-many, cascade delete)
- Foreign keys indexed for performance

### Nullable Fields
Most fields are nullable to allow progressive data collection and optional information.

---

## Data Constraints

### Enumerated Values

| Field | Valid Values | Notes |
|-------|--------------|-------|
| User.role | "user", "admin" | Default: "user" |
| Consultation.disease_confidence_level | "low", "medium", "high" | Derived from confidence score |
| Consultation.skin_type_confidence_level | "low", "medium", "high" | Derived from confidence score |
| Consultation.inferred_severity | "mild", "moderate", "severe" | From NLP classification |
| Consultation.urgency_class | "routine", "urgent", "emergency" | Risk-based classification |
| Consultation.risk_level | "low", "medium", "high", "critical" | Overall risk assessment |
| Consultation.predicted_skin_type | "dry", "normal", "oily" | From EfficientNet-B1 model |
| Product.category | Multiple (cleanser, moisturizer, sunscreen, etc.) | Free-form text |
| EducationArticle.category | "condition", "skincare", "prevention", etc. | Free-form text |
| RAGDocument.source_type | "condition", "treatment", "product", etc. | Free-form text |

### Uniqueness Constraints

| Table | Field | Notes |
|-------|-------|-------|
| User | email | Unique across all users |
| Profile | user_id | One profile per user |
| EducationArticle | slug | URL-safe identifier |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | May 2026 | Initial complete data dictionary |

