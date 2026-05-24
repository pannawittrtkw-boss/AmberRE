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

    // Base fields — always available regardless of Prisma client version
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

    // Use raw SQL to read new fields — bypasses stale Prisma client entirely
    type RawTier = { id: number; subscriptionTier: string; tierExpiredAt: Date | null };
    let enrichMap: Record<number, RawTier> = {};
    try {
      const rows = await prisma.$queryRaw<RawTier[]>`
        SELECT id, "subscriptionTier", "tierExpiredAt"
        FROM "User"
        WHERE role = 'CO_AGENT'
      `;
      enrichMap = Object.fromEntries(rows.map((r) => [r.id, r]));
    } catch {
      // Column not yet in DB — fall back to STANDARD
    }

    // Monthly unlock counts via raw SQL
    let monthlyMap: Record<number, number> = {};
    let totalMap: Record<number, number> = {};
    try {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const [monthly, total] = await Promise.all([
        prisma.$queryRaw<{ agentId: number; cnt: bigint }[]>`
          SELECT "agentId", COUNT(*) AS cnt
          FROM "ContactUnlockLog"
          WHERE "unlockedAt" >= ${startOfMonth}
          GROUP BY "agentId"
        `,
        prisma.$queryRaw<{ agentId: number; cnt: bigint }[]>`
          SELECT "agentId", COUNT(*) AS cnt
          FROM "ContactUnlockLog"
          GROUP BY "agentId"
        `,
      ]);
      monthlyMap = Object.fromEntries(monthly.map((r) => [r.agentId, Number(r.cnt)]));
      totalMap   = Object.fromEntries(total.map((r) => [r.agentId, Number(r.cnt)]));
    } catch {
      // Table not yet in DB
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

    const id = Number(userId);
    const expiry = tierExpiredAt ? new Date(tierExpiredAt) : null;

    // Raw SQL update — works even when Prisma client doesn't know the new columns
    if (tier && expiry !== undefined) {
      await prisma.$executeRaw`
        UPDATE "User"
        SET "subscriptionTier" = ${tier}::"SubscriptionTier",
            "tierExpiredAt"    = ${expiry}
        WHERE id = ${id}
      `;
    } else if (tier) {
      await prisma.$executeRaw`
        UPDATE "User"
        SET "subscriptionTier" = ${tier}::"SubscriptionTier"
        WHERE id = ${id}
      `;
    } else if (expiry !== undefined) {
      await prisma.$executeRaw`
        UPDATE "User"
        SET "tierExpiredAt" = ${expiry}
        WHERE id = ${id}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Subscriptions PUT error:", err);
    return NextResponse.json({ success: false, error: err?.message || "Internal server error" }, { status: 500 });
  }
}
