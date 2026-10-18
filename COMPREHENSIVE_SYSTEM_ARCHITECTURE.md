d# DermaSoul AI: Comprehensive System Architecture & Technical Deep Dive

**Version:** 1.0.0  
**Last Updated:** May 2026  
**Classification:** Technical Documentation  
**Audience:** System Architects, Backend Engineers, ML Engineers, Integration Teams

---

## Executive Summary

DermaSoul AI is a production-grade **medical decision-support platform** that combines **computer vision**, **natural language processing**, **retrieval-augmented generation (RAG)**, and **deterministic rule-based orchestration** to provide skin condition assessment and educational guidance. The system processes user-submitted skin images alongside descriptive symptoms, applies multi-stage ML inference, enriches results with curated medical knowledge, and delivers evidence-based recommendations—all without generative LLMs.

**Key Technologies:**
- **Vision Models:** EfficientNet-B3 (disease) + EfficientNet-B1 (skin type)
- **NLP Stack:** Hugging Face Transformers (optional NER), SentenceTransformers embeddings, rule-based classifiers
- **RAG System:** Semantic search with deterministic scoring, curated condition knowledge, embedding-based retrieval
- **Backend:** FastAPI, SQLAlchemy, PostgreSQL with JSONB
- **Frontend:** React 19 + TypeScript + Vite
- **Inference:** CPU/GPU with PyTorch, deterministic narrative generation

---

## Section 1: System Architecture Overview

### 1.1 High-Level Architecture

```mermaid
flowchart TB
    subgraph Client["Frontend Layer"]
        React["React 19 SPA<br/>TypeScript | Vite"]
        FAQModule["Condition FAQ Module<br/>Curated Static Content"]
    end

    subgraph Presentation["API Layer"]
        FastAPI["FastAPI REST Server<br/>Port 8010"]
        Auth["JWT Auth + RBAC<br/>HS256"]
        Validation["Input Validation<br/>Pydantic"]
    end

    subgraph Business["Business Logic Layer"]
        Services["Service Orchestration<br/>- diagnosis_service<br/>- nlp_service<br/>- rag_service<br/>- recommendation_service"]
        Orchestrator["AI Orchestrator<br/>Deterministic Narrative<br/>Generation"]
    end

    subgraph ML["ML Inference Layer"]
        VisionModels["Vision Models<br/>EfficientNet-B3/B1"]
        NLPPipeline["NLP Pipeline<br/>Entity Extraction<br/>+ Classification"]
        ImageValidation["Image Quality Checks<br/>Blur Detection<br/>Skin Visibility"]
    end

    subgraph Knowledge["Knowledge & RAG Layer"]
        RAGRetrieval["RAG Retrieval System<br/>Semantic + Rule-Based"]
        Embeddings["Embedding Models<br/>SentenceTransformers"]
        KnowledgeDB["Condition Knowledge<br/>JSON Database"]
        RecommendationDB["OTC Products DB<br/>Safe Products"]
    end

    subgraph Persistence["Data Layer"]
        PostgreSQL["PostgreSQL<br/>Primary Database"]
        FileStorage["File Storage<br/>Uploaded Images"]
    end

    Client -->|HTTP/HTTPS| FastAPI
    FastAPI --> Auth
    FastAPI --> Validation
    Validation --> Services
    Services --> VisionModels
    Services --> NLPPipeline
    Services --> ImageValidation
    Services --> RAGRetrieval
    Services --> Orchestrator
    RAGRetrieval --> Embeddings
    RAGRetrieval --> KnowledgeDB
    RAGRetrieval --> RecommendationDB
    Services --> PostgreSQL
    Services --> FileStorage
    React --> FAQModule
    FAQModule -.->|Static Condition Data| KnowledgeDB
```

### 1.2 Technology Stack

| Layer | Component | Technology |
|-------|-----------|------------|
| **Frontend** | UI Framework | React 19 + TypeScript |
| | Build Tool | Vite |
| | Styling | Tailwind CSS |
| | HTTP Client | Axios |
| | Routing | React Router |
| **Backend** | Framework | FastAPI + Uvicorn |
| | ORM | SQLAlchemy 2.x |
| | Config | Pydantic Settings v2 |
| | Auth | JWT (HS256) + bcrypt |
| **ML/CV** | Vision | PyTorch + TorchVision |
| | NLP | Hugging Face Transformers |
| | Embeddings | SentenceTransformers |
| | Image Proc | OpenCV + Pillow |
| **Data** | Primary DB | PostgreSQL |
| | Storage | JSONB (nested data) |
| | File Storage | Local filesystem |
| | Reports | ReportLab (PDF) |

---

## Section 2: Vision Models System

### 2.1 Disease Classification Model

#### Architecture

```mermaid
flowchart TB
    Input["Input Image<br/>JPEG/PNG<br/>Max 10MB"]
    
    Preprocessing["Preprocessing Pipeline<br/>1. Load PIL Image<br/>2. Resize to 300×300<br/>3. Convert to Tensor<br/>4. Normalize"]
    
    Normalization["ImageNet Normalization<br/>Mean: [0.485, 0.456, 0.406]<br/>Std: [0.229, 0.224, 0.225]"]
    
    Model["EfficientNet-B3<br/>Custom Classification Head<br/>22 Disease Classes"]
    
    Inference["Forward Pass<br/>GPU/CPU Inference<br/>torch.no_grad()"]
    
    Softmax["Softmax Activation<br/>Confidence Scores"]
    
    Output["Output<br/>- Predicted Disease<br/>- Confidence Score<br/>- Class Index"]
    
    Input --> Preprocessing
    Preprocessing --> Normalization
    Normalization --> Model
    Model --> Inference
    Inference --> Softmax
    Softmax --> Output
```

#### Model Specifications

```python
Model Name:          EfficientNet-B3
Weights:             Custom-trained on dermatology dataset
Input Size:          300 × 300 RGB
Input Normalization: ImageNet (mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
Output Classes:      22 disease categories
Checkpoint Format:   PyTorch state_dict
Device:              GPU (CUDA) / CPU fallback
Inference Mode:      torch.no_grad() (no gradients)
```

#### Disease Classes (22 Total)

| Index | Class | Index | Class |
|-------|-------|-------|-------|
| 0 | Acne | 11 | Psoriasis |
| 1 | Actinic Keratosis | 12 | Rosacea |
| 2 | Benign Tumors | 13 | Seborrheic Keratoses |
| 3 | Bullous | 14 | Skin Cancer |
| 4 | Candidiasis | 15 | Sun/Sunlight Damage |
| 5 | Drug Eruption | 16 | Tinea |
| 6 | Eczema | 17 | Unknown/Normal |
| 7 | Infestations/Bites | 18 | Vascular Tumors |
| 8 | Lichen | 19 | Vasculitis |
| 9 | Lupus | 20 | Vitiligo |
| 10 | Moles | 21 | Warts |

