import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || !["ADMIN", "CO_AGENT"].includes(role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const paymentId = parseInt(id, 10);

  // CO_AGENT can only mark payments for a contract credited to them.
  if (role === "CO_AGENT") {
    const payment = await prisma.rentPayment.findUnique({
      where: { id: paymentId },
      select: { contract: { select: { agentId: true } } },
    });
    if (!payment) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    if (payment.contract.agentId !== Number((session.user as any).id)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
  }

  const { isPaid, note } = await req.json();

  const updated = await prisma.rentPayment.update({
    where: { id: paymentId },
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
