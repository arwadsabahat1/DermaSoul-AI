export interface User {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  age: number | null;
  gender: string | null;
  phone: string | null;
  known_allergies: string | null;
  medical_history: string | null;
  skin_concerns: string | null;
  current_products: string | null;
}

export interface ConsultationListItem {
  id: string;
  image_filename: string | null;
  predicted_disease: string;
  disease_confidence: number;
  disease_confidence_level: string;
  predicted_skin_type: string;
  skin_type_confidence: number;
  skin_type_confidence_level: string;
  risk_level: string;
  created_at: string;
}

export interface ConsultationPaginated {
  items: ConsultationListItem[];
  total: number;
  limit: number;
  offset: number;
}

export type ConsultationDetail = ConsultationListItem & {
  user_id: string;
  symptoms: string;
  duration: string | null;
  severity: string | null;
  medical_history: string | null;
  skin_tone: string | null;
  fitzpatrick_type: string | null;
  ethnicity_region: string | null;
  melanin_context_note: string | null;
  skin_tone_considerations: string[] | null;
  extracted_symptoms: string[] | null;
  symptom_keyword_hits: Record<string, string[]> | null;
  clinical_entities: Record<string, unknown>[] | null;
  negated_entities: string[] | null;
  extracted_duration: string | null;
  inferred_severity: string | null;
  severity_rationale: string | null;
  severity_confidence: number | null;
  urgency_class: string | null;
  urgency_confidence: number | null;
  urgency_rationale: string | null;
  followup_candidates: string[] | null;
  nlp_model_version: string | null;
  red_flags: string[] | null;
  doctor_warning: string;
  assessment_summary: string | null;
  condition_explanation: string | null;
  symptom_context: string | null;
  skin_type_context: string | null;
  general_care_guidance: string[] | null;
  otc_support_guidance: string[] | null;
  what_to_avoid: string[] | null;
  safety_precautions: string[] | null;
  when_to_seek_doctor: string | null;
  professional_note: string | null;
  ai_limitations: string | null;
  retrieved_knowledge: string[] | null;
  knowledge_sources: { title?: string; url?: string }[] | null;
  retrieval_trace: Record<string, unknown>[] | null;
  retrieval_confidence: number | null;
  retrieval_metrics: Record<string, number> | null;
  recommendations: Record<string, unknown>[] | null;
  recommendation_safety_note: string | null;
  recommendation_source: string | null;
  llm_summary: string | null;
  llm_differential_notes: string[] | null;
  llm_next_steps: string[] | null;
  llm_followup_questions: string[] | null;
  llm_confidence_statement: string | null;
  llm_generation_mode: string | null;
  trace_id: string | null;
  allergy_filter_applied: string | null;
  referred_dermatologists: Dermatologist[] | null;
  referral_note: string | null;
};

export interface EducationArticleSummary {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string | null;
  warnings: string | null;
  updated_at: string;
}

export interface EducationArticle extends EducationArticleSummary {
  content: string;
  precautions: string | null;
  when_to_seek_doctor: string | null;
  source_urls: string | null;
  created_at: string;
}

export interface EducationKnowledge {
  condition_name: string;
  model_class: string;
  aliases: string[];
  category: string | null;
  brief_overview: string | null;
  common_signs: string[];
  common_triggers_or_causes: string[];
  general_care_guidance: string[];
  otc_support_guidance: string[];
  what_to_avoid: string[];
  red_flags: string[];
  when_to_seek_doctor: string | null;
  professional_note: string | null;
  source_names: string[];
  source_urls: string[];
}

export interface Product {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  ingredients: string | null;
  suitable_skin_types: string | null;
  supported_conditions: string | null;
  avoid_if_allergic_to: string | null;
  contraindications: string | null;
  price_range: string | null;
  availability: string | null;
  product_url: string | null;
  created_at?: string;
}

export interface Dermatologist {
  id: string;
  full_name: string;
  clinic_name: string | null;
  city: string | null;
  country: string | null;
  languages: string | null;
  specialties: string | null;
  supported_conditions: string | null;
  specialty_tags: string | null;
  regions_served: string | null;
  telemedicine_available: boolean;
  emergency_available: boolean;
  years_experience: number | null;
  contact_email: string | null;
  contact_phone: string | null;
  booking_url: string | null;
  profile_image_url: string | null;
  notes?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DiagnosisResponse {
  message: string;
  consultation_id: string;
  image_filename: string;
  symptoms: string;
  skin_tone?: string | null;
  fitzpatrick_type?: string | null;
  ethnicity_region?: string | null;
  melanin_context_note: string;
  skin_tone_considerations: string[];
  blur_score: number;
  skin_check: Record<string, unknown>;
  predicted_disease: string;
  disease_confidence: number;
  disease_confidence_level: string;
  predicted_skin_type: string;
  skin_type_confidence: number;
  skin_type_confidence_level: string;
  red_flags: string[];
  risk_level: string;
  doctor_warning: string;
  assessment_summary?: string | null;
  condition_explanation?: string | null;
  symptom_context?: string | null;
  general_care_guidance?: string[];
  what_to_avoid?: string[];
  safety_precautions?: string[];
  when_to_seek_doctor?: string | null;
  ai_limitations?: string | null;
  recommendation_safety_note?: string | null;
  extracted_symptoms: string[];
  symptom_keyword_hits: Record<string, string[]>;
  clinical_entities: Record<string, unknown>[];
  negated_entities: string[];
  extracted_duration?: string | null;
  inferred_severity: string;
  severity_rationale: string;
  severity_confidence: number;
  urgency_class: string;
  urgency_confidence: number;
  urgency_rationale: string;
  followup_candidates: string[];
  nlp_model_version: string;
  retrieval_trace: Record<string, unknown>[];
  retrieval_confidence: number;
  retrieval_metrics: Record<string, number>;
  llm_summary?: string | null;
  llm_differential_notes: string[];
  llm_next_steps: string[];
  llm_followup_questions: string[];
  llm_confidence_statement?: string | null;
  llm_generation_mode?: string | null;
  trace_id?: string | null;
  referred_dermatologists: Dermatologist[];
  referral_note?: string | null;
  suggested_education_slug?: string | null;
  suggested_education_title?: string | null;
  [key: string]: unknown;
}
