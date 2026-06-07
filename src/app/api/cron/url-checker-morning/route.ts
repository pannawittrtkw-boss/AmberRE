import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { pushMessage, TOKEN } from "@/app/api/line/url-checker/route";

function fmtDate(d: Date): string {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${String(d.getUTCDate()).padStart(2,"0")} ${months[d.getUTCMonth()]}`;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!TOKEN()) return NextResponse.json({ error: "No token" }, { status: 500 });

  // Find all groups that have pending URLs
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

    let msg = `☀️ Not Verified Links (Pending Review)\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `⏳ Pending: ${pending.length} link(s)\n\n`;

    pending.forEach((p, i) => {
      const by   = p.sentBy ? `by ${p.sentBy} · ` : "";
      const date = fmtDate(p.sentAt);
      msg += `${i + 1}. #${p.id} (${by}${date})\n${p.url}\n\n`;
    });

    msg += `💡 Tap a link to review`;

    await pushMessage(groupId, [{ type: "text", text: msg }]);
    sent++;
  }

  return NextResponse.json({ success: true, data: { sent } });
}
