import { isRelevantPlace } from "./places-filter";

type GooglePlace = {
  id: string;
  displayName?: { text: string; languageCode?: string };
  formattedAddress?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  regularOpeningHours?: Record<string, unknown>;
  location?: { latitude: number; longitude: number };
  types?: string[];
};

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.rating",
  "places.userRatingCount",
  "places.regularOpeningHours",
  "places.location",
  "places.types",
].join(",");

export async function fetchGooglePlacesCandidates({
  query,
  maxResults,
}: {
  query: string;
  maxResults: number;
}): Promise<{ places: GooglePlace[]; rawCount: number }> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_MAPS_API_KEY is not set");

  const allPlaces: GooglePlace[] = [];
  let pageToken: string | undefined;

  do {
    const body: Record<string, unknown> = {
      textQuery: query,
      languageCode: "de",
      regionCode: "AT",
      pageSize: Math.min(maxResults - allPlaces.length, 20),
    };
    if (pageToken) body.pageToken = pageToken;

    const res = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": FIELD_MASK,
        },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) throw new Error(`Places API error: ${res.status}`);

    const data = (await res.json()) as {
      places?: GooglePlace[];
      nextPageToken?: string;
    };
    allPlaces.push(...(data.places ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken && allPlaces.length < maxResults);

  const filtered = allPlaces.filter(isRelevantPlace);
  console.log(
    `[places-import] Fetched: ${allPlaces.length}, after filter: ${filtered.length} (removed ${allPlaces.length - filtered.length} false positives)`,
  );

  return { places: filtered, rawCount: allPlaces.length };
}
