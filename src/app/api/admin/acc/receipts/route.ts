import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") return null;
  return session;
}

async function genReceiptNumber(date: Date): Promise<string> {
  const yyyy = date.getFullYear().toString();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const prefix = `RE${yyyy}${mm}`;
  const last = await prisma.accReceipt.findFirst({
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
  const customerId = searchParams.get("customerId");
  const where: any = {};
  if (customerId) where.customerId = parseInt(customerId, 10);
  const receipts = await prisma.accReceipt.findMany({
    where,
    include: { customer: true, billingNote: true, invoice: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ success: true, data: receipts });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const {
    date, customerId, billingNoteId, invoiceId,
    items, subtotal, vatRate, vatAmount, totalAmount,
    paymentMethod, note,
  } = body;
  if (!date || !customerId) {
    return NextResponse.json({ success: false, error: "date and customerId required" }, { status: 400 });
  }
  const dateObj = new Date(date);
  const docNumber = await genReceiptNumber(dateObj);

  const receipt = await prisma.accReceipt.create({
    data: {
      docNumber,
      date: dateObj,
      customerId: parseInt(customerId, 10),
      billingNoteId: billingNoteId ? parseInt(billingNoteId, 10) : null,
      invoiceId: invoiceId ? parseInt(invoiceId, 10) : null,
      items: items ?? [],
      subtotal,
      vatRate: vatRate ?? 7,
      vatAmount,
      totalAmount,
      paymentMethod: paymentMethod ?? "CASH",
      note,
    },
    include: { customer: true, billingNote: true, invoice: true },
  });

  if (billingNoteId) {
    const bn = await prisma.accBillingNote.update({
      where: { id: parseInt(billingNoteId, 10) },
      data: { status: "PAID" },
    });
    if (bn.invoiceId) {
      await prisma.accInvoice.update({
        where: { id: bn.invoiceId },
        data: { status: "PAID" },
      });
    }
  } else if (invoiceId) {
    await prisma.accInvoice.update({
      where: { id: parseInt(invoiceId, 10) },
      data: { status: "PAID" },
    });
  }

  return NextResponse.json({ success: true, data: receipt }, { status: 201 });
}
