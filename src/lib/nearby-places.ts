// Real nearby-place distances via Google Places Nearby Search — not an AI
// guess. Given a property's coordinates, finds the closest place of each
// category and computes the straight-line distance to it.

export interface NearbyPlace {
  category: string;
  name: string;
  distanceKm: number;
}

export const NEARBY_CATEGORY_TYPE: Record<string, string> = {
  transit: "transit_station",
  busTerminal: "bus_station",
  airport: "airport",
  school: "school",
  mall: "shopping_mall",
  hospital: "hospital",
};

export const NEARBY_CATEGORY_LABEL_TH: Record<string, string> = {
  transit: "สถานีรถไฟฟ้า",
  busTerminal: "สถานีขนส่ง",
  airport: "สนามบิน",
  school: "โรงเรียน",
  mall: "ห้างสรรพสินค้า",
  hospital: "โรงพยาบาล",
};

export const NEARBY_CATEGORY_LABEL_EN: Record<string, string> = {
  transit: "Transit Station",
  busTerminal: "Bus Terminal",
  airport: "Airport",
  school: "School",
  mall: "Shopping Mall",
  hospital: "Hospital",
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// rankby=distance on its own surfaces whatever POI happens to be nearest —
// helipads tagged "airport", vending machines tagged "shopping_mall",
// unnamed streets tagged "transit_station". Requiring a minimum review
// count filters down to places someone would actually recognize; if
// nothing nearby clears the bar, skip the category rather than show a
// technically-nearest but meaningless result.
const MIN_RATINGS = 10;

export async function findNearbyPlaces(
  lat: number,
  lng: number,
  apiKey: string
): Promise<NearbyPlace[]> {
  const results: NearbyPlace[] = [];

  for (const [category, type] of Object.entries(NEARBY_CATEGORY_TYPE)) {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&rankby=distance&type=${type}&key=${apiKey}`
      );
      if (!res.ok) continue;
      const data = await res.json();
      if (data.status !== "OK" || !data.results?.length) continue;

      const top = data.results.find(
        (r: { user_ratings_total?: number }) => (r.user_ratings_total || 0) >= MIN_RATINGS
      );
      if (!top) continue;

      const distanceKm = haversineKm(lat, lng, top.geometry.location.lat, top.geometry.location.lng);
      results.push({ category, name: top.name, distanceKm: Math.round(distanceKm * 100) / 100 });
    } catch {
      // Skip this category on failure, keep the rest
    }
  }

  return results;
}
