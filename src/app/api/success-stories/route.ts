import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const stories = await prisma.successStory.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: stories });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const story = await prisma.successStory.create({
      data: {
        titleTh: body.titleTh || body.category || "Success Story",
        titleEn: body.titleEn || null,
        contentTh: body.contentTh || null,
        contentEn: body.contentEn || null,
        imageUrl: body.imageUrl || null,
        propertyImageUrl: body.propertyImageUrl || null,
        category: body.category || "RENT_CONDO",
      },
    });

    return NextResponse.json({ success: true, data: story });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });

    await prisma.successStory.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });

    const story = await prisma.successStory.update({
      where: { id: body.id },
      data: {
        ...(body.titleTh !== undefined && { titleTh: body.titleTh }),
        ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
        ...(body.propertyImageUrl !== undefined && { propertyImageUrl: body.propertyImageUrl }),
        ...(body.category !== undefined && { category: body.category }),
      },
    });

    return NextResponse.json({ success: true, data: story });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Internal server error" }, { status: 500 });
  }
}
