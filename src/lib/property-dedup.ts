import prisma from "@/lib/prisma";
import { haversineDistanceKm } from "@/lib/geo";
import { textMatches } from "@/lib/text-match";

// Possible-duplicate detection for property submissions — lets an agent
// (or admin) submitting a listing know a matching property may already be
// in the system, before they finish/submit the form. Warning only, never
// blocks submission — CO_AGENT rows already require admin verification
// before going live, so the admin gets a second look regardless.
//
// Two independent signals:
//   - "owner identity" (phone / LINE ID / Facebook link) — a real owner
//     has one identity no matter who lists them. Strongest signal.
//   - "property identity" (project + building + floor — there's no
//     dedicated unit-number column on Property) — supporting signal.
//
// Owner-identity matching ALONE is not enough to call it a likely
// duplicate (an owner can legitimately have several different units), so
// it only ever produces the weaker SAME_OWNER_DIFFERENT_UNIT tier unless
// property identity also matches.

export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  // Thai mobile numbers are 9 significant digits after any trunk/country
  // prefix (0812345678 / +66812345678 / 66-81-234-5678 all collapse to
  // the same last-9-digits key).
  return digits.length >= 9 ? digits.slice(-9) : null;
}

export function normalizeLineId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase().replace(/^@/, "");
  return v || null;
}

export function normalizeFacebookUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const v = raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "");
  return v || null;
}

export type DupTier = "LIKELY_SAME_UNIT" | "SAME_OWNER_DIFFERENT_UNIT";

export type DupReason =
  | "OWNER_PHONE_MATCH"
  | "OWNER_LINE_MATCH"
  | "OWNER_FACEBOOK_MATCH"
  | "PROJECT_NAME_MATCH"
  | "BUILDING_FLOOR_MATCH"
  | "GEO_PROXIMITY_MATCH";

export interface DupCandidateInput {
  ownerPhone?: string | null;
  ownerLineId?: string | null;
  ownerFacebookUrl?: string | null;
  projectName?: string | null;
  projectId?: number | null;
  building?: string | null;
  floor?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  // When editing an existing property, exclude it from matching itself.
  excludePropertyId?: number | null;
}

export interface DupMatch {
  propertyId: number;
  agentId: number | null;
  titleTh: string;
  projectName: string | null;
  building: string | null;
  floor: number | null;
  tier: DupTier;
  score: number;
  reasons: DupReason[];
}

const GEO_PROXIMITY_KM = 0.05; // ~50m — "same building," not "same neighborhood"

export async function findPossibleDuplicates(input: DupCandidateInput): Promise<DupMatch[]> {
  const phone = normalizePhone(input.ownerPhone);
  const lineId = normalizeLineId(input.ownerLineId);
  const fb = normalizeFacebookUrl(input.ownerFacebookUrl);
  const hasOwnerSignal = !!(phone || lineId || fb);
  const hasPropertySignal = !!(
    input.projectId ||
    (input.projectName && input.projectName.trim()) ||
    (input.building && input.building.trim()) ||
    input.floor != null ||
    (input.latitude != null && input.longitude != null)
  );

  // Never scan the table on an empty/near-empty query.
  if (!hasOwnerSignal && !hasPropertySignal) return [];

  const candidates = await prisma.property.findMany({
    where: input.excludePropertyId ? { id: { not: input.excludePropertyId } } : undefined,
    select: {
      id: true,
      agentId: true,
      titleTh: true,
      ownerPhone: true,
      ownerLineId: true,
      ownerFacebookUrl: true,
      projectName: true,
      projectId: true,
      building: true,
      floor: true,
      latitude: true,
      longitude: true,
      project: { select: { nameTh: true, nameEn: true } },
    },
  });

  const results: DupMatch[] = [];

  for (const c of candidates) {
    const reasons: DupReason[] = [];

    const cPhone = normalizePhone(c.ownerPhone);
    const cLineId = normalizeLineId(c.ownerLineId);
    const cFb = normalizeFacebookUrl(c.ownerFacebookUrl);

    if (phone && cPhone && phone === cPhone) reasons.push("OWNER_PHONE_MATCH");
    if (lineId && cLineId && lineId === cLineId) reasons.push("OWNER_LINE_MATCH");
    if (fb && cFb && fb === cFb) reasons.push("OWNER_FACEBOOK_MATCH");
    const ownerMatch = reasons.length > 0;

    let propertyMatch = false;
    if (input.projectId && c.projectId && input.projectId === c.projectId) {
      propertyMatch = true;
      reasons.push("PROJECT_NAME_MATCH");
    } else {
      const cProjectName = c.projectName || c.project?.nameTh || c.project?.nameEn || "";
      const projectNameMatches =
        !!input.projectName && !!cProjectName && textMatches(input.projectName, cProjectName);
      const buildingMatches =
        !!input.building &&
        !!c.building &&
        input.building.trim().toLowerCase() === c.building.trim().toLowerCase();
      const floorMatches = input.floor != null && c.floor != null && input.floor === c.floor;
      if (projectNameMatches && buildingMatches && floorMatches) {
        propertyMatch = true;
        reasons.push("PROJECT_NAME_MATCH", "BUILDING_FLOOR_MATCH");
      }
    }

    // Geo-proximity only ever adds confidence on top of an already-true
    // propertyMatch — it never substitutes for it, since lat/lng
    // precision varies by who geocoded it and nearby plots in dense
    // Bangkok developments can be different buildings.
    if (
      propertyMatch &&
      input.latitude != null &&
      input.longitude != null &&
      c.latitude != null &&
      c.longitude != null
    ) {
      const d = haversineDistanceKm(input.latitude, input.longitude, Number(c.latitude), Number(c.longitude));
      if (d <= GEO_PROXIMITY_KM) reasons.push("GEO_PROXIMITY_MATCH");
    }

    if (!ownerMatch && !propertyMatch) continue;
    // Property-identity match alone is noise (many unrelated owners list
    // in the same building) — only owner-identity ever surfaces a match.
    if (!ownerMatch) continue;

    const tier: DupTier = propertyMatch ? "LIKELY_SAME_UNIT" : "SAME_OWNER_DIFFERENT_UNIT";
    const score =
      (reasons.includes("OWNER_PHONE_MATCH") ? 40 : 0) +
      (reasons.includes("OWNER_LINE_MATCH") ? 30 : 0) +
      (reasons.includes("OWNER_FACEBOOK_MATCH") ? 30 : 0) +
      (reasons.includes("PROJECT_NAME_MATCH") ? 20 : 0) +
      (reasons.includes("BUILDING_FLOOR_MATCH") ? 20 : 0) +
      (reasons.includes("GEO_PROXIMITY_MATCH") ? 10 : 0);

    results.push({
      propertyId: c.id,
      agentId: c.agentId,
      titleTh: c.titleTh,
      projectName: c.projectName || c.project?.nameTh || null,
      building: c.building,
      floor: c.floor,
      tier,
      score,
      reasons,
    });
  }

  results.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier === "LIKELY_SAME_UNIT" ? -1 : 1;
    return b.score - a.score;
  });

  return results.slice(0, 5);
}
