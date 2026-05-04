import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const contracts = await prisma.contract.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      property: {
        select: { id: true, titleTh: true, projectName: true },
      },
    },
  });

  return NextResponse.json({ success: true, data: contracts });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();

    // Generate contract number: CON-YYYY-NNN
    const year = new Date().getFullYear();
    const yearStart = new Date(`${year}-01-01`);
    const count = await prisma.contract.count({
      where: { createdAt: { gte: yearStart } },
    });
    const contractNumber = `CON-${year}-${String(count + 1).padStart(4, "0")}`;

    const contract = await prisma.contract.create({
      data: {
        contractNumber,
        contractDate: new Date(body.contractDate),
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        termMonths: Number(body.termMonths) || 12,

        lessorName: body.lessorName,
        lessorIdCard: body.lessorIdCard || null,
        lessorAddress: body.lessorAddress || null,
        lessorPhone: body.lessorPhone || null,

        lesseeName: body.lesseeName,
        lesseeNationality: body.lesseeNationality || null,
        lesseeIdCard: body.lesseeIdCard || null,
        lesseeAddress: body.lesseeAddress || null,
        lesseePhone: body.lesseePhone || null,

        jointLesseeName: body.jointLesseeName || null,
        jointLesseeNationality: body.jointLesseeNationality || null,
        jointLesseeIdCard: body.jointLesseeIdCard || null,
        jointLesseeAddress: body.jointLesseeAddress || null,
        jointLesseePhone: body.jointLesseePhone || null,

        propertyId: body.propertyId ? Number(body.propertyId) : null,
        projectName: body.projectName,
        unitNumber: body.unitNumber,
        buildingName: body.buildingName || null,
        floorNumber: body.floorNumber || null,
        propertyAddress: body.propertyAddress,
        sizeSqm: body.sizeSqm ? Number(body.sizeSqm) : null,

        monthlyRent: Number(body.monthlyRent),
        paymentDay: Number(body.paymentDay) || 1,
        bankName: body.bankName || null,
        bankBranch: body.bankBranch || null,
        bankAccountName: body.bankAccountName || null,
        bankAccountNumber: body.bankAccountNumber || null,
        latePaymentFee: Number(body.latePaymentFee) || 500,

        securityDeposit: Number(body.securityDeposit),

        furnitureList: body.furnitureList || null,
        applianceList: body.applianceList || null,
        otherItems: body.otherItems || null,

        status: body.status || "DRAFT",
        createdById: Number((session.user as any).id) || null,
      },
    });

    return NextResponse.json({ success: true, data: contract });
  } catch (err) {
    console.error("Create contract error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