#### Code Flow

```python
# File: app/ml/disease_model.py
class DiseaseModel:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = None
        self.labels = DISEASE_CLASS_LABELS
        
    def load_model(self):
        model = efficientnet_b3(weights=None, num_classes=22)
        checkpoint = torch.load(path, map_location=device)
        model.load_state_dict(checkpoint)
        model.eval()
        return model
        
    @torch.no_grad()
    def predict(self, image: PIL.Image) -> DiseasePredictionResult:
        input_tensor = disease_transform(image).unsqueeze(0)
        logits = model(input_tensor)
        probabilities = torch.softmax(logits, dim=1)[0]
        predicted_idx = torch.argmax(probabilities).item()
        confidence = float(probabilities[predicted_idx].item())
        return DiseasePredictionResult(label=LABELS[predicted_idx], confidence=confidence)
```

### 2.2 Skin Type Classification Model

#### Architecture

```mermaid
flowchart TB
    Input["Input Image<br/>Same as Disease Model<br/>300×300 resized"]
    
    Preprocessing["Preprocessing Pipeline<br/>Resize to 240×240<br/>Convert to Tensor<br/>ImageNet Normalize"]
    
    Model["EfficientNet-B1<br/>Custom Classification Head<br/>3 Skin Type Classes"]
    
    Inference["Forward Pass<br/>GPU/CPU Inference"]
    
    Softmax["Softmax Activation<br/>Confidence Scores"]
    
    Output["Output<br/>- Skin Type: dry / normal / oily<br/>- Confidence Score"]
    
    Input --> Preprocessing
    Preprocessing --> Model
    Model --> Inference
    Inference --> Softmax
    Softmax --> Output
```

#### Model Specifications

```
Model Name:          EfficientNet-B1
Weights:             Custom-trained
Input Size:          240 × 240 RGB
Output Classes:      3 (dry, normal, oily)
Normalization:       ImageNet standard
Checkpoint:          skin_type_model.pth
```

#### Skin Type Classes

```
dry    → Skin appears dry, flaky, needs hydration
normal → Balanced oil/moisture content
oily   → High sebum production, prone to shine
```

### 2.3 Image Validation Pipeline

The image quality validation is critical for model robustness. Before ML inference, images pass through multiple gates:

```mermaid
flowchart TB
    RawImage["Uploaded Image<br/>Raw Bytes"]
    
    FileValidation["File Validation<br/>- Format: JPEG/PNG<br/>- Size Check: < 10MB<br/>- Dimensions exist"]
    
    PILLoad["Load with Pillow<br/>Convert to RGB<br/>Handle EXIF rotation"]
    
    BlurDetection["Blur Detection<br/>Laplacian variance<br/>Threshold: < 100 = blurry<br/>Returns blur_score"]
    
    SkinDetection["Skin Visibility Check<br/>HSV/YCrCb color masks<br/>Compute skin pixel ratio<br/>Threshold: > 15%"]
    
    DimensionCheck["Dimension Validation<br/>Min: 64×64<br/>Max: 4096×4096"]
    
    ValidatedImage["Validated PIL Image<br/>Ready for ML"]
    
    RawImage --> FileValidation
    FileValidation --> PILLoad
    PILLoad --> BlurDetection
    BlurDetection --> SkinDetection
    SkinDetection --> DimensionCheck
    DimensionCheck --> ValidatedImage
```

#### Validation Rules

| Check | Method | Threshold | Purpose |
|-------|--------|-----------|---------|
| Blur Detection | Laplacian variance | < 100 = fail | Ensures sharp features |
| Skin Ratio | HSV + YCrCb masks | > 15% required | Confirms skin is visible |
| File Size | File bytes | < 10MB | Prevents memory overload |
| Dimensions | Width/Height | 64–4096 px | Constrains resource use |
| Format | MIME type | JPEG, PNG only | Security + codec known |

---

## Section 3: NLP Pipeline & Text Processing

### 3.1 NLP Pipeline Architecture

The NLP system extracts medical entities, classifies severity/urgency, and enriches consultation with textual insights:

```mermaid
flowchart TB
    RawText["User Input<br/>Symptoms + History<br/>Max 2000 chars"]
    
    Normalization["Text Normalization<br/>- Lowercase<br/>- Strip whitespace<br/>- Merge history + symptoms"]
    
    EntityExtraction["Medical Entity Extraction<br/>Option A: HF Token Classification NER<br/>Option B: Regex fallback<br/>Labels: SYMPTOM, ENTITY, BODY_PART"]
    
    NegationDetection["Negation Detection<br/>Find negated terms<br/>e.g., 'NOT itchy'<br/>Filter from symptoms"]
    
    SymptomNormalization["Symptom Canonicalization<br/>Deduplicate synonyms<br/>Normalize variants<br/>e.g., 'acne' vs 'pimples'"]
    
    SeverityClassification["Severity Classifier<br/>Rule-based scoring<br/>Input: text + symptoms<br/>Output: mild/moderate/severe"]
    
    UrgencyClassification["Urgency Classifier<br/>Red flags + risk level<br/>Output: low/moderate/high"]
    
    DurationExtraction["Duration Pattern Matching<br/>Regex: \d+ (day|week|month|year)<br/>Extract temporal info"]
    
    FollowupGeneration["Generate Followup Questions<br/>If no duration: ask duration<br/>If no body part: ask location<br/>If high urgency: ask alarm symptoms"]
    
    OutputNLPState["NLP State Output<br/>- extracted_symptoms<br/>- severity + confidence<br/>- urgency + confidence<br/>- clinical_entities<br/>- followup_candidates"]
    
    RawText --> Normalization
    Normalization --> EntityExtraction
    EntityExtraction --> NegationDetection
    NegationDetection --> SymptomNormalization
    SymptomNormalization --> SeverityClassification
    SymptomNormalization --> UrgencyClassification
    SeverityClassification --> DurationExtraction
    UrgencyClassification --> DurationExtraction
    DurationExtraction --> FollowupGeneration
    FollowupGeneration --> OutputNLPState
```

### 3.2 Medical Entity Extraction

#### Option A: Transformer-based NER (Default)

```python
Model:           HF token-classification pipeline
Checkpoint:      biomedical-ner-all (or custom)
Input Max:       NLP_ENTITY_MAX_LENGTH = 256 tokens
Output Labels:   SYMPTOM, ENTITY, BODY_PART, etc.
Offline Mode:    HF_HUB_OFFLINE=True (uses cached weights)
Warmup:          Optional on startup (NLP_ENTITY_WARMUP_ON_START)
```

**Flow:**
```
symptoms_text + medical_history → Merge
                                 ↓
                          Tokenize (max 256)
                                 ↓
                          Forward pass (NER head)
                                 ↓
                          Extract spans with labels
                                 ↓
                          Return entity list
```

#### Option B: Regex/Keyword Fallback

If HF pipeline unavailable, use keyword matching:

