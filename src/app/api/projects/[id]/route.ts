import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id: parseInt(id) },
      include: {
        properties: {
          where: {
            // Exclude not-available statuses from public view
            status: { notIn: ["NOT_ACCEPT", "NOT_AVAILABLE", "PENDING"] },
          },
          select: {
            id: true,
            titleTh: true,
            titleEn: true,
            propertyType: true,
            listingType: true,
            price: true,
            salePrice: true,
            bedrooms: true,
            bathrooms: true,
            sizeSqm: true,
            floor: true,
            building: true,
            status: true,
            isSold: true,
            estCode: true,
            createdAt: true,
            images: {
              take: 5,
              orderBy: { sortOrder: "asc" },
              select: { imageUrl: true, isPrimary: true },
            },
          },
          orderBy: { id: "desc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...project,
        latitude: project.latitude ? Number(project.latitude) : null,
        longitude: project.longitude ? Number(project.longitude) : null,
        ceilingHeight: project.ceilingHeight ? Number(project.ceilingHeight) : null,
        properties: project.properties.map((p) => ({
          ...p,
          price: p.price ? Number(p.price) : null,
          salePrice: p.salePrice ? Number(p.salePrice) : null,
          sizeSqm: p.sizeSqm ? Number(p.sizeSqm) : null,
        })),
      },
    });
  } catch (error: unknown) {
    console.error("Public project GET error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
