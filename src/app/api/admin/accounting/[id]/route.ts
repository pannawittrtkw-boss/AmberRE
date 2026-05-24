import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any).role;
    const userId = Number((session.user as any).id);
    if (role !== "ADMIN" && role !== "CO_AGENT") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const txnId = parseInt(id);

    if (role === "CO_AGENT") {
      const existing = await prisma.transaction.findUnique({ where: { id: txnId }, select: { createdById: true } });
      if (!existing || existing.createdById !== userId) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }
    }

    const body = await req.json();
    const { date, amount, type, recordType, category, description, payee, slipUrl } = body;

    const txn = await prisma.transaction.update({
      where: { id: txnId },
      data: {
        ...(date && { date: new Date(date) }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(type && { type }),
        ...(recordType && { recordType }),
        ...(category && { category }),
        ...(description !== undefined && { description }),
        ...(payee !== undefined && { payee }),
        ...(slipUrl !== undefined && { slipUrl }),
      },
    });

    return NextResponse.json({
      success: true,
      data: { ...txn, amount: Number(txn.amount) },
    });
  } catch (error: unknown) {
    console.error("Accounting PUT error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any).role;
    const userId = Number((session.user as any).id);
    if (role !== "ADMIN" && role !== "CO_AGENT") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const txnId = parseInt(id);

    if (role === "CO_AGENT") {
      const existing = await prisma.transaction.findUnique({ where: { id: txnId }, select: { createdById: true } });
      if (!existing || existing.createdById !== userId) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }
    }

    await prisma.transaction.delete({ where: { id: txnId } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Accounting DELETE error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
