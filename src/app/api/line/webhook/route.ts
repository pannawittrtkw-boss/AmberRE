import { NextRequest, NextResponse } from "next/server";

const LINE_REPLY_API = "https://api.line.me/v2/bot/message/reply";

async function replyMessage(replyToken: string, text: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return;
  await fetch(LINE_REPLY_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text }],
    }),
  });
}

function isThai(text: string): boolean {
  return /[฀-๿]/.test(text);
}

async function translate(text: string, targetLang: "en" | "th"): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const prompt = targetLang === "en"
    ? `Translate the following Thai text to English. Reply with only the translation, no explanation:\n${text}`
    : `แปลข้อความภาษาอังกฤษต่อไปนี้เป็นภาษาไทย ตอบเฉพาะคำแปลเท่านั้น ไม่ต้องอธิบาย:\n${text}`;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 500,
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const events = body.events ?? [];

    for (const event of events) {
      // Send welcome message + Group ID when bot joins a group
      if (event.type === "join") {
        const groupId = event.source?.groupId || event.source?.roomId;
        if (!groupId || !event.replyToken) continue;
        await replyMessage(
          event.replyToken,
          `🤖 AmberBot Welcome\n\nGroup ID is : ${groupId}\n\nยินดีต้อนรับ ขอให้คุณพักอาศัยที่ห้องนี้อย่างมีความสุข\nเพื่อให้คุณไร้กังวลเรื่องวันชำระค่าเช่า ฉันจะทำหน้าที่แจ้งเตือนการชำระให้กับคุณในทุกๆ เดือน\n\nWelcome to your new home! Wish you a happy stay here.\nTo make things worry-free for you, I'll be happy to send you a monthly rent reminder.`
        );
        continue;
      }

      // Auto-translate text messages in group/room
      if (event.type === "message" && event.message?.type === "text" && event.replyToken) {
        const source = event.source;
        if (!source?.groupId && !source?.roomId) continue; // group/room only, not 1-on-1

        const text: string = event.message.text;
        if (!text.trim()) continue;

        const targetLang = isThai(text) ? "en" : "th";
        const translated = await translate(text, targetLang);
        if (translated) {
          const flag = targetLang === "en" ? "🇬🇧" : "🇹🇭";
          await replyMessage(event.replyToken, `${flag} ${translated}`);
        }
      }
    }
  } catch { /* ignore */ }

  return NextResponse.json({ ok: true });
}

// LINE platform sends a GET request to verify the webhook URL
export async function GET() {
  return NextResponse.json({ ok: true });
}
