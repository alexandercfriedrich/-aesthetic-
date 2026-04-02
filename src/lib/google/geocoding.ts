type GeocodeResult = {
  lat: number;
  lng: number;
  postalCode: string | null;
};

type AddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

export async function geocodeAddress(
  address?: string | null,
): Promise<GeocodeResult | null> {
  if (!address) return null;

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_MAPS_API_KEY is not set");

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&language=de&region=AT`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding API error: ${res.status}`);
  const data = (await res.json()) as {
    results?: {
      geometry: { location: { lat: number; lng: number } };
      address_components?: AddressComponent[];
    }[];
  };

  const result = data.results?.[0];
  if (!result) return null;

  const postalCode =
    result.address_components?.find((c) => c.types.includes("postal_code"))
      ?.long_name ?? null;

  return {
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    postalCode,
  };
}
