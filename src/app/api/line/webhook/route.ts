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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const events = body.events ?? [];

    for (const event of events) {
      if (event.type !== "join") continue;
      const groupId = event.source?.groupId || event.source?.roomId;
      if (!groupId || !event.replyToken) continue;

      await replyMessage(
        event.replyToken,
        `🤖 AmberBot Welcome\n\nGroup ID is : ${groupId}\n\nยินดีต้อนรับ ขอให้คุณพักอาศัยที่ห้องนี้อย่างมีความสุข\nเพื่อให้คุณไร้กังวลเรื่องวันชำระค่าเช่า ฉันจะทำหน้าที่แจ้งเตือนการชำระให้กับคุณในทุกๆ เดือน\n\nWelcome to your new home! Wish you a happy stay here.\nTo make things worry-free for you, I'll be happy to send you a monthly rent reminder.`
      );
    }
  } catch { /* ignore */ }

  return NextResponse.json({ ok: true });
}

// LINE platform sends a GET request to verify the webhook URL
export async function GET() {
  return NextResponse.json({ ok: true });
}
