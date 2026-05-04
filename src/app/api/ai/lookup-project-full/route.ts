import { NextRequest, NextResponse } from "next/server";

const FACILITY_KEYS = [
  "petFriendly", "convenienceStore", "coWorkingSpace", "evCharger",
  "garden", "swimmingPool", "parking", "sauna", "playground",
  "library", "security24h", "karaokeRoom", "meetingRoom", "fitnessGym",
  "clubhouse", "snookerTable", "basketballCourt", "badmintonCourt",
  "lowRise", "highRise",
];

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "API key not configured" },
        { status: 500 }
      );
    }

    const { projectName } = await req.json();
    if (!projectName || !projectName.trim()) {
      return NextResponse.json(
        { success: false, error: "Project name required" },
        { status: 400 }
      );
    }

    const prompt = `คุณเป็น AI ที่รู้ข้อมูลคอนโด/หมู่บ้าน/อสังหาริมทรัพย์ในประเทศไทย

ค้นหาข้อมูลของโครงการ "${projectName}" และตอบเป็น JSON เท่านั้น (ห้ามมี markdown code block):

{
  "nameTh": "ชื่อโครงการภาษาไทย (string)",
  "nameEn": "ชื่อโครงการภาษาอังกฤษ (string หรือ null)",
  "developer": "บริษัทผู้พัฒนา (string หรือ null)",
  "location": "ทำเล/ย่าน เช่น 'On Nut, Bangkok' (string หรือ null)",
  "province": "จังหวัด (string หรือ null)",
  "district": "เขต/อำเภอ (string หรือ null)",
  "fullAddress": "ที่อยู่เต็ม (string หรือ null)",
  "projectArea": "ขนาดพื้นที่โครงการ เช่น '5 ไร่ 2 งาน 13 ตร.ว.' (string หรือ null)",
  "ceilingHeight": "ความสูงเพดานเป็นเมตร (number หรือ null)",
  "utilityFee": "ค่าส่วนกลางต่อตร.ม. เช่น '50 บาท/ตร.ม.' (string หรือ null)",
  "buildings": "จำนวนอาคาร (number หรือ null)",
  "parking": "จำนวนที่จอดรถ (number หรือ null)",
  "floors": "จำนวนชั้น (number หรือ null)",
  "totalUnits": "จำนวนยูนิตทั้งหมด (number หรือ null)",
  "yearCompleted": "ปีที่แล้วเสร็จ (number หรือ null)",
  "latitude": "ละติจูด (number หรือ null)",
  "longitude": "ลองจิจูด (number หรือ null)",
  "googleMapsUrl": "URL Google Maps (string หรือ null)",
  "descriptionTh": "คำอธิบายโครงการ ภาษาไทย 2-3 ประโยค (string หรือ null)",
  "facilities": ["array ของ facility keys ที่โครงการนี้มี เลือกจาก: ${FACILITY_KEYS.join(", ")}"],
  "unitTypes": [
    { "type": "ประเภทห้อง เช่น '1 Bedroom'", "size": "ขนาดเป็น sqm เช่น '35-42'", "planImageUrl": "" }
  ]
}

หมายเหตุสำคัญ:
- ตอบข้อมูลตามที่รู้จริงเท่านั้น ถ้าไม่แน่ใจให้ใส่ null
- facilities ให้เลือกเฉพาะที่โครงการนี้มีจริง (เช่น คอนโดทั่วไปมี: parking, security24h, fitnessGym, swimmingPool, garden)
- ถ้าเป็นตึกสูง ใส่ "highRise" ถ้าตึกเตี้ย ใส่ "lowRise"
- unitTypes ให้ใส่เฉพาะที่รู้ว่ามี ถ้าไม่รู้ให้เป็น array ว่าง []
- planImageUrl ให้เป็น "" เสมอ (ไม่ต้องใส่ URL)
- ตอบเป็น JSON เท่านั้น ห้ามมี markdown หรือคำอธิบายอื่น`;

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
        max_tokens: 1500,
      }),
    });

    if (!aiRes.ok) {
      const errBody = await aiRes.json().catch(() => ({}));
      console.error("OpenRouter error:", errBody);
      return NextResponse.json(
        { success: false, error: "AI API error" },
        { status: 500 }
      );
    }

    const aiData = await aiRes.json();
    const text = aiData?.choices?.[0]?.message?.content || "";

    if (!text) {
      return NextResponse.json({
        success: false,
        error: "AI returned empty response",
      });
    }

    let result;
    try {
      const jsonStr = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      result = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json({
        success: false,
        error: "AI response could not be parsed",
      });
    }

    // Use Google Maps Geocoding API for accurate coordinates if API key is set
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (googleApiKey) {
      try {
        const searchQuery = encodeURIComponent(`${projectName} Thailand`);
        const geoRes = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${searchQuery}&language=th&region=th&key=${googleApiKey}`
        );
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData.status === "OK" && geoData.results?.length > 0) {
            const r = geoData.results[0];
            const loc = r.geometry.location;
            result.latitude = loc.lat;
            result.longitude = loc.lng;
            if (r.formatted_address && !result.fullAddress) {
              result.fullAddress = r.formatted_address;
            }
          }
        }
      } catch {
        // Keep AI coordinates as fallback
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    console.error("Lookup project full error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
