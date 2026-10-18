import type { Product } from "../types/models";

/** Topical steroid / steroid-combo patterns (education-only heuristics, not prescribing advice). */
const STEROID_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /\bhydrocortisone\b/i, label: "Hydrocortisone (topical steroid)" },
  { pattern: /\bbetamethasone\b/i, label: "Betamethasone (potent steroid)" },
  { pattern: /\bclobetasol\b/i, label: "Clobetasol (very potent steroid)" },
  { pattern: /\bmometasone\b/i, label: "Mometasone" },
  { pattern: /\btriamcinolone\b/i, label: "Triamcinolone" },
  { pattern: /\bfluticasone\b/i, label: "Fluticasone" },
  { pattern: /\bdexamethasone\b/i, label: "Dexamethasone" },
  { pattern: /\bfusidic\s+acid\b/i, label: "Fusidic acid (often combined with steroids—check label)" },
  { pattern: /\bsteroid\b/i, label: "Word “steroid” on label" },
  { pattern: /\bcorticosteroid\b/i, label: "Corticosteroid" },
];

const COMMON_CONTACT_ALLERGENS: { pattern: RegExp; label: string }[] = [
  { pattern: /\bneomycin\b/i, label: "Neomycin" },
  { pattern: /\bbacitracin\b/i, label: "Bacitracin" },
  { pattern: /\blanolin\b/i, label: "Lanolin / wool alcohol" },
  { pattern: /\bfragrance\b/i, label: "Fragrance" },
  { pattern: /\bparaben\b/i, label: "Paraben" },
  { pattern: /\bformaldehyde\b/i, label: "Formaldehyde releasers" },
  { pattern: /\bmethylisothiazolinone\b/i, label: "Methylisothiazolinone (MIT)" },
  { pattern: /\bpropylene\s+glycol\b/i, label: "Propylene glycol" },
  { pattern: /\bcoconut\b/i, label: "Coconut-derived" },
  { pattern: /\btea\s+tree\b/i, label: "Tea tree oil" },
  { pattern: /\bsalicylic\s+acid\b/i, label: "Salicylic acid" },
  { pattern: /\bretinoid\b/i, label: "Retinoid / vitamin A derivative" },
  { pattern: /\btretinoin\b/i, label: "Tretinoin" },
  { pattern: /\badapalene\b/i, label: "Adapalene" },
];

export type IngredientAnalysisResult = {
  steroidFlags: string[];
  labelAllergenHits: string[];
  profileAllergyHits: string[];
  productWarnings: { productName: string; note: string }[];
};

function splitAllergyNotes(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;/\n]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function uniqueStrings(list: string[]): string[] {
  return [...new Set(list)];
}

/**
 * Scan pasted label text plus profile allergy list against heuristics and OTC catalog hints.
 */
export function analyzeIngredientLabel(
  pastedText: string,
  profileKnownAllergies: string | null | undefined,
  products: Product[],
): IngredientAnalysisResult {
  const text = pastedText.trim();
  const lower = text.toLowerCase();

  const steroidFlags: string[] = [];
  for (const { pattern, label } of STEROID_PATTERNS) {
    if (pattern.test(text)) steroidFlags.push(label);
  }

  const labelAllergenHits: string[] = [];
  for (const { pattern, label } of COMMON_CONTACT_ALLERGENS) {
    if (pattern.test(text)) labelAllergenHits.push(label);
  }

  const profileTokens = splitAllergyNotes(profileKnownAllergies ?? "");
  const profileAllergyHits: string[] = [];
  for (const token of profileTokens) {
    if (token.length < 2) continue;
    if (lower.includes(token)) {
      profileAllergyHits.push(`Profile allergen “${token}” appears in this label text`);
      continue;
    }
    const wordBoundary = new RegExp(`\\b${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (wordBoundary.test(text)) {
      profileAllergyHits.push(`Profile allergen “${token}” matches label`);
    }
  }

  const productWarnings: { productName: string; note: string }[] = [];

  if (products.length && text.length > 2) {
    const compact = lower.replace(/\s+/g, " ");
    for (const p of products) {
      const ingRaw = p.ingredients?.toLowerCase();
      let overlap = Boolean(p.name.length > 2 && compact.includes(p.name.toLowerCase()));

      if (!overlap && ingRaw) {
        const parts = ingRaw
          .split(/[,;]| and /i)
          .map((s) => s.trim())
          .filter((s) => s.length > 4);
        overlap = parts.some((part) => compact.includes(part));
      }

      if (overlap && p.avoid_if_allergic_to) {
        productWarnings.push({
          productName: `${p.name}${p.brand ? ` · ${p.brand}` : ""}`,
          note: p.avoid_if_allergic_to,
        });
      }
    }
  }

  const profileAgainstAvoidField: { productName: string; note: string }[] = [];
  for (const p of products) {
    if (!p.avoid_if_allergic_to?.trim()) continue;
    const avoidLower = p.avoid_if_allergic_to.toLowerCase();
    for (const token of profileTokens) {
      if (token.length < 3) continue;
      if (avoidLower.includes(token)) {
        profileAgainstAvoidField.push({
          productName: p.name,
          note: `Catalog flags this product for people sensitive to cues matching “${token}”: ${p.avoid_if_allergic_to}`,
        });
        break;
      }
    }
  }

  for (const pr of profileAgainstAvoidField) {
    if (!productWarnings.some((x) => x.productName === pr.productName && x.note === pr.note)) {
      productWarnings.push(pr);
    }
  }

  return {
    steroidFlags: uniqueStrings(steroidFlags),
    labelAllergenHits: uniqueStrings(labelAllergenHits),
    profileAllergyHits: uniqueStrings(profileAllergyHits),
    productWarnings,
  };
}
