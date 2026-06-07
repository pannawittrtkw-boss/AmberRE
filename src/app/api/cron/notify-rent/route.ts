import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const LINE_API = "https://api.line.me/v2/bot/message/push";

async function sendLineMessage(groupId: string, text: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return;
  await fetch(LINE_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to: groupId,
      messages: [{ type: "text", text }],
    }),
  });
}

function fmtMoney(n: number) {
  return n.toLocaleString("th-TH", { minimumFractionDigits: 0 });
}

function buildMessage(
  projectName: string,
  unitNumber: string,
  amount: number,
  latePaymentFee: number,
  overdueDays: number
): string {
  const lateFee = overdueDays * latePaymentFee;
  const total = amount + lateFee;

  if (overdueDays === 0) {
    // Due today
    return (
      `🏠 ${projectName} ห้อง ${unitNumber}\n\n` +
      `📅 วันนี้ครบกำหนดชำระค่าเช่าประจำเดือน\n` +
      `💰 ยอดค่าเช่า: ฿${fmtMoney(amount)}\n\n` +
      `กรุณาชำระภายในวันนี้เพื่อหลีกเลี่ยงค่าปรับล่าช้า\n\n` +
      `*ขออภัยหากท่านชำระแล้ว กรุณาแจ้งเจ้าหน้าที่เพื่อยืนยันการชำระ*`
    );
  }

  // Overdue
  return (
    `🏠 ${projectName} ห้อง ${unitNumber}\n\n` +
    `⚠️ เกินกำหนดชำระค่าเช่า ${overdueDays} วัน\n` +
    `💰 ค่าเช่า: ฿${fmtMoney(amount)}\n` +
    `📌 ค่าปรับล่าช้า: ฿${fmtMoney(lateFee)} (฿${fmtMoney(latePaymentFee)}/วัน × ${overdueDays} วัน)\n` +
    `──────────────────\n` +
    `💳 ยอดรวมที่ต้องชำระ: ฿${fmtMoney(total)}\n\n` +
    `กรุณาชำระโดยเร็วที่สุดเพื่อหยุดการสะสมค่าปรับ\n\n` +
    `*ขออภัยหากท่านชำระแล้ว กรุณาแจ้งเจ้าหน้าที่เพื่อยืนยันการชำระ*`
  );
}

export async function GET(req: NextRequest) {
  // Verify Vercel Cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Today's UTC date string (yyyy-mm-dd)
  const todayUTC = new Date().toISOString().slice(0, 10);
  const todayMidnight = new Date(todayUTC + "T00:00:00.000Z");

  // Fetch all unpaid payments with dueDate <= today that have a lineGroupId
  const payments = await prisma.rentPayment.findMany({
    where: {
      isPaid: false,
      dueDate: { lte: todayMidnight },
    },
    include: {
      contract: {
        select: {
          projectName: true,
          unitNumber: true,
          latePaymentFee: true,
          lineGroupId: true,
          status: true,
        },
      },
    },
  });

  let sent = 0;
  let skipped = 0;

  for (const p of payments) {
    const { contract } = p;

    // Skip if no LINE group or contract is terminated
    if (!contract.lineGroupId || contract.status === "TERMINATED") {
      skipped++;
      continue;
    }

    // Calculate overdue days (end-of-day comparison, Bangkok time)
    const due = new Date(p.dueDate);
    // Compare date strings in UTC (both stored as UTC midnight)
    const dueDateStr = p.dueDate.toISOString().slice(0, 10);
    const overdueDays = dueDateStr < todayUTC
      ? Math.ceil((Date.now() - due.getTime()) / 86400000)
      : 0;

    const message = buildMessage(
      contract.projectName,
      contract.unitNumber,
      Number(p.amount),
      Number(contract.latePaymentFee),
      overdueDays
    );

    await sendLineMessage(contract.lineGroupId, message);
    sent++;
  }

  return NextResponse.json({ success: true, data: { sent, skipped } });
}
