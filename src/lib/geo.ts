// Straight-line distance + rough travel-time estimate for the map search's
// "distance from here" feature. There's no routing/directions API wired up
// (only geocoding), so this approximates real route time by applying a
// detour factor and a realistic average speed on top of the haversine
// distance, rather than the crow-flies straight line.

export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius, km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export type TravelMode = "walk" | "drive";

// Detour factor accounts for streets not being a straight line; speeds are
// realistic city averages (Bangkok driving is slow due to traffic).
const TRAVEL_PARAMS: Record<TravelMode, { detour: number; speedKmh: number }> = {
  walk: { detour: 1.3, speedKmh: 4.5 },
  drive: { detour: 1.35, speedKmh: 22 },
};

export function estimateTravel(straightLineKm: number, mode: TravelMode) {
  const { detour, speedKmh } = TRAVEL_PARAMS[mode];
  const routeKm = straightLineKm * detour;
  const minutes = (routeKm / speedKmh) * 60;
  return { routeKm, minutes };
}
