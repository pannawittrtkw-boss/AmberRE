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
      return NextResponse.json({ success: false, error: "API key not configured" }, { status: 500 });
    }

    const { projectName } = await req.json();
    if (!projectName) {
      return NextResponse.json({ success: false, error: "Project name required" });
    }

    // Call AI to lookup project facilities and location
    const prompt = `คุณเป็น AI ที่รู้ข้อมูลคอนโด/หมู่บ้านในประเทศไทย

ค้นหาข้อมูลของโครงการ "${projectName}" และตอบเป็น JSON เท่านั้น:

{
  "facilities": ["เลือกจาก: ${FACILITY_KEYS.join(", ")}"],
  "latitude": "ละติจูดของโครงการ (number หรือ null)",
  "longitude": "ลองจิจูดของโครงการ (number หรือ null)",
  "address": "ที่อยู่โครงการ (string หรือ null)"
}

หมายเหตุ:
- facilities ให้เลือกเฉพาะที่โครงการนี้มีจริงๆ ตามความรู้ของคุณ
- ถ้าเป็นคอนโดทั่วไปมักมี: parking, security24h, fitnessGym, swimmingPool, garden
- ถ้าเป็น High-Rise ให้เลือก highRise, ถ้า Low-Rise ให้เลือก lowRise
- latitude/longitude ให้ใส่พิกัดของโครงการให้แม่นยำที่สุด
- ถ้าไม่แน่ใจข้อมูลให้ใส่ null
- ตอบ JSON เท่านั้น ห้ามมี markdown`;

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
        max_tokens: 500,
      }),
    });

    if (!aiRes.ok) {
      return NextResponse.json({ success: false, error: "AI API error" }, { status: 500 });
    }

    const aiData = await aiRes.json();
    const text = aiData?.choices?.[0]?.message?.content || "";

    let result;
    try {
      const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      result = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json({ success: false, error: "ไม่สามารถวิเคราะห์ข้อมูลได้" });
    }

    // Use Google Maps Geocoding API for accurate coordinates
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (googleApiKey) {
      try {
        const searchQuery = encodeURIComponent(`${projectName} condo Thailand`);
        const geoRes = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${searchQuery}&language=th&region=th&key=${googleApiKey}`
        );
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData.status === "OK" && geoData.results?.length > 0) {
            const loc = geoData.results[0].geometry.location;
            result.latitude = loc.lat;
            result.longitude = loc.lng;
            // Also update address from Google if available
            if (geoData.results[0].formatted_address) {
              result.address = geoData.results[0].formatted_address;
            }
          }
        }
      } catch {
        // Keep AI coordinates as fallback
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Lookup project error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Error" }, { status: 500 });
  }
}
