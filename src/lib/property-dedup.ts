import prisma from "@/lib/prisma";
import { haversineDistanceKm } from "@/lib/geo";
import { textMatches } from "@/lib/text-match";

// Duplicate detection for property submissions.
//
// Three signals, in order of certainty:
//   - "source link" (the original post URL, e.g. a Facebook post) — an
//     exact match here means this is objectively the same listing
//     re-entered, not a judgment call. CONFIRMED_DUPLICATE, and the
//     create/update API routes hard-block on this (see
//     findExactSourceLinkMatch below) — the live check here is advisory
//     UX, not the actual enforcement.
//   - "owner identity" (phone / LINE ID / Facebook link) — a real owner
//     has one identity no matter who lists them. Strong but not certain.
//   - "property identity" (project + building + floor — there's no
//     dedicated unit-number column on Property) — supporting signal.
//
// Warning-only for the owner/property tiers — never blocks submission,
// since CO_AGENT rows already require admin verification before going
// live, so the admin gets a second look regardless. Owner-identity
// matching ALONE is not enough to call it a likely duplicate (an owner
// can legitimately have several different units), so it only ever
// produces the weaker SAME_OWNER_DIFFERENT_UNIT tier unless property
// identity also matches.

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

// Source-link matching needs more than a single normalized string: a
// Facebook post commonly has several different URL shapes that all point
// at the exact same post — a short share link (facebook.com/share/p/xxxx)
// that resolves via redirect to a long-form permalink
// (facebook.com/groups/<id>/permalink/<id>/...), with the long form often
// embedding the original short link back as a share_url/u query param for
// attribution. Two agents pasting "the same post" can easily end up with
// two strings that share no substring at all. So instead of normalizing
// to one canonical string, this collects every plausible identity a URL
// could represent, and a match is any overlap between two URLs' variant
// sets.
function sourceLinkVariants(raw: string | null | undefined): Set<string> {
  const variants = new Set<string>();
  if (!raw) return variants;
  const trimmed = raw.trim();
  if (!trimmed) return variants;

  const stripHost = (v: string) =>
    v.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");

  // Full form, query string and all, trailing slash stripped.
  const full = stripHost(trimmed).replace(/\/+$/, "");
  if (full) variants.add(full);

  // Path-only form (query string and fragment stripped) — covers two
  // links to the identical path that differ only by tracking params
  // (mibextid, rdid, utm_*, etc.).
  const pathOnly = stripHost(trimmed.split("#")[0].split("?")[0]).replace(/\/+$/, "");
  if (pathOnly) variants.add(pathOnly);

  // If a share_url/u query param embeds another canonical link (Facebook's
  // "view in group" expansion does this), recurse into it too so it's
  // matched against the original short link it was expanded from.
  const qIndex = trimmed.indexOf("?");
  if (qIndex !== -1) {
    try {
      const params = new URLSearchParams(trimmed.slice(qIndex));
      for (const key of ["share_url", "u"]) {
        const embedded = params.get(key);
        if (embedded) {
          for (const v of sourceLinkVariants(embedded)) variants.add(v);
        }
      }
    } catch {
      // Malformed query string — the other variants still apply.
    }
  }

  return variants;
}

function sourceLinksMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const va = sourceLinkVariants(a);
  if (va.size === 0) return false;
  const vb = sourceLinkVariants(b);
  for (const v of vb) {
    if (va.has(v)) return true;
  }
  return false;
}

export type DupTier = "CONFIRMED_DUPLICATE" | "LIKELY_SAME_UNIT" | "SAME_OWNER_DIFFERENT_UNIT";

export type DupReason =
  | "SOURCE_LINK_MATCH"
  | "SOURCE_LINK_SCANLINK_MATCH"
  | "OWNER_PHONE_MATCH"
  | "OWNER_LINE_MATCH"
  | "OWNER_FACEBOOK_MATCH"
  | "PROJECT_NAME_MATCH"
  | "BUILDING_FLOOR_MATCH"
  | "GEO_PROXIMITY_MATCH";

export interface DupCandidateInput {
  sourceLink?: string | null;
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
  source: "PROPERTY" | "SCANLINK";
  // null when source === "SCANLINK" — a link logged in the LINE-bot intake
  // (ScanLink) history doesn't necessarily have a Property yet.
  propertyId: number | null;
  agentId: number | null;
  titleTh: string;
  projectName: string | null;
  building: string | null;
  floor: number | null;
  tier: DupTier;
  score: number;
  reasons: DupReason[];
  // ScanLink-only context, shown instead of the Property fields above.
  scanlinkStatus?: string;
  scanlinkSentBy?: string | null;
  scanlinkSentAt?: Date;
}

export interface ScanlinkMatch {
  id: number;
  status: string;
  sentBy: string | null;
  sentAt: Date;
}

// ScanLink is the LINE-bot lead-intake log (src/app/api/line/url-checker,
// src/app/[locale]/admin/scanlink) — staff post candidate listing links
// into a company LINE group, and every URL gets logged to
// LineUrlHistory regardless of whether it's ever turned into a Property.
// A link already present there (any status) means someone already
// logged/claimed that lead, which counts as a duplicate just as much as
// an exact match against an existing Property.
export async function findScanlinkMatch(
  sourceLink: string | null | undefined,
  // When checking from within the ScanLink accept flow itself, exclude
  // the very LineUrlHistory row being accepted — otherwise every accept
  // would "match" against its own log entry.
  excludeId?: number | null
): Promise<ScanlinkMatch | null> {
  if (!sourceLink || !sourceLink.trim()) return null;

  const rows = await prisma.lineUrlHistory.findMany({
    where: excludeId ? { id: { not: excludeId } } : undefined,
    select: { id: true, url: true, status: true, sentBy: true, sentAt: true },
  });
  const match = rows.find((r) => sourceLinksMatch(sourceLink, r.url));
  return match ? { id: match.id, status: match.status, sentBy: match.sentBy, sentAt: match.sentAt } : null;
}

