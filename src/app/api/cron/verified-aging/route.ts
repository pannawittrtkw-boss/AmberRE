import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Daily job: a property sitting in plain VERIFIED status for more than 30
// days (counted from when it was added to the system, Property.createdAt)
// automatically ages into VERIFIED_OVER_30_DAYS — no manual admin action
// needed. Visible to both ADMIN and CO_AGENT since they share the same
// property list/status UI.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const { count } = await prisma.property.updateMany({
    where: { status: "VERIFIED", createdAt: { lte: cutoff } },
    data: { status: "VERIFIED_OVER_30_DAYS" },
  });

  return NextResponse.json({ success: true, data: { updated: count } });
}
