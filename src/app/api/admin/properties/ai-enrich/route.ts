import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { LINES } from "@/lib/stations";

export const runtime = "nodejs";
export const maxDuration = 60;

const PROPERTY_TYPES = ["CONDO", "HOUSE", "TOWNHOUSE", "LAND"];
const LISTING_TYPES = ["RENT", "SALE", "RENT_AND_SALE"];

const ALL_STATIONS = LINES.flatMap((l) =>
  l.stations.map((s) => ({ code: s.code, nameTh: s.nameTh, nameEn: s.nameEn, line: l.nameTh }))
);
const VALID_STATION_CODES = new Set(ALL_STATIONS.map((s) => s.code));
const STATION_REFERENCE = ALL_STATIONS.map((s) => `${s.code} — ${s.nameTh} (${s.nameEn}) [${s.line}]`).join("\n");

function parseStations(json: string | null): string[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
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

// POST — run AI suggestions for a small batch of property ids.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => null);
  const ids: number[] = Array.isArray(body?.ids) ? body.ids.map((n: unknown) => Number(n)).filter(Number.isFinite) : [];
  if (ids.length === 0) {
    return NextResponse.json({ success: false, error: "ids required" }, { status: 400 });
  }
  if (ids.length > 15) {
    return NextResponse.json({ success: false, error: "Max 15 ids per batch" }, { status: 400 });
  }

  const properties = await prisma.property.findMany({ where: { id: { in: ids } } });
  const client = new Anthropic({ apiKey });

  const results = await Promise.all(
    properties.map(async (p) => {
      const currentStations = parseStations(p.nearbyStations);
      const currentStationLabels = currentStations
        .map((c) => ALL_STATIONS.find((s) => s.code === c))
        .filter(Boolean)
        .map((s) => `${s!.code} ${s!.nameTh}`)
        .join(", ") || "(ไม่มี)";

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
        `สถานีใกล้เคียงปัจจุบัน: ${currentStationLabels}`,
      ].filter(Boolean).join("\n");

      const prompt = `คุณเป็นผู้ช่วยตรวจสอบข้อมูลอสังหาริมทรัพย์ ตรวจสอบว่าข้อมูล 5 อย่างต่อไปนี้ในระบบถูกต้องหรือไม่ โดยอ้างอิงจากข้อความที่ให้มาเท่านั้น:
1. propertyType — หนึ่งใน CONDO, HOUSE, TOWNHOUSE, LAND
2. listingType — หนึ่งใน RENT (ให้เช่าอย่างเดียว), SALE (ขายอย่างเดียว), RENT_AND_SALE (ทั้งเช่าและขาย)
3. price — ราคาเช่าต่อเดือน (บาท)
4. salePrice — ราคาขาย (บาท) หรือ null ถ้าไม่ใช่ทรัพย์ขาย
5. nearbyStations — รหัสสถานี BTS/MRT/Airport Rail Link ที่ใกล้เคียง เลือกจากรายการอ้างอิงเท่านั้น

กฎสำคัญ: ถ้าข้อความที่ให้มาไม่มีข้อมูลเพียงพอที่จะยืนยันว่าค่าปัจจุบันผิด ให้คงค่าปัจจุบันไว้เหมือนเดิม ห้ามเดาหรือสร้างข้อมูลขึ้นเองโดยไม่มีหลักฐานในข้อความ

รายการรหัสสถานีอ้างอิง (ใช้ code เท่านั้น):
${STATION_REFERENCE}

ข้อมูลทรัพย์สิน:
${info}

ตอบเป็น JSON เท่านั้น ไม่ต้องมีคำอธิบายอื่น รูปแบบ:
{"propertyType":"...","listingType":"...","price":number,"salePrice":number|null,"nearbyStations":["CODE1","CODE2"]}`;

      try {
        const message = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 512,
          messages: [{ role: "user", content: prompt }],
        });
        const text = message.content[0].type === "text" ? message.content[0].text : "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON in AI response");
        const parsed = JSON.parse(jsonMatch[0]);

        const suggested = {
          propertyType: PROPERTY_TYPES.includes(parsed.propertyType) ? parsed.propertyType : p.propertyType,
          listingType: LISTING_TYPES.includes(parsed.listingType) ? parsed.listingType : p.listingType,
          price: typeof parsed.price === "number" && parsed.price > 0 ? parsed.price : Number(p.price),
          salePrice: typeof parsed.salePrice === "number" && parsed.salePrice > 0 ? parsed.salePrice : null,
          nearbyStations: Array.isArray(parsed.nearbyStations)
            ? parsed.nearbyStations.filter((c: unknown) => typeof c === "string" && VALID_STATION_CODES.has(c))
            : currentStations,
        };

        return { id: p.id, success: true, suggested };
      } catch (err) {
        console.error(`[ai-enrich] property ${p.id} failed:`, err);
        const message = err instanceof Error ? err.message : "AI suggestion failed";
        return { id: p.id, success: false, error: message };
      }
    })
  );

  return NextResponse.json({ success: true, data: results });
}
