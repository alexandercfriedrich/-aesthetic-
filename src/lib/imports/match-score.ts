/**
 * Deterministic match-scoring between an import candidate and an existing profile.
 *
 * Weights:
 *   +0.40  exact domain match
 *   +0.25  exact phone match
 *   +0.15  exact postal code match
 *   +0.10  exact city match
 *   +0.10  exact normalized name match
 *
 * Score is capped at 1.0.
 *
 * Rules for safe merging:
 *   - Claimed profiles must never be auto-merged.
 *   - Higher-confidence sources win over lower-confidence sources.
 *   - Price fields must include source + timestamp.
 *   - Media must never be made public automatically.
 */

export type MatchInput = {
  candidateName: string;
  existingName: string;
  candidateDomain?: string | null;
  existingDomain?: string | null;
  candidatePhone?: string | null;
  existingPhone?: string | null;
  candidateCity?: string | null;
  existingCity?: string | null;
  candidatePostal?: string | null;
  existingPostal?: string | null;
};

export type MatchBreakdown = {
  score: number;
  domainMatch: boolean;
  phoneMatch: boolean;
  postalMatch: boolean;
  cityMatch: boolean;
  nameMatch: boolean;
};

export function computeMatchScore(input: MatchInput): number {
  return computeMatchBreakdown(input).score;
}

export function computeMatchBreakdown(input: MatchInput): MatchBreakdown {
  const domainMatch =
    !!input.candidateDomain &&
    !!input.existingDomain &&
    input.candidateDomain === input.existingDomain;

  const phoneMatch =
    !!input.candidatePhone &&
    !!input.existingPhone &&
    input.candidatePhone === input.existingPhone;

  const postalMatch =
    !!input.candidatePostal &&
    !!input.existingPostal &&
    input.candidatePostal === input.existingPostal;

  const cityMatch =
    !!input.candidateCity &&
    !!input.existingCity &&
    input.candidateCity === input.existingCity;

  const nameMatch =
    !!input.candidateName &&
    !!input.existingName &&
    input.candidateName === input.existingName;

  const score = Math.min(
    1,
    (domainMatch ? 0.4 : 0) +
      (phoneMatch ? 0.25 : 0) +
      (postalMatch ? 0.15 : 0) +
      (cityMatch ? 0.1 : 0) +
      (nameMatch ? 0.1 : 0),
  );

  return { score, domainMatch, phoneMatch, postalMatch, cityMatch, nameMatch };
}
