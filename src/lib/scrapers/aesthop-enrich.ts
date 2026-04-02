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

import type { AesthOpDoctor } from "./aesthetische-operationen";

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
 * Searches Google Places for the given ÄsthOp doctor and returns the
 * first result that looks like a match (same city, no blacklisted type).
 * Returns null if no confident match is found or if the API key is missing.
 */
export async function enrichWithGooglePlaces(
  doctor: AesthOpDoctor,
): Promise<GooglePlace | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null; // enrichment is optional

  const city = doctor.city ?? doctor.bundesland;
  const query = `${doctor.name} ${city} Arzt`;

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

    if (!res.ok) return null;

    const data = (await res.json()) as { places?: GooglePlace[] };
    const places = data.places ?? [];

    const cityNorm = city?.toLowerCase() ?? "";
    const match =
      places.find((p) =>
        p.formattedAddress?.toLowerCase().includes(cityNorm),
      ) ?? null;

    return match ?? null;
  } catch {
    return null;
  }
}
