import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") return null;
  return session;
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
  const { name, address, taxId, phone, email, contactName } = body;
  const customer = await prisma.accCustomer.update({
    where: { id: parseInt(id, 10) },
    data: { name, address, taxId, phone, email, contactName },
  });
  return NextResponse.json({ success: true, data: customer });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const numId = parseInt(id, 10);
  const [invCount, bnCount, rcCount] = await Promise.all([
    prisma.accInvoice.count({ where: { customerId: numId } }),
    prisma.accBillingNote.count({ where: { customerId: numId } }),
    prisma.accReceipt.count({ where: { customerId: numId } }),
  ]);
  if (invCount + bnCount + rcCount > 0) {
    return NextResponse.json(
      { success: false, error: "ไม่สามารถลบได้ เนื่องจากมีเอกสารที่เชื่อมอยู่" },
      { status: 409 }
    );
  }
  await prisma.accCustomer.delete({ where: { id: numId } });
  return NextResponse.json({ success: true });
}
