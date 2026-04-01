/**
 * Normalization helpers used during import candidate processing.
 * Keep pure / side-effect free so they can run in both server actions and edge functions.
 */

/** Strip everything except digits and leading + */
export function normalizePhone(input?: string | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  const hasLeadingPlus = trimmed.startsWith("+");
  const digitsOnly = trimmed.replace(/\D/g, "");
  const cleaned = hasLeadingPlus ? `+${digitsOnly}` : digitsOnly;
  return cleaned.length >= 4 ? cleaned : null;
}

/** Extract bare hostname without www prefix, lower-cased */
export function normalizeDomain(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Lowercase, strip diacritics, remove common title prefixes,
 * collapse whitespace. Used for fuzzy name matching.
 */
export function normalizeName(input?: string | null): string {
  if (!input) return "";
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(dr|priv-doz|doz|univ-prof|prof|mag|msc|bsc)\b\.?/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Lowercase + trim city name for comparison */
export function normalizeCity(input?: string | null): string | null {
  if (!input) return null;
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Strip spaces from postal codes */
export function normalizePostal(input?: string | null): string | null {
  if (!input) return null;
  const cleaned = input.replace(/\s/g, "");
  return cleaned.length >= 3 ? cleaned : null;
}

/**
 * Auto-classify a confidence score into a candidate status bucket.
 * - ≥ 0.90 → matched (likely duplicate, may be auto-merged)
 * - 0.60–0.89 → needs_review (admin must decide)
 * - < 0.60 → new (treat as fresh profile)
 */
export function classifyConfidence(
  score: number,
): "matched" | "needs_review" | "new" {
  if (score >= 0.9) return "matched";
  if (score >= 0.6) return "needs_review";
  return "new";
}
