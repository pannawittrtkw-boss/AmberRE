import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const tiers = await prisma.commissionTier.findMany({
    orderBy: [{ dealCategory: "asc" }, { sortOrder: "asc" }],
  });

  return NextResponse.json({
    success: true,
    data: tiers.map((t) => ({
      id: t.id,
      dealCategory: t.dealCategory,
      minAmount: Number(t.minAmount),
      maxAmount: t.maxAmount != null ? Number(t.maxAmount) : null,
      agentPercent: Number(t.agentPercent),
      sortOrder: t.sortOrder,
    })),
  });
}

// Replaces the whole tier list — simplest safe approach for a small (~6
// row), infrequently-edited config table, avoids diffing add/edit/delete
// against existing ids.
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const tiers: Array<{
      dealCategory: string;
      minAmount: number;
      maxAmount: number | null;
      agentPercent: number;
      sortOrder: number;
    }> = Array.isArray(body?.tiers) ? body.tiers : [];

    for (const t of tiers) {
      if (!["RENT", "SALE"].includes(t.dealCategory)) {
        return NextResponse.json({ success: false, error: "Invalid dealCategory" }, { status: 400 });
      }
    }

    await prisma.$transaction([
      prisma.commissionTier.deleteMany({}),
      prisma.commissionTier.createMany({
        data: tiers.map((t, i) => ({
          dealCategory: t.dealCategory,
          minAmount: t.minAmount,
          maxAmount: t.maxAmount,
          agentPercent: t.agentPercent,
          sortOrder: t.sortOrder ?? i,
        })),
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Commission tiers PUT error:", err);
    return NextResponse.json({ success: false, error: err?.message || "Internal server error" }, { status: 500 });
  }
}
