import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { summarizeAgentCommissionByMonth } from "@/lib/commission";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const monthParam = req.nextUrl.searchParams.get("month");
  const monthKey = monthParam || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [agents, rentTiers, contracts] = await Promise.all([
    prisma.user.findMany({
      where: { role: "CO_AGENT" },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    }),
    prisma.commissionTier.findMany({ where: { dealCategory: "RENT" } }),
    prisma.contract.findMany({
      where: { agentId: { not: null }, commissionReceived: true },
      select: {
        agentId: true,
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

  const contractsByAgent = new Map<number, typeof contracts>();
  for (const c of contracts) {
    if (!c.agentId) continue;
    const list = contractsByAgent.get(c.agentId) ?? [];
    list.push(c);
    contractsByAgent.set(c.agentId, list);
  }

  const rows = agents.map((agent) => {
    const agentContracts = (contractsByAgent.get(agent.id) ?? []).map((c) => ({
      ...c,
      monthlyRent: Number(c.monthlyRent),
    }));
    const months = summarizeAgentCommissionByMonth(agentContracts, tiers);
    const selectedMonth =
      months.find((m) => m.monthKey === monthKey) ??
      { monthKey, closedCount: 0, revenue: 0, tierPercent: null, earnedCommission: 0 };
    const allTimeEarned = months.reduce((sum, m) => sum + m.earnedCommission, 0);

    return {
      agentId: agent.id,
      name: `${agent.firstName} ${agent.lastName}`,
      selectedMonth,
      allTimeEarned,
    };
  });

  const totals = rows.reduce(
    (acc, r) => ({
      closedCount: acc.closedCount + r.selectedMonth.closedCount,
      revenue: acc.revenue + r.selectedMonth.revenue,
      earnedCommission: acc.earnedCommission + r.selectedMonth.earnedCommission,
      allTimeEarned: acc.allTimeEarned + r.allTimeEarned,
    }),
    { closedCount: 0, revenue: 0, earnedCommission: 0, allTimeEarned: 0 }
  );

  return NextResponse.json({ success: true, data: { monthKey, rows, totals } });
}
