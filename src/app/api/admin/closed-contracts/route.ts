import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const in45Days = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);

  const select = {
    id: true,
    titleTh: true,
    projectName: true,
    building: true,
    floor: true,
    estCode: true,
    ownerName: true,
    ownerPhone: true,
    listingType: true,
    price: true,
    status: true,
    exclusiveStartDate: true,
    exclusiveEndDate: true,
  };

  const [count, list, expiringSoon] = await Promise.all([
    prisma.property.count({ where: { isExclusive: true } }),
    prisma.property.findMany({
      where: { isExclusive: true },
      orderBy: { exclusiveEndDate: "asc" },
      select,
    }),
    prisma.property.findMany({
      where: {
        isExclusive: true,
        exclusiveEndDate: { gte: now, lte: in45Days },
      },
      orderBy: { exclusiveEndDate: "asc" },
      select,
    }),
  ]);

  return NextResponse.json({ success: true, data: { count, list, expiringSoon } });
}
