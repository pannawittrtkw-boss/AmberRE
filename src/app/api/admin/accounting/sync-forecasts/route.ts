import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Description prefix used to identify auto-generated forecasts
function forecastDescription(c: {
  contractNumber: string;
  projectName: string;
  unitNumber: string;
  lesseeName: string;
}) {
  return `[FC:${c.contractNumber}] ${c.projectName} #${c.unitNumber} - ${c.lesseeName}`;
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  const userId = Number((session.user as any).id);

  // Use start of today so contracts ending today are still included
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const contracts = await prisma.contract.findMany({
    where: { endDate: { gte: now } },
    select: {
      id: true,
      contractNumber: true,
      projectName: true,
      unitNumber: true,
      lesseeName: true,
      monthlyRent: true,
      endDate: true,
    },
  });

  // Fetch all existing forecast transactions that match [FC:...] pattern
  const existingForecasts = await prisma.transaction.findMany({
    where: {
      recordType: "FORECAST",
      category: "Commission Rent",
      description: { contains: "[FC:" },
    },
    select: { id: true, description: true, amount: true, date: true },
  });

  // Index existing forecasts by contractNumber for O(1) lookup
  const existingMap: Record<string, { id: number; amount: number; date: Date }> = {};
  for (const f of existingForecasts) {
    const match = f.description.match(/\[FC:(CON-\d{4}-\d{4})\]/);
    if (match) existingMap[match[1]] = { id: f.id, amount: Number(f.amount), date: f.date };
  }

  let created = 0;
  let updated = 0;

  for (const c of contracts) {
    const amount = Number(c.monthlyRent) / 2; // half-month commission
    const date   = new Date(c.endDate);
    const desc   = forecastDescription(c);
    const existing = existingMap[c.contractNumber];

    if (!existing) {
      // Create new forecast
      await prisma.transaction.create({
        data: {
          date,
          amount,
          type: "INCOME",
          recordType: "FORECAST",
          category: "Commission Rent",
          description: desc,
          createdById: userId,
        },
      });
      created++;
    } else {
      // Update if amount or date changed
      const dateChanged = existing.date.toISOString().slice(0, 10) !== date.toISOString().slice(0, 10);
      const amountChanged = existing.amount !== amount;
      if (dateChanged || amountChanged) {
        await prisma.transaction.update({
          where: { id: existing.id },
          data: { amount, date, description: desc },
        });
        updated++;
      }
    }
  }

  // Remove forecasts for contracts that no longer exist or have expired
  const activeContractNumbers = new Set(contracts.map(c => c.contractNumber));
  for (const [contractNumber, forecast] of Object.entries(existingMap)) {
    if (!activeContractNumbers.has(contractNumber)) {
      await prisma.transaction.delete({ where: { id: forecast.id } });
    }
  }

  return NextResponse.json({ success: true, data: { created, updated, total: contracts.length } });
}
