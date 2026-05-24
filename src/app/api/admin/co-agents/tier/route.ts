import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { userId, tier } = body;

  const VALID_TIERS = ["STANDARD", "PRO", "ELITE"];
  if (!userId || !VALID_TIERS.includes(tier)) {
    return NextResponse.json({ success: false, error: "Invalid userId or tier" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: Number(userId) },
    data: { subscriptionTier: tier },
  });

  return NextResponse.json({ success: true });
}
