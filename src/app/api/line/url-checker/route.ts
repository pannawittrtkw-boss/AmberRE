import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

const LINE_REPLY_API = "https://api.line.me/v2/bot/message/reply";
export const LINE_PUSH_API = "https://api.line.me/v2/bot/message/push";
export const TOKEN = () => process.env.LINE_URL_CHECKER_TOKEN ?? "";

// ── Status constants ──────────────────────────────────────────────────────────
export const STATUS = {
  PENDING:                    "PENDING",
  NOT_ACCEPT_AGENT:           "NOT_ACCEPT_AGENT",
  ACCEPT_AGENT_NOT_FOREIGNER: "ACCEPT_AGENT_NOT_FOREIGNER",
  ACCEPT_ALL:                 "ACCEPT_ALL",
  UNABLE_TO_CONTACT:          "UNABLE_TO_CONTACT",
  NOT_AVAILABLE:              "NOT_AVAILABLE",
} as const;

export const STATUS_LABEL: Record<string, string> = {
  ACCEPT_ALL:                 "✅ Accept Agent & Foreigner",
  NOT_ACCEPT_AGENT:           "❌ Not Accept Agent",
  ACCEPT_AGENT_NOT_FOREIGNER: "✅ Accept Agent & Not Foreigner",
  NOT_AVAILABLE:              "🚫 Not Available",
  UNABLE_TO_CONTACT:          "📞 Unable to contact",
};

// ── LINE helpers ──────────────────────────────────────────────────────────────

async function reply(replyToken: string, messages: object[]) {
  if (!TOKEN()) return;
  await fetch(LINE_REPLY_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN()}` },
    body: JSON.stringify({ replyToken, messages }),
  });
}

export async function pushMessage(groupId: string, messages: object[]) {
  if (!TOKEN()) return;
  await fetch(LINE_PUSH_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN()}` },
    body: JSON.stringify({ to: groupId, messages }),
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
    // Lowercase only scheme+host — path is case-sensitive (e.g. Facebook share IDs)
    const host = (u.protocol + "//" + u.host).toLowerCase();
    const rest = u.pathname + u.search + u.hash;
    return host + rest;
  } catch {
    return url.replace(/\/+$/, "");
  }
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function yesterdayKey(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function shortUrl(url: string, max = 120): string {
  return url.length > max ? url.slice(0, max - 3) + "..." : url;
}

// ── Message builders ──────────────────────────────────────────────────────────

export function buildButtonsMessage(id: number, seq: number, url: string, sentBy?: string | null, dateKey?: string | null) {
  const btn = (label: string, status: string) => ({
    type: "button",
    style: "secondary",
    height: "sm",
    action: {
      type: "postback",
      label,
      data: `s=${status}&id=${id}`,
    },
  });

  const metaLine = [sentBy, dateKey].filter(Boolean).join(" · ");

  return {
    type: "flex",
    altText: `🔗 New URL #${seq} — Please review`,
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#112240",
        paddingAll: "12px",
        action: { type: "uri", uri: url },
        contents: [
          {
            type: "box", layout: "horizontal", justifyContent: "space-between",
            contents: [
              { type: "text", text: `🔗 #${seq}`, color: "#C8A951", weight: "bold", size: "sm", flex: 0 },
              ...(metaLine ? [{ type: "text", text: metaLine, color: "#AAAAAA", size: "xxs", align: "end" as const, flex: 1 }] : []),
            ],
          },
          { type: "text", text: shortUrl(url, 100), color: "#FFFFFF", size: "xs", wrap: true, margin: "sm" },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "xs",
        paddingAll: "10px",
        contents: [
          btn("❌ Not Accept Agent",     "NOT_ACCEPT_AGENT"),
          btn("✅ Agent & Not Foreigner", "ACCEPT_AGENT_NOT_FOREIGNER"),
          btn("✅ Agent & Foreigner",     "ACCEPT_ALL"),
          btn("📞 Unable to contact",    "UNABLE_TO_CONTACT"),
          btn("🚫 Not Available",        "NOT_AVAILABLE"),
        ],
      },
    },
  };
}

export async function buildSummaryText(groupId: string, dateKey?: string): Promise<string> {
  const dk = dateKey ?? todayKey();

  const records = await prisma.lineUrlHistory.findMany({
    where: { groupId, dateKey: dk },
    select: { status: true },
  });

  const total    = records.length;
  const pending  = records.filter(r => r.status === STATUS.PENDING).length;
  const verified = total - pending;
  const byStatus = Object.keys(STATUS_LABEL).map(s => ({
    label: STATUS_LABEL[s],
    count: records.filter(r => r.status === s).length,
  }));

  let msg = `📊 Summary (${dk})\n━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📥 Total Link: ${total}\n`;
  msg += `✅ Verified: ${verified}\n`;
  byStatus.forEach(({ label, count }) => {
    msg += `   ${label}: ${count}\n`;
  });
  msg += `⏳ Pending: ${pending}`;

  return msg;
}

