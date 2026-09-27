import { NextRequest, NextResponse } from "next/server";

/**
 * Turn-by-turn walking/driving route between two points, for the map
 * search page's "distance from here" line. Backed by OpenRouteService
 * (free tier, no billing) — returns 501 if no key is configured yet, so
 * the frontend can fall back to a straight-line estimate instead of
 * breaking.
 */

const ORS_PROFILE: Record<string, string> = {
  walk: "foot-walking",
  drive: "driving-car",
};

export async function GET(req: NextRequest) {
  const apiKey = process.env.OPENROUTESERVICE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "Routing not configured" },
      { status: 501 }
    );
  }

  const { searchParams } = req.nextUrl;
  const startLat = searchParams.get("startLat");
  const startLng = searchParams.get("startLng");
  const endLat = searchParams.get("endLat");
  const endLng = searchParams.get("endLng");
  const mode = searchParams.get("mode") || "walk";
  const profile = ORS_PROFILE[mode] || "foot-walking";

  if (!startLat || !startLng || !endLat || !endLng) {
    return NextResponse.json(
      { success: false, error: "Missing coordinates" },
      { status: 400 }
    );
  }

  try {
    const url =
      `https://api.openrouteservice.org/v2/directions/${profile}` +
      `?api_key=${apiKey}&start=${startLng},${startLat}&end=${endLng},${endLat}`;

    const res = await fetch(url, {
      headers: { Accept: "application/geo+json" },
      // Same start/end/mode always gives the same route — cache briefly to
      // avoid re-billing the free-tier quota on repeated popup opens.
      next: { revalidate: 300 },
    });
    const data = await res.json();

    const feature = data?.features?.[0];
    if (!res.ok || !feature) {
      return NextResponse.json(
        { success: false, error: data?.error?.message || "Routing failed" },
        { status: 502 }
      );
    }

    // GeoJSON coordinates are [lng, lat] — Leaflet wants [lat, lng].
    const coordinates: [number, number][] = feature.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng]
    );
    const summary = feature.properties.summary;

    return NextResponse.json({
      success: true,
      data: {
        coordinates,
        distanceMeters: summary.distance,
        durationSeconds: summary.duration,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
