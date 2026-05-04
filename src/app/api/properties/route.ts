import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get("keyword") || "";
    const listingType = searchParams.get("listingType") || "";
    const propertyType = searchParams.get("propertyType") || "";
    const buildingType = searchParams.get("buildingType") || "";
    const condition = searchParams.get("condition") || "";
    const hideSold = searchParams.get("hideSold") === "true";
    const stationId = searchParams.get("stationId");
    const stationsParam = searchParams.get("stations") || "";
    const amenityIds = searchParams.get("amenityIds");
    const kitchenPartition = searchParams.get("kitchenPartition") === "true";
    const bedroomPartition = searchParams.get("bedroomPartition") === "true";
    const featured = searchParams.get("featured") === "true";
    const popular = searchParams.get("popular") === "true";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    // Support fetching by specific IDs (for favorites)
    const idsParam = searchParams.get("ids");
    if (idsParam) {
      const ids = idsParam.split(",").map(Number).filter(Boolean);
      const properties = await prisma.property.findMany({
        where: { id: { in: ids } },
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          propertyAmenities: { include: { amenity: true } },
        },
      });
      return NextResponse.json({ success: true, data: properties });
    }

    const where: any = {};

    if (keyword) {
      where.OR = [
        { titleTh: { contains: keyword } },
        { titleEn: { contains: keyword } },
        { projectName: { contains: keyword } },
        { address: { contains: keyword } },
      ];
    }
    if (listingType) where.listingType = listingType;
    if (propertyType) where.propertyType = propertyType;
    if (buildingType) where.buildingType = buildingType;
    if (condition) where.condition = condition;
    if (hideSold) where.isSold = false;
    if (kitchenPartition) where.kitchenPartition = true;
    if (bedroomPartition) where.bedroomPartition = true;
    if (featured) where.isFeatured = true;
    if (popular) where.isPopular = true;
    if (status) where.status = status;

    if (stationId) {
      where.propertyStations = {
        some: { stationId: parseInt(stationId) },
      };
    }

    // Filter by station codes stored as JSON in nearbyStations (e.g. ["E16","BL22"])
    if (stationsParam) {
      const codes = stationsParam.split(",").filter(Boolean);
      if (codes.length > 0) {
        where.OR = [
          ...(where.OR || []),
          ...codes.map((code) => ({
            nearbyStations: { contains: `"${code}"` },
          })),
        ];
      }
    }

    if (amenityIds) {
      const ids = amenityIds.split(",").map(Number);
      where.propertyAmenities = {
        some: { amenityId: { in: ids } },
      };
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          owner: { select: { id: true, firstName: true, lastName: true } },
          agent: { select: { id: true, firstName: true, lastName: true } },
          propertyAmenities: { include: { amenity: true } },
          propertyStations: { include: { station: true } },
          project: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.property.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: properties,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Properties GET error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = Number((session.user as any).id);
    const role = (session.user as any).role;

    if (!["OWNER", "AGENT", "ADMIN"].includes(role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      titleTh, titleEn, descriptionTh, descriptionEn,
      propertyType, buildingType, listingType, price,
      sizeSqm, bedrooms, bathrooms, floor,
      kitchenPartition, bedroomPartition, projectName,
      address, latitude, longitude, amenityIds, stationIds,
      salePrice, sourceLink, linkPage, building, postFrom,
      furnitureDetails, electricalAppliances, facilities,
      ownerName, ownerPhone, ownerLineId, ownerFacebookUrl,
      coAgentName, coAgentPhone, coAgentLineId, coAgentFacebookUrl,
      status, category, priority, note, imageUrls, projectId,
      condition, landSizeRai, landSizeNgan, landSizeWa,
    } = body;

    const property = await prisma.property.create({
      data: {
        titleTh,
        titleEn: titleEn || null,
        descriptionTh: descriptionTh || null,
        descriptionEn: descriptionEn || null,
        propertyType,
        buildingType: buildingType || "NONE",
        listingType,
        condition: condition || null,
        landSizeRai: landSizeRai || null,
        landSizeNgan: landSizeNgan || null,
        landSizeWa: landSizeWa || null,
        price,
        salePrice: salePrice || null,
        sizeSqm: sizeSqm || null,
        bedrooms: bedrooms || 0,
        bathrooms: bathrooms || 0,
        floor: floor || null,
        kitchenPartition: kitchenPartition || false,
        bedroomPartition: bedroomPartition || false,
        projectName: projectName || null,
        projectId: projectId || null,
        address: address || null,
        latitude: latitude || null,
        longitude: longitude || null,
        sourceLink: sourceLink || null,
        linkPage: linkPage || null,
        building: building || null,
        postFrom: postFrom || "OWNER",
        furnitureDetails: furnitureDetails ? JSON.stringify(furnitureDetails) : null,
        electricalAppliances: electricalAppliances ? JSON.stringify(electricalAppliances) : null,
        facilities: facilities ? JSON.stringify(facilities) : null,
        ownerName: ownerName || null,
        ownerPhone: ownerPhone || null,
        ownerLineId: ownerLineId || null,
        ownerFacebookUrl: ownerFacebookUrl || null,
        coAgentName: coAgentName || null,
        coAgentPhone: coAgentPhone || null,
        coAgentLineId: coAgentLineId || null,
        coAgentFacebookUrl: coAgentFacebookUrl || null,
        status: status || "PENDING",
        category: category || "NORMAL",
        priority: priority || "NORMAL",
        note: note || null,
        ownerId: role === "OWNER" ? userId : userId,
        agentId: role === "AGENT" ? userId : null,
        ...(amenityIds?.length && {
          propertyAmenities: {
            create: amenityIds.map((id: number) => ({ amenityId: id })),
          },
        }),
        ...(imageUrls?.length && {
          images: {
            create: imageUrls.map((url: string, index: number) => ({
              imageUrl: url,
              sortOrder: index,
              isPrimary: index === 0,
            })),
          },
        }),
        nearbyStations: stationIds?.length ? JSON.stringify(stationIds) : null,
      },
      include: {
        images: true,
        propertyAmenities: { include: { amenity: true } },
      },
    });

    return NextResponse.json({ success: true, data: property }, { status: 201 });
  } catch (error) {
    console.error("Properties POST error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