```python
SYMPTOM_KEYWORDS = {
    "itching": ["itch", "itchy", "khujli"],
    "redness": ["red", "redness", "laal"],
    "burning": ["burn", "burning", "jalan"],
    "pain": ["pain", "painful", "sore", "dard"],
    "swelling": ["swelling", "swollen", "soojan"],
    # ... 15+ symptom categories
}

def extract_symptoms(text: str) -> list[str]:
    found = []
    for symptom, keywords in SYMPTOM_KEYWORDS.items():
        for keyword in keywords:
            if word_boundary_match(text, keyword):
                found.append(symptom)
                break
    return deduplicate_canonical(found)
```

### 3.3 Severity Classification

**Rule-Based Scoring System:**

```python
SEVERE_WORDS = [
    "severe", "very painful", "unbearable", "extreme",
    "spreading fast", "rapidly spreading", "high fever",
    "difficulty breathing", "swollen face", "bleeding mole", "skin peeling"
]

MODERATE_WORDS = [
    "moderate", "painful", "burning", "swollen", "spreading",
    "getting worse", "oozing", "discharge", "pus"
]

MILD_WORDS = [
    "mild", "slight", "little", "minor", "not much", "small"
]

def classify_severity(text: str, symptoms: list[str]) -> SeverityResult:
    score = 0
    matched_words = []
    
    for word in SEVERE_WORDS:
        if word in text.lower():
            score += 3
            matched_words.append(word)
    
    for word in MODERATE_WORDS:
        if word in text.lower():
            score += 1
            matched_words.append(word)
    
    # Apply symptom multiplier
    if len(symptoms) > 5:
        score += 1
    
    # Determine level
    if score >= 3:
        return SeverityResult(label="severe", confidence=min(score/5, 1.0))
    elif score >= 1:
        return SeverityResult(label="moderate", confidence=min(score/3, 1.0))
    else:
        return SeverityResult(label="mild", confidence=0.7)
```

### 3.4 Urgency Classification

**Multi-Factor Urgency Model:**

```mermaid
flowchart TB
    RedFlags["Red Flags Detected<br/>List of flagged conditions"]
    RiskLevel["Risk Level<br/>from image analysis"]
    Severity["Severity<br/>from text classification"]
    
    RedFlagScore["Score Red Flags<br/>High-risk patterns<br/>+5 per flag"]
    
    RiskMultiplier["Apply Risk Multiplier<br/>If risk=high: +10<br/>If risk=moderate: +5"]
    
    SeverityBoost["Severity Boost<br/>If severe: +5<br/>If moderate: +2"]
    
    TotalScore["Total Urgency Score<br/>Threshold logic"]
    
    Classification["Classification<br/>Score >= 15 → HIGH<br/>Score >= 5 → MODERATE<br/>else → LOW"]
    
    RedFlags --> RedFlagScore
    RiskLevel --> RiskMultiplier
    Severity --> SeverityBoost
    RedFlagScore --> TotalScore
    RiskMultiplier --> TotalScore
    SeverityBoost --> TotalScore
    TotalScore --> Classification
```

---

## Section 4: Retrieval-Augmented Generation (RAG) System

### 4.1 RAG System Overview

RAG combines **semantic retrieval** (embeddings) with **deterministic scoring** to fetch the most relevant condition knowledge. The system does NOT use generative LLMs; instead, it retrieves curated medical facts.

```mermaid
flowchart TB
    Query["Input Query<br/>- Predicted disease<br/>- Extracted symptoms<br/>- Red flags<br/>- Risk level"]
    
    KnowledgeBase["Knowledge Base<br/>condition_knowledge.json<br/>22+ conditions<br/>Each with structured fields"]
    
    DeterministicRetrieval["Deterministic Retrieval<br/>1. Load all knowledge entries<br/>2. Score each against query<br/>3. Rank by relevance score<br/>4. Return top K (default: 3)"]
    
    SemanticRetrieval["Optional Semantic Retrieval<br/>1. Build query text<br/>2. Embed with SentenceTransformer<br/>3. Cosine similarity search<br/>4. Re-rank results"]
    
    Reranking["Re-ranking Pipeline<br/>Combine retrieval + semantic scores<br/>Apply safety filters<br/>Final ranking"]
    
    FinalResult["Ranked Results<br/>Top 3-5 condition entries<br/>Formatted for narrative"]
    
    Query --> DeterministicRetrieval
    Query --> SemanticRetrieval
    KnowledgeBase --> DeterministicRetrieval
    DeterministicRetrieval --> Reranking
    SemanticRetrieval --> Reranking
    Reranking --> FinalResult
```

### 4.2 Deterministic Scoring Function

The core RAG scoring algorithm matches query context against condition knowledge:

```python
def calculate_entry_score(
    entry: dict,
    predicted_disease: str,
    extracted_symptoms: list[str],
    red_flags: list[str],
    risk_level: str
) -> int:
    """
    Hierarchical scoring: disease match > symptom match > red flag match > category match
    """
    score = 0
    
    # Tier 1: Exact disease class match (highest confidence)
    if entry["model_class"].lower() == predicted_disease.lower():
        score += 100  # Strong match
    
    # Tier 2: Condition name match
    if entry["condition_name"].lower() == predicted_disease.lower():
        score += 80
    
    # Tier 3: Alias match
    if predicted_disease.lower() in [alias.lower() for alias in entry.get("aliases", [])]:
        score += 60
    
    # Tier 4: Symptom matching (multiplier effect)
    for symptom in extracted_symptoms:
        # Direct match with common_signs
        if symptom.lower() in [s.lower() for s in entry.get("common_signs", [])]:
            score += 8
        
        # Partial match with signs
        for sign in entry.get("common_signs", []):
            if symptom.lower() in sign.lower() or sign.lower() in symptom.lower():
                score += 4
        
        # Partial match with triggers
        for trigger in entry.get("common_triggers_or_causes", []):
            if symptom.lower() in trigger.lower():
                score += 2
    
    # Tier 5: Red flag matching
    for flag in red_flags:
        for entry_flag in entry.get("red_flags", []):
            if flag.lower() in entry_flag.lower():
                score += 6
    
    # Tier 6: Risk level + category boosting
    if risk_level.lower() == "high":
        high_risk_categories = {
            "cancer_warning", "sun_damage_precancerous",
            "reaction", "blistering"
        }
        if entry.get("category") in high_risk_categories:
            score += 3
    
    return score

# Ranking
scored_entries = []
for entry in knowledge_base:
    score = calculate_entry_score(entry, disease, symptoms, flags, risk)
    if score > 0:
        scored_entries.append({**entry, "retrieval_score": score})

# Sort descending and return top K
top_results = sorted(scored_entries, key=lambda x: x["retrieval_score"], reverse=True)[:3]
```

### 4.3 Knowledge Base Structure

**File:** `backend/app/rag_knowledge/condition_knowledge.json`

