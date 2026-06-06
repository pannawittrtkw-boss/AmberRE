import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Generate payment due dates for a contract between startDate and endDate
function generateDueDates(
  startDate: Date,
  endDate: Date,
  paymentDay: number
): Date[] {
  const dates: Date[] = [];
  const start = new Date(startDate);
  const end   = new Date(endDate);

  // Begin from the month of startDate
  let year  = start.getFullYear();
  let month = start.getMonth(); // 0-indexed

  while (true) {
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const day = Math.min(paymentDay, lastDayOfMonth);
    const due = new Date(year, month, day, 0, 0, 0, 0);

    if (due > end) break;
    if (due >= start) dates.push(due);

    month++;
    if (month > 11) { month = 0; year++; }
  }

  return dates;
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  // Fetch all non-terminated contracts
  const contracts = await prisma.contract.findMany({
    where: { status: { not: "TERMINATED" } },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      paymentDay: true,
      monthlyRent: true,
    },
  });

  // Fetch existing payment records (contractId + dueDate key)
  const existing = await prisma.rentPayment.findMany({
    select: { contractId: true, dueDate: true },
  });
  const existingSet = new Set(
    existing.map((e) => `${e.contractId}|${e.dueDate.toISOString().slice(0, 10)}`)
  );

  let created = 0;
  const toCreate: {
    contractId: number;
    dueDate: Date;
    amount: number;
  }[] = [];

  for (const c of contracts) {
    const dues = generateDueDates(c.startDate, c.endDate, c.paymentDay);
    for (const due of dues) {
      const key = `${c.id}|${due.toISOString().slice(0, 10)}`;
      if (!existingSet.has(key)) {
        toCreate.push({
          contractId: c.id,
          dueDate: due,
          amount: Number(c.monthlyRent),
        });
      }
    }
  }

  if (toCreate.length > 0) {
    await prisma.rentPayment.createMany({ data: toCreate, skipDuplicates: true });
    created = toCreate.length;
  }

  // Delete payments for terminated contracts or dates beyond endDate
  const activeContractIds = new Set(contracts.map((c) => c.id));
  const contractEndMap: Record<number, Date> = {};
  for (const c of contracts) contractEndMap[c.id] = c.endDate;

  const all = await prisma.rentPayment.findMany({ select: { id: true, contractId: true, dueDate: true } });
  const toDelete = all
    .filter((p) => {
      if (!activeContractIds.has(p.contractId)) return true;
      const end = contractEndMap[p.contractId];
      return end && p.dueDate > end;
    })
    .map((p) => p.id);

  if (toDelete.length > 0) {
    await prisma.rentPayment.deleteMany({ where: { id: { in: toDelete } } });
  }

  return NextResponse.json({ success: true, data: { created, deleted: toDelete.length } });
}
