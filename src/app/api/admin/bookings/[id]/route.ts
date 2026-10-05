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
  const booking = await prisma.booking.findUnique({ where: { id: parseInt(id, 10) } });
  if (!booking) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: booking });
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

  const booking = await prisma.booking.update({
    where: { id: parseInt(id, 10) },
    data: {
      propertyId: body.propertyId !== undefined ? (body.propertyId ? Number(body.propertyId) : null) : undefined,
      projectName: body.projectName !== undefined ? body.projectName || null : undefined,
      unitNumber: body.unitNumber !== undefined ? body.unitNumber || null : undefined,
      propertyAddress: body.propertyAddress !== undefined ? body.propertyAddress || null : undefined,

      ownerName: body.ownerName || undefined,
      ownerIdCard: body.ownerIdCard !== undefined ? body.ownerIdCard || null : undefined,
      ownerIdCardImage: body.ownerIdCardImage !== undefined ? body.ownerIdCardImage || null : undefined,
      ownerAddress: body.ownerAddress !== undefined ? body.ownerAddress || null : undefined,
      ownerPhone: body.ownerPhone !== undefined ? body.ownerPhone || null : undefined,
      ownerBankName: body.ownerBankName !== undefined ? body.ownerBankName || null : undefined,
      ownerBankAccountNumber:
        body.ownerBankAccountNumber !== undefined ? body.ownerBankAccountNumber || null : undefined,
      ownerBankAccountName:
        body.ownerBankAccountName !== undefined ? body.ownerBankAccountName || null : undefined,

      tenantName: body.tenantName || undefined,
      tenantIdCard: body.tenantIdCard !== undefined ? body.tenantIdCard || null : undefined,
      tenantIdCardImage: body.tenantIdCardImage !== undefined ? body.tenantIdCardImage || null : undefined,
      tenantAddress: body.tenantAddress !== undefined ? body.tenantAddress || null : undefined,
      tenantPhone: body.tenantPhone !== undefined ? body.tenantPhone || null : undefined,

      depositAmount: body.depositAmount !== undefined ? Number(body.depositAmount) : undefined,
      monthlyRent: body.monthlyRent !== undefined ? (body.monthlyRent ? Number(body.monthlyRent) : null) : undefined,
      leaseTermMonths:
        body.leaseTermMonths !== undefined ? (body.leaseTermMonths ? Number(body.leaseTermMonths) : null) : undefined,
      depositDate: body.depositDate !== undefined ? (body.depositDate ? new Date(body.depositDate) : null) : undefined,
      appointmentDate:
        body.appointmentDate !== undefined ? (body.appointmentDate ? new Date(body.appointmentDate) : null) : undefined,
      moveInDate: body.moveInDate !== undefined ? (body.moveInDate ? new Date(body.moveInDate) : null) : undefined,

      transferSlipImage: body.transferSlipImage !== undefined ? body.transferSlipImage || null : undefined,

      issuerName: body.issuerName !== undefined ? body.issuerName || null : undefined,
      witnessName: body.witnessName !== undefined ? body.witnessName || null : undefined,
      agentPhone: body.agentPhone !== undefined ? body.agentPhone || null : undefined,
    },
  });

  return NextResponse.json({ success: true, data: booking });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.booking.delete({ where: { id: parseInt(id, 10) } });
  return NextResponse.json({ success: true });
}
