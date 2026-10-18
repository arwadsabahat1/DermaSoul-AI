/**
 * Condition knowledge mirror for the frontend.
 *
 * Mirrors a slim, presentation-friendly subset of the backend file
 * `backend/app/rag_knowledge/condition_knowledge.json`. The backend remains
 * the source of truth; this file lets the library list and fallback views
 * render rich, condition-specific content without N HTTP round-trips.
 *
 * Keep this file in sync when the backend knowledge JSON gains/changes
 * a condition entry.
 */

export interface ConditionKnowledgeFE {
  condition_name: string;
  model_class: string;
  category: string;
  brief_overview: string;
  common_signs: string[];
  common_triggers_or_causes: string[];
  general_care_guidance: string[];
  otc_support_guidance: string[];
  what_to_avoid: string[];
  red_flags: string[];
  when_to_seek_doctor: string;
  professional_note: string;
  source_urls: string[];
}

export const CONDITION_KNOWLEDGE_FE: ConditionKnowledgeFE[] = [
  {
    condition_name: "Acne",
    model_class: "Acne",
    category: "inflammatory",
    brief_overview:
      "Acne is a common inflammatory skin condition involving clogged pores, excess oil, bacteria, and inflammation. It can appear as blackheads, whiteheads, pimples, nodules, or cyst-like lesions.",
    common_signs: ["pimples", "blackheads", "whiteheads", "red bumps", "oiliness", "painful bumps", "possible scarring"],
    common_triggers_or_causes: ["excess oil", "clogged pores", "hormonal changes", "comedogenic products", "sweat", "friction", "picking skin"],
    general_care_guidance: [
      "Use a gentle cleanser.",
      "Use a lightweight non-comedogenic moisturizer.",
      "Apply sunscreen during the day.",
      "Avoid squeezing or picking pimples.",
      "Keep skincare simple and consistent.",
    ],
    otc_support_guidance: [
      "OTC acne products may include ingredients such as benzoyl peroxide or salicylic acid, but they should be introduced carefully to avoid irritation.",
      "Moisturizer and sunscreen remain important even for oily or acne-prone skin.",
    ],
    what_to_avoid: ["Avoid harsh scrubs.", "Avoid picking or squeezing lesions.", "Avoid combining many strong actives at once.", "Avoid heavy pore-clogging products."],
    red_flags: ["deep painful cysts", "rapid worsening", "significant scarring", "pus with severe pain", "fever with skin infection signs"],
    when_to_seek_doctor:
      "Consult a dermatologist if acne is severe, painful, cystic, causing scars, emotionally distressing, or not improving with basic care.",
    professional_note:
      "AI prediction cannot determine acne subtype or prescribe treatment. Medical evaluation is needed for moderate to severe or scarring acne.",
    source_urls: ["https://www.aad.org/public/diseases/acne", "https://dermnetnz.org/topics/acne"],
  },
  {
    condition_name: "Actinic Keratosis",
    model_class: "Actinic Keratosis",
    category: "sun_damage_precancerous",
    brief_overview:
      "Actinic keratosis is a rough or scaly sun-damaged skin lesion that can appear on areas exposed to ultraviolet light. It is considered precancerous and should be assessed by a clinician.",
    common_signs: ["rough patch", "scaly patch", "sun-exposed area", "pink or red area", "crusty lesion", "tender spot"],
    common_triggers_or_causes: ["long-term sun exposure", "ultraviolet radiation", "older age", "fair skin", "outdoor work"],
    general_care_guidance: [
      "Use broad-spectrum sunscreen.",
      "Wear sun-protective clothing.",
      "Avoid tanning beds.",
      "Monitor sun-exposed areas for changes.",
    ],
    otc_support_guidance: ["OTC products cannot confirm or treat actinic keratosis. Sun protection can support prevention of further damage."],
    what_to_avoid: ["Avoid ignoring rough or changing sun-damaged spots.", "Avoid self-treating suspicious lesions without medical advice.", "Avoid tanning beds."],
    red_flags: ["rapid growth", "bleeding", "pain", "ulceration", "thick crust", "non-healing lesion"],
    when_to_seek_doctor:
      "A dermatologist or qualified doctor should examine suspected actinic keratosis because some lesions can progress to skin cancer.",
    professional_note: "This condition requires professional evaluation. AI support should not delay clinical assessment.",
    source_urls: ["https://www.aad.org/public/diseases/a-z/actinic-keratosis-overview", "https://dermnetnz.org/topics/actinic-keratosis"],
  },
  {
    condition_name: "Benign Tumors",
    model_class: "Benign Tumors",
    category: "growth",
    brief_overview:
      "Benign skin tumors are non-cancerous growths. They may vary in appearance and can include different types of harmless skin lesions, but visual similarity with serious lesions means uncertain or changing growths should be checked.",
    common_signs: ["skin growth", "raised bump", "stable lesion", "smooth or rough surface", "slow change"],
    common_triggers_or_causes: ["genetic tendency", "aging", "sun exposure", "skin friction", "unknown causes"],
    general_care_guidance: ["Monitor size, color, shape, and symptoms.", "Protect skin from sun exposure.", "Avoid scratching or traumatizing lesions."],
    otc_support_guidance: ["OTC products usually do not remove or diagnose skin tumors safely. Professional evaluation is preferred for uncertain growths."],
    what_to_avoid: ["Avoid cutting, burning, or removing growths at home.", "Avoid ignoring changes in size, color, bleeding, or pain."],
    red_flags: ["rapid growth", "bleeding", "color change", "irregular shape", "pain", "non-healing lesion"],
    when_to_seek_doctor:
      "Consult a dermatologist if a growth is new, changing, bleeding, painful, irregular, or cosmetically/functionally concerning.",
    professional_note: "AI cannot reliably distinguish all benign and malignant growths. Clinical examination may be required.",
    source_urls: ["https://dermnetnz.org/topics", "https://www.aad.org/public/diseases/a-z"],
  },
  {
    condition_name: "Bullous",
    model_class: "Bullous",
    category: "blistering",
    brief_overview:
      "Bullous conditions involve blisters or fluid-filled lesions. Some blistering disorders can be serious, especially when widespread, painful, involving mucous membranes, or associated with medication reactions.",
    common_signs: ["blisters", "fluid-filled bumps", "skin peeling", "pain", "raw skin", "mouth sores"],
    common_triggers_or_causes: ["autoimmune blistering disorders", "drug reactions", "burns", "infection", "friction", "allergic reactions"],
    general_care_guidance: [
      "Protect blistered areas.",
      "Keep the area clean.",
      "Avoid popping blisters unnecessarily.",
      "Seek medical assessment for widespread or painful blistering.",
    ],
    otc_support_guidance: ["Basic wound protection may help minor friction blisters, but unexplained or widespread blistering needs medical evaluation."],
    what_to_avoid: ["Avoid popping widespread blisters.", "Avoid applying irritating products.", "Avoid delaying care if blisters are painful, spreading, or involve mouth/eyes/genitals."],
    red_flags: ["widespread blisters", "skin peeling", "fever", "mouth or eye involvement", "severe pain", "recent new medication"],
    when_to_seek_doctor:
      "Seek urgent medical advice if blistering is widespread, painful, associated with fever, involves mucous membranes, or follows a new medication.",
    professional_note: "Bullous diseases may require urgent professional diagnosis and treatment. AI should be treated as triage support only.",
    source_urls: ["https://dermnetnz.org/topics/blistering-skin-conditions", "https://www.aad.org/public/diseases/a-z"],
  },
  {
    condition_name: "Candidiasis",
    model_class: "Candidiasis",
    category: "fungal",
    brief_overview:
      "Candidiasis is a yeast-related fungal infection that can affect moist skin folds and other areas. It may cause redness, irritation, itching, and sometimes satellite lesions.",
    common_signs: ["red rash", "itching", "moist irritation", "skin fold rash", "burning", "satellite spots"],
    common_triggers_or_causes: ["moisture", "sweating", "skin folds", "diabetes", "weakened immunity", "antibiotic use"],
    general_care_guidance: [
      "Keep affected areas clean and dry.",
      "Wear breathable clothing.",
      "Reduce friction and moisture.",
      "Seek medical advice if recurrent or severe.",
    ],
    otc_support_guidance: ["Some superficial fungal infections may improve with OTC antifungal products, but diagnosis should be confirmed if symptoms are severe, recurrent, or uncertain."],
    what_to_avoid: ["Avoid keeping the area wet.", "Avoid tight non-breathable clothing.", "Avoid steroid creams unless advised by a clinician."],
    red_flags: ["spreading infection", "pain", "pus", "fever", "diabetes with worsening rash", "recurrent infection"],
    when_to_seek_doctor:
      "Consult a doctor if symptoms are severe, recurrent, spreading, painful, or if the person has diabetes or immune compromise.",
    professional_note: "Fungal and inflammatory rashes can look similar. Incorrect steroid use may worsen fungal infections.",
    source_urls: ["https://dermnetnz.org/topics/candida", "https://www.cdc.gov/fungal/"],
  },
  {
    condition_name: "Drug Eruption",
    model_class: "Drug Eruption",
    category: "reaction",
    brief_overview:
      "Drug eruptions are skin reactions related to medications. They can range from mild rashes to severe reactions requiring urgent medical care.",
    common_signs: ["rash after medication", "red spots", "itching", "swelling", "blisters", "skin peeling"],
    common_triggers_or_causes: ["new medication", "antibiotics", "pain medicines", "anticonvulsants", "allergic reaction", "immune reaction"],
    general_care_guidance: [
      "Review recent medications with a doctor.",
      "Do not stop essential prescribed medicines without medical guidance unless severe allergic symptoms occur.",
      "Seek urgent help for serious symptoms.",
    ],
    otc_support_guidance: ["OTC support is not enough for suspected serious medication reactions. Medical advice is important."],
    what_to_avoid: ["Avoid re-taking a suspected medicine without medical advice.", "Avoid ignoring rash with fever, swelling, blisters, or peeling skin."],
    red_flags: ["difficulty breathing", "face swelling", "lip swelling", "mouth sores", "eye involvement", "skin peeling", "blisters", "fever"],
    when_to_seek_doctor:
      "Seek urgent medical care for rash with breathing difficulty, facial/lip swelling, fever, blisters, skin peeling, mouth sores, or eye involvement.",
    professional_note: "Drug eruptions can be serious. AI cannot determine medication safety or allergy status.",
    source_urls: ["https://dermnetnz.org/topics/drug-eruptions", "https://www.nhs.uk/conditions/allergies/"],
  },
  {
    condition_name: "Eczema",
    model_class: "Eczema",
    category: "inflammatory",
    brief_overview:
      "Eczema refers to inflammatory skin conditions commonly associated with itching, dryness, redness, irritation, and sometimes cracking or scaling.",
    common_signs: ["itching", "redness", "dryness", "flaking", "scaling", "cracking", "rash"],
    common_triggers_or_causes: ["dry skin", "fragrance", "harsh soaps", "allergens", "dust", "weather changes", "scratching"],
    general_care_guidance: [
      "Use fragrance-free moisturizer regularly.",
      "Use a gentle cleanser.",
      "Avoid hot water.",
      "Avoid harsh soaps.",
      "Try to identify and reduce triggers.",
    ],
    otc_support_guidance: ["Barrier-repair moisturizers and gentle skincare can support dry or irritated skin. Medication decisions should be discussed with a clinician if symptoms are moderate or severe."],
    what_to_avoid: ["Avoid scratching.", "Avoid fragrance-heavy products.", "Avoid harsh scrubs.", "Avoid hot showers.", "Avoid over-exfoliation."],
    red_flags: ["pus", "yellow crusting", "rapid spreading", "fever", "severe pain", "widespread flare"],
    when_to_seek_doctor:
      "Consult a dermatologist if eczema is widespread, painful, infected-looking, not improving, or significantly affecting sleep or daily life.",
    professional_note: "Eczema diagnosis and treatment depend on severity, age, location, and possible infection.",
    source_urls: ["https://www.aad.org/public/diseases/eczema", "https://dermnetnz.org/topics/dermatitis", "https://www.nhs.uk/conditions/atopic-eczema/"],
  },
  {
    condition_name: "Infestations/Bites",
    model_class: "Infestations/Bites",
    category: "infestation_or_bite",
    brief_overview:
      "Infestations and bites can cause itchy bumps, redness, swelling, and sometimes grouped lesions. Some infestations such as scabies require specific diagnosis and treatment.",
    common_signs: ["itching", "red bumps", "swelling", "bite marks", "grouped bumps", "night itching"],
    common_triggers_or_causes: ["insect bites", "mites", "scabies", "bed bugs", "mosquitoes", "skin exposure"],
    general_care_guidance: [
      "Avoid scratching.",
      "Keep the area clean.",
      "Check for patterns such as grouped bites or household spread.",
      "Seek medical advice if infestation is suspected.",
    ],
    otc_support_guidance: ["Basic soothing care may help minor bites, but suspected scabies or infected bites need medical guidance."],
    what_to_avoid: ["Avoid scratching until bleeding.", "Avoid sharing bedding or clothing if infestation is suspected.", "Avoid delaying care if multiple household members are itchy."],
    red_flags: ["pus", "spreading redness", "fever", "severe swelling", "difficulty breathing", "face swelling"],
    when_to_seek_doctor:
      "Seek medical advice if bites become infected, swelling is severe, itching is intense at night, or multiple people in the household are affected.",
    professional_note: "Infestations often need correct identification and sometimes treatment of close contacts or environment.",
    source_urls: ["https://dermnetnz.org/topics/arthropod-bites-and-stings", "https://www.nhs.uk/conditions/insect-bites-and-stings/"],
  },
  {
    condition_name: "Lichen",
    model_class: "Lichen",
    category: "inflammatory",
    brief_overview:
      "Lichen planus is an inflammatory condition that can affect the skin and sometimes the mouth, nails, scalp, or genitals. It may appear as itchy, flat-topped, purplish bumps.",
    common_signs: ["itching", "purple bumps", "flat-topped bumps", "mouth lesions", "scaly patches", "dark marks after healing"],
    common_triggers_or_causes: ["immune reaction", "some medications", "hepatitis association in some cases", "unknown triggers"],
    general_care_guidance: ["Avoid scratching.", "Use gentle skincare.", "Seek medical evaluation for mouth, genital, scalp, or nail involvement."],
    otc_support_guidance: ["OTC skincare may soothe irritation but does not confirm or treat lichen planus. Medical evaluation is recommended."],
    what_to_avoid: ["Avoid scratching.", "Avoid irritating products.", "Avoid ignoring mouth/genital involvement."],
    red_flags: ["mouth sores", "genital lesions", "pain", "widespread rash", "nail changes", "scalp hair loss"],
    when_to_seek_doctor:
      "See a GP or dermatologist if lichen-like symptoms occur, especially if the mouth, genitals, nails, or scalp are involved.",
    professional_note: "Lichen planus can require medical diagnosis and targeted treatment.",
    source_urls: ["https://www.nhs.uk/conditions/lichen-planus/", "https://dermnetnz.org/topics/lichen-planus"],
  },
  {
    condition_name: "Lupus",
    model_class: "Lupus",
    category: "autoimmune",
    brief_overview:
      "Lupus can affect the skin and may cause rashes, photosensitivity, or persistent lesions. Some forms are associated with systemic autoimmune disease.",
    common_signs: ["sun-sensitive rash", "red patches", "scaly lesions", "facial rash", "persistent rash", "discoid plaques"],
    common_triggers_or_causes: ["autoimmune disease", "sun exposure", "photosensitivity", "genetic tendency"],
    general_care_guidance: [
      "Use strict sun protection.",
      "Avoid tanning.",
      "Seek medical evaluation for persistent or photosensitive rashes.",
      "Track systemic symptoms such as joint pain or fatigue.",
    ],
    otc_support_guidance: ["Sunscreen and protective clothing support care, but suspected lupus requires professional evaluation."],
    what_to_avoid: ["Avoid excessive sun exposure.", "Avoid delaying care for systemic symptoms.", "Avoid self-diagnosis."],
    red_flags: ["joint pain", "fever", "fatigue", "mouth ulcers", "photosensitive rash", "worsening widespread rash"],
    when_to_seek_doctor:
      "Consult a doctor if lupus-like rash appears, especially with sun sensitivity, joint pain, fatigue, fever, or mouth ulcers.",
    professional_note: "Lupus may require blood tests, clinical examination, and specialist care.",
    source_urls: ["https://dermnetnz.org/topics/cutaneous-lupus-erythematosus", "https://www.aad.org/public/diseases/a-z/lupus-overview"],
  },
  {
    condition_name: "Moles",
    model_class: "Moles",
    category: "pigmented_lesion",
    brief_overview:
      "Moles are common pigmented skin spots. Many are harmless, but changes in size, shape, color, bleeding, or symptoms can require assessment for skin cancer risk.",
    common_signs: ["brown spot", "pigmented lesion", "stable mole", "round spot", "raised or flat mole"],
    common_triggers_or_causes: ["genetics", "sun exposure", "skin type", "age"],
    general_care_guidance: ["Monitor moles for change.", "Use sun protection.", "Consider regular skin checks if many moles or risk factors are present."],
    otc_support_guidance: ["OTC products should not be used to remove or treat moles at home."],
    what_to_avoid: ["Avoid cutting or removing moles at home.", "Avoid ignoring changes.", "Avoid tanning beds."],
    red_flags: ["asymmetry", "irregular border", "multiple colors", "diameter change", "evolving mole", "bleeding", "itching", "pain"],
    when_to_seek_doctor:
      "See a dermatologist if a mole changes, bleeds, becomes painful, develops irregular borders, or looks different from your other moles.",
    professional_note: "Only professional examination and sometimes biopsy can rule out melanoma or other skin cancers.",
    source_urls: ["https://www.aad.org/public/diseases/a-z/moles-overview", "https://dermnetnz.org/topics/melanocytic-naevus"],
  },
  {
    condition_name: "Psoriasis",
    model_class: "Psoriasis",
    category: "inflammatory",
    brief_overview:
      "Psoriasis is a chronic inflammatory skin condition often causing thick, scaly, red or darker plaques. It may affect elbows, knees, scalp, nails, or other areas.",
    common_signs: ["scaly plaques", "red patches", "thickened skin", "itching", "flaking", "scalp scale", "nail changes"],
    common_triggers_or_causes: ["immune system activity", "genetic tendency", "stress", "infection", "skin injury", "some medications"],
    general_care_guidance: [
      "Moisturize regularly.",
      "Avoid aggressive scrubbing.",
      "Protect irritated skin.",
      "Track triggers.",
      "Seek professional advice for persistent or widespread plaques.",
    ],
    otc_support_guidance: ["Moisturizers and scale-softening products may support comfort, but persistent psoriasis often needs medical guidance."],
    what_to_avoid: ["Avoid picking scales.", "Avoid harsh scrubbing.", "Avoid ignoring joint pain or nail changes."],
    red_flags: ["widespread plaques", "painful cracking", "joint pain", "nail changes", "bleeding", "severe flare"],
    when_to_seek_doctor:
      "Consult a dermatologist if psoriasis is widespread, painful, affecting nails/scalp, associated with joint pain, or not improving.",
    professional_note: "Psoriasis can require prescription treatments and assessment for psoriatic arthritis.",
    source_urls: ["https://www.aad.org/public/diseases/psoriasis", "https://dermnetnz.org/topics/psoriasis"],
  },
  {
    condition_name: "Rosacea",
    model_class: "Rosacea",
    category: "inflammatory",
    brief_overview:
      "Rosacea is a chronic condition often affecting the face with redness, flushing, visible vessels, bumps, burning, or sensitivity.",
    common_signs: ["facial redness", "flushing", "burning", "sensitivity", "visible blood vessels", "bumps", "eye irritation"],
    common_triggers_or_causes: ["sun exposure", "heat", "spicy foods", "alcohol", "stress", "hot drinks", "irritating skincare"],
    general_care_guidance: [
      "Use gentle skincare.",
      "Use sunscreen daily.",
      "Avoid known flushing triggers.",
      "Avoid harsh exfoliants.",
      "Choose products for sensitive skin.",
    ],
    otc_support_guidance: ["Gentle cleanser, moisturizer, and sunscreen can support rosacea-prone skin. Persistent rosacea may need dermatologist care."],
    what_to_avoid: ["Avoid harsh scrubs.", "Avoid irritating actives.", "Avoid known triggers when possible.", "Avoid skipping sunscreen."],
    red_flags: ["eye irritation", "vision symptoms", "painful redness", "rapid worsening", "significant swelling"],
    when_to_seek_doctor:
      "Consult a dermatologist if facial redness persists, worsens, causes eye symptoms, or significantly affects comfort.",
    professional_note: "Rosacea may need prescription therapy and trigger management.",
    source_urls: ["https://www.aad.org/public/diseases/rosacea", "https://dermnetnz.org/topics/rosacea"],
  },
  {
    condition_name: "Seborrheic Keratoses",
    model_class: "Seborrheic Keratoses",
    category: "benign_growth",
    brief_overview:
      "Seborrheic keratoses are common benign skin growths that may look waxy, rough, stuck-on, or wart-like. They are usually harmless but can resemble other lesions.",
    common_signs: ["waxy growth", "stuck-on appearance", "brown or tan growth", "rough surface", "wart-like lesion"],
    common_triggers_or_causes: ["aging", "genetics", "unknown causes"],
    general_care_guidance: ["Monitor for changes.", "Avoid irritation from scratching.", "Seek evaluation if diagnosis is uncertain."],
    otc_support_guidance: ["Do not attempt home removal with harsh chemicals or cutting."],
    what_to_avoid: ["Avoid picking or cutting lesions.", "Avoid ignoring rapid change, bleeding, or pain."],
    red_flags: ["rapid change", "bleeding", "pain", "irregular color", "non-healing lesion"],
    when_to_seek_doctor:
      "Consult a dermatologist if the lesion changes, bleeds, hurts, becomes irritated, or if you are unsure whether it is benign.",
    professional_note: "Clinical examination can help distinguish seborrheic keratosis from skin cancer or other lesions.",
    source_urls: ["https://dermnetnz.org/topics/seborrhoeic-keratosis", "https://www.aad.org/public/diseases/a-z"],
  },
  {
    condition_name: "Skin Cancer",
    model_class: "Skin Cancer",
    category: "cancer_warning",
    brief_overview:
      "Skin cancer can appear as changing moles, non-healing sores, bleeding lesions, pearly bumps, scaly patches, or irregular pigmented spots. Suspicious lesions require medical evaluation.",
    common_signs: ["changing mole", "bleeding lesion", "non-healing sore", "irregular border", "multiple colors", "rapid growth", "persistent crust"],
    common_triggers_or_causes: ["ultraviolet exposure", "sunburn history", "tanning beds", "fair skin", "immune suppression", "family history"],
    general_care_guidance: [
      "Seek professional evaluation for suspicious lesions.",
      "Use sun protection.",
      "Monitor skin changes.",
      "Do not delay assessment for changing or bleeding lesions.",
    ],
    otc_support_guidance: ["OTC products cannot diagnose or treat skin cancer. Suspicious lesions require dermatologist assessment."],
    what_to_avoid: ["Avoid self-removal.", "Avoid delaying care.", "Avoid tanning beds.", "Avoid covering changes without evaluation."],
    red_flags: ["changing mole", "bleeding", "non-healing", "rapid growth", "irregular shape", "multiple colors", "painful lesion"],
    when_to_seek_doctor: "Seek medical evaluation promptly for any changing, bleeding, painful, irregular, or non-healing lesion.",
    professional_note: "Skin cancer diagnosis requires clinical evaluation and sometimes biopsy. AI support should never replace this.",
    source_urls: ["https://www.aad.org/public/diseases/skin-cancer", "https://dermnetnz.org/topics/skin-cancer"],
  },
  {
    condition_name: "Sun/Sunlight Damage",
    model_class: "Sun/Sunlight Damage",
    category: "sun_damage",
    brief_overview:
      "Sun damage results from ultraviolet exposure and can cause pigmentation changes, roughness, wrinkles, actinic keratoses, and increased skin cancer risk.",
    common_signs: ["dark spots", "rough texture", "freckles", "sun spots", "redness", "wrinkles", "scaly sun-exposed patches"],
    common_triggers_or_causes: ["UV exposure", "sunburn", "tanning beds", "outdoor work", "lack of sunscreen"],
    general_care_guidance: [
      "Use broad-spectrum sunscreen.",
      "Wear protective clothing.",
      "Seek shade.",
      "Avoid tanning beds.",
      "Monitor changing spots.",
    ],
    otc_support_guidance: ["Sunscreen and gentle skincare can support prevention. Suspicious sun-damaged lesions need medical evaluation."],
    what_to_avoid: ["Avoid tanning beds.", "Avoid prolonged sun exposure.", "Avoid ignoring rough or changing lesions."],
    red_flags: ["non-healing lesion", "bleeding", "rapid change", "rough persistent patch", "painful sun-damaged spot"],
    when_to_seek_doctor: "Consult a dermatologist for persistent rough patches, changing spots, bleeding lesions, or non-healing sun-damaged areas.",
    professional_note: "Sun damage can overlap with precancerous and cancerous changes, requiring clinical assessment.",
    source_urls: ["https://www.aad.org/public/everyday-care/sun-protection", "https://dermnetnz.org/topics/photodamage"],
  },
  {
    condition_name: "Tinea",
    model_class: "Tinea",
    category: "fungal",
    brief_overview:
      "Tinea, commonly called ringworm, is a fungal infection that can affect skin, feet, groin, scalp, or nails. It may cause itchy, scaly, ring-shaped or spreading patches.",
    common_signs: ["itching", "ring-shaped rash", "scaling", "red patch", "spreading edge", "flaking"],
    common_triggers_or_causes: ["fungal exposure", "sweating", "moist areas", "shared towels", "close contact", "pets", "locker rooms"],
    general_care_guidance: [
      "Keep the area clean and dry.",
      "Avoid sharing towels or clothing.",
      "Wear breathable clothing.",
      "Wash hands after touching affected areas.",
    ],
    otc_support_guidance: ["Some mild forms of ringworm can be treated with OTC antifungal products, but scalp, nail, widespread, persistent, or uncertain cases need medical advice."],
    what_to_avoid: ["Avoid steroid creams unless prescribed.", "Avoid sharing towels.", "Avoid stopping antifungal treatment too early.", "Avoid scratching and spreading infection."],
    red_flags: ["scalp involvement", "nail involvement", "widespread infection", "pus", "pain", "fever", "not improving"],
    when_to_seek_doctor:
      "Consult a doctor if the infection is widespread, involves scalp or nails, affects a child, keeps returning, or does not improve.",
    professional_note: "Fungal infection can resemble eczema or psoriasis. Incorrect steroid use may worsen tinea.",
    source_urls: ["https://www.cdc.gov/ringworm/about/index.html", "https://dermnetnz.org/topics/tinea", "https://www.nhs.uk/conditions/ringworm/"],
  },
  {
    condition_name: "Unknown/Normal",
    model_class: "Unknown/Normal",
    category: "uncertain_or_normal",
    brief_overview:
      "The image may appear normal or the model may not confidently match a supported condition. This does not rule out disease, especially if symptoms are present.",
    common_signs: ["no obvious lesion", "subtle change", "uncertain appearance", "normal-looking skin"],
    common_triggers_or_causes: ["normal variation", "early condition", "poor image quality", "unsupported condition"],
    general_care_guidance: ["Monitor symptoms.", "Use gentle skincare.", "Avoid irritating products.", "Take a clearer image if symptoms persist."],
    otc_support_guidance: ["Basic gentle skincare may support comfort, but persistent symptoms should be assessed."],
    what_to_avoid: ["Avoid assuming there is no problem if symptoms persist.", "Avoid harsh self-treatment without a clear diagnosis."],
    red_flags: ["pain", "fever", "rapid spreading", "bleeding", "changing mole", "pus", "open wound"],
    when_to_seek_doctor:
      "Consult a dermatologist if symptoms persist, worsen, spread, or involve warning signs despite a normal/uncertain AI result.",
    professional_note: "A normal or unknown AI output is not a medical clearance.",
    source_urls: ["https://www.aad.org/public/diseases", "https://dermnetnz.org/topics"],
  },
  {
    condition_name: "Vascular Tumors",
    model_class: "Vascular Tumors",
    category: "vascular_growth",
    brief_overview:
      "Vascular tumors or vascular lesions involve blood vessels and can appear red, purple, blue, or raised. Many are benign, but changing or bleeding vascular lesions should be checked.",
    common_signs: ["red bump", "purple lesion", "blue lesion", "vascular spot", "bleeding tendency", "raised vascular growth"],
    common_triggers_or_causes: ["blood vessel growth", "congenital factors", "aging", "trauma", "unknown causes"],
    general_care_guidance: ["Monitor for changes.", "Avoid trauma to bleeding-prone lesions.", "Seek evaluation for new or changing vascular growths."],
    otc_support_guidance: ["OTC products cannot diagnose or treat vascular tumors safely."],
    what_to_avoid: ["Avoid cutting or removing lesions at home.", "Avoid ignoring bleeding or rapid growth."],
    red_flags: ["bleeding", "rapid growth", "pain", "ulceration", "color change", "new lesion in adult"],
    when_to_seek_doctor: "Consult a dermatologist if a vascular lesion grows quickly, bleeds, hurts, ulcerates, or changes appearance.",
    professional_note: "Vascular lesions require visual examination and sometimes further testing to classify safely.",
    source_urls: ["https://dermnetnz.org/topics/vascular-tumours", "https://www.aad.org/public/diseases/a-z"],
  },
  {
    condition_name: "Vasculitis",
    model_class: "Vasculitis",
    category: "vascular_inflammatory",
    brief_overview:
      "Vasculitis involves inflammation of blood vessels and may appear as purple spots, purpura, ulcers, or painful skin changes. It can sometimes reflect systemic disease.",
    common_signs: ["purple spots", "purpura", "painful rash", "ulcers", "leg rash", "skin tenderness"],
    common_triggers_or_causes: ["immune reaction", "infection", "medications", "autoimmune disease", "systemic inflammation"],
    general_care_guidance: ["Seek medical evaluation.", "Monitor for systemic symptoms.", "Avoid self-treatment without diagnosis."],
    otc_support_guidance: ["OTC skincare is not sufficient for suspected vasculitis. Medical assessment is recommended."],
    what_to_avoid: ["Avoid delaying care.", "Avoid ignoring fever, weakness, joint pain, or ulcers."],
    red_flags: ["fever", "joint pain", "weakness", "ulcers", "widespread purpura", "severe pain", "blood in urine"],
    when_to_seek_doctor:
      "Seek medical care promptly if vasculitis is suspected, especially with fever, joint pain, ulcers, widespread rash, or systemic symptoms.",
    professional_note: "Vasculitis may require laboratory tests and specialist assessment.",
    source_urls: ["https://dermnetnz.org/topics/cutaneous-vasculitis", "https://www.aad.org/public/diseases/a-z"],
  },
  {
    condition_name: "Vitiligo",
    model_class: "Vitiligo",
    category: "pigmentary",
    brief_overview:
      "Vitiligo is a condition where areas of skin lose pigment, leading to white patches. It is not contagious, but diagnosis and management should be discussed with a clinician.",
    common_signs: ["white patches", "depigmentation", "loss of skin color", "symmetrical patches", "patches around hands or face"],
    common_triggers_or_causes: ["autoimmune factors", "genetic tendency", "skin injury", "unknown triggers"],
    general_care_guidance: [
      "Use sunscreen on affected areas.",
      "Avoid sunburn.",
      "Seek medical advice for diagnosis and treatment options.",
      "Monitor spread.",
    ],
    otc_support_guidance: ["Sunscreen is important because depigmented areas can burn easily. Treatment options require professional advice."],
    what_to_avoid: ["Avoid sunburn.", "Avoid harsh bleaching or unverified treatments.", "Avoid assuming all white patches are vitiligo."],
    red_flags: ["rapid spread", "new widespread patches", "associated autoimmune symptoms", "significant distress"],
    when_to_seek_doctor: "Consult a dermatologist for new or spreading white patches or if the condition causes concern or distress.",
    professional_note: "Other conditions can cause light patches, so clinical confirmation is important.",
    source_urls: ["https://www.aad.org/public/diseases/a-z/vitiligo-overview", "https://dermnetnz.org/topics/vitiligo"],
  },
  {
    condition_name: "Warts",
    model_class: "Warts",
    category: "viral",
    brief_overview:
      "Warts are common skin growths caused by human papillomavirus. They may appear rough, raised, or flat and can spread by direct contact.",
    common_signs: ["rough bump", "raised growth", "wart-like lesion", "small black dots", "verruca", "flat wart"],
    common_triggers_or_causes: ["HPV infection", "skin contact", "minor skin injury", "shared surfaces", "weakened local skin barrier"],
    general_care_guidance: [
      "Avoid picking warts.",
      "Keep them covered if irritated.",
      "Avoid sharing personal items.",
      "Seek advice for painful or spreading warts.",
    ],
    otc_support_guidance: ["Some common warts may be managed with OTC wart treatments, but facial, genital, painful, bleeding, or uncertain lesions need professional advice."],
    what_to_avoid: ["Avoid picking or scratching.", "Avoid using wart acids on face/genitals.", "Avoid treating uncertain lesions as warts without confirmation."],
    red_flags: ["bleeding", "pain", "rapid spread", "genital location", "face location", "diabetes or immune compromise"],
    when_to_seek_doctor:
      "Consult a doctor if warts are painful, spreading, bleeding, on the face/genitals, or if the person has diabetes or immune compromise.",
    professional_note: "Not all rough growths are warts. Diagnosis matters before treatment.",
    source_urls: ["https://www.nhsinform.scot/illnesses-and-conditions/skin/skin-conditions/warts-and-verrucas/", "https://dermnetnz.org/topics/viral-wart"],
  },
];

function slugify(value: string): string {
  let slug = value.toLowerCase().trim();
  slug = slug.replace(/[^a-z0-9\s-]/g, "");
  slug = slug.replace(/[\s_-]+/g, "-");
  slug = slug.replace(/^-+|-+$/g, "");
  return slug;
}

const KNOWLEDGE_BY_SLUG = new Map<string, ConditionKnowledgeFE>(
  CONDITION_KNOWLEDGE_FE.flatMap((row) => {
    const entries: [string, ConditionKnowledgeFE][] = [
      [slugify(row.model_class), row],
      [slugify(row.condition_name), row],
    ];
    return entries;
  }),
);

export function getConditionKnowledgeBySlug(slug: string | null | undefined): ConditionKnowledgeFE | null {
  if (!slug) return null;
  return KNOWLEDGE_BY_SLUG.get(slug.trim().toLowerCase()) ?? null;
}
