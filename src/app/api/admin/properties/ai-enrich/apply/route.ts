import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

const PROPERTY_TYPES = ["CONDO", "HOUSE", "TOWNHOUSE", "LAND"];
const LISTING_TYPES = ["RENT", "SALE", "RENT_AND_SALE"];

interface UpdatePayload {
  id: number;
  propertyType?: string;
  listingType?: string;
  price?: number;
  salePrice?: number | null;
  nearbyStations?: string[];
}

// Applies only the specific fields an admin checked off in the AI-enrich
// preview — never touches anything else on the property.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const updates: UpdatePayload[] = Array.isArray(body?.updates) ? body.updates : [];
  if (updates.length === 0) {
    return NextResponse.json({ success: false, error: "updates required" }, { status: 400 });
  }

  let applied = 0;
  const errors: string[] = [];

  for (const u of updates) {
    const id = Number(u.id);
    if (!Number.isFinite(id)) continue;

    const data: Record<string, unknown> = {};
    if (u.propertyType !== undefined && PROPERTY_TYPES.includes(u.propertyType)) data.propertyType = u.propertyType;
    if (u.listingType !== undefined && LISTING_TYPES.includes(u.listingType)) data.listingType = u.listingType;
    if (u.price !== undefined && typeof u.price === "number" && u.price > 0) data.price = u.price;
    if (u.salePrice !== undefined) data.salePrice = typeof u.salePrice === "number" && u.salePrice > 0 ? u.salePrice : null;
    if (u.nearbyStations !== undefined && Array.isArray(u.nearbyStations)) {
      data.nearbyStations = u.nearbyStations.length ? JSON.stringify(u.nearbyStations) : null;
    }

    if (Object.keys(data).length === 0) continue;

    try {
      await prisma.property.update({ where: { id }, data });
      applied++;
    } catch (err) {
      console.error(`[ai-enrich/apply] property ${id} failed:`, err);
      errors.push(`Property #${id}: update failed`);
    }
  }

  return NextResponse.json({ success: true, data: { applied, errors } });
}
