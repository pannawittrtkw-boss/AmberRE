import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

function requireAgent(session: any) {
  const role = (session?.user as any)?.role;
  return role === "CO_AGENT" || role === "ADMIN";
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !requireAgent(session)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const userId = Number((session.user as any).id);
    const properties = await prisma.property.findMany({
      where: { agentId: userId },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
    });

    const result = properties.map((p) => ({
      ...p,
      price: Number(p.price),
      salePrice: p.salePrice ? Number(p.salePrice) : null,
      sizeSqm: p.sizeSqm ? Number(p.sizeSqm) : null,
    }));

    return NextResponse.json({ success: true, data: result });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !requireAgent(session)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const userId = Number((session.user as any).id);
    const body = await req.json();

    const {
      titleTh, titleEn, descriptionTh, descriptionEn,
      propertyType, listingType, price, salePrice,
      bedrooms, bathrooms, sizeSqm, floor, building,
      projectName, address, availableDate,
      ownerName, ownerPhone, ownerLineId,
      note,
    } = body;

    if (!titleTh || !propertyType || !listingType || !price) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const property = await prisma.property.create({
      data: {
        titleTh,
        titleEn: titleEn || null,
        descriptionTh: descriptionTh || null,
        descriptionEn: descriptionEn || null,
        propertyType,
        listingType,
        price,
        salePrice: salePrice || null,
        bedrooms: bedrooms ? Number(bedrooms) : 0,
        bathrooms: bathrooms ? Number(bathrooms) : 0,
        sizeSqm: sizeSqm || null,
        floor: floor ? Number(floor) : null,
        building: building || null,
        projectName: projectName || null,
        address: address || null,
        availableDate: availableDate ? new Date(availableDate) : null,
        ownerName: ownerName || null,
        ownerPhone: ownerPhone || null,
        ownerLineId: ownerLineId || null,
        note: note || null,
        status: "PENDING",
        postFrom: "CO_AGENT",
        ownerId: userId,
        agentId: userId,
      },
    });

    return NextResponse.json({ success: true, data: { ...property, price: Number(property.price) } }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
