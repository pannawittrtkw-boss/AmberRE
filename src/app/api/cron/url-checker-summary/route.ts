import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { pushMessage, buildSummary } from "@/app/api/line/url-checker/route";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find all distinct groups that have URLs
  const groups = await prisma.lineUrlHistory.findMany({
    select: { groupId: true },
    distinct: ["groupId"],
  });

  let sent = 0;
  for (const { groupId } of groups) {
    const summary = await buildSummary(groupId);
    await pushMessage(groupId, `🌙 สรุปประจำวัน\n\n${summary}`);
    sent++;
  }

  return NextResponse.json({ success: true, data: { sent } });
}
