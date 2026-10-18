# How DermaSoul AI Works: RAG, Models & NLP Explained 🎓

## A Teacher's Guide to Understanding Our Skin Analysis System

---

## Table of Contents
1. [Introduction - What Does Our App Do?](#introduction)
2. [Part 1: Vision Models - The Eyes of Our System](#part-1-vision-models)
3. [Part 2: NLP - The Listening Ears](#part-2-nlp)
4. [Part 3: RAG - The Brain with Knowledge](#part-3-rag)
5. [Part 4: How They Work Together](#part-4-together)
6. [File-to-File Implementation Trace](#file-to-file-implementation-trace)

---

## Introduction - What Does Our App Do?

### 🎯 The Big Picture

Imagine you have a **skin problem** and you need help. You do this:

1. **Take a photo** of your skin
2. **Describe your symptoms** (like "red, itchy, painful")
3. **Tell us about your medical history** (like "I have sensitive skin")

Now, our app does **three magical things**:

- **👀 LOOKS at your image** → Uses Vision Models
- **👂 LISTENS to your description** → Uses NLP
- **🧠 THINKS about the right advice** → Uses RAG

Let me explain each part like you're a beginner student. 📚

---

## Part 1: Vision Models - The Eyes of Our System

### What is a Vision Model?

Think of it like this:

> **A Vision Model is like a super-smart doctor who spent 10 years studying only pictures of skin diseases.**

When you show this "doctor" a photo, they instantly recognize:
- ✅ What disease it might be
- ✅ How confident they are
- ✅ What type of skin you have

### 1.1 The Two Vision Models We Use

#### Model #1: Disease Detective (EfficientNet-B3)

**Job:** "Look at this skin photo. What disease might it be?"

**How it works:**

```
Your Photo
    ↓
(Resize to 300×300 pixels)
    ↓
(Convert to numbers the computer understands)
    ↓
(Send through a trained brain - EfficientNet-B3)
    ↓
(Get 22 possible diseases with scores)
    ↓
(Pick the highest score = Predicted Disease)
```

**Example:**
```
Your Photo → Model Analysis →
"50% Acne, 30% Eczema, 15% Rosacea, 5% Other"
Result: ACNE (50% confidence) ✓
```

**The 22 Diseases It Can Recognize:**
Acne, Eczema, Psoriasis, Skin Cancer, Lichen, Candidiasis, Warts, Vitiligo, Rosacea, and 13 others...

#### Model #2: Skin Type Identifier (EfficientNet-B1)

**Job:** "What type of skin does this person have?"

**Output:** 3 choices:
- 🏜️ **DRY** - Your skin is like a desert (needs water/moisture)
- ⚖️ **NORMAL** - Your skin is balanced (just right!)
- 🛢️ **OILY** - Your skin is shiny/slick (too much oil)

**Why this matters:** Different skin types need different advice!

### 1.2 How the Model "Learns"

Think of training a model like **teaching a child to recognize animals**:

**Step 1:** Show the child 1000s of dog photos
```
🐕 → Child's brain learns "This is a dog"
🐕 → This pattern... and this one...
🐕 → And this one... all dogs!
```

**Step 2:** Test the child
```
New photo → "Is this a dog?" 
Child says: "Yes! 95% sure" ✓
```

**For our vision models:**
- **Trained on:** Thousands of dermatology images
- **Learned:** How to spot disease patterns, colors, textures
- **Stored in:** A file called `diagnosis_model_optimized.pth` (100MB)

### 1.3 Image Quality Check (Before the Model)

**Important:** Before we even run the big model, we check:

```
1. Is the image BLURRY? 
   → If yes: ❌ REJECT (Model won't work on blurry photos)
   → How: Calculate how "sharp" the image is

2. Is there SKIN in the photo?
   → If no: ❌ REJECT (We need to see skin!)
   → How: Check for skin colors (brown/pink tones)

3. Is the file size OK?
   → If bigger than 10MB: ❌ REJECT
   → How: Check file size in bytes
```

**Example:**
```
User uploads: photo.jpg
↓
Check 1: Blur score = 85 (needs > 100) ❌ TOO BLURRY
Result: "Please take a clearer photo"
```

---

## Part 2: NLP - The Listening Ears

### What is NLP?

**NLP = Natural Language Processing**

It means: **Teaching a computer to understand human language**

> Think of it like teaching a translator who learns to understand what you're saying and pulling out the important information.

### 2.1 What We Extract from Your Text

When you write: **"Red itchy bumps on my forehead for 3 weeks, very painful"**

Our NLP system extracts:

```
Input: "Red itchy bumps on my forehead for 3 weeks, very painful"

Output (Smart Extraction):
├─ Symptoms Found: [itching, redness, bumps, pain]
├─ Body Part: forehead
├─ Duration: 3 weeks
├─ Severity: SEVERE (because you said "very painful")
└─ Urgency: MODERATE (painful but not emergency-level)
```

### 2.2 How NLP Works - The Pipeline

#### Step 1️⃣: Text Cleaning

```
Raw Text: "Red itchy bumps on my forehead for 3 weeks, very painful!!!!!"
         ↓
Cleaned:  "red itchy bumps on forehead 3 weeks very painful"
         (lowercase, extra punctuation removed)
```

#### Step 2️⃣: Entity Extraction (Medical Understanding)

**What's an "entity"?** A medical concept the computer recognizes.

We use a **smart AI model** trained to find:

| What | Examples |
|------|----------|
| 🩺 **SYMPTOMS** | itching, redness, pain, swelling, pus |
| 🦴 **BODY PARTS** | forehead, cheek, arm, scalp, foot |
| 💊 **TREATMENTS** | cream, medication, antibiotic |
| ⏱️ **DURATIONS** | 3 weeks, 2 months, since yesterday |

**Example:**
```
Text: "My arm is very itchy with red bumps for 2 weeks"

Entity Extraction Result:
- SYMPTOM: "itchy" ← Found!
- SYMPTOM: "red bumps" ← Found!
- BODY_PART: "arm" ← Found!
- DURATION: "2 weeks" ← Found!
```

#### Step 3️⃣: Detecting Negations (NOT X!)

**Important:** We need to ignore things you DON'T have!

```
Text: "I don't have fever, just itching"

Negation Detection:
- "fever" is NEGATED (you said you don't have it)
- "itching" is NOT negated (you have it)

Final Symptoms: [itching] ← fever removed!
```

#### Step 4️⃣: Severity Classification

**Question:** "How serious is this?"

Our system reads your text and scores it:

```
Text: "Red bumps, slightly itchy, small area"
     ↓
Score: LOW → Severity = MILD 😊

Text: "Severe pain, spreading fast, pus oozing"
     ↓
Score: HIGH → Severity = SEVERE 🚨
```

**How it works:**
- Count "strong" words: "severe", "unbearable", "extremely" = +3 points each
- Count "medium" words: "painful", "swollen", "spreading" = +1 point each
- Count "weak" words: "mild", "slight", "small" = -1 point each
- If score ≥ 3 → SEVERE
- If score 1-2 → MODERATE
- If score ≤ 0 → MILD

#### Step 5️⃣: Urgency Classification

**Question:** "Does this need immediate medical attention?"

```
Check Red Flags:
├─ Breathing difficulty?          ← YES = URGENT 🚨
├─ Fever + skin issue?            ← YES = URGENT 🚨
├─ Bleeding spot?                 ← YES = URGENT 🚨
├─ Rapidly spreading?             ← YES = URGENT 🚨
├─ Face/Lip swelling?             ← YES = URGENT 🚨
└─ Pus/Infection signs?           ← YES = URGENT 🚨

Result:
If any red flag found → Urgency = HIGH
Else if severity = moderate → Urgency = MODERATE
Else → Urgency = LOW
```

#### Step 6️⃣: Duration Parsing

**Question:** "How long has this been happening?"

Our system uses pattern matching:

```
Text: "This has been happening for 2 weeks and 3 days"
     ↓
Regex Pattern: \d+ (day|week|month|year)
     ↓
Found: "2 weeks"
     ↓
Extracted Duration: "2 weeks" ✓
```

---

## Part 3: RAG - The Brain with Knowledge

### What is RAG?

**RAG = Retrieval-Augmented Generation**

Sounds complicated? Here's the simple version:

> **RAG is like having a library assistant who reads your question, runs to the library, grabs the most relevant medical books, and gives you the best answers from those books.**

### 3.1 Why Do We Need RAG?

Imagine you're a doctor. You know general things, but when you see a specific disease, you need to:

1. **Remember facts** about that disease
2. **Recall treatment options** that work
3. **Remember warning signs** that need urgent care

Our RAG system does exactly this! It:

```
Input: Predicted Disease = "Acne"
       Symptoms = [pimples, redness, oil]
       
Output: 
- Definition of Acne
- Common signs to look for
- Safe treatments
- When to see a doctor
- What to avoid
```

### 3.2 The Knowledge Base

We have a **database of knowledge** about 22+ skin diseases:

**File:** `condition_knowledge.json`

**Each disease has:**

```json
{
  "condition_name": "Acne",
  "brief_overview": "Acne is an inflammatory skin condition...",
  "common_signs": ["pimples", "blackheads", "redness", "oil"],
  "common_triggers": ["excess oil", "bacteria", "hormones"],
  "general_care": [
    "Use gentle cleanser",
    "Don't pick at pimples",
    "Apply sunscreen"
  ],
  "otc_products": [
    "Salicylic acid cleanser",
    "Benzoyl peroxide spot treatment"
  ],
  "when_to_see_doctor": "If severe, cystic, or not improving",
  "red_flags": ["deep cysts", "spreading fast", "severe scarring"]
}
```

### 3.3 How RAG Retrieval Works

Think of it like a **matching game**:

#### The Matching Algorithm

```
Question from User:
- Disease: Acne
- Symptoms: [pimples, redness, oil]
- Red Flags: []
- Risk Level: Moderate

Knowledge Base:
[Acne entry, Eczema entry, Rosacea entry, ... 22 entries total]

SCORING ALGORITHM:
For each entry in knowledge base:

1. Does disease NAME match? 
   → Acne vs Acne = YES! (+100 points)

2. Do symptoms MATCH common signs?
   → "pimples" in common_signs = YES! (+8 points)
   → "redness" in common_signs = YES! (+8 points)
   → "oil" close to "oiliness" = YES! (+4 points)

3. Do any RED FLAGS match?
   → None in user input = 0 points

FINAL SCORES:
- Acne: 100 + 8 + 8 + 4 = 120 points ✓✓✓ WINNER
- Eczema: 0 + 4 + 2 + 0 = 6 points
- Rosacea: 0 + 2 + 1 + 0 = 3 points

RESULT: Top 1 match = Acne information
```

### 3.4 Optional: Semantic Search with Embeddings

**Advanced Level:** We can also use AI embeddings (optional):

Think of embeddings like **turning words into numbers a computer loves**:

```
Word: "Acne"  →  [0.23, -0.15, 0.87, -0.42, ...] (384 numbers)
Word: "Pimple" → [0.24, -0.14, 0.86, -0.41, ...] (similar!)

Similarity Score: 99% match ✓
```

**Why this helps:**
- Finds matches even if exact words don't match
- "Pimples" matches "acne" even though different words
- Uses AI trained on medical texts

### 3.5 What RAG Returns

After finding the best match:

```
Input Request:
- Predicted Disease: Acne
- Symptoms: [pimples, redness]
- Risk Level: Moderate

RAG Output:
{
  "condition_name": "Acne",
  "explanation": "Acne is a common inflammatory...",
  "care_guidance": [
    "Use gentle cleanser twice daily",
    "Apply sunscreen (SPF 30+)",
    "Avoid picking or squeezing"
  ],
  "safe_products": [
    "Salicylic acid cleanser",
    "Lightweight moisturizer",
    "Sunscreen SPF 50"
  ],
  "when_to_see_doctor": "If severe, painful, or not improving",
  "confidence_score": 0.95
}
```

### 3.6 Safety Filters in RAG

**Important:** We don't recommend products blindly!

```
For HIGH RISK cases:
├─ Check: Does user have allergies?
│         → Remove conflicting products
│
├─ Check: Are there red flags?
│         → Avoid strong medicines
│         → Only suggest gentle care
│
└─ Check: Is disease dangerous?
          → Add urgent doctor warning

Result: Safe, personalized recommendations
```

---

## Part 4: How They Work Together

### 4.1 The Complete Journey

```
USER INTERACTION:
┌─────────────────────────────────────┐
│ 1. Take photo of skin               │
│ 2. Type symptoms & history          │
│ 3. Click "Analyze"                  │
└─────────────────────────────────────┘
           ↓
┌──────────────────────────────────────┐
│ STEP 1: IMAGE VALIDATION             │
├──────────────────────────────────────┤
│ Check: Blurry? Skin visible? Size OK?│
│ Vision Models: Ready to analyze ✓    │
└──────────────────────────────────────┘
           ↓
┌──────────────────────────────────────┐
│ STEP 2: VISION MODELS ANALYSIS       │
├──────────────────────────────────────┤
│ Disease Model: "Acne (87% confidence)"│
│ Skin Type: "Oily (92% confidence)"    │
└──────────────────────────────────────┘
           ↓
┌──────────────────────────────────────┐
│ STEP 3: NLP PROCESSING               │
├──────────────────────────────────────┤
│ Extract: [pimples, red, itching]    │
│ Severity: MODERATE                   │
│ Urgency: MODERATE                    │
│ Duration: 3 weeks                    │
│ Red Flags: None detected             │
└──────────────────────────────────────┘
           ↓
┌──────────────────────────────────────┐
│ STEP 4: RISK ASSESSMENT              │
├──────────────────────────────────────┤
│ Disease Risk: Moderate               │
│ Red Flag Count: 0                    │
│ Final Risk Level: MODERATE           │
└──────────────────────────────────────┘
           ↓
┌──────────────────────────────────────┐
│ STEP 5: RAG RETRIEVAL                │
├──────────────────────────────────────┤
│ Query: Acne + moderate risk          │
│ Match: Acne from knowledge base (95%)│
│ Get: Care guidance, products, when   │
│      to see doctor, red flag warnings│
└──────────────────────────────────────┘
           ↓
┌──────────────────────────────────────┐
│ STEP 6: GENERATE RECOMMENDATIONS     │
├──────────────────────────────────────┤
│ Filter products by:                  │
│ • User allergies? None               │
│ • Risk level safe? Yes               │
│ • Red flags conflicting? No          │
│                                      │
│ Final Products: [Cleanser, Sunscreen]│
└──────────────────────────────────────┘
           ↓
┌──────────────────────────────────────┐
│ STEP 7: BUILD FINAL REPORT           │
├──────────────────────────────────────┤
│ Summary: "Acne detected with..."     │
│ Confidence: 87%                      │
│ Care Steps: [Step 1, Step 2...]      │
│ Warnings: "See doctor if worsens"    │
│ Products: [Safe recommendations]     │
└──────────────────────────────────────┘
           ↓
┌──────────────────────────────────────┐
│ USER GETS RESULT                     │
├──────────────────────────────────────┤
│ ✓ Diagnosis with confidence score    │
│ ✓ Personalized care guidance         │
│ ✓ Safe product recommendations       │
│ ✓ When to see a doctor               │
│ ✓ PDF report they can save/print     │
└──────────────────────────────────────┘
```

### 4.2 Real-World Example

Let's trace a **real patient scenario**:

#### Scenario: User uploads photo with symptoms

```
USER INPUT:
├─ Photo: Forehead with red bumpy rash
├─ Symptoms: "Red bumps, very itchy, burning sensation"
├─ History: "Have acne-prone skin"
└─ Duration: "Past week, getting worse"
```

#### System Processing:

**Step 1: Vision Models**
```
Disease Model Output:
  ├─ Acne: 45% confidence
  ├─ Rosacea: 35% confidence
  └─ Eczema: 20% confidence
  
  Highest score → ACNE (45%)
  
Skin Type Model Output:
  ├─ Oily: 88% confidence ✓
  └─ Normal: 12% confidence
```

**Step 2: NLP Pipeline**
```
Input Text: "Red bumps, very itchy, burning sensation"

Entity Extraction:
  ├─ SYMPTOM: "red bumps" ✓
  ├─ SYMPTOM: "itchy" ✓
  └─ SYMPTOM: "burning" ✓

Severity Analysis:
  ├─ Found words: "very", "itchy", "burning"
  ├─ Score: 2 points → MODERATE
  └─ Severity: MODERATE ✓

Urgency Analysis:
  ├─ Red flag check: None found
  ├─ Severity: Moderate
  └─ Urgency: MODERATE ✓

Duration: "Past week" → "1 week"
```

**Step 3: Red Flag Detection**
```
Check for urgent patterns:
├─ "Rapidly spreading"? NO
├─ "Fever"? NO
├─ "Pus"? NO
├─ "Difficulty breathing"? NO
└─ Result: NO RED FLAGS ✓
```

**Step 4: Risk Assessment**
```
Base Score: 0
+ Disease "Acne" is moderate-risk: +25
+ Severity is moderate: +10
+ No red flags: +0
= TOTAL SCORE: 35 → RISK LEVEL: MODERATE ✓
```

**Step 5: RAG Retrieval**
```
Query:
  ├─ Disease: Acne
  ├─ Symptoms: [red bumps, itchy, burning]
  ├─ Risk: Moderate
  └─ Red Flags: None

Matching Score (Acne entry):
  ├─ Name match: +100
  ├─ "red bumps" in common_signs: +8
  ├─ "itchy" in common_signs: +8
  ├─ "burning" matches "burning": +8
  = SCORE: 124 ✓✓✓

Retrieved Knowledge:
  ├─ Definition: "Acne is an inflammatory condition..."
  ├─ Care: ["Gentle cleanser", "Avoid picking", "Use sunscreen"]
  ├─ Products: ["Salicylic acid cleanser", "Moisturizer"]
  └─ Warning: "See doctor if severe or not improving"
```

**Step 6: Recommendations**
```
Available Products: [20 products in database]

Filter by condition "Acne":
  → [10 acne-specific products]

Filter by user allergies: None known
  → [10 products still valid]

Filter by risk level (Moderate - safe):
  → [10 products still valid]

Filter by red flags: None
  → [10 products still valid]

Rank by relevance and safety:
  → Top results: [Gentle Cleanser, Sunscreen, Toner]

Final Recommendation: Show top 5-8 products ✓
```

**Step 7: Final Report**
```
DIAGNOSIS REPORT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Predicted Condition: ACNE
Confidence: 45% (Moderate confidence)
Severity: MODERATE
Urgency: MODERATE
Risk Level: MODERATE

CARE GUIDANCE:
✓ Use gentle, non-comedogenic cleanser
✓ Apply lightweight, non-oily moisturizer
✓ Use broad-spectrum sunscreen daily
✓ Avoid picking or squeezing lesions
✓ Change pillowcase frequently

SAFE PRODUCTS (Recommended):
1. Gentle Facial Cleanser ($8-15)
2. Salicylic Acid Spot Treatment ($10-20)
3. Lightweight Moisturizer ($12-18)
4. Sunscreen SPF 30+ ($15-25)

WHEN TO SEE A DOCTOR:
⚠️ Within 2 weeks if not improving
⚠️ Immediately if: spreading rapidly, severe pain, 
   signs of infection (pus, drainage)

IMPORTANT REMINDER:
This is AI-assisted educational support only.
Not a medical diagnosis. Consult a dermatologist for confirmed diagnosis.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Key Takeaways 🎯

### The 3 Systems in Simple Words:

| System | What It Does | Like A... |
|--------|------------|-----------|
| **Vision Models** | Looks at your photo and recognizes the disease | Doctor's trained eyes |
| **NLP** | Reads your description and extracts important info | Smart listener/translator |
| **RAG** | Looks up disease knowledge and gives personalized advice | Medical reference book with smart search |

### How They Connect:

```
Photo & Symptoms
       ↓
   Vision Models (Recognizes disease from photo)
       ↓
   NLP (Understands your description)
       ↓
   Risk Assessment (How urgent is this?)
       ↓
   RAG System (Looks up knowledge about disease)
       ↓
   Smart Filtering (Removes unsafe recommendations)
       ↓
   Final Report (Your diagnosis + care plan)
```

### Why This Design Is Smart:

✅ **Fast:** Each system does one job well
✅ **Accurate:** Multiple systems check each other
✅ **Safe:** Filters prevent bad recommendations
✅ **Understandable:** No black-box magic LLMs
✅ **Trustworthy:** Deterministic logic (same input = same output)

---

## Glossary - Word Definitions 📖

| Term | Simple Definition |
|------|------------------|
| **Model** | A trained AI brain that learned patterns |
| **Confidence** | How sure the model is (0-100%) |
| **Entity** | A meaningful piece of information (like a symptom) |
| **NLP** | Teaching computers to understand human language |
| **RAG** | Smart search system with a knowledge base |
| **Red Flag** | A warning sign that means urgent care needed |
| **Embedding** | Converting words into numbers for comparison |
| **Deterministic** | Same input always gives same output (no randomness) |
| **Threshold** | A cutoff point (like "above 100 = pass") |

---

## Quick Reference: System Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    USER UPLOADS                         │
│              (Photo + Symptoms + History)               │
└────────────────────────┬────────────────────────────────┘
                         ↓
    ┌────────────────────────────────────────┐
    │  IMAGE VALIDATION & QUALITY CHECK      │
    │  (Blur? Skin visible? Size OK?)        │
    └────────┬──────────────────────────────┘
             ↓
    ┌────────────────────────────────────────┐
    │  VISION MODELS                         │
    │  • Disease Model (22 options)          │
    │  • Skin Type Model (3 options)         │
    │  Output: Predicted disease + confidence│
    └────────┬──────────────────────────────┘
             ↓
    ┌────────────────────────────────────────┐
    │  NLP PIPELINE                          │
    │  • Extract symptoms                    │
    │  • Classify severity                   │
    │  • Classify urgency                    │
    │  • Parse duration                      │
    │  • Detect red flags                    │
    └────────┬──────────────────────────────┘
             ↓
    ┌────────────────────────────────────────┐
    │  RISK ASSESSMENT                       │
    │  Combine: Disease + Symptoms + Flags   │
    │  Output: Risk Level (LOW/MED/HIGH)     │
    └────────┬──────────────────────────────┘
             ↓
    ┌────────────────────────────────────────┐
    │  RAG RETRIEVAL                         │
    │  • Query knowledge base                │
    │  • Score each disease                  │
    │  • Get top matches                     │
    │  • Extract guidance + warnings         │
    └────────┬──────────────────────────────┘
             ↓
    ┌────────────────────────────────────────┐
    │  SMART FILTERING                       │
    │  • Check user allergies                │
    │  • Filter by risk level                │
    │  • Remove unsafe products              │
    │  • Rank recommendations                │
    └────────┬──────────────────────────────┘
             ↓
    ┌────────────────────────────────────────┐
    │  GENERATE FINAL REPORT                 │
    │  • Summary of findings                 │
    │  • Care guidance                       │
    │  • Recommended products                │
    │  • When to see doctor                  │
    │  • PDF for user to save                │
    └────────┬──────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────────────┐
│                   USER GETS RESULT                      │
│        (Diagnosis + Confidence + Advice + Products)     │
└─────────────────────────────────────────────────────────┘
```

---

## Practice Question 🤔

**Scenario:** A user uploads a photo of their arm with a scaly rash and writes: "Itchy, dry, flaky for 2 weeks. I have eczema."

**What would happen?**

Try to trace through the system steps before looking at the answer below...

<details>
<summary>Click to see the answer</summary>

1. **Vision Models:** Recognize the pattern as "Eczema" (high confidence)
2. **NLP:** Extracts [itchy, dry, flaky], Duration: "2 weeks", Severity: MODERATE
3. **Red Flags:** None detected (not spreading rapidly, no fever)
4. **Risk Level:** MODERATE (Eczema is moderate-risk, no red flags)
5. **RAG:** Retrieves Eczema knowledge
   - Care: "Use moisturizer, avoid harsh soaps, reduce stress"
   - Products: "Fragrance-free lotion, gentle cleanser"
   - Warning: "See doctor if infected (pus, crusting)"
6. **Recommendations:** Suggest moisturizing products + gentle cleanser
7. **Report:** Eczema diagnosis with eczema-specific care plan

✅ Result: User gets personalized eczema guidance!

</details>

---

## File-to-File Implementation Trace

The earlier sections explain the ideas. This section follows the real backend files so you can see exactly where information enters, changes shape, and leaves the system.

### RAG: knowledge file to database

RAG has a preparation path and a request path. The preparation path builds the searchable index:

```text
backend/app/rag_knowledge/condition_knowledge.json
backend/app/rag_knowledge/safe_otc_products.json
                         |
                         v
backend/app/services/rag_ingestion_service.py
  _knowledge_paths() finds both JSON files
  _row_to_text() turns each record into searchable text
                         |
                         v
backend/app/services/rag_chunking_service.py
  chunk_text() normalizes text and splits long records
  chunks are 900 characters with 120-character overlap
                         |
                         v
backend/app/services/rag_embedding_service.py
  embed_text() creates a vector for each chunk
  SentenceTransformer is used when configured;
  a deterministic SHA-256 vector is the fallback
                         |
                         v
backend/app/models/rag_document.py
  RAGDocument rows store source, title, chunk, metadata,
  and embedding values in PostgreSQL
```

`reindex_rag_documents(db)` performs this whole preparation path. It clears old rows, reads both JSON lists, ignores invalid records, creates chunks and embeddings, then commits the new rows. This is the **write-time** side of RAG.

### RAG: diagnosis request to retrieved context

At request time, the path begins after the image and text have already been analyzed:

```text
backend/app/routers/diagnosis_router.py
  run_image_diagnosis()
  analyze_symptom_text()
  calculate_risk_level()
  generate_doctor_warning()
           |
           v
backend/app/services/rag_service.py
  generate_structured_rag_assessment()
           |
           +--> rag_loader_service.py
           |    load_condition_knowledge()
           |    validates and caches condition_knowledge.json
           |
           +--> retrieve_relevant_entries()
           |    calculate_entry_score() for every condition
           |    sorts results and keeps the top 3
           |
           +--> builds explanation, care guidance,
           |    warnings, avoidance, and source fields
           |
           +--> optional database branch when db is available
                rag_retrieval_service.py
                  embed query and compare with RAGDocument vectors
                         |
                         v
                rag_rerank_service.py
                  sort by retrieval score and keep top 5
                         |
                         v
                retrieval_trace and retrieval_confidence
```

The structured score in `rag_service.py` rewards an exact model-class match with `+100`, an exact condition name with `+80`, an alias with `+60`, matching signs with `+8` or `+4`, trigger matches with `+2`, red-flag overlap with `+6`, and selected high-risk categories with `+3`. If the predicted model class exists in the JSON, that primary entry is placed first and supplies the main explanation.

The RAG result is a dictionary containing fields such as `condition_explanation`, `symptom_context`, `general_care_guidance`, `otc_support_guidance`, `what_to_avoid`, `safety_precautions`, `when_to_seek_doctor`, `knowledge_sources`, `retrieval_trace`, and `retrieval_confidence`. RAG does not inspect the image itself and does not create the disease prediction; it explains and contextualizes the prediction.

### NLP: user text to structured evidence

NLP follows this call chain:

```text
User symptoms + medical history
              |
              v
backend/app/routers/diagnosis_router.py
              |
              v
backend/app/services/nlp_service.py
  analyze_symptom_text()
  tries the modern pipeline first
              |
              v
backend/app/services/nlp_pipeline.py
  run_nlp_pipeline() merges the two text fields
              |
     +--------+----------+-------------+----------------+
     v                   v             v                v
nlp_entities_service  nlp_negation  nlp_normalization  nlp_classification
      .py               _service.py    _service.py       _service.py
     |                   |             |                |
     |                   |             |                +--> severity/urgency
     |                   |             +-------------------> canonical symptoms
     |                   +----------------------------------> removed negations
     +------------------------------------------------------> medical entities
              |
              v
nlp_pipeline.py returns one structured dictionary
              |
              v
diagnosis_router.py uses it for risk and passes symptoms to RAG
```

The individual files have these jobs:

1. `diagnosis_router.py` validates symptom text, duration, severity, and medical history, then calls `analyze_symptom_text()`.
2. `nlp_service.py` is the public entry point. If the modern pipeline fails, its legacy keyword-based fallback keeps the endpoint usable.
3. `nlp_pipeline.py` merges symptoms and medical history into one string.
4. `nlp_entities_service.py` tries Hugging Face token classification when `NLP_ENTITY_MODEL` is configured. Otherwise, or if loading fails, `_fallback_entities()` uses regular expressions for symptoms, body parts, medications, and allergies.
5. `nlp_negation_service.py` detects local patterns such as `no pain`, `not itchy`, and `without swelling`, so negated terms are excluded from the final symptom list.
6. `nlp_normalization_service.py` converts variants such as `itch`, `itchy`, and `itching` into stable canonical values and removes duplicates.
7. `nlp_classification_service.py` classifies severity and urgency. Severe terms include breathing difficulty, bleeding, high fever, and rapidly spreading symptoms. Urgency becomes high for red flags, high risk, or urgent phrases.
8. `nlp_pipeline.py` extracts duration such as `2 weeks` and creates follow-up questions when duration or body location is missing.

### NLP example across the files

For this input:

```text
"No fever. Itchy red bumps on my arm for 2 weeks."
```

the data moves like this:

```text
diagnosis_router.py
  receives the sentence
        |
nlp_service.py -> nlp_pipeline.py
  merges input and starts processing
        |
nlp_entities_service.py
  finds fever, itchy, red, bumps, and arm
        |
nlp_negation_service.py
  marks fever as negated because of "No fever"
        |
nlp_normalization_service.py
  produces stable symptom values such as itching and redness
        |
nlp_classification_service.py
  calculates severity and urgency from the remaining evidence
        |
nlp_pipeline.py
  extracts duration = "2 weeks"
        |
diagnosis_router.py
  uses symptoms/severity for risk and sends symptoms to rag_service.py
```

The final NLP dictionary contains `extracted_symptoms`, `clinical_entities`, `negated_entities`, `extracted_duration`, `inferred_severity`, confidence and rationale fields, urgency fields, and `followup_candidates`. The consultation stores this structured result, while RAG uses the extracted symptoms and red flags to choose safer, more relevant knowledge.

---

## Conclusion

Our system works like a **team of experts**:

- 👀 **Vision Models** = The observant doctor (sees the disease)
- 👂 **NLP** = The careful listener (understands the problem)
- 🧠 **RAG** = The knowledgeable advisor (has the answers)

Together, they provide **fast, safe, and personalized skin analysis** to help you make better health decisions.

---

**Remember:** This system is a **teacher, not a doctor**. Always consult a real medical professional for definitive diagnosis and treatment! 👨‍⚕️👩‍⚕️

---

## For More Information

Would you like to understand:
- How the database stores this information?
- How the frontend displays results?
- How the PDF report is created?
- How users get recommended to dermatologists?

Ask your instructor (or open another documentation file)! 📚
