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
  const note = await prisma.accBillingNote.findUnique({
    where: { id: parseInt(id, 10) },
    include: { customer: true, invoice: true, receipts: true },
  });
  if (!note) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: note });
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
  const { date, dueDate, customerId, invoiceId, items, subtotal, vatRate, vatAmount, totalAmount, note, status } = body;
  const updated = await prisma.accBillingNote.update({
    where: { id: parseInt(id, 10) },
    data: {
      ...(date && { date: new Date(date) }),
      dueDate: dueDate ? new Date(dueDate) : null,
      ...(customerId && { customerId: parseInt(customerId, 10) }),
      invoiceId: invoiceId ? parseInt(invoiceId, 10) : null,
      ...(items !== undefined && { items }),
      ...(subtotal !== undefined && { subtotal }),
      ...(vatRate !== undefined && { vatRate }),
      ...(vatAmount !== undefined && { vatAmount }),
      ...(totalAmount !== undefined && { totalAmount }),
      ...(note !== undefined && { note }),
      ...(status && { status }),
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
  const note = await prisma.accBillingNote.findUnique({ where: { id: parseInt(id, 10) } });
  if (!note) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  if (note.status !== "PENDING") {
    return NextResponse.json({ success: false, error: "ลบได้เฉพาะสถานะ PENDING" }, { status: 409 });
  }
  await prisma.accBillingNote.delete({ where: { id: parseInt(id, 10) } });
  return NextResponse.json({ success: true });
}
