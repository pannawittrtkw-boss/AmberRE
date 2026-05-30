import { NextRequest, NextResponse } from "next/server";

// Station list for AI to match nearby stations
const STATION_LIST = `BTS Sukhumvit: N24-คูคต, N23-แยกคลองหลวง, N22-ม.ธรรมศาสตร์, N21-เมืองเอก, N20-พหลโยธิน59, N19-สายหยุด, N18-สะพานใหม่, N17-พิพิธภัณฑ์กองทัพอากาศ, N16-รพ.ภูมิพล, N15-กรมทหารราบที่11, N14-วัดพระศรีมหาธาตุ, N13-พหลโยธิน24, N12-รัชโยธิน, N11-เสนานิคม, N10-ม.เกษตรศาสตร์, N9-ห้าแยกลาดพร้าว, N8-หมอชิต, N7-สะพานควาย, N6-เสนารวม, N5-อารีย์, N4-สนามเป้า, N3-อนุสาวรีย์ชัยฯ, N2-พญาไท, N1-ราชเทวี, CEN-สยาม, E1-ชิดลม, E2-เพลินจิต, E3-นานา, E4-อโศก, E5-พร้อมพงษ์, E6-ทองหล่อ, E7-เอกมัย, E8-พระโขนง, E9-อ่อนนุช, E10-บางจาก, E11-ปุณณวิถี, E12-อุดมสุข, E13-บางนา, E14-แบริ่ง, E15-สำโรง, E16-ปู่เจ้า, E17-ช้างเอราวัณ, E18-รร.นายเรือ, E19-ปากน้ำ, E20-ศรีนครินทร์, E21-แพรกษา, E22-สายลวด, E23-เคหะฯ
BTS Silom: W1-สนามกีฬาแห่งชาติ, S1-ราชดำริ, S2-ศาลาแดง, S3-ช่องนนทรี, S4-เซนต์หลุยส์, S5-สุรศักดิ์, S6-สะพานตากสิน, S7-กรุงธนบุรี, S8-วงเวียนใหญ่, S9-โพธิ์นิมิตร, S10-ตลาดพลู, S11-วุฒากาศ, S12-บางหว้า
BTS Gold: G1-กรุงธนบุรี, G2-เจริญนคร, G3-คลองสาน
MRT Blue: BL01-ท่าพระ, BL02-จรัญฯ13, BL03-ไฟฉาย, BL04-บางขุนนนท์, BL05-บางยี่ขัน, BL06-สิรินธร, BL07-บางพลัด, BL08-บางอ้อ, BL09-บางโพ, BL10-เตาปูน, BL11-บางซื่อ, BL12-กำแพงเพชร, BL13-สวนจตุจักร, BL14-พหลโยธิน, BL15-ลาดพร้าว, BL16-รัชดาภิเษก, BL17-สุทธิสาร, BL18-ห้วยขวาง, BL19-ศูนย์วัฒนธรรมฯ, BL20-พระราม9, BL21-เพชรบุรี, BL22-สุขุมวิท, BL23-ศูนย์ประชุมฯสิริกิติ์, BL24-คลองเตย, BL25-ลุมพินี, BL26-สีลม, BL27-สามย่าน, BL28-หัวลำโพง, BL29-วัดมังกร, BL30-สามยอด, BL31-สนามไชย, BL32-อิสรภาพ, BL33-บางไผ่, BL34-บางหว้า, BL35-เพชรเกษม48, BL36-ภาษีเจริญ, BL37-บางแค, BL38-หลักสอง
MRT Purple: PP01-คลองบางไผ่, PP02-ตลาดบางใหญ่, PP03-สามแยกบางใหญ่, PP04-บางพลู, PP05-บางรักใหญ่, PP06-บางรักน้อยท่าอิฐ, PP07-ไทรม้า, PP08-สะพานพระนั่งเกล้า, PP09-แยกนนทบุรี1, PP10-บางกระสอ, PP11-ศูนย์ราชการนนทบุรี, PP12-กระทรวงสาธารณสุข, PP13-แยกติวานนท์, PP14-วงศ์สว่าง, PP15-บางซ่อน, PP16-เตาปูน
MRT Yellow: YL01-ลาดพร้าว, YL02-พหลโยธิน48, YL03-ภาวนา, YL04-โชคชัย4, YL05-ลาดพร้าว71, YL06-ลาดพร้าว83, YL07-มหาดไทย, YL08-ลาดพร้าว101, YL09-บางกะปิ, YL10-แยกลำสาลี, YL11-ศรีกรีฑา, YL12-หัวหมาก, YL13-กลันตัน, YL14-ศรีนุช, YL15-ศรีนครินทร์38, YL16-สวนหลวงร.9, YL17-ศรีอุดม, YL18-ศรีเอี่ยม, YL19-ศรีลาซาล, YL20-ศรีแบริ่ง, YL21-ศรีด่าน, YL22-ศรีเทพา, YL23-ทิพวัล, YL24-สำโรง
MRT Pink: PK01-ศูนย์ราชการนนทบุรี, PK02-แคราย, PK03-สนามบินน้ำ, PK04-สามัคคี, PK05-กรมชลประทาน, PK06-ปากเกร็ด, PK07-เลี่ยงเมืองปากเกร็ด, PK08-แจ้งวัฒนะปากเกร็ด28, PK09-ศรีรัช, PK10-เมืองทองธานี, PK11-แจ้งวัฒนะ14, PK12-ศูนย์ราชการฯ, PK13-โทรคมนาคมแห่งชาติ, PK14-หลักสี่, PK15-ราชภัฏพระนคร, PK16-นพรัตนราชธานี, PK17-วัดพระศรีมหาธาตุ, PK18-รามอินทรา3, PK19-ลาดปลาเค้า, PK20-รามอินทรากม.4, PK21-มัยลาภ, PK22-วัชรพล, PK23-รามอินทรากม.6, PK24-คู้บอน, PK25-รามอินทรากม.9, PK26-วงแหวนรามอินทรา, PK27-นพรัตน์, PK28-บางชัน, PK29-เศรษฐบุตรบำเพ็ญ, PK30-มีนบุรี
Airport Rail Link: A1-พญาไท, A2-ราชปรารภ, A3-มักกะสัน, A4-รามคำแหง, A5-หัวหมาก, A6-บ้านทับช้าง, A7-ลาดกระบัง, A8-สุวรรณภูมิ`;

