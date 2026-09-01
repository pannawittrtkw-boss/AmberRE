import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

const CONTRACT_TYPE_LABEL: Record<string, string> = {
  NEW: "สัญญาใหม่",
  RENEW: "ต่อสัญญา",
};
const DEAL_TYPE_LABEL: Record<string, string> = {
  DIRECT_OWNER: "เจ้าของโดยตรง",
  CO_AGENT: "Co-Agent",
};

// Mirrors calcCommission() in the contracts admin page — kept in sync
// manually since one lives client-side (for live display) and this one
// runs server-side (so the amount can't be spoofed from the client).
function calcCommission(monthlyRent: number, contractType: string, termMonths: number, dealType: string): number {
  let commission = contractType === "RENEW" ? monthlyRent * (termMonths / 12) * 0.5 : monthlyRent;
  if (dealType === "CO_AGENT") commission /= 2;
  return commission;
}

function fmtDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function buildDescription(c: {
  projectName: string;
  unitNumber: string;
  startDate: Date;
  contractType: string;
  dealType: string;
  contractNumber: string;
}): string {
  const contractTypeLabel = CONTRACT_TYPE_LABEL[c.contractType] || c.contractType;
  const dealTypeLabel = DEAL_TYPE_LABEL[c.dealType] || c.dealType;
  return `${c.projectName} #${c.unitNumber} | ${fmtDate(c.startDate)} | ${contractTypeLabel} | ${dealTypeLabel} (${c.contractNumber})`;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || !["ADMIN", "CO_AGENT"].includes(role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const contract = await prisma.contract.findUnique({ where: { id: parseInt(id, 10) } });
  if (!contract) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  const description = buildDescription(contract);
  const amount = calcCommission(
    Number(contract.monthlyRent),
    contract.contractType,
    contract.termMonths,
    contract.dealType
  );

  const monthStart = new Date(contract.startDate.getFullYear(), contract.startDate.getMonth(), 1);
  const monthEnd = new Date(contract.startDate.getFullYear(), contract.startDate.getMonth() + 1, 1);

  const existing = await prisma.transaction.findFirst({
    where: {
      category: "Commission Rent",
      description,
      date: { gte: monthStart, lt: monthEnd },
    },
  });
  if (existing) {
    return NextResponse.json(
      {
        success: false,
        error: "รายการนี้ถูกบันทึกไว้ในบัญชีของเดือนนี้แล้ว หากต้องการสร้างใหม่ กรุณาไปลบรายการเดิมที่หน้าบัญชีก่อน",
      },
      { status: 409 }
    );
  }

  const userId = Number((session.user as any).id);
  const txn = await prisma.transaction.create({
    data: {
      date: contract.startDate,
      amount,
      type: "INCOME",
      recordType: "ACTUAL",
      category: "Commission Rent",
      description,
      createdById: userId || null,
    },
  });

  return NextResponse.json({ success: true, data: { ...txn, amount: Number(txn.amount) } });
}
