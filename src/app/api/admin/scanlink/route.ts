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

  // Property details (project name, price, stations, etc.) only exist once
  // a link has been reviewed and accepted via /scanlink/accept, which
  // creates a Property with sourceLink = this record's url. Nothing is
  // written back onto LineUrlHistory itself, so for PENDING/unreviewed
  // links there's genuinely no such data yet — join it in here for
  // whichever of this page's records do have a matching Property.
  const urls = [...new Set(records.map((r) => r.url))];
  const properties = urls.length
    ? await prisma.property.findMany({
        where: { sourceLink: { in: urls } },
        select: {
          sourceLink: true,
          projectName: true,
          titleTh: true,
          propertyType: true,
          listingType: true,
          price: true,
          salePrice: true,
          nearbyStations: true,
          availableDate: true,
        },
      })
    : [];
  const propertyByUrl = new Map(properties.map((p) => [p.sourceLink, p]));
  const recordsWithProperty = records.map((r) => {
    const p = propertyByUrl.get(r.url);
    return {
      ...r,
      property: p
        ? {
            projectName: p.projectName || p.titleTh,
            propertyType: p.propertyType,
            listingType: p.listingType,
            price: Number(p.price),
            salePrice: p.salePrice != null ? Number(p.salePrice) : null,
            nearbyStations: p.nearbyStations,
            availableDate: p.availableDate,
          }
        : null,
    };
  });

  return NextResponse.json({
    success: true,
    data: { records: recordsWithProperty, total, grandTotal, page, limit, groups: groups.map(g => g.groupId), stats },
  });
}

// DELETE — single or bulk delete
export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ success: false, error: "ids required" }, { status: 400 });
  }
  const deleted = await prisma.lineUrlHistory.deleteMany({
    where: { id: { in: body.ids } },
  });
  return NextResponse.json({ success: true, data: { count: deleted.count } });
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
