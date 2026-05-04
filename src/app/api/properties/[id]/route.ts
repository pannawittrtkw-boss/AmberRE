import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const property = await prisma.property.findUnique({
      where: { id: parseInt(id) },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        owner: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
        agent: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
        propertyAmenities: { include: { amenity: true } },
        propertyStations: { include: { station: true } },
        project: true,
        reviews: {
          where: { isApproved: true },
          include: { user: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!property) {
      return NextResponse.json({ success: false, error: "Property not found" }, { status: 404 });
    }

    // Increment views
    await prisma.property.update({
      where: { id: parseInt(id) },
      data: { views: { increment: 1 } },
    });

    return NextResponse.json({ success: true, data: property });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const userId = Number((session.user as any).id);
    const role = (session.user as any).role;

    const existing = await prisma.property.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    if (role !== "ADMIN" && existing.ownerId !== userId && existing.agentId !== userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { amenityIds, stationIds, imageUrls, furnitureDetails, electricalAppliances, facilities, ...rawData } = body;

    // Build clean update data - only include known Property fields
    const updateData: any = {};
    const stringFields = [
      "titleTh", "titleEn", "descriptionTh", "descriptionEn",
      "propertyType", "buildingType", "listingType", "priceUnit",
      "condition",
      "estCode", "projectName", "address",
      "sourceLink", "linkPage", "building", "postFrom",
      "ownerName", "ownerPhone", "ownerLineId", "ownerFacebookUrl",
      "coAgentName", "coAgentPhone", "coAgentLineId", "coAgentFacebookUrl",
      "status", "category", "priority", "note",
    ];
    const boolFields = [
      "kitchenPartition", "bedroomPartition", "isFeatured", "isPopular", "isSold",
    ];
    const intFields = ["bedrooms", "bathrooms", "floor", "views", "projectId"];

    for (const key of stringFields) {
      if (rawData[key] !== undefined) updateData[key] = rawData[key];
    }
    for (const key of boolFields) {
      if (rawData[key] !== undefined) updateData[key] = Boolean(rawData[key]);
    }
    for (const key of intFields) {
      if (rawData[key] !== undefined) updateData[key] = rawData[key] !== null ? Number(rawData[key]) : null;
    }
    if (rawData.price !== undefined) updateData.price = Number(rawData.price) || 0;
    if (rawData.salePrice !== undefined) updateData.salePrice = rawData.salePrice !== null ? Number(rawData.salePrice) : null;
    if (rawData.sizeSqm !== undefined) updateData.sizeSqm = rawData.sizeSqm !== null ? Number(rawData.sizeSqm) : null;
    if (rawData.landSizeRai !== undefined) updateData.landSizeRai = rawData.landSizeRai !== null ? Number(rawData.landSizeRai) : null;
    if (rawData.landSizeNgan !== undefined) updateData.landSizeNgan = rawData.landSizeNgan !== null ? Number(rawData.landSizeNgan) : null;
    if (rawData.landSizeWa !== undefined) updateData.landSizeWa = rawData.landSizeWa !== null ? Number(rawData.landSizeWa) : null;
    if (rawData.latitude !== undefined) updateData.latitude = rawData.latitude !== null ? Number(rawData.latitude) : null;
    if (rawData.longitude !== undefined) updateData.longitude = rawData.longitude !== null ? Number(rawData.longitude) : null;
    if (rawData.availableDate !== undefined) updateData.availableDate = rawData.availableDate ? new Date(rawData.availableDate) : null;

    // JSON stringify arrays
    if (furnitureDetails !== undefined) {
      updateData.furnitureDetails = Array.isArray(furnitureDetails) ? JSON.stringify(furnitureDetails) : furnitureDetails;
    }
    if (electricalAppliances !== undefined) {
      updateData.electricalAppliances = Array.isArray(electricalAppliances) ? JSON.stringify(electricalAppliances) : electricalAppliances;
    }
    if (facilities !== undefined) {
      updateData.facilities = Array.isArray(facilities) ? JSON.stringify(facilities) : facilities;
    }
    // Save nearby stations as JSON text
    if (stationIds !== undefined) {
      updateData.nearbyStations = Array.isArray(stationIds) ? JSON.stringify(stationIds) : stationIds;
    }

    const property = await prisma.property.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { images: true, propertyAmenities: { include: { amenity: true } } },
    });

    if (amenityIds) {
      await prisma.propertyAmenity.deleteMany({ where: { propertyId: parseInt(id) } });
      await prisma.propertyAmenity.createMany({
        data: amenityIds.map((amenityId: number) => ({ propertyId: parseInt(id), amenityId })),
      });
    }

    if (imageUrls?.length) {
      // Delete all existing images and recreate with new order
      await prisma.propertyImage.deleteMany({ where: { propertyId: parseInt(id) } });
      await prisma.propertyImage.createMany({
        data: imageUrls.map((url: string, index: number) => ({
          propertyId: parseInt(id),
          imageUrl: url,
          sortOrder: index,
          isPrimary: index === 0,
        })),
      });
    }

    return NextResponse.json({ success: true, data: property });
  } catch (error: any) {
    console.error("PUT /api/properties/[id] error:", error?.message || error);
    return NextResponse.json({ success: false, error: error?.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = Number((session.user as any).id);
    const role = (session.user as any).role;

    const existing = await prisma.property.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    if (role !== "ADMIN" && existing.ownerId !== userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await prisma.property.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
