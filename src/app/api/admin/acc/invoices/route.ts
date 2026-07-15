import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") return null;
  return session;
}

async function genInvoiceNumber(date: Date): Promise<string> {
  const yyyy = date.getFullYear().toString();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const prefix = `INV${yyyy}${mm}`;
  const last = await prisma.accInvoice.findFirst({
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
  const invoices = await prisma.accInvoice.findMany({
    where,
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ success: true, data: invoices });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { date, dueDate, creditTerm, customerId, items, subtotal, vatRate, vatAmount, totalAmount, note } = body;
  if (!date || !customerId) {
    return NextResponse.json({ success: false, error: "date and customerId required" }, { status: 400 });
  }
  const dateObj = new Date(date);
  const docNumber = await genInvoiceNumber(dateObj);
  const invoice = await prisma.accInvoice.create({
    data: {
      docNumber,
      date: dateObj,
      dueDate: dueDate ? new Date(dueDate) : null,
      creditTerm: creditTerm || null,
      customerId: parseInt(customerId, 10),
      items: items ?? [],
      subtotal,
      vatRate: vatRate ?? 7,
      vatAmount,
      totalAmount,
      note,
    },
    include: { customer: true },
  });
  return NextResponse.json({ success: true, data: invoice }, { status: 201 });
}
