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

    const agents = await prisma.user.findMany({
      where: { role: "CO_AGENT" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        subscriptionTier: true,
        tierExpiredAt: true,
        isActive: true,
        createdAt: true,
        coAgentApplication: {
          select: { companyName: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Count unlocks per agent — graceful fallback if ContactUnlockLog doesn't exist yet
    let monthlyMap: Record<number, number> = {};
    let totalMap: Record<number, number> = {};
    try {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const [monthlyUsage, totalUsage] = await Promise.all([
        prisma.contactUnlockLog.groupBy({
          by: ["agentId"],
          where: { unlockedAt: { gte: startOfMonth } },
          _count: { agentId: true },
        }),
        prisma.contactUnlockLog.groupBy({
          by: ["agentId"],
          _count: { agentId: true },
        }),
      ]);
      monthlyMap = Object.fromEntries(monthlyUsage.map((m) => [m.agentId, m._count.agentId]));
      totalMap = Object.fromEntries(totalUsage.map((m) => [m.agentId, m._count.agentId]));
    } catch {
      // Table may not exist yet — return zero counts
    }

    const data = agents.map((a) => ({
      ...a,
      unlocksTotal: totalMap[a.id] ?? 0,
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

    const updated = await prisma.user.update({
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