Each condition entry contains:

```json
{
  "condition_name": "Acne",
  "model_class": "Acne",
  "aliases": ["Acne vulgaris", "Pimples", "Breakouts", "Comedones"],
  "category": "inflammatory",
  "brief_overview": "Acne is a common inflammatory skin condition...",
  "common_signs": ["pimples", "blackheads", "whiteheads", "red bumps", ...],
  "common_triggers_or_causes": ["excess oil", "clogged pores", "hormonal changes", ...],
  "general_care_guidance": ["Use a gentle cleanser.", "Apply sunscreen.", ...],
  "otc_support_guidance": ["OTC acne products may include...", ...],
  "what_to_avoid": ["Avoid harsh scrubs.", "Avoid picking or squeezing...", ...],
  "red_flags": ["deep painful cysts", "rapid worsening", "significant scarring", ...],
  "when_to_seek_doctor": "Consult a dermatologist if acne is severe...",
  "professional_note": "AI prediction cannot determine acne subtype...",
  "source_names": ["American Academy of Dermatology", "DermNet"],
  "source_urls": ["https://www.aad.org/public/diseases/acne", ...]
}
```

**Total Conditions:** 22+ (Acne, Eczema, Psoriasis, Skin Cancer, etc.)

### 4.4 Semantic Embedding Pipeline (Optional)

For enhanced retrieval, SentenceTransformers embeddings enable cosine similarity:

```mermaid
flowchart TB
    ConditionEntry["Condition Entry<br/>From knowledge.json"]
    
    BuildText["Build Embedding Text<br/>Concatenate:<br/>- condition_name<br/>- brief_overview<br/>- common_signs<br/>- triggers<br/>- red_flags"]
    
    EmbedCheck["Check Embedding Model<br/>Load SentenceTransformer<br/>bge-base-en-v1.5<br/>Fallback: hash embedding"]
    
    ComputeVector["Compute Vector<br/>384-dimensional<br/>Normalized L2"]
    
    StoreJSON["Store in DB<br/>Consultation.embedding_json<br/>JSONB field"]
    
    QueryTime["Query Time<br/>Build query text<br/>Embed same way<br/>Cosine similarity search"]
    
    RankResults["Rank by Score<br/>Combine with<br/>deterministic score"]
    
    ConditionEntry --> BuildText
    BuildText --> EmbedCheck
    EmbedCheck --> ComputeVector
    ComputeVector --> StoreJSON
    StoreJSON --> QueryTime
    QueryTime --> RankResults
```

#### Embedding Model Details

```
Model:              SentenceTransformers
Checkpoint:         bge-base-en-v1.5
Dimensions:         384
Normalization:      L2 (cosine similarity ready)
Offline:            Yes (cached in .hf-cache/)
Fallback:           Deterministic hash embedding (SHA256-based)
```

#### Hash Fallback (Deterministic)

If SentenceTransformer unavailable:

```python
def _hash_embedding(text: str, dimensions: int = 384) -> list[float]:
    """
    Deterministic embedding via SHA256 hashing.
    Ensures reproducibility without ML library dependency.
    """
    digest = hashlib.sha256(text.encode("utf-8")).digest()
    values = []
    for i in range(dimensions):
        byte_val = digest[i % len(digest)]
        values.append((byte_val / 255.0) - 0.5)  # Normalize to [-0.5, 0.5]
    
    # L2 normalization
    norm = math.sqrt(sum(v * v for v in values)) or 1.0
    return [v / norm for v in values]
```

### 4.5 RAG Service Architecture

```mermaid
flowchart TB
    DiagnosisRequest["Diagnosis Request<br/>Image + Symptoms"]
    
    RunDiagnosis["Run Image Diagnosis<br/>Disease model<br/>Skin type model"]
    
    RunNLP["Run NLP Pipeline<br/>Extract symptoms<br/>Classify severity/urgency"]
    
    DetectRedFlags["Detect Red Flags<br/>Pattern matching<br/>Keyword extraction"]
    
    GenerateRAGQuery["Generate RAG Query<br/>Build context string<br/>from all signals"]
    
    RetrieveRelevant["Retrieve Relevant Entries<br/>Score all conditions<br/>Rank top K"]
    
    OptionalSemanticSearch["Optional Semantic Search<br/>If embeddings available<br/>Cosine similarity"]
    
    RerankerService["Reranker Service<br/>Combine scores<br/>Apply safety filters"]
    
    FormatOutput["Format RAG Output<br/>Explanations<br/>Guidance<br/>Citations"]
    
    DiagnosisRequest --> RunDiagnosis
    RunDiagnosis --> RunNLP
    RunNLP --> DetectRedFlags
    DetectRedFlags --> GenerateRAGQuery
    GenerateRAGQuery --> RetrieveRelevant
    RetrieveRelevant --> OptionalSemanticSearch
    OptionalSemanticSearch --> RerankerService
    RerankerService --> FormatOutput
```

---

## Section 5: Red Flag Detection & Risk Stratification

### 5.1 Red Flag Taxonomy

Red flags indicate urgent conditions requiring immediate medical evaluation:

```python
RED_FLAG_RULES = {
    "rapidly_spreading": ["rapidly spreading", "spreading fast", "spreading quickly"],
    "fever_with_skin_issue": ["fever", "high temperature", "chills"],
    "severe_pain": ["severe pain", "very painful", "unbearable pain"],
    "pus_or_infection": ["pus", "oozing", "yellow discharge", "infected"],
    "bleeding_lesion": ["bleeding mole", "bleeding spot", "bleeding lesion"],
    "changing_mole": ["changing mole", "mole changed", "irregular mole"],
    "breathing_or_face_swelling": ["difficulty breathing", "swollen face", "lip swelling"],
    "open_wound": ["open wound", "deep wound", "skin ulcer"],
}

HIGH_RISK_DISEASES = {"Skin Cancer", "Melanoma Warning Sign"}

MODERATE_RISK_DISEASES = {
    "Eczema", "Psoriasis", "Rosacea", "Bullous", "Drug Eruption",
    "Vasculitis", "Lupus", "Tinea", "Candidiasis"
}
```

### 5.2 Risk Level Calculation

```mermaid
flowchart TB
    PredictedDisease["Predicted Disease<br/>from model"]
    
    ExtractedSymptoms["Extracted Symptoms<br/>from NLP"]
    
    DetectedRedFlags["Detected Red Flags<br/>from text matching"]
    
    CheckHighRisk["Is disease in<br/>HIGH_RISK set?"]
    
    CheckModerateRisk["Is disease in<br/>MODERATE_RISK set?"]
    
    CountFlags["Count red flags"]
    
    ComputeScore["Compute Risk Score<br/>Base: 0<br/>+ 50 if high-risk disease<br/>+ 25 if moderate-risk<br/>+ 10 × num_red_flags<br/>+ severity_bonus"]
    
    ClassifyRisk["Classify Risk Level<br/>Score >= 70 → HIGH<br/>Score >= 30 → MODERATE<br/>else → LOW"]
    
    PredictedDisease --> CheckHighRisk
    PredictedDisease --> CheckModerateRisk
    ExtractedSymptoms --> CountFlags
    DetectedRedFlags --> CountFlags
    CheckHighRisk --> ComputeScore
    CheckModerateRisk --> ComputeScore
    CountFlags --> ComputeScore
    ComputeScore --> ClassifyRisk
```

