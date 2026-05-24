import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  const userId = Number((session.user as any).id);
  if (role !== "ADMIN" && role !== "CO_AGENT") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const in45Days = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);

  // CO_AGENT: only their properties; ADMIN: all
  const agentScope = role === "CO_AGENT" ? { agentId: userId } : {};

  const select = {
    id: true, titleTh: true, projectName: true, building: true, floor: true,
    estCode: true, ownerName: true, ownerPhone: true, listingType: true, price: true,
    status: true, exclusiveStartDate: true, exclusiveEndDate: true,
  };

  const baseWhere = { isExclusive: true, ...agentScope };

  const [count, list, expiringSoon] = await Promise.all([
    prisma.property.count({ where: baseWhere }),
    prisma.property.findMany({ where: baseWhere, orderBy: { exclusiveEndDate: "asc" }, select }),
    prisma.property.findMany({
      where: { ...baseWhere, exclusiveEndDate: { gte: now, lte: in45Days } },
      orderBy: { exclusiveEndDate: "asc" },
      select,
    }),
  ]);

  return NextResponse.json({ success: true, data: { count, list, expiringSoon } });
}
