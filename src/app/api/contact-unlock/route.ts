import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const MONTHLY_QUOTA: Record<string, number | null> = {
  STANDARD: 5,
  PRO: null,    // unlimited
  ELITE: null,  // unlimited
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const propertyIdParam = searchParams.get("propertyId");
  const statsOnly = searchParams.get("stats") === "1" || !propertyIdParam;

  const agentId = Number((session.user as any).id);
  const tier: string = (session.user as any).subscriptionTier ?? "STANDARD";
  const quota = MONTHLY_QUOTA[tier] ?? null;

  const usedThisMonth =
    quota !== null
      ? await prisma.contactUnlockLog.count({
          where: {
            agentId,
            unlockedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
          },
        })
      : 0;

  if (statsOnly) {
    return NextResponse.json({
      success: true,
      data: { tier, quota, usedThisMonth },
    });
  }

  const propertyId = parseInt(propertyIdParam!, 10);
  if (!propertyId) {
    return NextResponse.json({ success: false, error: "propertyId required" }, { status: 400 });
  }

  const existing = await prisma.contactUnlockLog.findUnique({
    where: { agentId_propertyId: { agentId, propertyId } },
  });

  return NextResponse.json({
    success: true,
    data: {
      isUnlocked: !!existing,
      tier,
      quota,
      usedThisMonth,
      canUnlock: !!existing || quota === null || usedThisMonth < quota,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const propertyId = parseInt(body.propertyId, 10);
  if (!propertyId) {
    return NextResponse.json({ success: false, error: "propertyId required" }, { status: 400 });
  }

  const agentId = Number((session.user as any).id);
  const tier: string = (session.user as any).subscriptionTier ?? "STANDARD";
  const quota = MONTHLY_QUOTA[tier] ?? null;

  // Already unlocked — idempotent
  const existing = await prisma.contactUnlockLog.findUnique({
    where: { agentId_propertyId: { agentId, propertyId } },
  });
  if (existing) {
    return NextResponse.json({ success: true, data: { alreadyUnlocked: true } });
  }

  // Quota check
  if (quota !== null) {
    const usedThisMonth = await prisma.contactUnlockLog.count({
      where: {
        agentId,
        unlockedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    });
    if (usedThisMonth >= quota) {
      return NextResponse.json(
        {
          success: false,
          error: "quota_exceeded",
          message: `STANDARD plan allows ${quota} unlocks per month. Upgrade to PRO or ELITE for unlimited access.`,
          usedThisMonth,
          quota,
        },
        { status: 402 }
      );
    }
  }

  await prisma.contactUnlockLog.create({ data: { agentId, propertyId } });

  return NextResponse.json({ success: true, data: { unlocked: true } });
}
