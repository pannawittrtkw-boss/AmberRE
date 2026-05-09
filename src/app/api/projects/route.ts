import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const province = searchParams.get("province") || "";

    const projects = await prisma.project.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { nameTh: { contains: search, mode: "insensitive" } },
                  { nameEn: { contains: search, mode: "insensitive" } },
                  { developer: { contains: search, mode: "insensitive" } },
                  { location: { contains: search, mode: "insensitive" } },
                  { district: { contains: search, mode: "insensitive" } },
                ],
              }
            : {},
          province ? { province: { contains: province, mode: "insensitive" } } : {},
        ],
      },
      select: {
        id: true,
        nameTh: true,
        nameEn: true,
        developer: true,
        imageUrl: true,
        logoUrl: true,
        location: true,
        province: true,
        district: true,
        totalUnits: true,
        floors: true,
        yearCompleted: true,
        isPopular: true,
        _count: { select: { properties: true } },
      },
      orderBy: [{ isPopular: "desc" }, { createdAt: "desc" }],
    });

    // Compute sales/rents counts per project (excluding sold/unavailable)
    const projectIds = projects.map((p) => p.id);
    const counts = projectIds.length
      ? await prisma.property.groupBy({
          by: ["projectId", "listingType"],
          where: {
            projectId: { in: projectIds },
            status: { notIn: ["NOT_ACCEPT", "NOT_AVAILABLE", "PENDING", "SOLD", "RENTED"] },
            isSold: false,
          },
          _count: { _all: true },
        })
      : [];

    // Map counts: rent = RENT or RENT_AND_SALE; sale = SALE or RENT_AND_SALE
    const countsByProject = new Map<number, { sales: number; rents: number }>();
    for (const c of counts) {
      if (c.projectId == null) continue;
      const n = c._count?._all ?? 0;
      const cur = countsByProject.get(c.projectId) || { sales: 0, rents: 0 };
      if (c.listingType === "RENT") cur.rents += n;
      else if (c.listingType === "SALE") cur.sales += n;
      else if (c.listingType === "RENT_AND_SALE") {
        cur.rents += n;
        cur.sales += n;
      }
      countsByProject.set(c.projectId, cur);
    }

    const enriched = projects.map((p) => ({
      ...p,
      salesCount: countsByProject.get(p.id)?.sales || 0,
      rentsCount: countsByProject.get(p.id)?.rents || 0,
    }));

    return NextResponse.json({ success: true, data: enriched });
  } catch (error: unknown) {
    console.error("Public projects GET error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
