import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const projects = await prisma.project.findMany({
      where: search
        ? {
            OR: [
              { nameTh: { contains: search, mode: "insensitive" } },
              { nameEn: { contains: search, mode: "insensitive" } },
              { developer: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      include: {
        _count: { select: { properties: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: projects.map((p) => ({
        ...p,
        latitude: p.latitude ? Number(p.latitude) : null,
        longitude: p.longitude ? Number(p.longitude) : null,
        ceilingHeight: p.ceilingHeight ? Number(p.ceilingHeight) : null,
      })),
    });
  } catch (error: unknown) {
    console.error("Projects GET error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const project = await prisma.project.create({
      data: sanitizeProjectData(body),
    });
    return NextResponse.json({ success: true, data: project });
  } catch (error: unknown) {
    console.error("Projects POST error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

function sanitizeProjectData(body: any) {
  return {
    nameTh: body.nameTh || "",
    nameEn: body.nameEn || null,
    descriptionTh: body.descriptionTh || null,
    descriptionEn: body.descriptionEn || null,
    developer: body.developer || null,
    imageUrl: body.imageUrl || null,
    logoUrl: body.logoUrl || null,
    latitude: body.latitude ? parseFloat(body.latitude) : null,
    longitude: body.longitude ? parseFloat(body.longitude) : null,
    isPopular: body.isPopular || false,
    location: body.location || null,
    fullAddress: body.fullAddress || null,
    province: body.province || null,
    district: body.district || null,
    projectArea: body.projectArea || null,
    googleMapsUrl: body.googleMapsUrl || null,
    ceilingHeight: body.ceilingHeight ? parseFloat(body.ceilingHeight) : null,
    utilityFee: body.utilityFee || null,
    buildings: body.buildings ? parseInt(body.buildings) : null,
    parking: body.parking ? parseInt(body.parking) : null,
    floors: body.floors ? parseInt(body.floors) : null,
    totalUnits: body.totalUnits ? parseInt(body.totalUnits) : null,
    yearCompleted: body.yearCompleted ? parseInt(body.yearCompleted) : null,
    facilities: body.facilities ? JSON.stringify(body.facilities) : null,
    unitTypes: body.unitTypes ? JSON.stringify(body.unitTypes) : null,
    photoAlbum: body.photoAlbum ? JSON.stringify(body.photoAlbum) : null,
    nearbyPlaces: body.nearbyPlaces ? JSON.stringify(body.nearbyPlaces) : null,
  };
}

