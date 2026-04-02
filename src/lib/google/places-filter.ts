/**
 * Google Places import filter helpers.
 * Used to reduce false positives when importing aesthetic medicine professionals.
 */

/**
 * Google place types that are typically NOT relevant for aesthetic medicine.
 * A place with a blacklisted type is rejected UNLESS an allowlist type or
 * allowlist keyword also matches (allowlist takes priority).
 */
export const BLACKLIST_TYPES = new Set([
  "dentist",
  "dental_clinic",
  "dental_laboratory",
  "pharmacy",
  "physiotherapist",
  "chiropractor",
  "veterinary_care",
  "animal_shelter",
  "hospital",
  "emergency_room",
  "urgent_care_facility",
  "nursing_home",
  "rehabilitation_center",
  "mental_health",
  "psychiatrist",
  "psychologist",
  "psychotherapist",
  "speech_pathologist",
  "nutritionist",
  "dietitian",
  "optician",
  "optometrist",
  "podiatrist",
  "orthopedist",
  "cardiologist",
  "oncologist",
  "gynecologist",
  "pediatrician",
  "pediatric_dentist",
  "school",
  "gym",
  "spa",
  "beauty_salon",
  "nail_salon",
  "hair_care",
  "hair_salon",
  "massage",
  "tattoo_parlor",
  "piercing_shop",
]);

/**
 * Keywords that indicate aesthetic relevance when found in the displayName.
 * A candidate passes the allowlist if at least ONE keyword matches.
 * Case-insensitive, checked against the full displayName.text string.
 */
export const ALLOWLIST_KEYWORDS = [
  // Deutsch
  "ästhetisch",
  "ästhetik",
  "plastisch",
  "kosmetisch",
  "kosmetologie",
  "schönheitschirurg",
  "schönheitsklinik",
  "schönheitsmedizin",
  "faltenbehandlung",
  "fettabsaugung",
  "liposuktion",
  "brustvergrößerung",
  "bruststraffung",
  "bauchdeckenstraffung",
  "oberlidstraffung",
  "lidstraffung",
  "nasenkorrektur",
  "rhinoplastik",
  "haartransplantation",
  "haarverpflanzung",
  "anti-aging",
  "antiaging",
  "verjüngung",
  "hyaluron",
  "filler",
  "botox",
  "botulinumtoxin",
  "laserbehandlung",
  "lasermedizin",
  "lasertherapie",
  "microneedling",
  "mesotherapie",
  "fadenlifting",
  "facelift",
  "lifting",
  "peeling",
  "pigmentbehandlung",
  "faltenunterspritzung",
  "unterspritzung",
  "hautarzt",
  "dermatolog",
  "dermatologie",
  // Englisch
  "aesthetic",
  "aesthetics",
  "plastic surgery",
  "cosmetic surgery",
  "cosmetic medicine",
  "cosmetic dermatology",
  "beauty clinic",
  "beauty medicine",
  "anti aging",
  "hair transplant",
  "hair restoration",
  "laser clinic",
  "skin clinic",
  "skin care clinic",
  "rejuvenation",
  "blepharoplasty",
  "rhinoplasty",
  "liposuction",
  "breast augmentation",
  "body contouring",
  "injectable",
  "filler clinic",
];

/** Google place type strings that indicate aesthetic relevance */
export const ALLOWLIST_TYPES = new Set([
  "plastic_surgeon",
  "cosmetic_surgeon",
  "dermatologist",
  "skin_care_clinic",
  "medical_spa",
  "beauty_clinic",
  "laser_hair_removal_service",
  "hair_transplantation_clinic",
]);

/**
 * Returns true if the place should be KEPT as an import candidate.
 *
 * Logic:
 * 1. If an allowlist type matches → keep
 * 2. If an allowlist keyword matches in the display name → keep
 * 3. If any place type is blacklisted → reject
 * 4. Otherwise → reject (too ambiguous)
 */
export function isRelevantPlace(place: {
  displayName?: { text?: string };
  types?: string[];
}): boolean {
  const name = (place.displayName?.text ?? "").toLowerCase();
  const types = place.types ?? [];

  // Check allowlist types first (fast pass)
  for (const t of types) {
    if (ALLOWLIST_TYPES.has(t)) return true;
  }

  // Check name against allowlist keywords
  const hasAllowlistKeyword = ALLOWLIST_KEYWORDS.some((kw) =>
    name.includes(kw.toLowerCase()),
  );
  if (hasAllowlistKeyword) return true;

  // If a blacklisted type is present and no allowlist match → reject
  const hasBlacklistType = types.some((t) => BLACKLIST_TYPES.has(t));
  if (hasBlacklistType) return false;

  // No clear signal → reject (conservative)
  return false;
}