const GEO_PROXIMITY_KM = 0.05; // ~50m — "same building," not "same neighborhood"

export async function findPossibleDuplicates(input: DupCandidateInput): Promise<DupMatch[]> {
  const hasSourceLink = !!(input.sourceLink && input.sourceLink.trim());
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
  if (!hasSourceLink && !hasOwnerSignal && !hasPropertySignal) return [];

  const candidates = await prisma.property.findMany({
    where: input.excludePropertyId ? { id: { not: input.excludePropertyId } } : undefined,
    select: {
      id: true,
      agentId: true,
      titleTh: true,
      sourceLink: true,
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

    const sourceLinkMatch = hasSourceLink && sourceLinksMatch(input.sourceLink, c.sourceLink);
    if (sourceLinkMatch) reasons.push("SOURCE_LINK_MATCH");

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

    if (!sourceLinkMatch && !ownerMatch && !propertyMatch) continue;
    // Property-identity match alone (without a source-link or owner-
    // identity match) is noise — many unrelated owners list in the same
    // building — so it never surfaces by itself.
    if (!sourceLinkMatch && !ownerMatch) continue;

    const tier: DupTier = sourceLinkMatch
      ? "CONFIRMED_DUPLICATE"
      : propertyMatch
      ? "LIKELY_SAME_UNIT"
      : "SAME_OWNER_DIFFERENT_UNIT";
    const score =
      (reasons.includes("SOURCE_LINK_MATCH") ? 1000 : 0) +
      (reasons.includes("OWNER_PHONE_MATCH") ? 40 : 0) +
      (reasons.includes("OWNER_LINE_MATCH") ? 30 : 0) +
      (reasons.includes("OWNER_FACEBOOK_MATCH") ? 30 : 0) +
      (reasons.includes("PROJECT_NAME_MATCH") ? 20 : 0) +
      (reasons.includes("BUILDING_FLOOR_MATCH") ? 20 : 0) +
      (reasons.includes("GEO_PROXIMITY_MATCH") ? 10 : 0);

    results.push({
      source: "PROPERTY",
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

  // Also check the ScanLink lead-intake log — a link already logged
  // there (independent of whether it was ever turned into a Property)
  // is just as much a duplicate as an exact Property.sourceLink match.
  if (hasSourceLink) {
    const scanMatch = await findScanlinkMatch(input.sourceLink);
    if (scanMatch) {
      results.push({
        source: "SCANLINK",
        propertyId: null,
        agentId: null,
        titleTh: "",
        projectName: null,
        building: null,
        floor: null,
        tier: "CONFIRMED_DUPLICATE",
        score: 1000,
        reasons: ["SOURCE_LINK_SCANLINK_MATCH"],
        scanlinkStatus: scanMatch.status,
        scanlinkSentBy: scanMatch.sentBy,
        scanlinkSentAt: scanMatch.sentAt,
      });
    }
  }

  const TIER_RANK: Record<DupTier, number> = {
    CONFIRMED_DUPLICATE: 0,
    LIKELY_SAME_UNIT: 1,
    SAME_OWNER_DIFFERENT_UNIT: 2,
  };
  results.sort((a, b) => {
    if (a.tier !== b.tier) return TIER_RANK[a.tier] - TIER_RANK[b.tier];
    return b.score - a.score;
  });

  return results.slice(0, 5);
}

export type SourceLinkConflict =
  | { source: "PROPERTY"; id: number; titleTh: string; status: string | null; agentId: number | null }
  | { source: "SCANLINK"; id: number; status: string; sentBy: string | null; sentAt: Date };

// Lightweight, authoritative check used by the create/update API routes
// to actually enforce the block — the live findPossibleDuplicates call
// from the form is advisory UX, this is the real gate. An exact
// (normalized) sourceLink match is objectively the same listing, so this
// alone is grounds to reject the request outright, regardless of status
// (PENDING/VERIFIED/REVIEW/etc. all count, and so does a link that was
// only ever logged in ScanLink and never turned into a Property).
export async function findExactSourceLinkMatch(
  sourceLink: string | null | undefined,
  excludePropertyId?: number | null,
  excludeScanlinkId?: number | null
): Promise<SourceLinkConflict | null> {
  if (!sourceLink || !sourceLink.trim()) return null;

  const candidates = await prisma.property.findMany({
    where: {
      sourceLink: { not: null },
      ...(excludePropertyId ? { id: { not: excludePropertyId } } : {}),
    },
    select: { id: true, titleTh: true, status: true, agentId: true, sourceLink: true },
  });

  const match = candidates.find((c) => sourceLinksMatch(sourceLink, c.sourceLink));
  if (match) {
    return { source: "PROPERTY", id: match.id, titleTh: match.titleTh, status: match.status, agentId: match.agentId };
  }

  const scanMatch = await findScanlinkMatch(sourceLink, excludeScanlinkId);
  if (scanMatch) {
    return { source: "SCANLINK", id: scanMatch.id, status: scanMatch.status, sentBy: scanMatch.sentBy, sentAt: scanMatch.sentAt };
  }

  return null;
}
