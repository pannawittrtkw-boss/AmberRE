// Shared commission logic — used both client-side (contracts admin page,
// for live display) and server-side (commission-income route, so the
// amount can't be spoofed from the client). Previously duplicated in both
// places with a comment noting they had to be "kept in sync manually."

export interface CommissionTierLike {
  minAmount: number;
  maxAmount: number | null;
  agentPercent: number;
}

// The company's commission revenue for a single contract — the base
// amount that the agent-tier system (elsewhere in this module) then
// takes a percentage of. Both NEW and RENEW scale proportionally with
// the contract term, capped at a full year (a 2-year NEW contract earns
// the same as a 1-year one, not double): NEW = rent x min(term/12, 1);
// RENEW = rent x min(term/12, 1) x 0.5. Co-agent deals (an external
// co-broker, see Contract.coAgentName) split the result in half.
//   12mo NEW direct   = 100% · 6mo NEW direct   = 50%
//   12mo RENEW direct = 50%  · 6mo RENEW direct = 25%
//   (co-agent deals: half of the above)
export function calcContractCommission(c: {
  monthlyRent: number | string;
  contractType: string;
  termMonths: number;
  dealType: string;
}): number {
  const rent = Number(c.monthlyRent) || 0;
  const termFactor = Math.min(c.termMonths / 12, 1);
  let commission = rent * termFactor * (c.contractType === "RENEW" ? 0.5 : 1);
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

export interface MonthlyClosedCount {
  monthKey: string; // "YYYY-MM"
  closedCount: number;
}

// "ทรัพย์ที่ปิดได้" is tracked independently of the money — a signed
// contract counts as closed the month it was made (contractDate),
// whether or not commission has been collected yet. RENEW contracts
// count too, per the confirmed rule.
export function summarizeClosedCountByMonth(
  contracts: Array<{ contractDate: Date | string }>
): MonthlyClosedCount[] {
  const byMonth = new Map<string, number>();
  for (const c of contracts) {
    const d = new Date(c.contractDate);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth.set(monthKey, (byMonth.get(monthKey) ?? 0) + 1);
  }
  return Array.from(byMonth, ([monthKey, closedCount]) => ({ monthKey, closedCount })).sort(
    (a, b) => b.monthKey.localeCompare(a.monthKey)
  );
}

export interface AgentCommissionMonth {
  monthKey: string; // "YYYY-MM"
  revenue: number;
  tierPercent: number | null;
  earnedCommission: number;
  paidCommission: number;
  pendingCommission: number;
}

// Buckets an agent's commission-received contracts by the month the money
// was received in (commissionReceivedDate — not contractDate/startDate;
// see summarizeClosedCountByMonth for the separate, status-independent
// "closed" count). Each month's whole revenue total determines a single
// tier bracket (non-graduated), applied to that whole total. Because the
// same percentage applies uniformly, each contract's own slice of the
// month's earned commission is its own revenue x that percentage — which
// is then bucketed into "paid" or "pending" per that contract's own
// commissionPaid flag, so the two halves always add up to the month's
// earnedCommission exactly.
export function summarizeAgentCommissionByMonth(
  contracts: Array<{
    monthlyRent: number | string;
    contractType: string;
    termMonths: number;
    dealType: string;
    commissionReceivedDate: Date | string | null;
    commissionPaid: boolean;
  }>,
  rentTiers: CommissionTierLike[]
): AgentCommissionMonth[] {
  const byMonth = new Map<string, Array<{ amount: number; paid: boolean }>>();

  for (const c of contracts) {
    if (!c.commissionReceivedDate) continue;
    const d = new Date(c.commissionReceivedDate);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const amount = calcContractCommission(c);
    const list = byMonth.get(monthKey) ?? [];
    list.push({ amount, paid: c.commissionPaid });
    byMonth.set(monthKey, list);
  }

  const result: AgentCommissionMonth[] = [];
  for (const [monthKey, items] of byMonth) {
    const revenue = items.reduce((sum, i) => sum + i.amount, 0);
    const tier = getTierForAmount(rentTiers, revenue);
    const percent = tier ? Number(tier.agentPercent) : 0;

    let paidCommission = 0;
    let pendingCommission = 0;
    for (const i of items) {
      const share = (i.amount * percent) / 100;
      if (i.paid) paidCommission += share;
      else pendingCommission += share;
    }

    result.push({
      monthKey,
      revenue,
      tierPercent: tier ? percent : null,
      earnedCommission: paidCommission + pendingCommission,
      paidCommission,
      pendingCommission,
    });
  }

  return result.sort((a, b) => b.monthKey.localeCompare(a.monthKey));
}
