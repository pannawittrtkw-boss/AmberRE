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

    // Generate contract number: CON-YYYY-NNNN
    // Derive the sequence from the highest existing contractNumber for the
    // year — not from a row count — so deleting a contract doesn't reuse
    // its number and trigger a unique-constraint violation on the next
    // create. Retry on P2002 in the (rare) event of a concurrent insert.
    const year = new Date().getFullYear();
    const prefix = `CON-${year}-`;
    const nextSeq = async () => {
      const last = await prisma.contract.findFirst({
        where: { contractNumber: { startsWith: prefix } },
        orderBy: { contractNumber: "desc" },
        select: { contractNumber: true },
      });
      if (!last) return 1;
      const tail = last.contractNumber.slice(prefix.length);
      const parsed = parseInt(tail, 10);
      return Number.isFinite(parsed) ? parsed + 1 : 1;
    };

    let contract;
    let seq = await nextSeq();
    const MAX_ATTEMPTS = 5;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const contractNumber = `${prefix}${String(seq).padStart(4, "0")}`;
      try {
        contract = await prisma.contract.create({
          data: {
            contractNumber,
        contractDate: new Date(body.contractDate),
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        termMonths: Number(body.termMonths) || 12,

        lessorName: String(body.lessorName).trim(),
        lessorNameEn: body.lessorNameEn || null,
        lessorNationality: body.lessorNationality || null,
        lessorIdCard: body.lessorIdCard || null,
        lessorAddress: body.lessorAddress || null,
        lessorAddressEn: body.lessorAddressEn || null,
        lessorPhone: body.lessorPhone || null,
        lessorIdImage: body.lessorIdImage || null,

        lesseeName: String(body.lesseeName).trim(),
        lesseeNameEn: body.lesseeNameEn || null,
        lesseeNationality: body.lesseeNationality || null,
        lesseeIdCard: body.lesseeIdCard || null,
        lesseeAddress: body.lesseeAddress || null,
        lesseeAddressEn: body.lesseeAddressEn || null,
        lesseePhone: body.lesseePhone || null,
        lesseeIdImage: body.lesseeIdImage || null,

        jointLesseeName: body.jointLesseeName || null,
        jointLesseeNameEn: body.jointLesseeNameEn || null,
        jointLesseeNationality: body.jointLesseeNationality || null,
        jointLesseeIdCard: body.jointLesseeIdCard || null,
        jointLesseeAddress: body.jointLesseeAddress || null,
        jointLesseeAddressEn: body.jointLesseeAddressEn || null,
        jointLesseePhone: body.jointLesseePhone || null,
        jointLesseeIdImage: body.jointLesseeIdImage || null,

        propertyId,
        projectName: String(body.projectName).trim(),
        unitNumber: String(body.unitNumber).trim(),
        buildingName: body.buildingName || null,
        floorNumber: body.floorNumber || null,
        propertyAddress: String(body.propertyAddress).trim(),
        propertyAddressEn: body.propertyAddressEn || null,
        sizeSqm: body.sizeSqm ? Number(body.sizeSqm) : null,

        monthlyRent: Number(body.monthlyRent),
        paymentDay: Number(body.paymentDay) || 1,
        bankName: body.bankName || null,
        bankBranch: body.bankBranch || null,
        bankBranchEn: body.bankBranchEn || null,
        bankAccountName: body.bankAccountName || null,
        bankAccountNameEn: body.bankAccountNameEn || null,
        bankAccountNumber: body.bankAccountNumber || null,
        latePaymentFee: Number(body.latePaymentFee) || 500,

        securityDeposit: Number(body.securityDeposit),

        furnitureList: body.furnitureList || null,
        applianceList: body.applianceList || null,
        otherItems: body.otherItems || null,

        customClauses: body.customClauses || null,
        clauseOverrides: body.clauseOverrides || null,

        status: body.status || "DRAFT",
        createdById,
      },
    });
        break;
      } catch (err: unknown) {
        // P2002 = unique constraint violation. Bump the seq and retry —
        // the only field with a unique constraint we can collide on is
        // `contractNumber`. After MAX_ATTEMPTS give up and surface the error.
        const code =
          typeof err === "object" && err && "code" in err
            ? (err as { code?: string }).code
            : undefined;
        if (code === "P2002" && attempt < MAX_ATTEMPTS - 1) {
          seq += 1;
          continue;
        }
        throw err;
      }
    }
    if (!contract) {
      return NextResponse.json(
        { success: false, error: "Could not allocate contract number" },
        { status: 500 }
      );
    }

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
