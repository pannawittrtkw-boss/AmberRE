import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "CO_AGENT"].includes((session.user as any).role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { isPaid, note } = await req.json();

  const updated = await prisma.rentPayment.update({
    where: { id: parseInt(id) },
    data: {
      isPaid,
      paidAt: isPaid ? new Date() : null,
      note: note !== undefined ? note : undefined,
    },
  });

  return NextResponse.json({
    success: true,
    data: { ...updated, amount: Number(updated.amount) },
  });
}
