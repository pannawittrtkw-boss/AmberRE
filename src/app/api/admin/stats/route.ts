import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const in45Days = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);

    const [
      totalProperties,
      totalUsers,
      pendingApprovals,
      viewsResult,
      recentProperties,
      exclusiveCount,
      exclusiveList,
      exclusiveExpiringSoon,
      activeContractsCount,
    ] = await Promise.all([
      prisma.property.count(),
      prisma.user.count(),
      prisma.coAgentApplication.count({ where: { status: "PENDING" } }),
      prisma.property.aggregate({ _sum: { views: true } }),
      prisma.property.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, titleTh: true, propertyType: true, listingType: true, price: true, isSold: true, createdAt: true },
      }),
      prisma.property.count({ where: { isExclusive: true } }),
      prisma.property.findMany({
        where: { isExclusive: true },
        orderBy: { exclusiveEndDate: "asc" },
        select: {
          id: true,
          titleTh: true,
          projectName: true,
          building: true,
          floor: true,
          estCode: true,
          ownerName: true,
          ownerPhone: true,
          listingType: true,
          price: true,
          status: true,
          exclusiveStartDate: true,
          exclusiveEndDate: true,
        },
      }),
      prisma.property.findMany({
        where: {
          isExclusive: true,
          exclusiveEndDate: { gte: now, lte: in45Days },
        },
        orderBy: { exclusiveEndDate: "asc" },
        select: {
          id: true,
          titleTh: true,
          projectName: true,
          building: true,
          floor: true,
          estCode: true,
          ownerName: true,
          ownerPhone: true,
          listingType: true,
          price: true,
          status: true,
          exclusiveStartDate: true,
          exclusiveEndDate: true,
        },
      }),
      prisma.contract.count({ where: { status: "ACTIVE" } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalProperties,
        totalUsers,
        totalViews: viewsResult._sum.views || 0,
        pendingApprovals,
        recentProperties,
        exclusiveCount,
        exclusiveList,
        exclusiveExpiringSoon,
        activeContractsCount,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
