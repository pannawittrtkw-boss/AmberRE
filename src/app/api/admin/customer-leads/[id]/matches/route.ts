import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getStationThaiName, getStationEnName } from "@/lib/stations";

// Scoring weights (total possible = 100)
const SCORE = {
  PROJECT_NAME: 25,
  BUDGET: 25,
  BEDROOMS: 20,
  PROVINCE: 10,
  DISTRICT: 10,
  BTS_STATION: 10,
};

function normalizeText(s: string) {
  return s.toLowerCase().replace(/\s+/g, "").trim();
}

function textMatches(a: string, b: string): boolean {
  const na = normalizeText(a);
  const nb = normalizeText(b);
  return na.includes(nb) || nb.includes(na);
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

  // Fetch all active properties with related data
  const properties = await prisma.property.findMany({
    where: { isSold: false },
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

    // 1. Project name match (25pts)
    if (lead.projectName) {
      const propProject = prop.projectName || prop.project?.nameTh || prop.project?.nameEn || "";
      if (propProject && textMatches(propProject, lead.projectName)) {
        score += SCORE.PROJECT_NAME;
        reasons.push("ชื่อโครงการตรงกัน");
      }
    }

    // 2. Budget match (25pts)
    if (lead.budgetMax || lead.budgetMin) {
      const price = Number(prop.price);
      const min = lead.budgetMin ? Number(lead.budgetMin) : 0;
      const max = lead.budgetMax ? Number(lead.budgetMax) : Infinity;
      // Disqualify if price exceeds max budget by more than 50%
      if (lead.budgetMax && price > Number(lead.budgetMax) * 1.5) {
        return { property: prop, score: -1, reasons: [] };
      }
      if (price >= min && price <= max) {
        score += SCORE.BUDGET;
        reasons.push("ราคาอยู่ในงบประมาณ");
      } else if (lead.budgetMax && price <= Number(lead.budgetMax) * 1.2) {
        score += Math.round(SCORE.BUDGET * 0.4);
        reasons.push("ราคาใกล้เคียงงบประมาณ");
      }
    }

    // 3. Bedrooms — exact match required when specified
    if (lead.bedrooms !== null && lead.bedrooms !== undefined) {
      if (prop.bedrooms === lead.bedrooms) {
        score += SCORE.BEDROOMS;
        reasons.push("จำนวนห้องนอนตรงกัน");
      } else {
        return { property: prop, score: -1, reasons: [] };
      }
    }

    // 4. Province — disqualify ONLY when property HAS province data that doesn't match
    if (lead.province) {
      const propProvince = resolvePropLocation(
        (prop as any).province,
        prop.project?.province,
        prop.address
      );
      if (propProvince) {
        if (textMatches(propProvince, lead.province)) {
          score += SCORE.PROVINCE;
          reasons.push("จังหวัดตรงกัน");
        } else {
          return { property: prop, score: -1, reasons: [] };
        }
      }
      // No province data on property → don't disqualify, give 0 pts
    }

    // 5. District — disqualify ONLY when property HAS district data that doesn't match
    if (lead.district) {
      const propDistrict = resolvePropLocation(
        (prop as any).district,
        prop.project?.district,
        prop.address
      );
      if (propDistrict) {
        if (textMatches(propDistrict, lead.district)) {
          score += SCORE.DISTRICT;
          reasons.push("อำเภอตรงกัน");
        } else {
          return { property: prop, score: -1, reasons: [] };
        }
      }
      // No district data on property → don't disqualify, give 0 pts
    }

    // 6. BTS/MRT station match (10pts)
    const propStationCodes = parseStationCodes(prop.nearbyStations);
    if (lead.btsStation && propStationCodes.length > 0) {
      const stationNames = lead.btsStation.split(",").map((s) => s.trim()).filter(Boolean);
      const matched = propStationCodes.some((code) =>
        stationNames.some(
          (name) =>
            textMatches(getStationThaiName(code), name) ||
            textMatches(getStationEnName(code), name)
        )
      );
      if (matched) {
        score += SCORE.BTS_STATION;
        reasons.push("สถานี BTS/MRT ตรงกัน");
      }
    }

    // Older listings are more likely to already be rented out, so decay
    // the score the longer a property has sat in the system unrefreshed.
    const daysPosted = Math.floor(
      (Date.now() - new Date(prop.listedAt || prop.createdAt).getTime()) / 86400000
    );
    const freshnessFactor =
      daysPosted > 90 ? 0.7 : daysPosted > 30 ? 0.85 : daysPosted > 7 ? 0.95 : 1;
    score = Math.round(score * freshnessFactor);

    return { property: prop, score, reasons };
  });

  const results = scored
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map(({ property, score, reasons }) => ({
      id: property.id,
      titleTh: property.titleTh,
      titleEn: property.titleEn,
      propertyType: property.propertyType,
      listingType: property.listingType,
      price: property.price,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      sizeSqm: property.sizeSqm,
      projectName: property.projectName,
      address: property.address,
      province: (property as any).province ?? null,
      district: (property as any).district ?? null,
      primaryImage: property.images[0]?.imageUrl ?? null,
      createdAt: property.createdAt,
      listedAt: property.listedAt,
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
    }));

  return NextResponse.json({ success: true, data: results, total: results.length });
}
