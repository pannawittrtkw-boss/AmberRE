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
  const body = await req.json();
  const events = body.events ?? [];

  for (const event of events) {
    // Only handle messages sent in a group or room
    const source = event.source;
    if (!source) continue;

    const groupId = source.groupId || source.roomId;
    if (!groupId) continue;

    // Reply with Group ID when someone sends any message in the group
    if (event.type === "message" && event.replyToken) {
      await replyMessage(
        event.replyToken,
        `🤖 AmberBot\n\nGroup ID ของกลุ่มนี้คือ:\n${groupId}\n\nคัดลอกไปใส่ในฟอร์มสัญญา ช่อง "LINE Group ID" ได้เลยครับ`
      );
    }
  }

  return NextResponse.json({ ok: true });
}

// LINE platform sends a GET request to verify the webhook URL
export async function GET() {
  return NextResponse.json({ ok: true });
}
