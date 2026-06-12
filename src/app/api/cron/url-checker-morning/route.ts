import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { pushMessage, TOKEN } from "@/app/api/line/url-checker/route";

function shortUrl(url: string, max = 80): string {
  return url.length > max ? url.slice(0, max - 3) + "..." : url;
}

function fmtDate(d: Date): string {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${String(d.getUTCDate()).padStart(2,"0")} ${months[d.getUTCMonth()]}`;
}

function buildBubble(rec: any, listIndex: number) {
  const by  = rec.sentBy || "Unknown";
  const seq = rec.dailySeq > 0 ? rec.dailySeq : listIndex + 1;
  const date = fmtDate(new Date(rec.sentAt));
  return {
    type: "bubble",
    size: "kilo",
    header: {
      type: "box", layout: "vertical", backgroundColor: "#112240", paddingAll: "10px",
      action: { type: "uri", label: `Open #${seq}`, uri: rec.url },
      contents: [
        { type: "text", text: `🔗 #${seq}`, color: "#C8A951", weight: "bold", size: "sm" },
        { type: "text", text: `${by} · ${date}`, color: "#AAAAAA", size: "xxs", margin: "xs" },
      ],
    },
    body: {
      type: "box", layout: "vertical", paddingAll: "10px",
      action: { type: "uri", label: `Open #${seq}`, uri: rec.url },
      contents: [
        { type: "text", text: shortUrl(rec.url), size: "xxs", color: "#555555", wrap: true },
      ],
    },
    footer: {
      type: "box", layout: "vertical", paddingAll: "8px",
      contents: [{
        type: "button", style: "primary", height: "sm", color: "#1565C0",
        action: { type: "uri", label: "🔗 เปิดลิงค์", uri: rec.url },
      }],
    },
  };
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
      orderBy: { sentAt: "asc" },
    });

    if (pending.length === 0) continue;

    const headerText =
      `☀️ Not Verified Links (Pending Review)\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `⏳ Pending: ${pending.length} link(s)`;

    // Split into carousel chunks of 12 (LINE carousel limit)
    const CHUNK = 12;
    const messages: object[] = [{ type: "text", text: headerText }];

    for (let i = 0; i < pending.length; i += CHUNK) {
      const chunk = pending.slice(i, i + CHUNK);
      const bubbles = chunk.map((rec, j) => buildBubble(rec, i + j));
      messages.push({
        type: "flex",
        altText: `⏳ Pending links ${i + 1}–${i + chunk.length}`,
        contents: bubbles.length === 1 ? bubbles[0] : { type: "carousel", contents: bubbles },
      });
    }

    // LINE push allows max 5 messages per call — send in batches
    for (let i = 0; i < messages.length; i += 5) {
      await pushMessage(groupId, messages.slice(i, i + 5));
    }
    sent++;
  }

  return NextResponse.json({ success: true, data: { sent } });
}
