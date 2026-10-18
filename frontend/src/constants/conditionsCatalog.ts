import { DETECTABLE_CONDITIONS } from "./detectableConditions";
import type { EducationArticle, EducationArticleSummary } from "../types/models";
import { getConditionKnowledgeBySlug, type ConditionKnowledgeFE } from "./conditionKnowledgeData";

/** Mirrors backend `seed_education_articles.CATEGORY_FOR_LABEL`. */
const CATEGORY_FOR_LABEL: Record<string, string> = {
  Acne: "inflammatory",
  "Actinic Keratosis": "photodamage",
  "Benign Tumors": "benign-neoplasm",
  Bullous: "blistering",
  Candidiasis: "infection",
  "Drug Eruption": "reactive",
  Eczema: "eczema",
  "Infestations/Bites": "infection",
  Lichen: "inflammatory",
  Lupus: "autoimmune",
  Moles: "pigmented-lesions",
  Psoriasis: "inflammatory",
  Rosacea: "inflammatory",
  "Seborrheic Keratoses": "benign-lesions",
  "Skin Cancer": "oncology",
  "Sun/Sunlight Damage": "photodamage",
  Tinea: "infection",
  "Unknown/Normal": "general",
  "Vascular Tumors": "vascular",
  Vasculitis: "inflammatory-vascular",
  Vitiligo: "pigmentary",
  Warts: "infection",
};

/** Same rules as backend `seed_education_articles._slugify`. */
export function slugifyConditionLabel(value: string): string {
  let slug = value.toLowerCase().trim();
  slug = slug.replace(/[^a-z0-9\s-]/g, "");
  slug = slug.replace(/[\s_-]+/g, "-");
  slug = slug.replace(/^-+|-+$/g, "");
  return slug;
}

export type CanonicalCondition = {
  title: string;
  slug: string;
  category: string;
};

export const CANONICAL_CONDITIONS: CanonicalCondition[] = DETECTABLE_CONDITIONS.map((title) => ({
  title,
  slug: slugifyConditionLabel(title),
  category: CATEGORY_FOR_LABEL[title] ?? "general",
}));

const SLUG_SET = new Set(CANONICAL_CONDITIONS.map((c) => c.slug));

const BY_SLUG = new Map(CANONICAL_CONDITIONS.map((c) => [c.slug, c] as const));

export function isCanonicalEducationSlug(slug: string | undefined): boolean {
  if (!slug) return false;
  return SLUG_SET.has(slug.trim().toLowerCase());
}

export function getCanonicalConditionBySlug(slug: string): CanonicalCondition | null {
  return BY_SLUG.get(slug.trim().toLowerCase()) ?? null;
}

function genericSummary(label: string): string {
  return (
    `Educational overview of ${label.toLowerCase()}—how it is discussed clinically, why appearances vary, ` +
    "and when to seek in-person care. Not a diagnosis for your photos or symptoms."
  );
}

function bulletBlock(heading: string, items: string[]): string {
  if (!items.length) return "";
  return `${heading}\n${items.map((s) => `- ${s}`).join("\n")}`;
}

function joinSections(sections: string[]): string {
  return sections.filter((s) => s && s.trim().length > 0).join("\n\n");
}

function buildContentFromKnowledge(label: string, k: ConditionKnowledgeFE): string {
  return joinSections([
    `What is ${label}?\n${k.brief_overview}`,
    bulletBlock("Common signs to watch for", k.common_signs),
    bulletBlock("Common triggers or causes", k.common_triggers_or_causes),
    bulletBlock("General care guidance", k.general_care_guidance),
    bulletBlock("OTC support guidance", k.otc_support_guidance),
    bulletBlock("What to avoid", k.what_to_avoid),
    k.professional_note ? `Clinical note\n${k.professional_note}` : "",
  ]);
}

function genericContent(label: string): string {
  return (
    `What is ${label}?\n` +
    `${label} is a clinical label used to group certain skin patterns. It helps organize education, but it is not a final diagnosis by itself.\n\n` +
    "How it can appear\n" +
    "- Color, borders, and texture can vary with skin tone, lighting, and camera quality.\n" +
    "- The same condition can look different across people and body areas.\n" +
    "- Early lesions and healing lesions may look very different from textbook images.\n\n" +
    "Practical self-care while arranging care\n" +
    "- Keep the area clean and avoid harsh scrubbing or picking.\n" +
    "- Use gentle, fragrance-free moisturizer and sunscreen when relevant.\n" +
    "- Avoid combining multiple strong active products at once.\n" +
    "- Track onset date, spread, itch/pain level, and triggers to share with your clinician.\n\n" +
    "Clinical caution\n" +
    "DermaSoul content is educational. It does not replace examination, dermoscopy, swab/culture, biopsy, or blood work when needed.\n\n" +
    "Urgent red flags\n" +
    "- Rapidly spreading rash\n" +
    "- Severe pain, fever, confusion, or breathing difficulty\n" +
    "- Eye, mouth, or genital involvement\n" +
    "- Bleeding, skin peeling, pus, or non-healing lesions"
  );
}