const FURNITURE_KEYS = [
  "bed", "mattress", "wardrobe", "dressingTable", "sofa", "coffeeTable",
  "tvCabinet", "curtains", "kitchenCounter", "sink", "diningTable", "chairs", "showerScreen",
];

const APPLIANCE_KEYS = [
  "airConditioner", "tv", "refrigerator", "microwave", "stove",
  "cookerHood", "washingMachine", "digitalDoorLock", "waterHeater",
];

async function fetchUrlContent(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "th-TH,th;q=0.9,en;q=0.8",
      },
      redirect: "follow",
    });

    if (!res.ok) return "";
    const html = await res.text();

    // Extract Open Graph and meta content
    const ogMatches = html.match(/<meta[^>]*(?:property|name)="(?:og:|description|twitter:)[^"]*"[^>]*content="([^"]*)"[^>]*>/gi) || [];
    const ogContent = ogMatches
      .map((m) => {
        const content = m.match(/content="([^"]*)"/);
        return content ? content[1] : "";
      })
      .filter(Boolean)
      .join("\n");

    // Extract visible text from body (strip HTML tags)
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyHtml = bodyMatch ? bodyMatch[1] : html;
    const textContent = bodyHtml
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#x([0-9a-f]+);/gi, (_: string, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
      .replace(/&#(\d+);/g, (_: string, dec: string) => String.fromCodePoint(parseInt(dec)))
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 5000);

    // Extract image URLs
    const imgMatches = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/gi) || [];
    const images = imgMatches
      .map((m) => {
        const src = m.match(/content="([^"]*)"/);
        return src ? src[1] : "";
      })
      .filter(Boolean);

    return `=== OG/META CONTENT ===\n${ogContent}\n\n=== PAGE TEXT ===\n${textContent}\n\n=== IMAGES ===\n${images.join("\n")}`;
  } catch {
    return "";
  }
}

