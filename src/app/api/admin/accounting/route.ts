import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month"); // 1-12

    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();
    const month = monthParam ? parseInt(monthParam) : new Date().getMonth() + 1;

    // Current month range
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    // Previous month range
    const prevStart = new Date(year, month - 2, 1);
    const prevEnd = new Date(year, month - 1, 1);

    // Full year range for chart
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year + 1, 0, 1);

    const [currentTxns, prevTxns, yearTxns] = await Promise.all([
      prisma.transaction.findMany({
        where: { date: { gte: startDate, lt: endDate } },
        orderBy: { date: "desc" },
      }),
      prisma.transaction.findMany({
        where: {
          date: { gte: prevStart, lt: prevEnd },
          recordType: "ACTUAL",
        },
      }),
      prisma.transaction.findMany({
        where: {
          date: { gte: yearStart, lt: yearEnd },
          recordType: "ACTUAL",
        },
        select: { date: true, amount: true, type: true, category: true },
      }),
    ]);

    // Aggregate by month for chart, including category breakdown
    type MonthStats = {
      income: number;
      expense: number;
      incomeByCategory: Record<string, number>;
      expenseByCategory: Record<string, number>;
    };
    const monthlyStats: Record<number, MonthStats> = {};
    for (let i = 1; i <= 12; i++) {
      monthlyStats[i] = {
        income: 0,
        expense: 0,
        incomeByCategory: {},
        expenseByCategory: {},
      };
    }
    for (const t of yearTxns) {
      const m = t.date.getMonth() + 1;
      const amt = Number(t.amount);
      if (t.type === "INCOME") {
        monthlyStats[m].income += amt;
        monthlyStats[m].incomeByCategory[t.category] =
          (monthlyStats[m].incomeByCategory[t.category] || 0) + amt;
      } else if (t.type === "EXPENSE") {
        monthlyStats[m].expense += amt;
        monthlyStats[m].expenseByCategory[t.category] =
          (monthlyStats[m].expenseByCategory[t.category] || 0) + amt;
      }
    }
    const chartData = Object.entries(monthlyStats).map(([m, v]) => ({
      month: parseInt(m),
      income: v.income,
      expense: v.expense,
      net: v.income - v.expense,
      incomeByCategory: v.incomeByCategory,
      expenseByCategory: v.expenseByCategory,
    }));

    return NextResponse.json({
      success: true,
      data: {
        transactions: currentTxns.map((t) => ({
          ...t,
          amount: Number(t.amount),
        })),
        previousMonth: prevTxns.map((t) => ({
          ...t,
          amount: Number(t.amount),
        })),
        yearlyChart: chartData,
      },
    });
  } catch (error: unknown) {
    console.error("Accounting GET error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, amount, type, recordType, category, description, payee, slipUrl } = body;

    if (!date || amount === undefined || !type || !category) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const txn = await prisma.transaction.create({
      data: {
        date: new Date(date),
        amount: parseFloat(amount),
        type,
        recordType: recordType || "ACTUAL",
        category,
        description: description || "",
        payee: payee || null,
        slipUrl: slipUrl || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: { ...txn, amount: Number(txn.amount) },
    });
  } catch (error: unknown) {
    console.error("Accounting POST error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
