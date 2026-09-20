import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { summarizeAgentCommissionByMonth, summarizeClosedCountByMonth, calcContractCommission } from "@/lib/commission";

export async function GET(req: NextRequest) {
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

    // ADMIN can drill into a specific agent's numbers via ?agentId= (used
    // by the commission-overview detail page) — CO_AGENT can only ever see
    // their own, regardless of what's passed.
    const requestedAgentId = req.nextUrl.searchParams.get("agentId");
    const targetAgentId =
      role === "ADMIN" && requestedAgentId ? Number(requestedAgentId) : userId;
    const viewingOtherAgent = role === "ADMIN" && requestedAgentId != null;

    const now = new Date();
    const in45Days = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);

    // For CO_AGENT: scope to their properties; for ADMIN viewing a specific
    // agent: scope to that agent; for ADMIN's own overview: all contracts.
    const agentFilter =
      role === "CO_AGENT"
        ? { agentId: userId }
        : viewingOtherAgent
        ? { agentId: targetAgentId }
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
    if (role === "CO_AGENT" || viewingOtherAgent) {
      const [rentTiers, allAgentContracts, commissionContracts] = await Promise.all([
        prisma.commissionTier.findMany({ where: { dealCategory: "RENT" } }),
        // "Closed" count/history is independent of payment status — every
        // contract credited to this agent, by the month it was signed.
        prisma.contract.findMany({
          where: { agentId: targetAgentId },
          orderBy: { contractDate: "desc" },
          select: {
            id: true,
            contractNumber: true,
            contractDate: true,
            contractType: true,
            dealType: true,
            projectName: true,
            unitNumber: true,
            lesseeName: true,
            monthlyRent: true,
            termMonths: true,
            commissionReceived: true,
            commissionReceivedDate: true,
            commissionPaid: true,
            shareToken: true,
            signedPdfUrl: true,
          },
        }),
        prisma.contract.findMany({
          where: { agentId: targetAgentId, commissionReceived: true },
          select: {
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
      const closedMonths = summarizeClosedCountByMonth(allAgentContracts);
      const commissionMonths = summarizeAgentCommissionByMonth(
        commissionContracts.map((c) => ({ ...c, monthlyRent: Number(c.monthlyRent) })),
        tiers
      );

      const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const currentClosedCount =
        closedMonths.find((m) => m.monthKey === currentMonthKey)?.closedCount ?? 0;
      const currentCommissionMonth =
        commissionMonths.find((m) => m.monthKey === currentMonthKey) ??
        { monthKey: currentMonthKey, revenue: 0, tierPercent: null, earnedCommission: 0, paidCommission: 0, pendingCommission: 0 };

      const currentMonth = { ...currentCommissionMonth, closedCount: currentClosedCount };
      const allTimeClosedCount = closedMonths.reduce((sum, m) => sum + m.closedCount, 0);
      const allTimeEarned = commissionMonths.reduce((sum, m) => sum + m.earnedCommission, 0);
      const allTimePaid = commissionMonths.reduce((sum, m) => sum + m.paidCommission, 0);
      const allTimePending = commissionMonths.reduce((sum, m) => sum + m.pendingCommission, 0);

      // Looked up by each contract's own commissionReceivedDate month (not
      // the contractDate month used to group "history" below) — the tier
      // bracket a contract's payout falls into depends on when the money
      // was actually received, which can be a different month than when
      // the contract was signed.
      const commissionByMonthKey = new Map(commissionMonths.map((m) => [m.monthKey, m]));

      // Per-contract history grouped by the month it was signed — answers
      // "how many, and which ones" behind the closed-count numbers, with a
      // link to the signed contract for each.
      const historyByMonth = new Map<string, typeof allAgentContracts>();
      for (const c of allAgentContracts) {
        const d = new Date(c.contractDate);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const list = historyByMonth.get(monthKey) ?? [];
        list.push(c);
        historyByMonth.set(monthKey, list);
      }
      const history = Array.from(historyByMonth, ([monthKey, list]) => {
        const contracts = list.map((c) => {
          const revenueAmount = calcContractCommission({ ...c, monthlyRent: Number(c.monthlyRent) });
          let agentEarnedCommission: number | null = null;
          if (c.commissionReceived && c.commissionReceivedDate) {
            const rd = new Date(c.commissionReceivedDate);
            const receivedMonthKey = `${rd.getFullYear()}-${String(rd.getMonth() + 1).padStart(2, "0")}`;
            const tierPercent = commissionByMonthKey.get(receivedMonthKey)?.tierPercent ?? null;
            if (tierPercent != null) agentEarnedCommission = (revenueAmount * tierPercent) / 100;
          }
          return {
            id: c.id,
            contractNumber: c.contractNumber,
            contractType: c.contractType,
            projectName: c.projectName,
            unitNumber: c.unitNumber,
            lesseeName: c.lesseeName,
            monthlyRent: Number(c.monthlyRent),
            commissionAmount: revenueAmount,
            agentEarnedCommission,
            commissionReceived: c.commissionReceived,
            commissionReceivedDate: c.commissionReceivedDate,
            commissionPaid: c.commissionPaid,
            shareToken: c.shareToken,
            signedPdfUrl: c.signedPdfUrl,
          };
        });
        return {
          monthKey,
          closedCount: contracts.length,
          totalContractValue: contracts.reduce((sum, c) => sum + c.monthlyRent, 0),
          totalEarnedCommission: contracts.reduce((sum, c) => sum + (c.agentEarnedCommission ?? 0), 0),
          // Tier achieved for this calendar month (by commissionReceivedDate,
          // same convention as "currentMonth") — null if nothing was
          // received in this month yet.
          tierPercent: commissionByMonthKey.get(monthKey)?.tierPercent ?? null,
          contracts,
        };
      }).sort((a, b) => b.monthKey.localeCompare(a.monthKey));

      // Year-over-year monthly trend for the "Commission performance" chart
      // and stat-card sparklines — earnedCommission/closedCount per calendar
      // month for this year and last, filling months with no activity as 0.
      const closedByMonthKey = new Map(closedMonths.map((m) => [m.monthKey, m]));
      const buildYear = (year: number) =>
        Array.from({ length: 12 }, (_, i) => {
          const monthKey = `${year}-${String(i + 1).padStart(2, "0")}`;
          return {
            monthKey,
            month: i + 1,
            earnedCommission: commissionByMonthKey.get(monthKey)?.earnedCommission ?? 0,
            closedCount: closedByMonthKey.get(monthKey)?.closedCount ?? 0,
          };
        });
      const thisYear = now.getFullYear();
      const yearlySeries = {
        currentYear: thisYear,
        previousYear: thisYear - 1,
        current: buildYear(thisYear),
        previous: buildYear(thisYear - 1),
      };

      commission = { currentMonth, allTimeClosedCount, allTimeEarned, allTimePaid, allTimePending, history, yearlySeries };
    }

    let agentName: string | null = null;
    if (viewingOtherAgent) {
      const agent = await prisma.user.findUnique({
        where: { id: targetAgentId },
        select: { firstName: true, lastName: true },
      });
      agentName = agent ? `${agent.firstName} ${agent.lastName}` : null;
    }

    return NextResponse.json({
      success: true,
      data: { draft, active, expiringSoon, expired, recentContracts, commission, agentName },
    });
  } catch (err: any) {
    console.error("Agent stats GET error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
