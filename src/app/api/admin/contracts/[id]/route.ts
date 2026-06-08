import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function assertContractAccess(session: any, contractId: number) {
  const role = (session?.user as any)?.role;
  if (!["ADMIN", "CO_AGENT"].includes(role)) return false;
  if (role === "ADMIN") return true;
  // CO_AGENT: verify the contract's property belongs to them
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    select: { property: { select: { agentId: true } } },
  });
  const userId = Number((session.user as any).id);
  return contract?.property?.agentId === userId;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const contractId = parseInt(id, 10);
  if (!session?.user || !(await assertContractAccess(session, contractId))) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
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
  const { id } = await params;
  const contractId = parseInt(id, 10);
  if (!session?.user || !(await assertContractAccess(session, contractId))) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();

    const contract = await prisma.contract.update({
      where: { id: contractId },
      data: {
        contractDate: body.contractDate ? new Date(body.contractDate) : undefined,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        termMonths: body.termMonths != null ? Number(body.termMonths) : undefined,

        lessorName: body.lessorName,
        lessorNameEn: body.lessorNameEn || null,
        lessorNationality: body.lessorNationality || null,
        lessorIdCard: body.lessorIdCard || null,
        lessorAddress: body.lessorAddress || null,
        lessorAddressEn: body.lessorAddressEn || null,
        lessorPhone: body.lessorPhone || null,
        lessorIdImage: body.lessorIdImage || null,

        lesseeName: body.lesseeName,
        lesseeNameEn: body.lesseeNameEn || null,
        lesseeNationality: body.lesseeNationality || null,
        lesseeIdCard: body.lesseeIdCard || null,
        lesseeAddress: body.lesseeAddress || null,
        lesseeAddressEn: body.lesseeAddressEn || null,
        lesseePhone: body.lesseePhone || null,
        lineGroupId: body.lineGroupId || null,
        lesseeIdImage: body.lesseeIdImage || null,

        jointLesseeName: body.jointLesseeName || null,
        jointLesseeNameEn: body.jointLesseeNameEn || null,
        jointLesseeNationality: body.jointLesseeNationality || null,
        jointLesseeIdCard: body.jointLesseeIdCard || null,
        jointLesseeAddress: body.jointLesseeAddress || null,
        jointLesseeAddressEn: body.jointLesseeAddressEn || null,
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
        propertyAddressEn: body.propertyAddressEn || null,
        sizeSqm: body.sizeSqm ? Number(body.sizeSqm) : null,

        monthlyRent: body.monthlyRent != null ? Number(body.monthlyRent) : undefined,
        paymentDay: body.paymentDay != null ? Number(body.paymentDay) : undefined,
        bankName: body.bankName || null,
        bankBranch: body.bankBranch || null,
        bankBranchEn: body.bankBranchEn || null,
        bankAccountName: body.bankAccountName || null,
        bankAccountNameEn: body.bankAccountNameEn || null,
        bankAccountNumber: body.bankAccountNumber || null,
        latePaymentFee: body.latePaymentFee != null ? Number(body.latePaymentFee) : undefined,

        securityDeposit: body.securityDeposit != null ? Number(body.securityDeposit) : undefined,

        furnitureList: body.furnitureList || null,
        applianceList: body.applianceList || null,
        otherItems: body.otherItems || null,
        furnitureNone: !!body.furnitureNone,
        applianceNone: !!body.applianceNone,
        otherItemsNone: !!body.otherItemsNone,

        customClauses: body.customClauses || null,
        clauseOverrides: body.clauseOverrides || null,

        contractType: body.contractType || undefined,
        dealType: body.dealType || undefined,
        coAgentName: body.dealType === "CO_AGENT" ? (body.coAgentName || null) : null,
        coAgentPhone: body.dealType === "CO_AGENT" ? (body.coAgentPhone || null) : null,
        coAgentLineId: body.dealType === "CO_AGENT" ? (body.coAgentLineId || null) : null,
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

// Partial update — currently scoped to `status` only. Lets the
// contracts table flip status inline without sending the full PUT
// payload (which clobbers any optional field missing from the body).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const contractId = parseInt(id, 10);
  if (!session?.user || !(await assertContractAccess(session, contractId))) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();

    const ALLOWED_STATUSES = ["DRAFT", "ACTIVE", "EXPIRED", "TERMINATED"];
    if (body.status && !ALLOWED_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 }
      );
    }

    const contract = await prisma.contract.update({
      where: { id: contractId },
      data: {
        ...(body.status ? { status: body.status } : {}),
      },
    });

    return NextResponse.json({ success: true, data: contract });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("Patch contract error:", err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const contractId = parseInt(id, 10);
  if (!session?.user || !(await assertContractAccess(session, contractId))) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    await prisma.contract.delete({ where: { id: contractId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}
