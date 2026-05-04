import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
            status: true,
            images: { take: 1, select: { imageUrl: true } },
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
    console.error("Project GET error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const project = await prisma.project.update({
      where: { id: parseInt(id) },
      data: sanitizeProjectData(body),
    });
    return NextResponse.json({ success: true, data: project });
  } catch (error: unknown) {
    console.error("Project PUT error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.project.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Project DELETE error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
