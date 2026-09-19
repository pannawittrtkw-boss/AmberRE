// Shared commission logic — used both client-side (contracts admin page,
// for live display) and server-side (commission-income route, so the
// amount can't be spoofed from the client). Previously duplicated in both
// places with a comment noting they had to be "kept in sync manually."

export interface CommissionTierLike {
  minAmount: number;
  maxAmount: number | null;
  agentPercent: number;
}

// The company's commission revenue for a single contract. New contract:
// one month's rent. Renewal: rent x half a month per year renewed (12mo →
// 0.5x, 6mo → 0.25x, prorated for anything in between). Co-agent deals
// (an external co-broker, see Contract.coAgentName) split the result in
// half. This formula is unchanged from the original — the agent-tier
// system in this module sits on top of it, it doesn't replace it.
export function calcContractCommission(c: {
  monthlyRent: number | string;
  contractType: string;
  termMonths: number;
  dealType: string;
}): number {
  const rent = Number(c.monthlyRent) || 0;
  let commission =
    c.contractType === "RENEW" ? rent * (c.termMonths / 12) * 0.5 : rent;
  if (c.dealType === "CO_AGENT") commission /= 2;
  return commission;
}

// Non-graduated tier lookup: finds the single bracket `amount` falls
// into and returns its whole percentage (not a marginal/stacked rate).
export function getTierForAmount<T extends CommissionTierLike>(
  tiers: T[],
  amount: number
): T | null {
  return (
    tiers.find(
      (t) => amount >= t.minAmount && (t.maxAmount == null || amount <= t.maxAmount)
    ) ?? null
  );
}

export interface AgentCommissionMonth {
  monthKey: string; // "YYYY-MM"
  closedCount: number;
  revenue: number;
  tierPercent: number | null;
  earnedCommission: number;
}

// Buckets an agent's commission-received contracts by the month they were
// received in (per the confirmed rule: tiers are evaluated on money
// actually collected, keyed by commissionReceivedDate — not contractDate
// or startDate). Each month's whole revenue total determines a single
// tier bracket, applied to that whole total (non-graduated).
export function summarizeAgentCommissionByMonth(
  contracts: Array<{
    monthlyRent: number | string;
    contractType: string;
    termMonths: number;
    dealType: string;
    commissionReceivedDate: Date | string | null;
  }>,
  rentTiers: CommissionTierLike[]
): AgentCommissionMonth[] {
  const byMonth = new Map<string, { count: number; revenue: number }>();

  for (const c of contracts) {
    if (!c.commissionReceivedDate) continue;
    const d = new Date(c.commissionReceivedDate);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const amount = calcContractCommission(c);
    const bucket = byMonth.get(monthKey) ?? { count: 0, revenue: 0 };
    bucket.count += 1;
    bucket.revenue += amount;
    byMonth.set(monthKey, bucket);
  }

  const result: AgentCommissionMonth[] = [];
  for (const [monthKey, { count, revenue }] of byMonth) {
    const tier = getTierForAmount(rentTiers, revenue);
    result.push({
      monthKey,
      closedCount: count,
      revenue,
      tierPercent: tier ? Number(tier.agentPercent) : null,
      earnedCommission: tier ? (revenue * Number(tier.agentPercent)) / 100 : 0,
    });
  }

  return result.sort((a, b) => b.monthKey.localeCompare(a.monthKey));
}
