import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getStationThaiName, getStationEnName } from "@/lib/stations";
import { haversineDistanceKm } from "@/lib/geo";
import { textMatches } from "@/lib/text-match";

// Scoring weights (total possible = 153)
const SCORE = {
  PROJECT_NAME: 25,
  BUDGET: 25,
  BEDROOMS: 20,
  PROVINCE: 10,
  DISTRICT: 10,
  SUBDISTRICT: 8,
  BTS_STATION: 10,
  SIZE: 10,
  PET_FRIENDLY: 5,
  SMOKING_ALLOWED: 5,
  READY_TO_MOVE_IN: 5,
  NEARBY_LOCATION: 20,
};

// Soft distance bonus from the lead's geocoded "ทำเลที่สนใจ" search point —
// never disqualifies (unlike province/district), just ranks closer listings
// higher. Full credit within easy walking distance, tapering off by ~5km.
function nearbyLocationScore(distanceKm: number): number {
  if (distanceKm <= 1) return SCORE.NEARBY_LOCATION;
  if (distanceKm <= 2) return Math.round(SCORE.NEARBY_LOCATION * 0.7);
  if (distanceKm <= 3.5) return Math.round(SCORE.NEARBY_LOCATION * 0.4);
  if (distanceKm <= 5) return Math.round(SCORE.NEARBY_LOCATION * 0.15);
  return 0;
}

interface InterestPlace {
  label: string;
  lat: number;
  lng: number;
}

function parseInterestPlaces(json: string | null): InterestPlace[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((p) => typeof p?.lat === "number" && typeof p?.lng === "number") : [];
  } catch {
    return [];
  }
}

// Resolve location field from property: own field → project field → address fallback
function resolvePropLocation(own: string | null, projField: string | null | undefined, address: string | null) {
  return own || projField || address || "";
}