// ── Main webhook handler ──────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json();
    const events = body.events ?? [];

    for (const event of events) {
      const source  = event.source;
      const groupId = source?.groupId || source?.roomId;
      if (!groupId) continue;

      const userId = source?.userId as string | undefined;

      // ── Postback: admin pressed a status button ──────────────────────────
      if (event.type === "postback" && event.postback?.data) {
        const params = new URLSearchParams(event.postback.data as string);
        const status = params.get("s");
        const urlId  = parseInt(params.get("id") ?? "");

        if (!status || isNaN(urlId) || !(status in STATUS_LABEL)) continue;

        const urlRecord = await prisma.lineUrlHistory.findFirst({ where: { id: urlId, groupId } });
        if (!urlRecord) continue;

        const reviewerName = userId ? await getMemberName(groupId, userId) : null;

        await prisma.lineUrlHistory.update({
          where: { id: urlId },
          data:  { status, reviewedAt: new Date(), reviewedBy: reviewerName },
        });

        // Auto-create property stub when agent is accepted (with or without foreigner)
        if (status === STATUS.ACCEPT_ALL || status === STATUS.ACCEPT_AGENT_NOT_FOREIGNER) {
          try {
            const adminUser = await prisma.user.findFirst({
              where: { role: "ADMIN" },
              select: { id: true },
            });
            if (!adminUser) throw new Error("No ADMIN user found");
            const propData: Prisma.PropertyUncheckedCreateInput = {
              titleTh:        "รายการใหม่ (จาก ScanLink)",
              propertyType:   "CONDO",
              listingType:    "RENT",
              price:          new Prisma.Decimal(0),
              sourceLink:     urlRecord.url,
              status:         "VERIFIED",
              foreignerAccept: status === STATUS.ACCEPT_ALL ? "ACCEPT" : "NOT_ACCEPT",
              ownerId:        adminUser.id,
            };
            await prisma.property.create({ data: propData });
          } catch (propErr: any) {
            console.error("[ScanLink] property create failed:", propErr);
            await pushMessage(groupId, [{
              type: "text",
              text: `⚠️ สร้างรายการทรัพย์ไม่สำเร็จ\n${propErr?.message ?? String(propErr)}`,
            }]);
          }
        }

        if (event.replyToken) {
          const displayNum = urlRecord.dailySeq > 0 ? urlRecord.dailySeq : urlId;
          const replyMsg: Record<string, unknown> = {
            type: "text",
            text: `${STATUS_LABEL[status]} [#${displayNum}] — Saved${reviewerName ? `\nBy ${reviewerName}` : ""}`,
          };
          if (urlRecord.quoteToken) replyMsg.quoteToken = urlRecord.quoteToken;
          await reply(event.replyToken, [replyMsg]);
        }
        continue;
      }

      // ── Text messages ────────────────────────────────────────────────────
      if (event.type !== "message" || event.message?.type !== "text") continue;
      if (!event.replyToken) continue;

      const text = (event.message.text ?? "").trim();

      // /Summary command
      if (/^\/summary$/i.test(text)) {
        await reply(event.replyToken, [{ type: "text", text: await buildSummaryText(groupId) }]);
        continue;
      }

      // /NotVerify command — plain text list + push button cards for each pending link
      if (/^\/notverify$/i.test(text)) {
        const today   = todayKey();
        const pending = await prisma.lineUrlHistory.findMany({
          where: { groupId, status: "PENDING" },
          orderBy: [{ dateKey: "asc" }, { dailySeq: "asc" }],
        });

        if (pending.length === 0) {
          await reply(event.replyToken, [{ type: "text", text: "✅ No pending links today" }]);
        } else {
          // Build plain text list
          const lines = pending.map((rec, i) => {
            const by     = rec.sentBy || "Unknown";
            const seqNum = rec.dailySeq > 0 ? rec.dailySeq : i + 1;
            return `#${seqNum} | ${by} · ${rec.dateKey}\n${shortUrl(rec.url, 100)}`;
          });

          const headerText =
            `📋 Not Verified Links\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `⏳ Pending: ${pending.length} link(s)\n\n` +
            lines.join("\n\n");

          // Reply with the plain text summary
          await reply(event.replyToken, [{ type: "text", text: headerText }]);

          // Push button cards so admin can review each one directly
          const buttonCards = pending.map((rec, i) => {
            const seqNum = rec.dailySeq > 0 ? rec.dailySeq : i + 1;
            return buildButtonsMessage(rec.id, seqNum, rec.url, rec.sentBy, rec.dateKey);
          });

          for (let i = 0; i < buttonCards.length; i += 5) {
            await pushMessage(groupId, buttonCards.slice(i, i + 5));
          }
        }
        continue;
      }

      // URL detection
      const urls = extractUrls(text);
      if (urls.length === 0) continue;

      const today       = todayKey();
      const displayName = userId ? await getMemberName(groupId, userId) : null;
      const quoteToken  = (event.message as { quoteToken?: string }).quoteToken ?? null;

      for (const url of urls) {
        const existing = await prisma.lineUrlHistory.findUnique({
          where: { groupId_url: { groupId, url } },
        });

        if (existing) {
          // Duplicate — log it and notify
          await prisma.lineUrlDuplicate.create({
            data: { groupId, url, sentBy: displayName, dateKey: today },
          });

          const statusLabel = existing.status in STATUS_LABEL
            ? STATUS_LABEL[existing.status]
            : "⏳ Not Verified";

          await reply(event.replyToken, [{
            type: "text",
            text: `⚠️ Duplicate link — not counted [#${existing.id}]\nPrevious status: ${statusLabel}\n\nThis link has been excluded from the review list`,
          }]);
        } else {
          // New URL — calculate daily sequence then save
          const countToday = await prisma.lineUrlHistory.count({
            where: { groupId, dateKey: today },
          });
          const dailySeq = countToday + 1;
          const record = await prisma.lineUrlHistory.create({
            data: { groupId, url, userId: userId ?? null, sentBy: displayName, dateKey: today, quoteToken, dailySeq },
          });
          await reply(event.replyToken, [buildButtonsMessage(record.id, dailySeq, url, displayName, today)]);
        }
      }
    }
  } catch { /* ignore */ }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
