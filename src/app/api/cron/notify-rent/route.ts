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

const MONTHS_TH = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
const MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function fmtDateTH(d: Date) {
  return `${d.getUTCDate()} ${MONTHS_TH[d.getUTCMonth()]} ${d.getUTCFullYear() + 543}`;
}
function fmtDateEN(d: Date) {
  return `${d.getUTCDate()} ${MONTHS_EN[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

const CLOSING =
  "\nขอบคุณที่ไว้วางใจให้ทีมงาน Amber Real Estate ได้ดูแลคุณ\n" +
  "Thank you for trusting Amber Real Estate to take care of you.";

function buildPaymentMessage(
  lesseeName: string,
  projectName: string,
  unitNumber: string,
  amount: number,
  latePaymentFee: number,
  overdueDays: number,
  bankName: string,
  bankAccountNumber: string,
  bankAccountName: string,
  bankAccountNameEn: string,
): string {
  const lateFee  = overdueDays * latePaymentFee;
  const total    = amount + lateFee;
  const bankLine = [
    `🏦 ${bankName}`,
    `📋 เลขที่บัญชี / Acct No.: ${bankAccountNumber}`,
    `👤 ${bankAccountName}${bankAccountNameEn ? ` / ${bankAccountNameEn}` : ""}`,
  ].join("\n");

  if (overdueDays === 0) {
    return (
      `เรียนคุณ ${lesseeName}\n` +
      `ผู้เช่าห้อง ${projectName} ห้อง ${unitNumber}\n\n` +
      `📅 แจ้งเตือนกำหนดชำระค่าเช่าประจำเดือน\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 ยอดค่าเช่า: ฿${fmtMoney(amount)}\n` +
      `📆 ครบกำหนดชำระ: วันนี้\n\n` +
      `ช่องทางการชำระเงิน:\n` +
      `${bankLine}\n\n` +
      `กรุณาชำระภายในวันนี้ และส่งหลักฐานการโอนมาที่นายหน้า/เจ้าของ\n` +
      `*ขออภัยหากท่านได้ชำระเงินแล้ว*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Dear ${lesseeName}\n` +
      `Tenant of ${projectName}, Room ${unitNumber}\n\n` +
      `📅 Monthly Rent Due Reminder\n` +
      `💰 Rent Amount: ฿${fmtMoney(amount)} | Due: Today\n\n` +
      `Payment Details:\n` +
      `${bankLine}\n\n` +
      `Please make payment today and send proof of transfer to your agent/landlord.\n` +
      `*We apologize if payment has already been made.*` +
      CLOSING
    );
  }

  return (
    `เรียนคุณ ${lesseeName}\n` +
    `ผู้เช่าห้อง ${projectName} ห้อง ${unitNumber}\n\n` +
    `⚠️ แจ้งเตือนค่าเช่าค้างชำระ\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `💰 ยอดค่าเช่า: ฿${fmtMoney(amount)}\n` +
    `📌 เกินกำหนด: ${overdueDays} วัน\n` +
    `🔴 ค่าปรับล่าช้า: ฿${fmtMoney(lateFee)} (฿${fmtMoney(latePaymentFee)}/วัน × ${overdueDays} วัน)\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `💳 ยอดรวมที่ต้องชำระ: ฿${fmtMoney(total)}\n\n` +
    `ช่องทางการชำระเงิน:\n` +
    `${bankLine}\n\n` +
    `กรุณาชำระโดยเร็วที่สุดเพื่อหลีกเลี่ยงค่าปรับที่เพิ่มขึ้นทุกวัน\n` +
    `*ขออภัยหากท่านได้ชำระเงินแล้ว กรุณาแจ้งนายหน้า/เจ้าของเพื่อยืนยันการชำระ*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `Dear ${lesseeName}\n` +
    `Tenant of ${projectName}, Room ${unitNumber}\n\n` +
    `⚠️ Overdue Rent Notice\n` +
    `💰 Rent: ฿${fmtMoney(amount)} | Overdue: ${overdueDays} days\n` +
    `🔴 Late Fee: ฿${fmtMoney(lateFee)} (฿${fmtMoney(latePaymentFee)}/day × ${overdueDays} days)\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `💳 Total Amount Due: ฿${fmtMoney(total)}\n\n` +
    `Payment Details:\n` +
    `${bankLine}\n\n` +
    `Please settle the outstanding balance immediately to stop further penalties.\n` +
    `*We apologize if payment has already been made. Please notify your agent/landlord to confirm.*` +
    CLOSING
  );
}

function buildRenewalMessage(
  lesseeName: string,
  projectName: string,
  unitNumber: string,
  endDate: Date,
  daysLeft: number,
): string {
  const deadlineDate = new Date(endDate.getTime() - 30 * 86400000);
  const endTH      = fmtDateTH(endDate);
  const endEN      = fmtDateEN(endDate);
  const deadlineTH = fmtDateTH(deadlineDate);
  const deadlineEN = fmtDateEN(deadlineDate);

  return (
    `เรียนคุณ ${lesseeName}\n` +
    `ผู้เช่าห้อง ${projectName} ห้อง ${unitNumber}\n\n` +
    `🔔 แจ้งเตือนสัญญาเช่าใกล้ครบกำหนด\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `📅 วันหมดสัญญา: ${endTH}\n` +
    `⏳ เหลือเวลาอีก: ${daysLeft} วัน\n\n` +
    `ขณะนี้สัญญาเช่าของท่านกำลังจะครบกำหนดในอีก ${daysLeft} วัน\n` +
    `โปรดแจ้งความประสงค์ว่าท่านต้องการ ต่อสัญญา หรือ ย้ายออก\n` +
    `ให้นายหน้า/เจ้าของทราบ ก่อนครบสัญญาอย่างน้อย 30 วัน\n` +
    `(ภายในวันที่ ${deadlineTH})\n\n` +
    `⚠️ หากไม่แจ้งภายในระยะเวลาดังกล่าว จะถือว่าท่านประสงค์ต่อสัญญาโดยอัตโนมัติ\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `Dear ${lesseeName}\n` +
    `Tenant of ${projectName}, Room ${unitNumber}\n\n` +
    `🔔 Lease Expiry Notice\n` +
    `📅 Expiry Date: ${endEN} | ⏳ ${daysLeft} days remaining\n\n` +
    `Your lease agreement is expiring in ${daysLeft} days.\n` +
    `Please inform your agent or landlord whether you wish to renew or vacate\n` +
    `at least 30 days before expiry (by ${deadlineEN}).\n\n` +
    `⚠️ Failure to notify within the specified timeframe will be treated as an automatic renewal for the following year.` +
    CLOSING
  );
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todayUTC      = new Date().toISOString().slice(0, 10);
  const todayMidnight = new Date(todayUTC + "T00:00:00.000Z");

  let sent = 0;
  let skipped = 0;

  // ── 1. Rent payment notifications ────────────────────────────────────────
  const payments = await prisma.rentPayment.findMany({
    where: { isPaid: false, dueDate: { lte: todayMidnight } },
    include: {
      contract: {
        select: {
          lesseeName: true,
          projectName: true,
          unitNumber: true,
          latePaymentFee: true,
          lineGroupId: true,
          status: true,
          bankName: true,
          bankAccountNumber: true,
          bankAccountName: true,
          bankAccountNameEn: true,
        },
      },
    },
  });

  for (const p of payments) {
    const c = p.contract;
    if (!c.lineGroupId || c.status === "TERMINATED") { skipped++; continue; }

    const dueDateStr  = p.dueDate.toISOString().slice(0, 10);
    const overdueDays = dueDateStr < todayUTC
      ? Math.ceil((Date.now() - new Date(p.dueDate).getTime()) / 86400000)
      : 0;

    const message = buildPaymentMessage(
      c.lesseeName,
      c.projectName,
      c.unitNumber,
      Number(p.amount),
      Number(c.latePaymentFee),
      overdueDays,
      c.bankName        || "-",
      c.bankAccountNumber || "-",
      c.bankAccountName   || "-",
      c.bankAccountNameEn || "",
    );

    await sendLineMessage(c.lineGroupId, message);
    sent++;
  }

  // ── 2. Contract renewal notifications (45 / 30 / 14 / 7 days before expiry) ──
  const contracts = await prisma.contract.findMany({
    where: { status: { in: ["ACTIVE", "DRAFT"] }, lineGroupId: { not: null } },
    select: {
      lesseeName: true,
      projectName: true,
      unitNumber: true,
      endDate: true,
      lineGroupId: true,
    },
  });

  const RENEWAL_TRIGGERS = [45, 30, 14, 7];
  for (const c of contracts) {
    if (!c.lineGroupId) continue;
    const daysLeft = Math.ceil(
      (new Date(c.endDate).getTime() - todayMidnight.getTime()) / 86400000
    );
    if (!RENEWAL_TRIGGERS.includes(daysLeft)) continue;

    const message = buildRenewalMessage(
      c.lesseeName,
      c.projectName,
      c.unitNumber,
      c.endDate,
      daysLeft,
    );
    await sendLineMessage(c.lineGroupId, message);
    sent++;
  }

  return NextResponse.json({ success: true, data: { sent, skipped } });
}
