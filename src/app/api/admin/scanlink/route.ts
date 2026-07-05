import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status  = searchParams.get("status") || "ALL";
  const groupId = searchParams.get("groupId") || undefined;
  const page    = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit   = Math.min(200, parseInt(searchParams.get("limit") ?? "100"));
  const skip    = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status !== "ALL") where.status = status;
  if (groupId) where.groupId = groupId;

  const statsWhere = groupId ? { groupId } : undefined;

  const [records, total, grandTotal, groups, stats] = await Promise.all([
    prisma.lineUrlHistory.findMany({
      where,
      orderBy: [{ dateKey: "desc" }, { dailySeq: "asc" }],
      skip,
      take: limit,
    }),
    prisma.lineUrlHistory.count({ where }),
    // Grand total — always all records, unaffected by status filter
    prisma.lineUrlHistory.count({ where: statsWhere }),
    // Distinct group IDs for filter dropdown
    prisma.lineUrlHistory.groupBy({ by: ["groupId"] }),
    // Status breakdown — not filtered by status, so it's always the full breakdown
    prisma.lineUrlHistory.groupBy({
      by: ["status"],
      where: statsWhere,
      _count: { status: true },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: { records, total, grandTotal, page, limit, groups: groups.map(g => g.groupId), stats },
  });
}

// PATCH — bulk or single status update
export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.ids || !body?.status) {
    return NextResponse.json({ success: false, error: "ids and status required" }, { status: 400 });
  }
  const updated = await prisma.lineUrlHistory.updateMany({
    where:  { id: { in: body.ids } },
    data:   { status: body.status, reviewedAt: new Date(), reviewedBy: "Admin (Web)" },
  });
  return NextResponse.json({ success: true, data: { count: updated.count } });
}
