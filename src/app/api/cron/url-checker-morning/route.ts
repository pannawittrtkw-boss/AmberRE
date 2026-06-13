import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { pushMessage, TOKEN, buildButtonsMessage } from "@/app/api/line/url-checker/route";

function shortUrl(url: string, max = 100): string {
  return url.length > max ? url.slice(0, max - 3) + "..." : url;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!TOKEN()) return NextResponse.json({ error: "No token" }, { status: 500 });

  const groups = await prisma.lineUrlHistory.findMany({
    where: { status: "PENDING" },
    select: { groupId: true },
    distinct: ["groupId"],
  });

  let sent = 0;
  for (const { groupId } of groups) {
    const pending = await prisma.lineUrlHistory.findMany({
      where: { groupId, status: "PENDING" },
      orderBy: { dailySeq: "asc" },
    });

    if (pending.length === 0) continue;

    // Build plain text list
    const lines = pending.map((rec, i) => {
      const by     = rec.sentBy || "Unknown";
      const t      = new Date(rec.sentAt);
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const date   = `${String(t.getUTCDate()).padStart(2,"0")} ${months[t.getUTCMonth()]}`;
      const seqNum = rec.dailySeq > 0 ? rec.dailySeq : i + 1;
      return `#${seqNum} | ${by} · ${date}\n${shortUrl(rec.url)}`;
    });

    const headerText =
      `☀️ Not Verified Links (Pending Review)\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `⏳ Pending: ${pending.length} link(s)\n\n` +
      lines.join("\n\n");

    // Push plain text summary first
    await pushMessage(groupId, [{ type: "text", text: headerText }]);

    // Push button cards so admin can review each one directly, batched by 5
    const buttonCards = pending.map((rec, i) => {
      const seqNum = rec.dailySeq > 0 ? rec.dailySeq : i + 1;
      return buildButtonsMessage(rec.id, seqNum, rec.url, rec.sentBy, rec.dateKey);
    });

    for (let i = 0; i < buttonCards.length; i += 5) {
      await pushMessage(groupId, buttonCards.slice(i, i + 5));
    }

    sent++;
  }

  return NextResponse.json({ success: true, data: { sent } });
}
