import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    const userId = Number((session.user as any).id);

    if (role !== "CO_AGENT" && role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const in45Days = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);

    // For CO_AGENT: scope to their properties; for ADMIN: all contracts
    const agentFilter = role === "CO_AGENT"
      ? { property: { agentId: userId } }
      : {};

    const [draft, active, expiringSoon, expired, recentContracts] = await Promise.all([
      prisma.contract.count({
        where: { ...agentFilter, status: "DRAFT" },
      }),
      prisma.contract.count({
        where: { ...agentFilter, status: "ACTIVE" },
      }),
      prisma.contract.count({
        where: {
          ...agentFilter,
          status: "ACTIVE",
          endDate: { gte: now, lte: in45Days },
        },
      }),
      prisma.contract.count({
        where: { ...agentFilter, status: "EXPIRED" },
      }),
      prisma.contract.findMany({
        where: agentFilter,
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          contractNumber: true,
          lesseeName: true,
          startDate: true,
          endDate: true,
          monthlyRent: true,
          status: true,
          property: {
            select: { id: true, titleTh: true, projectName: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: { draft, active, expiringSoon, expired, recentContracts },
    });
  } catch (err: any) {
    console.error("Agent stats GET error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
