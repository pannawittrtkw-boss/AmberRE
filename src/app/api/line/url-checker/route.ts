import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const LINE_REPLY_API = "https://api.line.me/v2/bot/message/reply";
export const LINE_PUSH_API = "https://api.line.me/v2/bot/message/push";
export const TOKEN = () => process.env.LINE_URL_CHECKER_TOKEN ?? "";

// ── LINE helpers ─────────────────────────────────────────────────────────────

async function reply(replyToken: string, messages: object[]) {
  if (!TOKEN()) return;
  await fetch(LINE_REPLY_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN()}` },
    body: JSON.stringify({ replyToken, messages }),
  });
}

export async function pushMessage(groupId: string, text: string) {
  if (!TOKEN()) return;
  await fetch(LINE_PUSH_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN()}` },
    body: JSON.stringify({ to: groupId, messages: [{ type: "text", text }] }),
  });
}

async function getMemberName(groupId: string, userId: string): Promise<string | null> {
  if (!TOKEN()) return null;
  try {
    const res = await fetch(`https://api.line.me/v2/bot/group/${groupId}/member/${userId}`, {
      headers: { Authorization: `Bearer ${TOKEN()}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.displayName ?? null;
  } catch { return null; }
}

// ── URL helpers ───────────────────────────────────────────────────────────────

function extractUrls(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s<>"]+/gi) ?? [];
  return [...new Set(matches.map(normalizeUrl))];
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    ["ref", "mibextid", "sfnsn", "rdid", "__cft__", "__tn__", "tracking_source"].forEach(p =>
      u.searchParams.delete(p)
    );
    u.pathname = u.pathname.replace(/\/+$/, "") || "/";
    return u.toString().toLowerCase();
  } catch {
    return url.replace(/\/+$/, "").toLowerCase();
  }
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysDiff(from: Date): number {
  return Math.floor((Date.now() - from.getTime()) / 86400000);
}

function shortUrl(url: string, max = 120): string {
  return url.length > max ? url.slice(0, max - 3) + "..." : url;
}

// ── Message builders ──────────────────────────────────────────────────────────

function buildButtonsMessage(id: number, url: string) {
  return {
    type: "template",
    altText: `🔗 URL ใหม่ #${id} — กรุณาตรวจสอบ`,
    template: {
      type: "buttons",
      text: `#${id} กรุณาตรวจสอบ\n${shortUrl(url, 130)}`,
      actions: [
        {
          type: "postback",
          label: "✅ ตรวจสอบแล้ว",
          data: `action=CHECKED&id=${id}`,
          displayText: `✅ ตรวจสอบแล้ว #${id}`,
        },
        {
          type: "postback",
          label: "🔄 รอติดต่อซ้ำ",
          data: `action=FOLLOW_UP&id=${id}`,
          displayText: `🔄 รอติดต่อซ้ำ #${id}`,
        },
      ],
    },
  };
}

export async function buildSummary(groupId: string): Promise<string> {
  const today = todayKey();

  const [todayAll, pending, followUp] = await Promise.all([
    prisma.lineUrlHistory.findMany({ where: { groupId, dateKey: today }, select: { status: true } }),
    prisma.lineUrlHistory.findMany({ where: { groupId, status: "PENDING" }, orderBy: { id: "asc" }, take: 20 }),
    prisma.lineUrlHistory.findMany({ where: { groupId, status: "FOLLOW_UP" }, orderBy: { id: "asc" }, take: 10 }),
  ]);

  const todayTotal   = todayAll.length;
  const todayChecked = todayAll.filter(u => u.status === "CHECKED").length;

  let msg = `📊 สรุป URL (${today})\n━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📥 รับวันนี้: ${todayTotal} รายการ\n`;
  msg += `✅ ตรวจสอบแล้ว: ${todayChecked} รายการ\n`;
  msg += `🔄 รอติดต่อซ้ำ: ${followUp.length} รายการ\n`;
  msg += `⏳ รอตรวจสอบ: ${pending.length} รายการ`;

  if (pending.length > 0) {
    msg += `\n\n⏳ รายการที่ยังไม่ตรวจสอบ:\n`;
    pending.forEach((u, i) => { msg += `${i + 1}. [#${u.id}] ${shortUrl(u.url, 60)}\n`; });
  }

  if (followUp.length > 0) {
    msg += `\n🔄 รอติดต่อซ้ำ:\n`;
    followUp.forEach((u, i) => {
      msg += `${i + 1}. [#${u.id}] ${shortUrl(u.url, 50)}\n`;
      if (u.note) msg += `   📝 ${u.note}\n`;
    });
  }

  return msg;
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json();
    const events = body.events ?? [];

    for (const event of events) {
      const source  = event.source;
      const groupId = source?.groupId || source?.roomId;
      if (!groupId) continue;

      const userId = source?.userId as string | undefined;

      // ── Postback: admin pressed a button ────────────────────────────────
      if (event.type === "postback" && event.postback?.data) {
        const params = new URLSearchParams(event.postback.data as string);
        const action = params.get("action");
        const urlId  = parseInt(params.get("id") ?? "");

        if (!action || isNaN(urlId)) continue;

        // Verify URL belongs to this group
        const urlRecord = await prisma.lineUrlHistory.findFirst({
          where: { id: urlId, groupId },
        });
        if (!urlRecord) continue;

        // Save pending action (waiting for description)
        await prisma.lineUrlPendingAction.upsert({
          where:  { groupId_userId: { groupId, userId: userId ?? "unknown" } },
          create: { groupId, userId: userId ?? "unknown", urlId, action },
          update: { urlId, action, createdAt: new Date() },
        });

        const label = action === "CHECKED" ? "ตรวจสอบแล้ว ✅" : "รอติดต่อซ้ำ 🔄";
        if (event.replyToken) {
          await reply(event.replyToken, [{
            type: "text",
            text: `${label} [#${urlId}]\n\nกรุณาพิมพ์คำอธิบายหรือหมายเหตุสั้นๆ\n(เช่น ราคา ตำแหน่ง ความน่าสนใจ ผลการติดต่อ)`,
          }]);
        }
        continue;
      }

      // ── Text message ──────────────────────────────────────────────────────
      if (event.type !== "message" || event.message?.type !== "text") continue;
      if (!event.replyToken) continue;

      const text = (event.message.text ?? "").trim();

      // Check for pending action first (description for a button press)
      if (userId) {
        const pending = await prisma.lineUrlPendingAction.findUnique({
          where: { groupId_userId: { groupId, userId } },
        });

        if (pending && !text.startsWith("/")) {
          const reviewerName = await getMemberName(groupId, userId);
          await prisma.lineUrlHistory.update({
            where: { id: pending.urlId },
            data: {
              status:     pending.action,
              note:       text,
              reviewedAt: new Date(),
              reviewedBy: reviewerName,
            },
          });
          await prisma.lineUrlPendingAction.delete({
            where: { groupId_userId: { groupId, userId } },
          });

          const label = pending.action === "CHECKED" ? "✅ ตรวจสอบแล้ว" : "🔄 รอติดต่อซ้ำ";
          await reply(event.replyToken, [{
            type: "text",
            text: `${label} บันทึกแล้ว [#${pending.urlId}]\n📝 ${text}`,
          }]);
          continue;
        }
      }

      // Commands
      if (text === "/สรุป" || text === "/summary") {
        await reply(event.replyToken, [{ type: "text", text: await buildSummary(groupId) }]);
        continue;
      }

      if (text === "/รายการ" || text === "/list") {
        const [pending, followUp] = await Promise.all([
          prisma.lineUrlHistory.findMany({ where: { groupId, status: "PENDING" }, orderBy: { id: "asc" }, take: 20 }),
          prisma.lineUrlHistory.findMany({ where: { groupId, status: "FOLLOW_UP" }, orderBy: { id: "asc" }, take: 10 }),
        ]);
        const all = [...pending, ...followUp];
        if (all.length === 0) {
          await reply(event.replyToken, [{ type: "text", text: "✅ ไม่มีรายการที่รอตรวจสอบ" }]);
        } else {
          let msg = `📋 รายการรอตรวจสอบ (${all.length} รายการ):\n\n`;
          pending.forEach((u, i) => { msg += `${i + 1}. [#${u.id}] ⏳ ${shortUrl(u.url, 55)}\n`; });
          followUp.forEach((u, i) => {
            msg += `${pending.length + i + 1}. [#${u.id}] 🔄 ${shortUrl(u.url, 55)}\n`;
            if (u.note) msg += `   📝 ${u.note}\n`;
          });
          await reply(event.replyToken, [{ type: "text", text: msg }]);
        }
        continue;
      }

      // URL detection
      const urls = extractUrls(text);
      if (urls.length === 0) continue;

      const today       = todayKey();
      const displayName = userId ? await getMemberName(groupId, userId) : null;

      for (const url of urls) {
        const existing = await prisma.lineUrlHistory.findUnique({
          where: { groupId_url: { groupId, url } },
        });

        if (existing) {
          // Duplicate — skip silently or notify
          const days   = daysDiff(existing.sentAt);
          const when   = days === 0 ? "วันนี้" : days === 1 ? "เมื่อวาน" : `${days} วันที่แล้ว`;
          const by     = existing.sentBy ? ` โดย ${existing.sentBy}` : "";
          const status = existing.status === "CHECKED" ? "✅ ตรวจสอบแล้ว" :
                         existing.status === "FOLLOW_UP" ? "🔄 รอติดต่อซ้ำ" : "⏳ รอตรวจสอบ";
          await reply(event.replyToken, [{
            type: "text",
            text: `⚠️ URL ซ้ำ — ตัดออก [#${existing.id}] ${status}\nเคยส่งเมื่อ${when}${by}`,
          }]);
        } else {
          // New URL — save and show buttons
          const record = await prisma.lineUrlHistory.create({
            data: { groupId, url, userId: userId ?? null, sentBy: displayName, dateKey: today },
          });
          await reply(event.replyToken, [buildButtonsMessage(record.id, url)]);
        }
      }
    }
  } catch { /* ignore */ }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
