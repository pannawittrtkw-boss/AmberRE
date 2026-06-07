import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const LINE_REPLY_API = "https://api.line.me/v2/bot/message/reply";
const LINE_PROFILE_API = "https://api.line.me/v2/bot/group";

const TOKEN = () => process.env.LINE_URL_CHECKER_TOKEN ?? "";

async function replyMessage(replyToken: string, text: string) {
  if (!TOKEN()) return;
  await fetch(LINE_REPLY_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN()}` },
    body: JSON.stringify({ replyToken, messages: [{ type: "text", text }] }),
  });
}

async function getMemberName(groupId: string, userId: string): Promise<string> {
  if (!TOKEN()) return userId;
  try {
    const res = await fetch(`${LINE_PROFILE_API}/${groupId}/member/${userId}`, {
      headers: { Authorization: `Bearer ${TOKEN()}` },
    });
    if (!res.ok) return userId;
    const data = await res.json();
    return data.displayName ?? userId;
  } catch {
    return userId;
  }
}

function extractUrls(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s<>"]+/gi) ?? [];
  return [...new Set(matches.map(normalizeUrl))];
}

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, "").toLowerCase();
}

function fmtDate(d: Date): string {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${String(d.getDate()).padStart(2,"0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function daysDiff(from: Date): number {
  return Math.floor((Date.now() - from.getTime()) / 86400000);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const events = body.events ?? [];

    for (const event of events) {
      if (event.type !== "message" || event.message?.type !== "text") continue;
      if (!event.replyToken) continue;

      const source  = event.source;
      const groupId = source?.groupId || source?.roomId;
      if (!groupId) continue;

      const text: string = event.message.text ?? "";
      const urls = extractUrls(text);
      if (urls.length === 0) continue;

      const userId = source?.userId as string | undefined;

      // Check each URL against DB
      const duplicates: { url: string; sentBy: string | null; sentAt: Date }[] = [];
      const newUrls: string[] = [];

      for (const url of urls) {
        const existing = await prisma.lineUrlHistory.findUnique({
          where: { groupId_url: { groupId, url } },
        });
        if (existing) {
          duplicates.push({ url, sentBy: existing.sentBy, sentAt: existing.sentAt });
        } else {
          newUrls.push(url);
        }
      }

      // Save new URLs
      if (newUrls.length > 0) {
        const displayName = userId ? await getMemberName(groupId, userId) : null;
        await prisma.lineUrlHistory.createMany({
          data: newUrls.map((url) => ({ groupId, url, userId: userId ?? null, sentBy: displayName })),
          skipDuplicates: true,
        });
      }

      // Reply if duplicates found
      if (duplicates.length > 0) {
        const lines = duplicates.map(({ url, sentBy, sentAt }) => {
          const days  = daysDiff(sentAt);
          const when  = days === 0 ? "วันนี้" : days === 1 ? "เมื่อวาน" : `${days} วันที่แล้ว (${fmtDate(sentAt)})`;
          const by    = sentBy ? `โดย ${sentBy}` : "";
          const short = url.length > 50 ? url.slice(0, 47) + "..." : url;
          return `🔗 ${short}\n    ⏱ ${when}${by ? " " + by : ""}`;
        });

        const header = duplicates.length === 1
          ? "⚠️ URL ซ้ำ! (Duplicate URL)"
          : `⚠️ พบ URL ซ้ำ ${duplicates.length} รายการ`;

        await replyMessage(event.replyToken, `${header}\n\n${lines.join("\n\n")}`);
      }
    }
  } catch { /* ignore */ }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
