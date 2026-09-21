import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") return null;
  return session;
}

interface Bucket {
  key: string;
  total: number;
  reviewed: number;
  pending: number;
}

// dateKey is stored as "YYYY-MM-DD" (see todayKey() in api/line/url-checker),
// so month/year buckets are just prefixes of it — no raw SQL date-trunc
// needed. The dataset is small enough (a couple thousand rows) to fetch
// the two fields needed and aggregate all three granularities in one pass.
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const rows = await prisma.lineUrlHistory.findMany({
    select: { dateKey: true, status: true },
  });

  const daily = new Map<string, Bucket>();
  const monthly = new Map<string, Bucket>();
  const yearly = new Map<string, Bucket>();

  const bump = (map: Map<string, Bucket>, key: string, isPending: boolean) => {
    if (!key) return;
    const b = map.get(key) ?? { key, total: 0, reviewed: 0, pending: 0 };
    b.total += 1;
    if (isPending) b.pending += 1;
    else b.reviewed += 1;
    map.set(key, b);
  };

  for (const r of rows) {
    const dateKey = r.dateKey || "";
    if (!dateKey) continue;
    const isPending = r.status === "PENDING";
    bump(daily, dateKey, isPending);
    bump(monthly, dateKey.slice(0, 7), isPending);
    bump(yearly, dateKey.slice(0, 4), isPending);
  }

  const sortByKey = (map: Map<string, Bucket>) =>
    Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));

  return NextResponse.json({
    success: true,
    data: {
      daily: sortByKey(daily),
      monthly: sortByKey(monthly),
      yearly: sortByKey(yearly),
    },
  });
}
