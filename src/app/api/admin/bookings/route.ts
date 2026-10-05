import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "crypto";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getWitnessSettings } from "@/lib/contract-witnesses";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") return null;
  return session;
}

async function genDocNumber(date: Date): Promise<string> {
  const yyyy = date.getFullYear().toString();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const prefix = `BK${yyyy}${mm}`;
  const last = await prisma.booking.findFirst({
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

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ success: true, data: bookings });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  if (!body.ownerName || !body.tenantName || !body.depositAmount) {
    return NextResponse.json(
      { success: false, error: "ownerName, tenantName, and depositAmount are required" },
      { status: 400 }
    );
  }

  const now = new Date();
  const docNumber = await genDocNumber(now);
  const witnesses = await getWitnessSettings();

  const booking = await prisma.booking.create({
    data: {
      docNumber,
      propertyId: body.propertyId ? Number(body.propertyId) : null,
      projectName: body.projectName || null,
      unitNumber: body.unitNumber || null,
      propertyAddress: body.propertyAddress || null,

      ownerName: body.ownerName,
      ownerIdCard: body.ownerIdCard || null,
      ownerIdCardImage: body.ownerIdCardImage || null,
      ownerAddress: body.ownerAddress || null,
      ownerPhone: body.ownerPhone || null,
      ownerBankName: body.ownerBankName || null,
      ownerBankAccountNumber: body.ownerBankAccountNumber || null,
      ownerBankAccountName: body.ownerBankAccountName || null,

      tenantName: body.tenantName,
      tenantIdCard: body.tenantIdCard || null,
      tenantAddress: body.tenantAddress || null,
      tenantPhone: body.tenantPhone || null,

      depositAmount: Number(body.depositAmount),
      monthlyRent: body.monthlyRent ? Number(body.monthlyRent) : null,
      leaseTermMonths: body.leaseTermMonths ? Number(body.leaseTermMonths) : null,
      depositDate: body.depositDate ? new Date(body.depositDate) : null,
      appointmentDate: body.appointmentDate ? new Date(body.appointmentDate) : null,
      moveInDate: body.moveInDate ? new Date(body.moveInDate) : null,

      transferSlipImage: body.transferSlipImage || null,

      issuerName: body.issuerName || session.user?.name || null,
      witnessName: body.witnessName || witnesses.witness1Name || null,
      agentPhone: body.agentPhone || null,

      signToken: crypto.randomBytes(24).toString("hex"),
    },
  });

  return NextResponse.json({ success: true, data: booking });
}
