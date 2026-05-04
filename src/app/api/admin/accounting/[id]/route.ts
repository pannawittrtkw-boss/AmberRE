import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { date, amount, type, recordType, category, description, payee, slipUrl } = body;

    const txn = await prisma.transaction.update({
      where: { id: parseInt(id) },
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
    const { id } = await params;
    await prisma.transaction.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Accounting DELETE error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
