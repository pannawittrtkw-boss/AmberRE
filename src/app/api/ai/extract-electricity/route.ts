import { NextRequest, NextResponse } from "next/server";

const BILL_PROMPT = `คุณเป็น AI ที่ช่วยอ่านบิลค่าไฟฟ้าจากรูปภาพ
วิเคราะห์รูปบิลค่าไฟและดึงข้อมูลต่อไปนี้:

ตอบเป็น JSON เท่านั้น (ไม่ต้องมี markdown code block):
{
  "billAmount": "จำนวนเงินค่าไฟ (number หรือ null)",
  "unitsUsed": "จำนวนหน่วยที่ใช้ (number หรือ null)",
  "latestMeter": "เลขมิเตอร์ล่าสุด (number หรือ null)",
  "previousMeter": "เลขมิเตอร์ครั้งก่อน (number หรือ null)"
}

หมายเหตุ:
- billAmount คือยอมเงินรวมที่ต้องชำระ
- unitsUsed คือจำนวนหน่วยไฟฟ้าที่ใช้ในรอบบิล (kWh)
- latestMeter คือเลขมิเตอร์ที่จดล่าสุด
- previousMeter คือเลขมิเตอร์ที่จดครั้งก่อน
- ถ้าไม่พบข้อมูลใดให้ใส่ null`;

const METER_PROMPT = `คุณเป็น AI ที่ช่วยอ่านเลขมิเตอร์ไฟฟ้าจากรูปภาพ
วิเคราะห์รูปมิเตอร์ไฟฟ้าและดึงเลขมิเตอร์ออกมา

ตอบเป็น JSON เท่านั้น (ไม่ต้องมี markdown code block):
{
  "meterReading": "เลขมิเตอร์ที่อ่านได้ (number หรือ null)"
}

หมายเหตุ:
- อ่านตัวเลขบนหน้าจอมิเตอร์ไฟฟ้า
- ปัดเศษเป็นจำนวนเต็ม
- ถ้าไม่สามารถอ่านได้ให้ใส่ null`;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "OPENROUTER_API_KEY not configured" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string; // "bill" | "oldMeter" | "newMeter"

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "image/jpeg";

    const prompt = type === "bill" ? BILL_PROMPT : METER_PROMPT;

    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                },
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!aiRes.ok) {
      const errBody = await aiRes.json().catch(() => ({}));
      console.error("OpenRouter API error:", JSON.stringify(errBody));
      if (aiRes.status === 429) {
        return NextResponse.json({
          success: false,
          error: "API rate limit - กรุณารอสักครู่แล้วลองใหม่",
        });
      }
      return NextResponse.json(
        { success: false, error: `API error (${aiRes.status})` },
        { status: 500 }
      );
    }

    const aiData = await aiRes.json();
    const responseText = aiData?.choices?.[0]?.message?.content || "";

    if (!responseText) {
      return NextResponse.json({
        success: false,
        error: "AI ไม่สามารถวิเคราะห์รูปภาพได้ กรุณาลองใหม่",
      });
    }

    let extracted;
    try {
      const jsonStr = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      extracted = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json({
        success: false,
        error: "AI ไม่สามารถวิเคราะห์รูปภาพได้ กรุณาลองใหม่",
      });
    }

    return NextResponse.json({
      success: true,
      data: extracted,
      type,
    });
  } catch (error: unknown) {
    console.error("AI extract electricity error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