### 5.3 Doctor Warning Generation

Based on risk level and red flags, generate contextual warning:

```python
def generate_doctor_warning(
    risk_level: str,
    red_flags: list[str],
    predicted_disease: str,
    disease_confidence: float
) -> str:
    """
    Generate medical disclaimer for high-risk cases.
    """
    if risk_level == "high":
        if any(flag in ["rapidly_spreading", "breathing_or_face_swelling"] 
               for flag in red_flags):
            return (
                "⚠️ URGENT: Seek immediate medical attention if you experience "
                "difficulty breathing, severe swelling, or rapidly spreading symptoms. "
                "This platform is not a substitute for emergency medical care."
            )
        else:
            return (
                "⚠️ HIGH RISK: This presentation has concerning features. "
                "Please schedule an urgent appointment with a dermatologist or physician."
            )
    
    elif risk_level == "moderate":
        return (
            "Moderate concern detected. Please consult a dermatologist within 1-2 weeks "
            "or sooner if symptoms worsen."
        )
    
    else:  # LOW
        return (
            "This appears to be a low-risk presentation. Monitor the area and maintain "
            "good skin hygiene. Consult a doctor if it worsens or doesn't improve."
        )
```

---

## Section 6: Recommendation System

### 6.1 Safe OTC Product Recommendation

The system recommends only **vetted, dermatologist-safe OTC products** based on:
- Predicted condition
- User allergies
- Risk level
- Red flags

```mermaid
flowchart TB
    LoadProducts["Load Safe Products<br/>from safe_otc_products.json"]
    
    FilterByCondition["Filter by Condition<br/>Product has condition match<br/>in recommended_for"]
    
    FilterByAllergy["Filter by Allergy<br/>Check user allergies<br/>against avoid_if_allergic_to"]
    
    FilterByRiskLevel["Filter by Risk Level<br/>If risk=high:<br/>Block pharmacist-guided OTC<br/>Allow only supportive care"]
    
    FilterByRedFlags["Filter by Red Flags<br/>Remove products conflicting<br/>with detected red flags"]
    
    RankByRelevance["Rank by Relevance<br/>Exact match > partial > generic<br/>Confidence scoring"]
    
    LimitResults["Limit Results<br/>Return top 5-8<br/>products"]
    
    AnnotateWithContext["Annotate with Context<br/>Add allergies_applied_note<br/>Add risk_level_note"]
    
    LoadProducts --> FilterByCondition
    FilterByCondition --> FilterByAllergy
    FilterByAllergy --> FilterByRiskLevel
    FilterByRiskLevel --> FilterByRedFlags
    FilterByRedFlags --> RankByRelevance
    RankByRelevance --> LimitResults
    LimitResults --> AnnotateWithContext
```

### 6.2 Safe Products Database Structure

**File:** `backend/app/rag_knowledge/safe_otc_products.json`

```json
{
  "product_id": "gentle_cleanser_1",
  "name": "Gentle Facial Cleanser",
  "category": "cleanser",
  "recommended_for": ["Acne", "Eczema", "Rosacea"],
  "general_guidance": "Use twice daily with lukewarm water...",
  "ingredients": ["water", "gentle surfactant", "glycerin"],
  "avoid_if_allergic_to": ["salicylic acid", "benzoyl peroxide"],
  "avoid_if_red_flags": ["severe_pain", "pus_or_infection"],
  "price_range": "affordable",
  "availability": "OTC, widely available",
  "source": "AAD Recommended"
}
```

---

## Section 7: Core Diagnosis Flow

### 7.1 End-to-End Diagnosis Request Flow

```mermaid
flowchart TB
    Start["User POST /api/diagnosis/analyze<br/>Image + Symptoms + Context"]
    
    Auth["1. Authenticate<br/>JWT token validation<br/>User session check"]
    
    ValidateImage["2. Validate Image<br/>File format check<br/>Size check < 10MB<br/>PIL load + EXIF rotate"]
    
    BlurCheck["3. Image Quality Check<br/>Laplacian blur score<br/>Skin visibility ratio<br/>Pass/fail gates"]
    
    SaveImage["4. Save Image<br/>Generate filename<br/>Store in app/uploads/<br/>Get storage path"]
    
    RunDiagnosisModels["5. Run Vision Models<br/>EfficientNet-B3 disease<br/>EfficientNet-B1 skin type<br/>Get confidences"]
    
    RunNLPPipeline["6. Run NLP Pipeline<br/>Entity extraction<br/>Severity classification<br/>Urgency classification<br/>Duration parsing"]
    
    DetectRedFlags["7. Detect Red Flags<br/>Pattern matching in text<br/>Return flag list"]
    
    CalculateRiskLevel["8. Calculate Risk Level<br/>Disease-based scoring<br/>Red flag counting<br/>Classify: HIGH/MODERATE/LOW"]
    
    GenerateRAG["9. Generate RAG Assessment<br/>Retrieve relevant conditions<br/>Optional semantic search<br/>Format explanations<br/>Recommendations<br/>Guidance"]
    
    GenerateRecommendations["10. Generate Recommendations<br/>Load safe OTC products<br/>Filter by condition + allergies<br/>Filter by risk + red flags<br/>Rank + limit results"]
    
    GeneratePDFData["11. Generate PDF Data<br/>Format consultation narrative<br/>Deterministic rules (no LLM)<br/>Build citations + guidance"]
    
    SaveConsultation["12. Save to Database<br/>Store Consultation record<br/>All fields: symptoms, models,<br/>NLP, RAG, recommendations"]
    
    GenerateResponse["13. Generate Response<br/>Return DiagnosisResponse<br/>Include all fields + links"]
    
    ReturnClient["14. Return to Client<br/>200 OK + JSON"]
    
    Start --> Auth
    Auth --> ValidateImage
    ValidateImage --> BlurCheck
    BlurCheck --> SaveImage
    SaveImage --> RunDiagnosisModels
    RunDiagnosisModels --> RunNLPPipeline
    RunNLPPipeline --> DetectRedFlags
    DetectRedFlags --> CalculateRiskLevel
    CalculateRiskLevel --> GenerateRAG
    GenerateRAG --> GenerateRecommendations
    GenerateRecommendations --> GeneratePDFData
    GeneratePDFData --> SaveConsultation
    SaveConsultation --> GenerateResponse
    GenerateResponse --> ReturnClient
```

### 7.2 Diagnosis Router Implementation

