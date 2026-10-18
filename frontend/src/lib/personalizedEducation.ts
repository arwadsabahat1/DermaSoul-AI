import type { ConsultationListItem, EducationArticleSummary } from "../types/models";
import { slugifyConditionLabel } from "../constants/conditionsCatalog";

/**
 * Pick up to 3 library articles tailored to latest analysis + optional allergy hints.
 */
export function pickPersonalizedArticles(
  library: EducationArticleSummary[],
  latest: ConsultationListItem | null,
  profileAllergiesText: string | null | undefined,
): { articles: EducationArticleSummary[]; note: string | null } {
  if (!latest) {
    return {
      articles: [],
      note: null,
    };
  }

  const slug = slugifyConditionLabel(latest.predicted_disease);
  const bySlug = new Map(library.map((a) => [a.slug, a]));

  const chosen: EducationArticleSummary[] = [];
  const chosenSlugs = new Set<string>();

  const primary = bySlug.get(slug);
  if (primary) {
    chosen.push(primary);
    chosenSlugs.add(primary.slug);
  } else {
    const words = latest.predicted_disease
      .toLowerCase()
      .split(/\s+/)
      .filter((x) => x.length > 3);
    for (const a of library) {
      if (chosen.length >= 1) break;
      if (words.some((word) => a.title.toLowerCase().includes(word))) {
        chosen.push(a);
        chosenSlugs.add(a.slug);
      }
    }
  }

  const primaryCategory = chosen[0]?.category;
  const rest = [...library].filter((a) => !chosenSlugs.has(a.slug));

  if (primaryCategory) {
    const sameCat = rest.filter((a) => a.category === primaryCategory);
    for (const a of sameCat) {
      if (chosen.length >= 3) break;
      chosen.push(a);
      chosenSlugs.add(a.slug);
    }
  }

  for (const a of rest) {
    if (chosen.length >= 3) break;
    if (!chosenSlugs.has(a.slug)) {
      chosen.push(a);
      chosenSlugs.add(a.slug);
    }
  }

  const allergyTokens =
    profileAllergiesText
      ?.split(/[,;/\n]+/)
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length >= 3) ?? [];

  let note: string | null = null;
  if (allergyTokens.length) {
    note = `You noted allergies (${allergyTokens.slice(0, 4).join(", ")}${allergyTokens.length > 4 ? "…" : ""}). Compare any OTC ideas in articles with your clinician and your allergy list—this picker does not vet every paragraph.`;
  }

  return { articles: chosen.slice(0, 3), note };
}