const GENERIC_WARNINGS =
  "Educational text only. Do not delay emergency evaluation for symptoms that could indicate severe infection, " +
  "Stevens–Johnson spectrum reactions, or other urgent conditions.";

const GENERIC_PRECAUTIONS =
  "Avoid combining unsupervised steroid creams, bleaching agents, or harsh peels on undiagnosed rashes; these " +
  "can alter appearance and complicate medical assessment.";

const GENERIC_WHEN =
  "Book an in-person dermatology or primary-care visit if a lesion is new or changing, bleeds easily, fails " +
  "to heal, is painful, or affects your quality of life.";

export function buildCatalogPlaceholderSummary(c: CanonicalCondition): EducationArticleSummary {
  const title = `${c.title}: educational overview`;
  const knowledge = getConditionKnowledgeBySlug(c.slug);
  const summary = knowledge?.brief_overview?.trim() || genericSummary(c.title);
  const warnings = knowledge && knowledge.red_flags.length > 0
    ? `Seek prompt evaluation if you notice: ${knowledge.red_flags.join("; ")}.`
    : GENERIC_WARNINGS;
  return {
    id: `catalog-${c.slug}`,
    title,
    slug: c.slug,
    category: c.category,
    summary,
    warnings,
    updated_at: "1970-01-01T00:00:00.000Z",
  };
}

export function buildCatalogFallbackArticle(c: CanonicalCondition): EducationArticle {
  const base = buildCatalogPlaceholderSummary(c);
  const knowledge = getConditionKnowledgeBySlug(c.slug);
  const content = knowledge ? buildContentFromKnowledge(c.title, knowledge) : genericContent(c.title);
  const precautions = knowledge && knowledge.what_to_avoid.length > 0
    ? `Daily-care precautions: ${knowledge.what_to_avoid.join(" ")}`
    : GENERIC_PRECAUTIONS;
  const whenToSeek = knowledge?.when_to_seek_doctor?.trim() || GENERIC_WHEN;
  const sourceUrls = knowledge && knowledge.source_urls.length > 0
    ? knowledge.source_urls.join("\n")
    : "https://www.aad.org/public/diseases";
  return {
    ...base,
    content,
    precautions,
    when_to_seek_doctor: whenToSeek,
    source_urls: sourceUrls,
    created_at: base.updated_at,
  };
}

export function buildFallbackArticleForSlug(slug: string): EducationArticle | null {
  const c = getCanonicalConditionBySlug(slug);
  return c ? buildCatalogFallbackArticle(c) : null;
}

/**
 * Full library: every taxonomy condition, preferring API rows when present; then any extra API-only articles.
 */
export function mergeEducationLibrary(apiArticles: EducationArticleSummary[]): EducationArticleSummary[] {
  const bySlug = new Map(apiArticles.map((a) => [a.slug, a] as const));
  const remaining = [...apiArticles];
  const merged: EducationArticleSummary[] = [];

  function removeFromRemaining(slug: string) {
    const idx = remaining.findIndex((a) => a.slug === slug);
    if (idx >= 0) remaining.splice(idx, 1);
  }

  function bestTitleMatch(conditionTitle: string): EducationArticleSummary | null {
    const needle = conditionTitle.trim().toLowerCase();
    const candidates = remaining.filter((a) => {
      const t = a.title.trim().toLowerCase();
      return t === needle || t.startsWith(`${needle}:`) || t.startsWith(`${needle} -`);
    });
    if (candidates.length === 0) return null;
    return [...candidates].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]!;
  }

  for (const c of CANONICAL_CONDITIONS) {
    const exactSlug = bySlug.get(c.slug);
    if (exactSlug) {
      merged.push(exactSlug);
      bySlug.delete(c.slug);
      removeFromRemaining(exactSlug.slug);
      continue;
    }

    const matchedByTitle = bestTitleMatch(c.title);
    if (matchedByTitle) {
      merged.push({
        ...matchedByTitle,
        slug: c.slug,
      });
      removeFromRemaining(matchedByTitle.slug);
      bySlug.delete(matchedByTitle.slug);
      continue;
    }

    merged.push(buildCatalogPlaceholderSummary(c));
  }

  const extras = remaining.sort((a, b) => a.title.localeCompare(b.title));
  merged.push(...extras);
  return merged;
}
