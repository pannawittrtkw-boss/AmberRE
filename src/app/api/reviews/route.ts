import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId");

    const where: any = { isApproved: true };
    if (propertyId) where.propertyId = parseInt(propertyId);

    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true } },
        property: { select: { titleTh: true, titleEn: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: reviews });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { propertyId, rating, comment, name, anonymous } = body;

    if (!propertyId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: "Invalid data" }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        propertyId,
        userId: session?.user ? Number((session.user as any).id) : null,
        rating,
        comment: comment || null,
        name: anonymous ? null : (typeof name === "string" && name.trim() ? name.trim().slice(0, 200) : null),
      },
    });

    return NextResponse.json({ success: true, data: review }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
