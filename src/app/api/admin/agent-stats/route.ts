import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { summarizeAgentCommissionByMonth } from "@/lib/commission";

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

    // Commission tier breakdown is only meaningful for the agent viewing
    // their own numbers — an ADMIN isn't personally credited on deals, and
    // has the commission-overview dashboard for the all-agents view.
    let commission = null;
    if (role === "CO_AGENT") {
      const [rentTiers, commissionContracts] = await Promise.all([
        prisma.commissionTier.findMany({ where: { dealCategory: "RENT" } }),
        prisma.contract.findMany({
          where: { agentId: userId, commissionReceived: true },
          select: {
            monthlyRent: true,
            contractType: true,
            termMonths: true,
            dealType: true,
            commissionReceivedDate: true,
          },
        }),
      ]);

      const tiers = rentTiers.map((t) => ({
        minAmount: Number(t.minAmount),
        maxAmount: t.maxAmount != null ? Number(t.maxAmount) : null,
        agentPercent: Number(t.agentPercent),
      }));
      const months = summarizeAgentCommissionByMonth(
        commissionContracts.map((c) => ({ ...c, monthlyRent: Number(c.monthlyRent) })),
        tiers
      );

      const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const currentMonth =
        months.find((m) => m.monthKey === currentMonthKey) ??
        { monthKey: currentMonthKey, closedCount: 0, revenue: 0, tierPercent: null, earnedCommission: 0 };
      const allTimeEarned = months.reduce((sum, m) => sum + m.earnedCommission, 0);

      commission = { currentMonth, allTimeEarned, months };
    }

    return NextResponse.json({
      success: true,
      data: { draft, active, expiringSoon, expired, recentContracts, commission },
    });
  } catch (err: any) {
    console.error("Agent stats GET error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
