import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const contract = await prisma.contract.findUnique({
    where: { id: parseInt(id, 10) },
  });
  if (!contract) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: contract });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const contract = await prisma.contract.update({
      where: { id: parseInt(id, 10) },
      data: {
        contractDate: body.contractDate ? new Date(body.contractDate) : undefined,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        termMonths: body.termMonths != null ? Number(body.termMonths) : undefined,

        lessorName: body.lessorName,
        lessorNationality: body.lessorNationality || null,
        lessorIdCard: body.lessorIdCard || null,
        lessorAddress: body.lessorAddress || null,
        lessorPhone: body.lessorPhone || null,
        lessorIdImage: body.lessorIdImage || null,

        lesseeName: body.lesseeName,
        lesseeNationality: body.lesseeNationality || null,
        lesseeIdCard: body.lesseeIdCard || null,
        lesseeAddress: body.lesseeAddress || null,
        lesseePhone: body.lesseePhone || null,
        lesseeIdImage: body.lesseeIdImage || null,

        jointLesseeName: body.jointLesseeName || null,
        jointLesseeNationality: body.jointLesseeNationality || null,
        jointLesseeIdCard: body.jointLesseeIdCard || null,
        jointLesseeAddress: body.jointLesseeAddress || null,
        jointLesseePhone: body.jointLesseePhone || null,
        jointLesseeIdImage: body.jointLesseeIdImage || null,

        property: body.propertyId
          ? { connect: { id: Number(body.propertyId) } }
          : { disconnect: true },
        projectName: body.projectName,
        unitNumber: body.unitNumber,
        buildingName: body.buildingName || null,
        floorNumber: body.floorNumber || null,
        propertyAddress: body.propertyAddress,
        sizeSqm: body.sizeSqm ? Number(body.sizeSqm) : null,

        monthlyRent: body.monthlyRent != null ? Number(body.monthlyRent) : undefined,
        paymentDay: body.paymentDay != null ? Number(body.paymentDay) : undefined,
        bankName: body.bankName || null,
        bankBranch: body.bankBranch || null,
        bankAccountName: body.bankAccountName || null,
        bankAccountNumber: body.bankAccountNumber || null,
        latePaymentFee: body.latePaymentFee != null ? Number(body.latePaymentFee) : undefined,

        securityDeposit: body.securityDeposit != null ? Number(body.securityDeposit) : undefined,

        furnitureList: body.furnitureList || null,
        applianceList: body.applianceList || null,
        otherItems: body.otherItems || null,

        customClauses: body.customClauses || null,
        clauseOverrides: body.clauseOverrides || null,

        status: body.status || undefined,
      },
    });

    return NextResponse.json({ success: true, data: contract });
  } catch (err: any) {
    console.error("Update contract error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error", code: err?.code },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    await prisma.contract.delete({ where: { id: parseInt(id, 10) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}
