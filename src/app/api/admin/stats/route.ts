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

    const [totalProperties, totalUsers, pendingApprovals, viewsResult, recentProperties] = await Promise.all([
      prisma.property.count(),
      prisma.user.count(),
      prisma.coAgentApplication.count({ where: { status: "PENDING" } }),
      prisma.property.aggregate({ _sum: { views: true } }),
      prisma.property.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, titleTh: true, propertyType: true, listingType: true, price: true, isSold: true, createdAt: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalProperties,
        totalUsers,
        totalViews: viewsResult._sum.views || 0,
        pendingApprovals,
        recentProperties,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
