/**
 * Local clinical-photo covers supplied for the matching condition labels.
 * Unknown/unmatched labels intentionally use the neutral fallback rather than
 * displaying an unrelated disease photograph.
 */
const BY_SLUG: Record<string, string> = {
  acne: "acne.jpg",
  "actinic-keratosis": "actinic-keratosis.jpg",
  "benign-tumors": "benign-tumors.jpg",
  bullous: "bullous.jpg",
  candidiasis: "candidiasis.jpg",
  "drug-eruption": "drug-eruption.jpg",
  eczema: "eczema.jpg",
  "infestations-bites": "infestations-bites.jpg",
  lichen: "lichen.jpg",
  lupus: "lupus.jpg",
  moles: "moles.jpg",
  psoriasis: "psoriasis.jpg",
  rosacea: "rosacea.jpg",
  "seborrheic-keratoses": "seborrheic-keratoses.jpg",
  "skin-cancer": "skin-cancer.jpg",
  "sunsunlight-damage": "sunsunlight-damage.jpg",
  tinea: "tinea.jpg",
  "vascular-tumors": "vascular-tumors.jpg",
  vasculitis: "vasculitis.jpg",
  vitiligo: "vitiligo.jpg",
  warts: "warts.jpg",
};

const LEGACY_SLUG_ALIASES: Record<string, string> = {
  infestationsbites: "infestations-bites",
  unknownnormal: "unknown-normal",
};

export function conditionCoverImageUrl(slug: string): string {
  const raw = slug.trim().toLowerCase();
  const key = LEGACY_SLUG_ALIASES[raw] ?? raw;
  const filename = BY_SLUG[key];
  return filename ? `/covers/conditions/${filename}` : "/covers/fallback-cover.svg";
}

export function conditionCoverAlt(articleTitle: string): string {
  return `${articleTitle}: clinical reference photo for educational use; not a diagnosis of your skin.`;
}
