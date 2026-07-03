import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.propertyId) {
    return NextResponse.json({ success: false, error: "propertyId required" }, { status: 400 });
  }

  const property = await prisma.property.findUnique({
    where: { id: parseInt(String(body.propertyId), 10) },
    select: {
      id: true,
      titleTh: true,
      titleEn: true,
      propertyType: true,
      listingType: true,
      bedrooms: true,
      bathrooms: true,
      sizeSqm: true,
      price: true,
      floor: true,
      projectName: true,
      address: true,
      province: true,
      district: true,
      furnitureDetails: true,
      electricalAppliances: true,
      facilities: true,
      fullyFurnished: true,
      fullyElectric: true,
    },
  });

  if (!property) {
    return NextResponse.json({ success: false, error: "Property not found" }, { status: 404 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const client = new Anthropic({ apiKey });

  const propertyInfo = [
    `ชื่อทรัพย์: ${property.titleTh}${property.titleEn ? ` / ${property.titleEn}` : ""}`,
    `ประเภท: ${property.propertyType} (${property.listingType})`,
    `โครงการ: ${property.projectName || "-"}`,
    `ที่อยู่: ${[property.address, property.district, property.province].filter(Boolean).join(", ") || "-"}`,
    `ขนาด: ${property.sizeSqm ? `${property.sizeSqm} ตร.ม.` : "-"}`,
    `ชั้น: ${property.floor || "-"}`,
    `ห้องนอน: ${property.bedrooms}, ห้องน้ำ: ${property.bathrooms}`,
    `ราคา: ${Number(property.price).toLocaleString()} บาท`,
    `เฟอร์นิเจอร์: ${property.fullyFurnished ? "ครบชุด" : property.furnitureDetails || "-"}`,
    `เครื่องใช้ไฟฟ้า: ${property.fullyElectric ? "ครบชุด" : property.electricalAppliances || "-"}`,
    `สิ่งอำนวยความสะดวก: ${property.facilities || "-"}`,
  ].join("\n");

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `คุณเป็น Content Writer ผู้เชี่ยวชาญด้านอสังหาริมทรัพย์ไทย
เขียนคำอธิบายทรัพย์สินที่น่าสนใจและดึงดูดผู้เช่า/ผู้ซื้อ ทั้งภาษาไทยและภาษาอังกฤษ
แต่ละภาษาความยาว 2-3 ย่อหน้า เน้นจุดเด่น ทำเลดี สิ่งอำนวยความสะดวก
ตอบในรูปแบบ JSON เท่านั้น: {"descriptionTh": "...", "descriptionEn": "..."}

ข้อมูลทรัพย์สิน:
${propertyInfo}`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  const jsonMatch = text.match(/\{[\s\S]*"descriptionTh"[\s\S]*"descriptionEn"[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ success: false, error: "Invalid AI response" }, { status: 500 });
  }

  let parsed: { descriptionTh: string; descriptionEn: string };
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return NextResponse.json({ success: false, error: "Failed to parse AI response" }, { status: 500 });
  }

  await prisma.property.update({
    where: { id: property.id },
    data: {
      descriptionTh: parsed.descriptionTh,
      descriptionEn: parsed.descriptionEn,
      descriptionGeneratedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true, data: { ...parsed, propertyId: property.id } });
}
