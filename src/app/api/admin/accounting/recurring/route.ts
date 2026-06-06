import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const SETTING_KEY = "accounting_recurring_expenses";

export type RecurringTemplate = {
  id: string;
  category: string;
  amount: number;
  description: string;
  payee: string | null;
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "CO_AGENT"].includes((session.user as any).role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  const row = await prisma.siteSetting.findUnique({ where: { key: SETTING_KEY } });
  const templates: RecurringTemplate[] = row?.valueTh ? JSON.parse(row.valueTh) : [];
  return NextResponse.json({ success: true, data: templates });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  const templates: RecurringTemplate[] = await req.json();
  await prisma.siteSetting.upsert({
    where: { key: SETTING_KEY },
    update: { valueTh: JSON.stringify(templates) },
    create: { key: SETTING_KEY, valueTh: JSON.stringify(templates) },
  });
  return NextResponse.json({ success: true });
}

// POST: apply recurring templates to a specific year/month
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "CO_AGENT"].includes((session.user as any).role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  const userId = Number((session.user as any).id);
  const { year, month } = await req.json();

  const row = await prisma.siteSetting.findUnique({ where: { key: SETTING_KEY } });
  const templates: RecurringTemplate[] = row?.valueTh ? JSON.parse(row.valueTh) : [];
  if (!templates.length) return NextResponse.json({ success: true, data: { created: 0 } });

  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  const tag = `[REC:${monthKey}]`;

  // Check if already applied
  const existing = await prisma.transaction.findFirst({
    where: { description: { contains: tag } },
  });
  if (existing) return NextResponse.json({ success: true, data: { created: 0, alreadyApplied: true } });

  // Create transactions on day 1 of the month
  const date = new Date(year, month - 1, 1);
  await prisma.transaction.createMany({
    data: templates.map((t) => ({
      date,
      amount: t.amount,
      type: "EXPENSE" as const,
      recordType: "ACTUAL" as const,
      category: t.category,
      description: `${tag} ${t.description}`,
      payee: t.payee || null,
      createdById: userId,
    })),
  });

  return NextResponse.json({ success: true, data: { created: templates.length } });
}