const AI_PROMPT = `คุณเป็น AI ที่ช่วยดึงข้อมูลอสังหาริมทรัพย์จากข้อความโพสต์ Facebook หรือเว็บไซต์

วิเคราะห์ข้อความต่อไปนี้และดึงข้อมูลออกมาในรูปแบบ JSON:

"""
{{CONTENT}}
"""

ตอบเป็น JSON เท่านั้น (ไม่ต้องมี markdown code block) ตามโครงสร้างนี้:
{
  "projectName": "ชื่อโครงการ/คอนโด (string หรือ null)",
  "listingType": "RENT หรือ SALE หรือ RENT_AND_SALE",
  "price": "ราคาเช่าต่อเดือน (number หรือ null)",
  "salePrice": "ราคาขาย (number หรือ null)",
  "sizeSqm": "ขนาดตร.ม. (number หรือ null)",
  "floor": "ชั้น (number หรือ null)",
  "building": "ตึก/อาคาร (string หรือ null)",
  "bedrooms": "จำนวนห้องนอน (number, default 1)",
  "bathrooms": "จำนวนห้องน้ำ (number, default 1)",
  "furniture": ["เลือกจาก: ${FURNITURE_KEYS.join(", ")}"],
  "appliances": ["เลือกจาก: ${APPLIANCE_KEYS.join(", ")}"],
  "ownerName": "ชื่อเจ้าของ (string หรือ null)",
  "ownerPhone": "เบอร์โทร (string หรือ null)",
  "ownerLineId": "Line ID (string หรือ null)",
  "nearbyStations": ["รหัสสถานี BTS/MRT ที่ใกล้เคียง เลือกจากรายการด้านล่าง"],
  "note": "ข้อมูลเพิ่มเติมที่น่าสนใจ (string หรือ null)"
}

รายการสถานี BTS/MRT ทั้งหมด:
${STATION_LIST}

หมายเหตุ:
- ดูจากชื่อโครงการ/ที่ตั้ง แล้วเลือกสถานี BTS/MRT ที่ใกล้ที่สุด 1-3 สถานี (ใช้รหัสสถานี เช่น E4, BL22, E16)
- furniture และ appliances ให้เลือกเฉพาะ key ที่ตรงกับข้อมูลในโพสต์เท่านั้น
- ราคาถ้าเป็นค่าเช่ารายเดือนใส่ใน price, ถ้าเป็นราคาขายใส่ใน salePrice
- ถ้าไม่มีข้อมูลให้ใส่ null`;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "OPENROUTER_API_KEY not configured - กรุณาตั้งค่าใน .env" },
        { status: 500 }
      );
    }

    const { url, text } = await req.json();

    // Get content from URL or use provided text
    let content = text || "";
    let imageUrls: string[] = [];

    if (url && !content) {
      const fetched = await fetchUrlContent(url);
      if (!fetched) {
        return NextResponse.json({
          success: false,
          error: "ไม่สามารถดึงข้อมูลจาก URL ได้ กรุณาวางข้อความจากโพสต์แทน",
          needsManualInput: true,
        });
      }
      content = fetched;

      // Extract image URLs from fetched content
      const imgSection = content.split("=== IMAGES ===")[1] || "";
      imageUrls = imgSection
        .trim()
        .split("\n")
        .filter((u: string) => u.startsWith("http"));
    }

    // Call OpenRouter API (Gemini 2.0 Flash)
    const prompt = AI_PROMPT.replace("{{CONTENT}}", content.slice(0, 4000));

    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!aiRes.ok) {
      const errBody = await aiRes.json().catch(() => ({}));
      console.error("OpenRouter API error:", JSON.stringify(errBody));
      const errMsg = errBody?.error?.message || "";
      if (aiRes.status === 429) {
        return NextResponse.json({
          success: false,
          error: "API rate limit - กรุณารอสักครู่แล้วลองใหม่",
        });
      }
      if (aiRes.status === 401) {
        return NextResponse.json({
          success: false,
          error: "API Key ไม่ถูกต้อง กรุณาตรวจสอบ OPENROUTER_API_KEY ใน .env",
        });
      }
      return NextResponse.json(
        { success: false, error: errMsg || `API error (${aiRes.status})` },
        { status: 500 }
      );
    }

    const aiData = await aiRes.json();
    const responseText = aiData?.choices?.[0]?.message?.content || "";

    if (!responseText) {
      return NextResponse.json({
        success: false,
        error: "AI ไม่สามารถวิเคราะห์ข้อมูลได้ กรุณาลองใหม่",
      });
    }

    // Parse JSON from response
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
        error: "AI ไม่สามารถวิเคราะห์ข้อมูลได้ กรุณาลองใหม่",
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...extracted,
        imageUrls,
        sourceUrl: url || null,
      },
    });
  } catch (error: unknown) {
    console.error("AI extract error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
