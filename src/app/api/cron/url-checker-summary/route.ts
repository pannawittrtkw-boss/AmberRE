import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { pushMessage, buildSummaryText, TOKEN } from "@/app/api/line/url-checker/route";
// Note: imported as buildSummaryText (not buildSummary)

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!TOKEN()) return NextResponse.json({ error: "No token" }, { status: 500 });

  const groups = await prisma.lineUrlHistory.findMany({
    select: { groupId: true },
    distinct: ["groupId"],
  });

  let sent = 0;
  for (const { groupId } of groups) {
    const text = await buildSummaryText(groupId);
    await pushMessage(groupId, [{ type: "text", text: `🌙 Daily Summary\n\n${text}` }]);
    sent++;
  }

  return NextResponse.json({ success: true, data: { sent } });
}
