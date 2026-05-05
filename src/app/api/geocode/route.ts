import { NextRequest, NextResponse } from "next/server";

/**
 * Public geocoding endpoint backed by OpenStreetMap Nominatim.
 * Restricted to Thailand and accepts Thai or English queries.
 * Used by the map-search page's "search area" box to fly the map
 * to a place name (district, road, neighbourhood, etc.).
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json(
      { success: false, error: "Missing query" },
      { status: 400 }
    );
  }

  try {
    const url =
      `https://nominatim.openstreetmap.org/search` +
      `?q=${encodeURIComponent(q)}` +
      `&format=json&limit=5&addressdetails=1` +
      `&countrycodes=th&accept-language=th,en`;

    const res = await fetch(url, {
      headers: {
        // Nominatim requires a real User-Agent identifying the app.
        "User-Agent": "NPB-Property/1.0 (https://npb-property.com)",
      },
      // Cache the result for an hour — area names rarely move.
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Geocode upstream returned ${res.status}` },
        { status: 502 }
      );
    }

    const arr = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
      boundingbox?: string[];
      type?: string;
    }>;

    if (!Array.isArray(arr) || arr.length === 0) {
      return NextResponse.json(
        { success: false, error: "No results" },
        { status: 404 }
      );
    }

    // Map all results so the client can show suggestions; first entry is the
    // primary match.
    const data = arr.map((r) => ({
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      displayName: r.display_name,
      bbox: r.boundingbox?.map((s) => parseFloat(s)),
      type: r.type,
    }));

    return NextResponse.json({ success: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Geocode failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
