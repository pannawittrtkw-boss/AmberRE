// Real nearby-place distances via Geoapify Places API (backed by
// OpenStreetMap data) — not an AI guess, and free (3,000 requests/day)
// unlike Google Places Nearby Search. Given a property's coordinates,
// finds the closest named place of each category and its distance.

export interface NearbyPlace {
  category: string;
  name: string;
  distanceKm: number;
}

// [Geoapify category, search radius in meters]
export const NEARBY_CATEGORY_CONFIG: Record<string, { category: string; radiusM: number }> = {
  transit: { category: "public_transport.train,public_transport.subway,public_transport.light_rail", radiusM: 5000 },
  busTerminal: { category: "public_transport.bus", radiusM: 8000 },
  airport: { category: "airport", radiusM: 30000 },
  school: { category: "education.school", radiusM: 3000 },
  mall: { category: "commercial.shopping_mall", radiusM: 5000 },
  hospital: { category: "healthcare.hospital", radiusM: 5000 },
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

export async function findNearbyPlaces(
  lat: number,
  lng: number,
  apiKey: string
): Promise<NearbyPlace[]> {
  const results: NearbyPlace[] = [];

  for (const [category, { category: geoCategory, radiusM }] of Object.entries(NEARBY_CATEGORY_CONFIG)) {
    try {
      const res = await fetch(
        `https://api.geoapify.com/v2/places?categories=${geoCategory}&filter=circle:${lng},${lat},${radiusM}&bias=proximity:${lng},${lat}&limit=1&apiKey=${apiKey}`
      );
      if (!res.ok) continue;
      const data = await res.json();
      const top = data.features?.[0]?.properties;
      if (!top?.name || top.distance == null) continue;

      results.push({ category, name: top.name, distanceKm: Math.round((top.distance / 1000) * 100) / 100 });
    } catch {
      // Skip this category on failure, keep the rest
    }
  }

  return results;
}
