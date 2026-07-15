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
  const invoice = await prisma.accInvoice.findUnique({
    where: { id: parseInt(id, 10) },
    include: { customer: true, billingNotes: true, receipts: true },
  });
  if (!invoice) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: invoice });
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
  const { date, dueDate, creditTerm, customerId, items, subtotal, vatRate, vatAmount, totalAmount, note, status } = body;
  const invoice = await prisma.accInvoice.update({
    where: { id: parseInt(id, 10) },
    data: {
      ...(date && { date: new Date(date) }),
      dueDate: dueDate ? new Date(dueDate) : null,
      creditTerm: creditTerm || null,
      ...(customerId && { customerId: parseInt(customerId, 10) }),
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
  return NextResponse.json({ success: true, data: invoice });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const invoice = await prisma.accInvoice.findUnique({ where: { id: parseInt(id, 10) } });
  if (!invoice) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  if (invoice.status !== "PENDING") {
    return NextResponse.json({ success: false, error: "ลบได้เฉพาะสถานะ PENDING" }, { status: 409 });
  }
  await prisma.accInvoice.delete({ where: { id: parseInt(id, 10) } });
  return NextResponse.json({ success: true });
}
