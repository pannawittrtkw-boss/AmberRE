import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") return null;
  return session;
}

async function genBillingNoteNumber(date: Date): Promise<string> {
  const yyyy = date.getFullYear().toString();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const prefix = `BL${yyyy}${mm}`;
  const last = await prisma.accBillingNote.findFirst({
    where: { docNumber: { startsWith: prefix } },
    orderBy: { docNumber: "desc" },
  });
  let seq = 1;
  if (last) {
    const lastSeq = parseInt(last.docNumber.slice(prefix.length), 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }
  return prefix + String(seq).padStart(4, "0");
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const customerId = searchParams.get("customerId");
  const where: any = {};
  if (status) where.status = status;
  if (customerId) where.customerId = parseInt(customerId, 10);
  const notes = await prisma.accBillingNote.findMany({
    where,
    include: { customer: true, invoice: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ success: true, data: notes });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { date, dueDate, customerId, invoiceId, items, subtotal, vatRate, vatAmount, totalAmount, note } = body;
  if (!date || !customerId) {
    return NextResponse.json({ success: false, error: "date and customerId required" }, { status: 400 });
  }
  const dateObj = new Date(date);
  const docNumber = await genBillingNoteNumber(dateObj);

  const billingNote = await prisma.accBillingNote.create({
    data: {
      docNumber,
      date: dateObj,
      dueDate: dueDate ? new Date(dueDate) : null,
      customerId: parseInt(customerId, 10),
      invoiceId: invoiceId ? parseInt(invoiceId, 10) : null,
      items: items ?? [],
      subtotal,
      vatRate: vatRate ?? 7,
      vatAmount,
      totalAmount,
      note,
    },
    include: { customer: true, invoice: true },
  });

  if (invoiceId) {
    await prisma.accInvoice.update({
      where: { id: parseInt(invoiceId, 10) },
      data: { status: "BILLED" },
    });
  }

  return NextResponse.json({ success: true, data: billingNote }, { status: 201 });
}
