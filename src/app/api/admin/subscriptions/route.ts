import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET — list all CO_AGENT users with subscription info + unlock usage
export async function GET() {
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
      _count: {
        select: { contactUnlockLogs: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Count unlocks this month per agent
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthlyUsage = await prisma.contactUnlockLog.groupBy({
    by: ["agentId"],
    where: { unlockedAt: { gte: startOfMonth } },
    _count: { agentId: true },
  });
  const monthlyMap = Object.fromEntries(monthlyUsage.map((m) => [m.agentId, m._count.agentId]));

  const data = agents.map((a) => ({
    ...a,
    unlocksTotal: a._count.contactUnlockLogs,
    unlocksThisMonth: monthlyMap[a.id] ?? 0,
  }));

  return NextResponse.json({ success: true, data });
}

// PUT — update tier and/or expiry for a user
export async function PUT(req: NextRequest) {
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

  const data: any = {};
  if (tier) data.subscriptionTier = tier;
  if (tierExpiredAt !== undefined) {
    data.tierExpiredAt = tierExpiredAt ? new Date(tierExpiredAt) : null;
  }

  const updated = await prisma.user.update({
    where: { id: Number(userId) },
    data,
    select: { id: true, subscriptionTier: true, tierExpiredAt: true },
  });

  return NextResponse.json({ success: true, data: updated });
}
