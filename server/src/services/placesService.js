import { env } from "../config/env.js";

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/**
 * Nearby pharmacies via Google Places API (Nearby Search).
 * Requires GOOGLE_MAPS_API_KEY and Places API enabled on the key.
 */
export async function fetchNearbyPharmacies(lat, lng, radiusM = 5000) {
  const key = env.googleMapsApiKey;
  if (!key) {
    return {
      source: "mock",
      pharmacies: [
        {
          id: "mock-1",
          name: "Demo Pharmacy (add GOOGLE_MAPS_API_KEY)",
          address: "Enable Places API in Google Cloud",
          distanceKm: 0.5,
          rating: 4.5,
          mapsUrl: `https://www.google.com/maps/search/pharmacy/@${lat},${lng},14z`,
        },
      ],
    };
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
  url.searchParams.set("location", `${lat},${lng}`);
  url.searchParams.set("radius", String(radiusM));
  url.searchParams.set("type", "pharmacy");
  url.searchParams.set("key", key);

  const res = await fetch(url.toString());
  const data = await res.json();

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(data.error_message || `Places API: ${data.status}`);
  }

  const results = data.results || [];
  const pharmacies = results.map((r) => {
    const plat = r.geometry?.location?.lat;
    const plng = r.geometry?.location?.lng;
    const distanceKm =
      plat != null && plng != null ? Number(haversineKm(lat, lng, plat, plng).toFixed(2)) : null;
    const mapsUrl =
      r.place_id != null
        ? `https://www.google.com/maps/search/?api=1&query_place_id=${r.place_id}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${r.name} ${r.vicinity || ""}`)}`;

    return {
      id: r.place_id,
      name: r.name,
      address: r.vicinity || r.formatted_address || "",
      distanceKm,
      rating: r.rating ?? null,
      userRatingsTotal: r.user_ratings_total ?? null,
      openNow: r.opening_hours?.open_now ?? null,
      lat: plat,
      lng: plng,
      mapsUrl,
    };
  });

  pharmacies.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));

  return { source: "google", pharmacies };
}