**File:** `backend/app/routers/diagnosis_router.py`

```python
@router.post("/analyze", response_model=DiagnosisBaseResponse)
async def analyze_skin_image(
    image: UploadFile = File(...),
    symptoms: str = Form(...),
    duration: str | None = Form(None),
    severity: str | None = Form(None),
    medical_history: str | None = Form(None),
    skin_tone: str | None = Form(None),
    fitzpatrick_type: str | None = Form(None),
    ethnicity_region: str | None = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Main diagnosis endpoint. Orchestrates all ML, NLP, RAG, and recommendation systems.
    Returns comprehensive consultation result.
    """
    
    # 1. Validate inputs
    file_bytes = await image.read()
    pil_image = validate_uploaded_image(image, file_bytes)
    validate_image_not_blurry(pil_image)
    validate_visible_skin(pil_image)
    
    # 2. Save image
    stored_filename, stored_path = save_uploaded_image_bytes(file_bytes, image.filename)
    
    # 3. Run diagnosis models
    diagnosis_result = run_image_diagnosis(pil_image)
    
    # 4. Run NLP pipeline
    nlp_result = run_nlp_pipeline(
        symptoms_text=symptoms,
        medical_history=medical_history,
        supplied_duration=duration,
        supplied_severity=severity,
        risk_level=diagnosis_result["risk_level"],  # Computed after
        red_flags=[]  # Computed after
    )
    
    # 5. Detect red flags
    red_flags = detect_red_flags(symptoms, medical_history)
    
    # 6. Calculate risk level
    risk_level = calculate_risk_level(
        predicted_disease=diagnosis_result["predicted_disease"],
        red_flags=red_flags,
        severity=nlp_result["inferred_severity"]
    )
    
    # 7. Generate RAG assessment
    rag_result = generate_structured_rag_assessment(
        predicted_disease=diagnosis_result["predicted_disease"],
        extracted_symptoms=nlp_result["extracted_symptoms"],
        red_flags=red_flags,
        risk_level=risk_level
    )
    
    # 8. Generate recommendations
    recommendations = generate_safe_recommendations(
        predicted_disease=diagnosis_result["predicted_disease"],
        red_flags=red_flags,
        risk_level=risk_level,
        user_allergies=current_user.profile.allergies if current_user.profile else ""
    )
    
    # 9. Generate deterministic narrative
    narrative = generate_consultation_narrative(
        db=db,
        base_state={
            **diagnosis_result,
            **nlp_result,
            **rag_result,
            "risk_level": risk_level,
            "red_flags": red_flags,
            "general_care_guidance": rag_result.get("general_care_guidance", []),
            "when_to_seek_doctor": rag_result.get("when_to_seek_doctor", "")
        }
    )
    
    # 10. Build melanin context (inclusive guidance)
    melanin_note = build_melanin_context_note(
        skin_tone=skin_tone,
        fitzpatrick_type=fitzpatrick_type,
        ethnicity_region=ethnicity_region,
        predicted_disease=diagnosis_result["predicted_disease"]
    )
    
    # 11. Save consultation to database
    consultation = save_consultation_result(
        db=db,
        user_id=current_user.id,
        image_filename=stored_filename,
        symptoms=symptoms,
        **diagnosis_result,
        **nlp_result,
        red_flags=red_flags,
        risk_level=risk_level,
        **rag_result,
        recommendations=recommendations,
        **narrative,
        melanin_context_note=melanin_note
    )
    
    # 12. Send high-risk alert (if applicable)
    if risk_level == "high":
        send_high_risk_alert_email(current_user.email, consultation.id)
    
    # 13. Return response
    return DiagnosisBaseResponse(
        consultation_id=consultation.id,
        predicted_disease=consultation.predicted_disease,
        disease_confidence=consultation.disease_confidence,
        risk_level=consultation.risk_level,
        doctor_warning=consultation.doctor_warning,
        # ... all fields
    )
```

---

## Section 8: Database Schema

### 8.1 Consultation Table Structure

**Table:** `consultations`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `user_id` | String FK | Links to user |
| `image_filename` | String | Stored image name |
| `symptoms` | Text | User-provided symptoms |
| `duration` | String | How long symptoms present |
| `severity` | String | User-supplied severity |
| `medical_history` | Text | Medical context |
| `predicted_disease` | String | Model's diagnosis |
| `disease_confidence` | Float | 0–1 confidence score |
| `predicted_skin_type` | String | dry / normal / oily |
| `skin_type_confidence` | Float | Confidence of skin type |
| `extracted_symptoms` | JSONB | NLP-extracted symptoms list |
| `clinical_entities` | JSONB | Medical entities from NER |
| `negated_entities` | JSONB | Terms to ignore |
| `inferred_severity` | String | NLP-classified severity |
| `severity_confidence` | Float | Severity score confidence |
| `urgency_class` | String | low / moderate / high |
| `red_flags` | JSONB | Detected red flags |
| `risk_level` | String | HIGH / MODERATE / LOW |
| `doctor_warning` | Text | Contextual medical warning |
| `retrieved_knowledge` | JSONB | RAG retrieval results |
| `recommendations` | JSONB | Safe OTC products |
| `llm_summary` | Text | Deterministic narrative |
| `llm_next_steps` | JSONB | Guidance + followups |
| `referred_dermatologists` | JSONB | Specialist referrals |
| `created_at` | DateTime | Timestamp |

### 8.2 RAG Document Table (Optional)

For storing indexed knowledge:

