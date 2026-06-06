import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: fetch rent payments for a date range
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "CO_AGENT"].includes((session.user as any).role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const yearParam  = searchParams.get("year");
  const monthParam = searchParams.get("month");

  let where: any = {};

  if (yearParam && monthParam) {
    const year  = parseInt(yearParam);
    const month = parseInt(monthParam);
    where.dueDate = {
      gte: new Date(year, month - 1, 1),
      lt:  new Date(year, month, 1),
    };
  }

  const payments = await prisma.rentPayment.findMany({
    where,
    include: {
      contract: {
        select: {
          id: true,
          contractNumber: true,
          lesseeName: true,
          projectName: true,
          unitNumber: true,
          monthlyRent: true,
          paymentDay: true,
          latePaymentFee: true,
          status: true,
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json({
    success: true,
    data: payments.map((p) => ({
      ...p,
      amount: Number(p.amount),
      contract: {
        ...p.contract,
        monthlyRent: Number(p.contract.monthlyRent),
        latePaymentFee: Number(p.contract.latePaymentFee),
      },
    })),
  });
}
