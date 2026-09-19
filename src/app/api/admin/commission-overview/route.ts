import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { summarizeAgentCommissionByMonth, summarizeClosedCountByMonth } from "@/lib/commission";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const monthParam = req.nextUrl.searchParams.get("month");
  const monthKey = monthParam || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [agents, rentTiers, allContracts, commissionContracts] = await Promise.all([
    prisma.user.findMany({
      where: { role: "CO_AGENT" },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    }),
    prisma.commissionTier.findMany({ where: { dealCategory: "RENT" } }),
    // "Closed" count is independent of payment status.
    prisma.contract.findMany({
      where: { agentId: { not: null } },
      select: { agentId: true, contractDate: true },
    }),
    prisma.contract.findMany({
      where: { agentId: { not: null }, commissionReceived: true },
      select: {
        agentId: true,
        monthlyRent: true,
        contractType: true,
        termMonths: true,
        dealType: true,
        commissionReceivedDate: true,
        commissionPaid: true,
      },
    }),
  ]);

  const tiers = rentTiers.map((t) => ({
    minAmount: Number(t.minAmount),
    maxAmount: t.maxAmount != null ? Number(t.maxAmount) : null,
    agentPercent: Number(t.agentPercent),
  }));

  const closedByAgent = new Map<number, typeof allContracts>();
  for (const c of allContracts) {
    if (!c.agentId) continue;
    const list = closedByAgent.get(c.agentId) ?? [];
    list.push(c);
    closedByAgent.set(c.agentId, list);
  }

  const commissionByAgent = new Map<number, typeof commissionContracts>();
  for (const c of commissionContracts) {
    if (!c.agentId) continue;
    const list = commissionByAgent.get(c.agentId) ?? [];
    list.push(c);
    commissionByAgent.set(c.agentId, list);
  }

  const rows = agents.map((agent) => {
    const closedMonths = summarizeClosedCountByMonth(closedByAgent.get(agent.id) ?? []);
    const commissionMonths = summarizeAgentCommissionByMonth(
      (commissionByAgent.get(agent.id) ?? []).map((c) => ({ ...c, monthlyRent: Number(c.monthlyRent) })),
      tiers
    );

    const closedCount = closedMonths.find((m) => m.monthKey === monthKey)?.closedCount ?? 0;
    const commissionMonth =
      commissionMonths.find((m) => m.monthKey === monthKey) ??
      { monthKey, revenue: 0, tierPercent: null, earnedCommission: 0, paidCommission: 0, pendingCommission: 0 };
    const selectedMonth = { ...commissionMonth, closedCount };

    const allTimeClosedCount = closedMonths.reduce((sum, m) => sum + m.closedCount, 0);
    const allTimeEarned = commissionMonths.reduce((sum, m) => sum + m.earnedCommission, 0);
    const allTimePaid = commissionMonths.reduce((sum, m) => sum + m.paidCommission, 0);
    const allTimePending = commissionMonths.reduce((sum, m) => sum + m.pendingCommission, 0);

    return {
      agentId: agent.id,
      name: `${agent.firstName} ${agent.lastName}`,
      selectedMonth,
      allTimeClosedCount,
      allTimeEarned,
      allTimePaid,
      allTimePending,
    };
  });

  const totals = rows.reduce(
    (acc, r) => ({
      closedCount: acc.closedCount + r.selectedMonth.closedCount,
      revenue: acc.revenue + r.selectedMonth.revenue,
      earnedCommission: acc.earnedCommission + r.selectedMonth.earnedCommission,
      allTimeClosedCount: acc.allTimeClosedCount + r.allTimeClosedCount,
      allTimeEarned: acc.allTimeEarned + r.allTimeEarned,
      allTimePaid: acc.allTimePaid + r.allTimePaid,
      allTimePending: acc.allTimePending + r.allTimePending,
    }),
    { closedCount: 0, revenue: 0, earnedCommission: 0, allTimeClosedCount: 0, allTimeEarned: 0, allTimePaid: 0, allTimePending: 0 }
  );

  return NextResponse.json({ success: true, data: { monthKey, rows, totals } });
}