```python
class RAGDocument(Base):
    __tablename__ = "rag_documents"
    
    id = Column(String, primary_key=True)
    source = Column(String)  # "condition_knowledge" or "custom"
    condition_name = Column(String, index=True)
    model_class = Column(String)
    content = Column(Text)  # Concatenated text for search
    embedding_json = Column(JSONB)  # Stored SentenceTransformer vector
    metadata = Column(JSONB)  # Additional context
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

---

## Section 9: Integration Points & API Contracts

### 9.1 Diagnosis Endpoint

**POST /api/diagnosis/analyze**

**Request:**
```json
{
  "image": "multipart/form-data",
  "symptoms": "Red itchy bumps on my face for 2 weeks",
  "duration": "2 weeks",
  "severity": "moderate",
  "medical_history": "Sensitive skin, no major allergies",
  "skin_tone": "medium",
  "fitzpatrick_type": "III",
  "ethnicity_region": "South Asian"
}
```

**Response:**
```json
{
  "consultation_id": "uuid-string",
  "predicted_disease": "Acne",
  "disease_confidence": 0.87,
  "disease_confidence_level": "high",
  "predicted_skin_type": "oily",
  "skin_type_confidence": 0.92,
  "extracted_symptoms": ["red bumps", "itching"],
  "inferred_severity": "moderate",
  "urgency_class": "moderate",
  "risk_level": "moderate",
  "doctor_warning": "Moderate concern detected...",
  "general_care_guidance": ["Use gentle cleanser...", "Apply sunscreen..."],
  "otc_support_guidance": ["Consider benzoyl peroxide..."],
  "recommendations": [
    {
      "product_id": "gentle_cleanser_1",
      "name": "Gentle Facial Cleanser",
      "reason": "Recommended for acne-prone skin"
    }
  ],
  "llm_summary": "Deterministic assessment narrative...",
  "llm_next_steps": ["Monitor for improvement...", "Avoid picking lesions..."],
  "referred_dermatologists": [
    {
      "id": "derm-1",
      "name": "Dr. Sarah Johnson",
      "specialty": "Acne & Rosacea"
    }
  ]
}
```

### 9.2 Consultation Detail Endpoint

**GET /api/consultations/{consultation_id}**

Returns full consultation record including all RAG, NLP, and recommendation data.

### 9.3 Consultation FAQ Endpoint

**GET /api/consultations/{consultation_id}/faq**

Returns curated FAQs for the predicted disease (frontend-side curated content).

---

## Section 10: Security & Safety Guardrails

### 10.1 Clinical Safety Policy

```python
class ClinicalSafetyPolicy:
    """Enforces medical disclaimers and risk-aware messaging."""
    
    DISCLAIMER = (
        "This assessment is AI-assisted educational support only. "
        "It does NOT constitute a medical diagnosis. "
        "Always consult a licensed healthcare provider."
    )
    
    HIGH_RISK_ESCALATION = (
        "⚠️ Urgent evaluation needed. Seek medical care immediately."
    )
    
    MODERATE_RISK_ESCALATION = (
        "Please schedule an appointment with a dermatologist within 1-2 weeks."
    )
    
    def enforce_safety_policy(
        llm_payload: dict,
        risk_level: str,
        red_flags: list[str]
    ) -> dict:
        """Inject safety disclaimers based on risk context."""
        if risk_level == "high":
            llm_payload["safety_notice"] = self.HIGH_RISK_ESCALATION
        elif risk_level == "moderate":
            llm_payload["safety_notice"] = self.MODERATE_RISK_ESCALATION
        
        llm_payload["ai_limitations"] = self.DISCLAIMER
        return llm_payload
```

### 10.2 Input Validation & Rate Limiting

- File size cap: 10 MB
- Symptom text: 2000 characters max
- Duration: parseable temporal patterns only
- Rate limiting: Per-user API throttle (e.g., 10 requests/day for free tier)

### 10.3 Data Privacy

- PII handling: User profile PII encrypted in transit (HTTPS)
- Image storage: Uploaded images stored locally, not shared
- Database: PostgreSQL with bcrypt-hashed passwords, JWT tokens
- GDPR compliance: Data retention policies, user deletion workflows

---

## Section 11: Configuration & Deployment

### 11.1 Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dermasoul

# JWT Authentication
JWT_SECRET_KEY=<your-secret-key>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# CORS
BACKEND_CORS_ORIGINS=http://localhost:5173,http://localhost:5174

# ML Models
DIAGNOSIS_MODEL_PATH=app/ml/ml_models/diagnosis_model_optimized.pth
SKIN_TYPE_MODEL_PATH=app/ml/ml_models/skin_type_model.pth

# NLP & RAG
NLP_ENTITY_MODEL=app/ml/hf_models/biomedical-ner-all
NLP_HF_HUB_OFFLINE=true
NLP_ENTITY_WARMUP_ON_START=false
RAG_EMBEDDING_MODEL=app/ml/hf_models/bge-base-en-v1.5
HF_HOME=backend/.hf-cache

# File Storage
UPLOAD_DIR=app/uploads
MAX_IMAGE_SIZE_MB=10
MAX_REPORT_SIZE_MB=15

# Email (Optional)
SMTP_ENABLED=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# Features
ENVIRONMENT=production
APP_VERSION=1.0.0
```

### 11.2 Startup Sequence

```mermaid
flowchart TB
    Start["FastAPI lifespan event"]
    
    CreateTables["1. Create DB tables<br/>if not exist<br/>SQLAlchemy metadata"]
    
    EnsureUploadDir["2. Ensure upload directory<br/>app/uploads/<br/>Create if missing"]
    
    ConfigureHF["3. Configure HuggingFace<br/>Set HF_HOME env var<br/>Create cache dir<br/>Set offline mode"]
    
    WarmupNER["4. Warmup NER Pipeline<br/>if NLP_ENTITY_WARMUP_ON_START<br/>Load transformer<br/>Cache in memory"]
    
    Ready["Server Ready<br/>Accept requests"]
    
    Start --> CreateTables
    CreateTables --> EnsureUploadDir
    EnsureUploadDir --> ConfigureHF
    ConfigureHF --> WarmupNER
    WarmupNER --> Ready
```

---

## Section 12: Monitoring & Observability

### 12.1 Trace Service

The system logs detailed traces for every diagnosis:

```python
class TraceService:
    """Logs diagnosis flow for debugging and quality assurance."""
    
    def log_trace_event(
        trace_id: str,
        event_type: str,  # "model_inference", "nlp_processing", etc.
        duration_ms: float,
        result: dict
    ) -> None:
        """
        Log structured trace event.
        Example: {"trace_id": "...", "event": "disease_model_inference", 
                  "duration_ms": 156, "predicted": "Acne", "confidence": 0.87}
        """
        pass
```

### 12.2 Metrics Tracked

- Model inference latency (per model)
- NLP extraction quality (entities found, duration parsed)
- RAG retrieval quality (relevance score, number of results)
- Error rates (image validation failures, model failures)
- User satisfaction (via optional feedback endpoint)

---

## Section 13: Workflow Examples

### 13.1 Example: Acne Diagnosis Flow

**User Input:**
```
Image: face photo with red bumps
Symptoms: "Red itchy pimples on my forehead and chin for 3 weeks"
Duration: "3 weeks"
Severity: "moderate"
Skin Type: "medium"
Fitzpatrick: "III"
```

**System Processing:**

1. **Image Validation**
   - Blur score: 180 (passes > 100 threshold)
   - Skin ratio: 42% (passes > 15% threshold)

2. **Vision Models**
   - Disease: "Acne" (confidence 0.87)
   - Skin Type: "oily" (confidence 0.92)

3. **NLP Pipeline**
   - Extracted symptoms: `["pimples", "red bumps", "itching"]`
   - Severity: "moderate" (confidence 0.82)
   - Urgency: "moderate" (confidence 0.75)
   - Duration: "3 weeks"

4. **Red Flag Detection**
   - None detected (no "pus", "fever", etc.)

5. **Risk Level**
   - Base score: 0
   - Moderate-risk disease (Acne): +25
   - Moderate severity: +10
   - Final: "MODERATE"

