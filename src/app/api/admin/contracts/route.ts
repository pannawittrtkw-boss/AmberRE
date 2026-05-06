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

    // Required field validation
    const required = [
      "contractDate", "startDate", "endDate",
      "lessorName", "lesseeName",
      "projectName", "unitNumber", "propertyAddress",
      "monthlyRent", "securityDeposit",
    ];
    for (const k of required) {
      const v = body[k];
      if (v === undefined || v === null || String(v).trim() === "") {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${k}` },
          { status: 400 }
        );
      }
    }

    // Verify property exists if propertyId is provided
    let propertyId: number | null = null;
    if (body.propertyId) {
      const idNum = Number(body.propertyId);
      if (!Number.isNaN(idNum)) {
        const exists = await prisma.property.findUnique({ where: { id: idNum }, select: { id: true } });
        if (exists) propertyId = idNum;
      }
    }

    // Verify creator user exists
    let createdById: number | null = null;
    const sessionUserId = (session.user as any).id;
    if (sessionUserId) {
      const idNum = Number(sessionUserId);
      if (!Number.isNaN(idNum)) {
        const exists = await prisma.user.findUnique({ where: { id: idNum }, select: { id: true } });
        if (exists) createdById = idNum;
      }
    }

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

        lessorName: String(body.lessorName).trim(),
        lessorNationality: body.lessorNationality || null,
        lessorIdCard: body.lessorIdCard || null,
        lessorAddress: body.lessorAddress || null,
        lessorPhone: body.lessorPhone || null,
        lessorIdImage: body.lessorIdImage || null,

        lesseeName: String(body.lesseeName).trim(),
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

        propertyId,
        projectName: String(body.projectName).trim(),
        unitNumber: String(body.unitNumber).trim(),
        buildingName: body.buildingName || null,
        floorNumber: body.floorNumber || null,
        propertyAddress: String(body.propertyAddress).trim(),
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
        createdById,
      },
    });

    return NextResponse.json({ success: true, data: contract });
  } catch (err: any) {
    console.error("Create contract error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Internal server error",
        code: err?.code,
      },
      { status: 500 }
    );
  }
}
