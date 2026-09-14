import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { matchStationsInText } from "@/lib/stations";

export const runtime = "nodejs";
export const maxDuration = 60;

function parseStations(json: string | null): string[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// GET — list of eligible (status VERIFIED) properties with current field
// values, so the preview page can show current -> suggested side by side.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const properties = await prisma.property.findMany({
    where: { status: "VERIFIED" },
    select: {
      id: true,
      titleTh: true,
      projectName: true,
      propertyType: true,
      listingType: true,
      price: true,
      salePrice: true,
      nearbyStations: true,
    },
    orderBy: { id: "desc" },
  });

  return NextResponse.json({
    success: true,
    data: properties.map((p) => ({
      id: p.id,
      titleTh: p.titleTh,
      projectName: p.projectName,
      propertyType: p.propertyType,
      listingType: p.listingType,
      price: Number(p.price),
      salePrice: p.salePrice ? Number(p.salePrice) : null,
      nearbyStations: parseStations(p.nearbyStations),
    })),
  });
}

// POST — build suggestions for a batch of property ids. No AI call: every
// property under review here is a condo-rental listing from before the
// site handled sale/other types, so propertyType/listingType are always
// CONDO/RENT and price/salePrice are left untouched. The only thing
// actually derived from the property's own text is nearbyStations, via a
// free deterministic name match (see matchStationsInText).
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const ids: number[] = Array.isArray(body?.ids) ? body.ids.map((n: unknown) => Number(n)).filter(Number.isFinite) : [];
  if (ids.length === 0) {
    return NextResponse.json({ success: false, error: "ids required" }, { status: 400 });
  }

  const properties = await prisma.property.findMany({ where: { id: { in: ids } } });

  const results = properties.map((p) => {
    const currentStations = parseStations(p.nearbyStations);
    const textBlob = [p.titleTh, p.titleEn, p.projectName, p.address, p.descriptionTh, p.note]
      .filter(Boolean)
      .join(" ");
    const matchedStations = matchStationsInText(textBlob);

    const suggested = {
      propertyType: "CONDO",
      listingType: "RENT",
      price: Number(p.price),
      salePrice: null,
      nearbyStations: matchedStations.length > 0 ? matchedStations : currentStations,
    };

    return { id: p.id, success: true, suggested };
  });

  return NextResponse.json({ success: true, data: results });
}
