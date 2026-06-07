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
    const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const day = Math.min(paymentDay, lastDayOfMonth);
    const due = new Date(Date.UTC(year, month, day));

    if (due > end) break;
    // compare calendar dates, not raw timestamps
    if (due.toISOString().slice(0, 10) >= start.toISOString().slice(0, 10)) dates.push(due);

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

  // Remove any unpaid records stored with a non-UTC-midnight timestamp
  // (these were created by the local dev server running in UTC+7, causing duplicate entries)
  const allForCleanup = await prisma.rentPayment.findMany({
    where: { isPaid: false },
    select: { id: true, dueDate: true },
  });
  const nonMidnightIds = allForCleanup
    .filter((p) => {
      const d = new Date(p.dueDate);
      return d.getUTCHours() !== 0 || d.getUTCMinutes() !== 0 || d.getUTCSeconds() !== 0;
    })
    .map((p) => p.id);
  if (nonMidnightIds.length > 0) {
    await prisma.rentPayment.deleteMany({ where: { id: { in: nonMidnightIds } } });
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

  // Build the complete set of valid due-date keys from current contract settings.
  // Any unpaid record whose key is missing from this set is stale (e.g. old
  // paymentDay or startDate) and should be removed.
  const validKeys = new Set<string>();
  for (const c of contracts) {
    const dues = generateDueDates(c.startDate, c.endDate, c.paymentDay);
    for (const due of dues) {
      validKeys.add(`${c.id}|${due.toISOString().slice(0, 10)}`);
    }
  }

  const activeContractIds = new Set(contracts.map((c) => c.id));

  const all = await prisma.rentPayment.findMany({
    select: { id: true, contractId: true, dueDate: true, isPaid: true },
  });
  const toDelete = all
    .filter((p) => {
      // Always remove records for terminated contracts
      if (!activeContractIds.has(p.contractId)) return true;
      // Remove unpaid records that no longer match the contract's current schedule
      const key = `${p.contractId}|${p.dueDate.toISOString().slice(0, 10)}`;
      return !p.isPaid && !validKeys.has(key);
    })
    .map((p) => p.id);

  if (toDelete.length > 0) {
    await prisma.rentPayment.deleteMany({ where: { id: { in: toDelete } } });
  }

  return NextResponse.json({ success: true, data: { created, deleted: toDelete.length } });
}
