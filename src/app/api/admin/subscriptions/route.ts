import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Base query — fields that have always existed
    const baseAgents = await prisma.user.findMany({
      where: { role: "CO_AGENT" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        coAgentApplication: {
          select: { companyName: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Try to enrich with new B2B fields — silently skip if Prisma client is stale
    type Enriched = { subscriptionTier: string; tierExpiredAt: string | null };
    let enrichMap: Record<number, Enriched> = {};
    try {
      const rich = await (prisma.user as any).findMany({
        where: { role: "CO_AGENT" },
        select: { id: true, subscriptionTier: true, tierExpiredAt: true },
      }) as Array<{ id: number } & Enriched>;
      enrichMap = Object.fromEntries(
        rich.map((r) => [r.id, { subscriptionTier: r.subscriptionTier ?? "STANDARD", tierExpiredAt: r.tierExpiredAt ?? null }])
      );
    } catch {
      // Stale Prisma client — default to STANDARD for all
    }

    // Count monthly unlocks — skip if ContactUnlockLog not yet in schema
    let monthlyMap: Record<number, number> = {};
    let totalMap: Record<number, number> = {};
    try {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const [monthly, total] = await Promise.all([
        (prisma as any).contactUnlockLog.groupBy({
          by: ["agentId"],
          where: { unlockedAt: { gte: startOfMonth } },
          _count: { agentId: true },
        }),
        (prisma as any).contactUnlockLog.groupBy({
          by: ["agentId"],
          _count: { agentId: true },
        }),
      ]);
      monthlyMap = Object.fromEntries((monthly as any[]).map((m: any) => [m.agentId, m._count.agentId]));
      totalMap  = Object.fromEntries((total  as any[]).map((m: any) => [m.agentId, m._count.agentId]));
    } catch {
      // Table not available yet
    }

    const data = baseAgents.map((a) => ({
      ...a,
      subscriptionTier: enrichMap[a.id]?.subscriptionTier ?? "STANDARD",
      tierExpiredAt:    enrichMap[a.id]?.tierExpiredAt    ?? null,
      unlocksTotal:     totalMap[a.id]   ?? 0,
      unlocksThisMonth: monthlyMap[a.id] ?? 0,
    }));

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Subscriptions GET error:", err);
    return NextResponse.json({ success: false, error: err?.message || "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, tier, tierExpiredAt } = body;

    const VALID_TIERS = ["STANDARD", "PRO", "ELITE"];
    if (!userId || (tier && !VALID_TIERS.includes(tier))) {
      return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 });
    }

    const updateData: any = {};
    if (tier) updateData.subscriptionTier = tier;
    if (tierExpiredAt !== undefined) {
      updateData.tierExpiredAt = tierExpiredAt ? new Date(tierExpiredAt) : null;
    }

    const updated = await (prisma.user as any).update({
      where: { id: Number(userId) },
      data: updateData,
      select: { id: true, subscriptionTier: true, tierExpiredAt: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    console.error("Subscriptions PUT error:", err);
    return NextResponse.json({ success: false, error: err?.message || "Internal server error" }, { status: 500 });
  }
}
