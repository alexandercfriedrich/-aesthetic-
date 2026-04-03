/**
 * Google Places enrichment for ÄsthOp doctor records.
 *
 * After scraping from aerztekammer.at the raw data contains name, address,
 * phone and operations but often lacks a website and verified Google Place ID.
 * This module performs a Places API (New) Text Search for each doctor and
 * returns the best-matching result for enrichment.
 *
 * ⚠️  No Playwright here — safe to import in Next.js server actions.
 */

import { BLACKLIST_TYPES } from "../google/places-filter";

type GooglePlace = {
  id: string;
  displayName?: { text: string; languageCode?: string };
  formattedAddress?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  location?: { latitude: number; longitude: number };
  types?: string[];
};

export type EnrichResult = GooglePlace & {
  _matchStatus: "matched_strict" | "no_results" | "ambiguous" | "error";
  _candidateCount: number;
  _notes?: string;
};

const ENRICH_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.rating",
  "places.userRatingCount",
  "places.location",
  "places.types",
].join(",");

/**
 * Searches Google Places for the given doctor name + address and returns the
 * best-matching result along with match-status metadata.
 *
 * @param name    Doctor display name (e.g. "Dr. Max Mustermann")
 * @param address Address or city string used for geo-scoping the search
 * @returns EnrichResult with _matchStatus tracking, or null if API key missing
 */
export async function enrichWithGooglePlaces(
  name: string,
  address: string,
): Promise<EnrichResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null; // enrichment is optional

  const query = `${name} ${address} Arzt`;

  try {
    const res = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": ENRICH_FIELD_MASK,
        },
        body: JSON.stringify({
          textQuery: query,
          languageCode: "de",
          regionCode: "AT",
          pageSize: 3,
        }),
      },
    );

    if (!res.ok) {
      return {
        id: "",
        _matchStatus: "error",
        _candidateCount: 0,
        _notes: `Google API HTTP ${res.status}`,
      };
    }

    const data = (await res.json()) as { places?: GooglePlace[] };
    const places = data.places ?? [];

    if (places.length === 0) {
      return {
        id: "",
        _matchStatus: "no_results",
        _candidateCount: 0,
      };
    }

    // Filter: city must be in address, no blacklisted types
    const addressNorm = address?.toLowerCase() ?? "";
    const cityWords = addressNorm.split(/[\s,]+/).filter((w) => w.length >= 3);

    const viable = places.filter((p) => {
      const addr = p.formattedAddress?.toLowerCase() ?? "";
      const hasCity = cityWords.length === 0 || cityWords.some((w) => addr.includes(w));
      if (!hasCity) return false;
      if (p.types?.some((t) => BLACKLIST_TYPES.has(t))) return false;
      return true;
    });

    if (viable.length === 0) {
      return {
        id: "",
        _matchStatus: "no_results",
        _candidateCount: places.length,
        _notes: `${places.length} Treffer, aber keiner passt (Stadt/Typ-Filter)`,
      };
    }

    if (viable.length === 1) {
      return {
        ...viable[0],
        _matchStatus: "matched_strict",
        _candidateCount: 1,
      };
    }

    // Multiple viable candidates → ambiguous
    const candidateDescriptions = viable
      .map((p) => p.formattedAddress ?? p.displayName?.text ?? "?")
      .join(" | ");

    return {
      id: "",
      _matchStatus: "ambiguous",
      _candidateCount: viable.length,
      _notes: `${viable.length} Treffer: ${candidateDescriptions}`,
    };
  } catch (err) {
    return {
      id: "",
      _matchStatus: "error",
      _candidateCount: 0,
      _notes: err instanceof Error ? err.message : "Unbekannter Fehler",
    };
  }
}
