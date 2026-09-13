import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { matchStationsInText } from "@/lib/stations";

export const runtime = "nodejs";
export const maxDuration = 60;

const PROPERTY_TYPES = ["CONDO", "HOUSE", "TOWNHOUSE", "LAND"];
const LISTING_TYPES = ["RENT", "SALE", "RENT_AND_SALE"];

// Free-tier Gemini model. Override via env if Google renames/retires this.
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

// Small delay between sequential Gemini calls to stay comfortably under
// the free tier's requests-per-minute limit — we'd rather a batch take a
// bit longer than start throwing 429s partway through.
const THROTTLE_MS = 400;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function parseStations(json: string | null): string[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0 },
      }),
    }
  );
  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty Gemini response");
  return text;
}

// GET — list of eligible (status VERIFIED) properties with current field
// values, so the preview page can show current -> suggested side by side.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const properties = await prisma.property.findMany({
    where: { status: "VERIFIED" },
    select: {
      id: true,
      titleTh: true,
      projectName: true,
      propertyType: true,
      listingType: true,
      price: true,
      salePrice: true,
      nearbyStations: true,
    },
    orderBy: { id: "desc" },
  });

  return NextResponse.json({
    success: true,
    data: properties.map((p) => ({
      id: p.id,
      titleTh: p.titleTh,
      projectName: p.projectName,
      propertyType: p.propertyType,
      listingType: p.listingType,
      price: Number(p.price),
      salePrice: p.salePrice ? Number(p.salePrice) : null,
      nearbyStations: parseStations(p.nearbyStations),
    })),
  });
}

// POST — run suggestions for a small batch of property ids.
// nearbyStations is matched deterministically (free, no AI call) from the
// property's own text; propertyType/listingType/price/salePrice go
// through Gemini's free tier, one at a time (see THROTTLE_MS).
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => null);
  const ids: number[] = Array.isArray(body?.ids) ? body.ids.map((n: unknown) => Number(n)).filter(Number.isFinite) : [];
  if (ids.length === 0) {
    return NextResponse.json({ success: false, error: "ids required" }, { status: 400 });
  }
  if (ids.length > 10) {
    return NextResponse.json({ success: false, error: "Max 10 ids per batch" }, { status: 400 });
  }

  const properties = await prisma.property.findMany({ where: { id: { in: ids } } });

  const results: Array<{ id: number; success: boolean; suggested?: Record<string, unknown>; error?: string }> = [];

  for (const p of properties) {
    const currentStations = parseStations(p.nearbyStations);

    // Free, deterministic station lookup — no AI call.
    const textBlob = [p.titleTh, p.titleEn, p.projectName, p.address, p.descriptionTh, p.note]
      .filter(Boolean)
      .join(" ");
    const matchedStations = matchStationsInText(textBlob);

    const info = [
      `ชื่อทรัพย์ (ไทย): ${p.titleTh}`,
      p.titleEn ? `ชื่อทรัพย์ (อังกฤษ): ${p.titleEn}` : null,
      `โครงการ: ${p.projectName || "-"}`,
      `ที่อยู่: ${[p.address, p.subdistrict, p.district, p.province].filter(Boolean).join(", ") || "-"}`,
      p.descriptionTh ? `คำอธิบาย: ${p.descriptionTh}` : null,
      p.note ? `หมายเหตุ: ${p.note}` : null,
      `--- ค่าปัจจุบันในระบบ ---`,
      `ประเภททรัพย์สิน: ${p.propertyType}`,
      `ประเภทประกาศ: ${p.listingType}`,
      `ราคาเช่าปัจจุบัน: ${Number(p.price).toLocaleString()} บาท`,
      `ราคาขายปัจจุบัน: ${p.salePrice ? Number(p.salePrice).toLocaleString() + " บาท" : "(ไม่มี)"}`,
    ].filter(Boolean).join("\n");

    const prompt = `คุณเป็นผู้ช่วยตรวจสอบข้อมูลอสังหาริมทรัพย์ ตรวจสอบว่าข้อมูล 4 อย่างต่อไปนี้ในระบบถูกต้องหรือไม่ โดยอ้างอิงจากข้อความที่ให้มาเท่านั้น:
1. propertyType — หนึ่งใน CONDO, HOUSE, TOWNHOUSE, LAND
2. listingType — หนึ่งใน RENT (ให้เช่าอย่างเดียว), SALE (ขายอย่างเดียว), RENT_AND_SALE (ทั้งเช่าและขาย)
3. price — ราคาเช่าต่อเดือน (บาท)
4. salePrice — ราคาขาย (บาท) หรือ null ถ้าไม่ใช่ทรัพย์ขาย

กฎสำคัญ: ถ้าข้อความที่ให้มาไม่มีข้อมูลเพียงพอที่จะยืนยันว่าค่าปัจจุบันผิด ให้คงค่าปัจจุบันไว้เหมือนเดิม ห้ามเดาหรือสร้างข้อมูลขึ้นเองโดยไม่มีหลักฐานในข้อความ

ข้อมูลทรัพย์สิน:
${info}

ตอบเป็น JSON เท่านั้น ไม่ต้องมีคำอธิบายอื่น ไม่ต้องใส่ \`\`\`json รูปแบบ:
{"propertyType":"...","listingType":"...","price":number,"salePrice":number|null}`;

    try {
      const text = await callGemini(apiKey, prompt);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error(`No JSON in AI response: ${text.slice(0, 200)}`);
      const parsed = JSON.parse(jsonMatch[0]);

      const suggested = {
        propertyType: PROPERTY_TYPES.includes(parsed.propertyType) ? parsed.propertyType : p.propertyType,
        listingType: LISTING_TYPES.includes(parsed.listingType) ? parsed.listingType : p.listingType,
        price: typeof parsed.price === "number" && parsed.price > 0 ? parsed.price : Number(p.price),
        salePrice: typeof parsed.salePrice === "number" && parsed.salePrice > 0 ? parsed.salePrice : null,
        nearbyStations: matchedStations.length > 0 ? matchedStations : currentStations,
      };

      results.push({ id: p.id, success: true, suggested });
    } catch (err) {
      console.error(`[ai-enrich] property ${p.id} failed:`, err);
      const message = err instanceof Error ? err.message : "AI suggestion failed";
      results.push({ id: p.id, success: false, error: message });
    }

    await sleep(THROTTLE_MS);
  }

  return NextResponse.json({ success: true, data: results });
}