// nearbyStations is a JSON array of station codes (e.g. ["E13","E14"]) — the
// PropertyStation relation table it used to read from is never populated in
// practice, so station data has to come from here instead.
function parseStationCodes(json: string | null): string[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "CO_AGENT"].includes((session.user as any).role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const leadId = parseInt(id);

  const lead = await prisma.customerLead.findUnique({ where: { id: leadId } });
  if (!lead) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  // Each agent only manages their own customers — an admin can view anyone's.
  const isAdmin = (session.user as any).role === "ADMIN";
  const userId = parseInt((session.user as any).id);
  if (!isAdmin && lead.createdById !== userId) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const interestPlaces = parseInterestPlaces(lead.interestPlaces);

  // Fetch properties that have actually passed verification — never
  // recommend a lead something still pending/under review, rejected,
  // unavailable, or already rented/sold.
  const properties = await prisma.property.findMany({
    where: {
      isSold: false,
      isRented: false,
      status: { in: ["VERIFIED", "VERIFIED_OVER_30_DAYS", "ADDED_PROPERTIES"] },
    },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      project: {
        select: { id: true, nameTh: true, nameEn: true, province: true, district: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Score each property
  const scored = properties.map((prop) => {
    let score = 0;
    const reasons: string[] = [];

    // 0. Deal type — hard filter. A property listed as RENT_AND_SALE is
    // genuinely available either way, so it matches a lead wanting either.
    if (
      (lead.dealType === "RENT" && prop.listingType !== "RENT" && prop.listingType !== "RENT_AND_SALE") ||
      (lead.dealType === "SALE" && prop.listingType !== "SALE" && prop.listingType !== "RENT_AND_SALE")
    ) {
      return { property: prop, score: -1, reasons: [], distanceKm: null, nearestPlaceLabel: null };
    }

    // Precompute every location signal once — reused both by the primary
    // location gate right below and by the scoring additions further down.
    const propProject = prop.projectName || prop.project?.nameTh || prop.project?.nameEn || "";
    const projectMatched = !!(lead.projectName && propProject && textMatches(propProject, lead.projectName));

    let distanceKm: number | null = null;
    let nearestPlaceLabel: string | null = null;
    if (interestPlaces.length > 0 && prop.latitude != null && prop.longitude != null) {
      for (const place of interestPlaces) {
        const d = haversineDistanceKm(place.lat, place.lng, Number(prop.latitude), Number(prop.longitude));
        if (distanceKm === null || d < distanceKm) {
          distanceKm = d;
          nearestPlaceLabel = place.label;
        }
      }
    }
    const nearbyMatched = distanceKm !== null && nearbyLocationScore(distanceKm) > 0;

    const propStationCodes = parseStationCodes(prop.nearbyStations);
    const stationMatched = !!(
      lead.btsStation &&
      propStationCodes.length > 0 &&
      lead.btsStation
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .some((name) =>
          propStationCodes.some(
            (code) => textMatches(getStationThaiName(code), name) || textMatches(getStationEnName(code), name)
          )
        )
    );

    const propProvince = resolvePropLocation(null, prop.project?.province, prop.address);
    const propDistrict = resolvePropLocation(null, prop.project?.district, prop.address);
    const provinceMatched = !!(lead.province && propProvince && textMatches(propProvince, lead.province));
    const districtMatched = !!(lead.district && propDistrict && textMatches(propDistrict, lead.district));
    const subdistrictMatched = !!(lead.subdistrict && prop.address && textMatches(prop.address, lead.subdistrict));

    // Primary location gate — when the lead specified ANY location
    // preference (project / searched zones / station / province-district-
    // subdistrict), a property must satisfy at least one of them to even
    // be considered. Price, bedrooms, size, and amenities only refine the
    // ranking afterward — they never rescue a property that's nowhere near
    // where the customer actually wants to live.
    const hasLocationCriteria = !!(
      lead.projectName || interestPlaces.length > 0 || lead.btsStation || lead.province || lead.district || lead.subdistrict
    );
    if (
      hasLocationCriteria &&
      !(projectMatched || nearbyMatched || stationMatched || provinceMatched || districtMatched || subdistrictMatched)
    ) {
      return { property: prop, score: -1, reasons: [], distanceKm: null, nearestPlaceLabel: null };
    }

    // 1. Project name match (25pts)
    if (projectMatched) {
      score += SCORE.PROJECT_NAME;
      reasons.push("PROJECT_NAME_MATCH");
    }

    // 2. Budget match (25pts)
    if (lead.budgetMax || lead.budgetMin) {
      const price = Number(prop.price);
      const min = lead.budgetMin ? Number(lead.budgetMin) : 0;
      const max = lead.budgetMax ? Number(lead.budgetMax) : Infinity;
      // Disqualify if price exceeds max budget by more than 50%
      if (lead.budgetMax && price > Number(lead.budgetMax) * 1.5) {
        return { property: prop, score: -1, reasons: [], distanceKm: null, nearestPlaceLabel: null };
      }
      if (price >= min && price <= max) {
        score += SCORE.BUDGET;
        reasons.push("BUDGET_MATCH");
      } else if (lead.budgetMax && price <= Number(lead.budgetMax) * 1.2) {
        score += Math.round(SCORE.BUDGET * 0.4);
        reasons.push("BUDGET_CLOSE");
      }
    }

    // 3. Bedrooms — exact match required when specified; the "4" option in
    // the form means "4+" (matches the same convention used elsewhere in
    // the app, e.g. the co-agent portal's bedroom filter).
    if (lead.bedrooms !== null && lead.bedrooms !== undefined) {
      const bedroomsMatch =
        lead.bedrooms >= 4 ? prop.bedrooms >= 4 : prop.bedrooms === lead.bedrooms;
      if (bedroomsMatch) {
        score += SCORE.BEDROOMS;
        reasons.push("BEDROOMS_MATCH");
      } else {
        return { property: prop, score: -1, reasons: [], distanceKm: null, nearestPlaceLabel: null };
      }
    }

    // 4. Province match (10pts)
    if (provinceMatched) {
      score += SCORE.PROVINCE;
      reasons.push("PROVINCE_MATCH");
    }

    // 5. District match (10pts)
    if (districtMatched) {
      score += SCORE.DISTRICT;
      reasons.push("DISTRICT_MATCH");
    }

    // 5b. Subdistrict match (8pts) — no dedicated column on Property, only
    // ever found via a text hit in the free-text address.
    if (subdistrictMatched) {
      score += SCORE.SUBDISTRICT;
      reasons.push("SUBDISTRICT_MATCH");
    }

    // 6. Minimum room size — disqualify only when property HAS size data
    // that falls short; unknown size doesn't disqualify.
    if (lead.minSizeSqm) {
      const size = prop.sizeSqm ? Number(prop.sizeSqm) : null;
      if (size !== null) {
        if (size >= Number(lead.minSizeSqm)) {
          score += SCORE.SIZE;
          reasons.push("SIZE_MATCH");
        } else {
          return { property: prop, score: -1, reasons: [], distanceKm: null, nearestPlaceLabel: null };
        }
      }
    }

    // 7. Pet friendly requirement — hard requirement when set
    if (lead.wantPetFriendly) {
      if (prop.petFriendly === "ACCEPT") {
        score += SCORE.PET_FRIENDLY;
        reasons.push("PET_FRIENDLY_MATCH");
      } else {
        return { property: prop, score: -1, reasons: [], distanceKm: null, nearestPlaceLabel: null };
      }
    }

    // 8. Smoking allowed requirement — hard requirement when set
    if (lead.wantSmokingAllowed) {
      if (prop.smokingAllowed === "ACCEPT") {
        score += SCORE.SMOKING_ALLOWED;
        reasons.push("SMOKING_MATCH");
      } else {
        return { property: prop, score: -1, reasons: [], distanceKm: null, nearestPlaceLabel: null };
      }
    }

    // 9. Ready to move in — hard requirement when set. No availableDate on
    // the property means it's already listed as available now.
    if (lead.wantReadyToMoveIn) {
      if (prop.availableDate && new Date(prop.availableDate).getTime() > Date.now()) {
        return { property: prop, score: -1, reasons: [], distanceKm: null, nearestPlaceLabel: null };
      }
      score += SCORE.READY_TO_MOVE_IN;
      reasons.push("READY_MATCH");
    }

    // 10. BTS/MRT station match (10pts)
    if (stationMatched) {
      score += SCORE.BTS_STATION;
      reasons.push("STATION_MATCH");
    }

    // 11. Proximity to the lead's geocoded "ทำเลที่สนใจ" search points (up to
    // 20pts, soft bonus — decays with distance, on top of having already
    // passed the primary location gate above).
    if (nearbyMatched) {
      score += nearbyLocationScore(distanceKm!);
      reasons.push("NEARBY_LOCATION_MATCH");
    }

    // Older listings are more likely to already be rented out, so decay
    // the score the longer a property has sat in the system unrefreshed.
    const daysPosted = Math.floor(
      (Date.now() - new Date(prop.listedAt || prop.createdAt).getTime()) / 86400000
    );
    const freshnessFactor =
      daysPosted > 90 ? 0.7 : daysPosted > 30 ? 0.85 : daysPosted > 7 ? 0.95 : 1;
    score = Math.round(score * freshnessFactor);

    return { property: prop, score, reasons, distanceKm, nearestPlaceLabel };
  });

  const results = scored
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map(({ property, score, reasons, distanceKm, nearestPlaceLabel }) => ({
      id: property.id,
      titleTh: property.titleTh,
      titleEn: property.titleEn,
      propertyType: property.propertyType,
      listingType: property.listingType,
      status: property.status,
      price: property.price,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      sizeSqm: property.sizeSqm,
      petFriendly: property.petFriendly,
      smokingAllowed: property.smokingAllowed,
      projectName: property.projectName,
      address: property.address,
      province: (property as any).province ?? null,
      district: (property as any).district ?? null,
      primaryImage: property.images[0]?.imageUrl ?? null,
      createdAt: property.createdAt,
      listedAt: property.listedAt,
      availableDate: property.availableDate,
      stations: parseStationCodes(property.nearbyStations).map((code) => ({
        code,
        nameTh: getStationThaiName(code),
        nameEn: getStationEnName(code),
      })),
      project: property.project
        ? { id: property.project.id, nameTh: property.project.nameTh, province: property.project.province, district: property.project.district }
        : null,
      score,
      reasons,
      distanceKm,
      nearestPlaceLabel,
    }));

  return NextResponse.json({ success: true, data: results, total: results.length });
}
