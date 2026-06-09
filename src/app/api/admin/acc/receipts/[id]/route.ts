import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const receipt = await prisma.accReceipt.findUnique({
    where: { id: parseInt(id, 10) },
    include: { customer: true, billingNote: true, invoice: true },
  });
  if (!receipt) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: receipt });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const { date, customerId, billingNoteId, invoiceId, items, subtotal, vatRate, vatAmount, totalAmount, paymentMethod, note } = body;
  const updated = await prisma.accReceipt.update({
    where: { id: parseInt(id, 10) },
    data: {
      ...(date && { date: new Date(date) }),
      ...(customerId && { customerId: parseInt(customerId, 10) }),
      billingNoteId: billingNoteId ? parseInt(billingNoteId, 10) : null,
      invoiceId: invoiceId ? parseInt(invoiceId, 10) : null,
      ...(items !== undefined && { items }),
      ...(subtotal !== undefined && { subtotal }),
      ...(vatRate !== undefined && { vatRate }),
      ...(vatAmount !== undefined && { vatAmount }),
      ...(totalAmount !== undefined && { totalAmount }),
      ...(paymentMethod && { paymentMethod }),
      ...(note !== undefined && { note }),
    },
    include: { customer: true },
  });
  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const receipt = await prisma.accReceipt.findUnique({ where: { id: parseInt(id, 10) } });
  if (!receipt) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  await prisma.accReceipt.delete({ where: { id: parseInt(id, 10) } });
  return NextResponse.json({ success: true });
}