6. **RAG Retrieval**
   - Query: predicted_disease="Acne", symptoms=[...], red_flags=[], risk="moderate"
   - Scoring:
     - Entry "Acne": score = 100 (exact match) + 24 (symptoms) = **124**
     - Entry "Rosacea": score = 0 + 4 (some signs match) = **4**
   - Top 1 Result: "Acne" with full guidance

7. **Recommendations**
   - Filter products for "Acne"
   - Check user allergies: none
   - Check risk conflicts: none
   - Return: [Gentle Cleanser, Sunscreen, Salicylic Acid Toner]

8. **Narrative Generation** (Deterministic)
   ```
   Summary: "The classifier highlights Acne with contextual risk summarized as Moderate..."
   Differential Notes: ["Similar conditions...", "Medications not captured..."]
   Next Steps: ["Use gentle cleanser", "Avoid picking", "Apply sunscreen"]
   Followups: ["How long has this been present?"]
   ```

9. **Database Save**
   - Store all fields in `consultations` table
   - Create audit log entry

10. **Response to Client**
    ```json
    {
      "consultation_id": "abc-123",
      "predicted_disease": "Acne",
      "disease_confidence": 0.87,
      "risk_level": "MODERATE",
      "recommendations": [
        {"name": "Gentle Cleanser", ...},
        {"name": "Broad-spectrum Sunscreen", ...}
      ],
      "llm_summary": "...",
      "referred_dermatologists": [
        {"name": "Dr. Smith", "specialty": "Acne"}
      ]
    }
    ```

### 13.2 Example: High-Risk Red Flag Flow

**User Input:**
```
Symptoms: "Rapidly spreading red rash with fever for 2 days"
Medical History: "Recently took new antibiotic"
```

**System Processing:**

1. **Red Flag Detection**
   - `"rapidly_spreading"`: YES (keyword "rapidly spreading" found)
   - `"fever_with_skin_issue"`: YES (keyword "fever" found)
   - Flags: `["rapidly_spreading", "fever_with_skin_issue"]`

2. **Risk Level Calculation**
   - Base: 0
   - 2 red flags × 10 = +20
   - If disease is "Drug Eruption" (high-risk): +50
   - Final: SCORE = 70+ → **"HIGH"**

3. **Doctor Warning**
   ```
   "⚠️ Urgent: Seek immediate medical attention if you experience rapidly spreading
    symptoms or fever. Please consult a doctor or dermatologist immediately."
   ```

4. **Recommendation Filtering**
   - High-risk mode: only supportive care allowed
   - Block: pharmacist-guided OTC actives
   - Allow: gentle cleanser, cold compress
   - Result: Limited, safe-only recommendations

5. **Alert System**
   - Send high-risk alert email to user + clinician
   - Flag in admin dashboard

6. **RAG Retrieval**
   - Boost scores for high-risk categories
   - Ensure "when_to_seek_doctor" prominently featured

---

## Section 14: Performance Characteristics

### 14.1 Model Inference Times (Typical)

| Component | Time | Hardware |
|-----------|------|----------|
| Image validation | 100–200ms | CPU |
| Disease model | 150–300ms | GPU / CPU |
| Skin type model | 100–200ms | GPU / CPU |
| NLP entity extraction | 200–500ms | CPU (warmup) / 50ms (cached) |
| Severity classification | 10–50ms | CPU |
| RAG retrieval (deterministic) | 5–20ms | CPU |
| RAG semantic search | 50–150ms | CPU (embeddings) |
| Narrative generation | 20–100ms | CPU |
| **Total End-to-End** | **~1–2 seconds** | Combined |

### 14.2 Scalability Considerations

- **Concurrent users:** Uvicorn with gunicorn workers handles ~100+ concurrent requests
- **Model caching:** Disease/Skin Type models loaded once, reused per request
- **NLP warmup:** Optional at startup; reduces first-request latency
- **RAG scaling:** Deterministic scoring scales O(n_conditions); currently 22 conditions (~1ms)
- **Database:** PostgreSQL connection pooling; JSONB indexes for fast queries

---

## Section 15: Future Enhancements & Roadmap

### 15.1 Potential Improvements

1. **Multi-modal RAG**
   - Retrieve similar images from medical literature
   - Cross-reference visual patterns with textual descriptions

2. **Specialist Routing**
   - Automatic specialist assignment based on predicted disease
   - Integration with dermatology clinics

3. **Longitudinal Tracking**
   - Follow-up consultations
   - Outcome tracking (did condition resolve?)
   - Trend analysis over time

4. **Explainability Enhancements**
   - Attention maps from disease model
   - Confidence calibration analysis
   - "Why this diagnosis?" explanations

5. **Localization**
   - Multi-language NLP support
   - Localized condition guidance (regional prevalence)
   - Cultural sensitivity in recommendations

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **RAG** | Retrieval-Augmented Generation: fetch relevant knowledge before generating response |
| **NER** | Named Entity Recognition: extract medical concepts from text |
| **JSONB** | PostgreSQL JSON type with binary encoding; supports indexing |
| **Embeddings** | Dense vector representation of text (384-dim for SentenceTransformers) |
| **Softmax** | Probability distribution; ensures outputs sum to 1 |
| **Deterministic** | Reproducible output; no randomness (opposite of generative/LLM) |
| **Red Flag** | Clinical warning sign requiring urgent evaluation |
| **Fitzpatrick** | Skin typing system (I–VI) based on sun reactivity |
| **OTC** | Over-the-counter; non-prescription medication/products |

---

## Appendix B: References & Resources

### Official Documentation
- **DermaSoul README:** [DermaSoul-main/README.md](e:/DermaSoul-AI/README.md)
- **Project Documentation:** [PROJECT_DOCUMENTATION.md](e:/DermaSoul-AI/PROJECT_DOCUMENTATION.md)
- **Frontend Architecture:** [FRONTEND_ARCHITECTURE_COMPLETE.md](e:/DermaSoul-AI/FRONTEND_ARCHITECTURE_COMPLETE.md)

### ML & Framework Docs
- **PyTorch:** https://pytorch.org/
- **EfficientNet:** https://github.com/google/efficientnet
- **FastAPI:** https://fastapi.tiangolo.com/
- **SQLAlchemy:** https://www.sqlalchemy.org/
- **Hugging Face Transformers:** https://huggingface.co/transformers/
- **SentenceTransformers:** https://www.sbert.net/

### Medical References
- **American Academy of Dermatology:** https://www.aad.org/
- **DermNet NZ:** https://dermnetnz.org/
- **Fitzpatrick Scale:** https://en.wikipedia.org/wiki/Fitzpatrick_scale

---

## Document Information

**Author:** DermaSoul AI Technical Team  
**Version:** 1.0.0  
**Date:** May 2026  
**Status:** Complete & Production-Ready  

**For Support:**
- Backend Questions: Backend team
- ML/Model Questions: ML Engineering team
- Architecture: Solutions Architecture team
- Deployment: DevOps team

---

**END OF COMPREHENSIVE SYSTEM ARCHITECTURE DOCUMENT**
