import { NextRequest, NextResponse } from "next/server";
import { findNearbyPlaces } from "@/lib/nearby-places";

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
  "address": "ที่อยู่โครงการ (string หรือ null)"
}

หมายเหตุ:
- facilities ให้เลือกเฉพาะที่โครงการนี้มีจริงๆ ตามความรู้ของคุณ
- ถ้าเป็นคอนโดทั่วไปมักมี: parking, security24h, fitnessGym, swimmingPool, garden
- ถ้าเป็น High-Rise ให้เลือก highRise, ถ้า Low-Rise ให้เลือก lowRise
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

    // The LLM's own lat/long is a guess from training data, not a real
    // lookup — it's frequently off by kilometers for anything but the most
    // famous projects. Discard it and only trust coordinates that come back
    // from an actual place search; a blank map (manual pin needed) beats a
    // confident-looking wrong pin.
    result.latitude = null;
    result.longitude = null;

    // Places Text Search matches named buildings/projects far better than
    // the Geocoding API, which is tuned for structured street addresses,
    // not business/POI names — this is what was producing wrong coordinates.
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (googleApiKey) {
      try {
        const searchQuery = encodeURIComponent(`${projectName} คอนโด`);
        const geoRes = await fetch(
          `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${searchQuery}&region=th&language=th&key=${googleApiKey}`
        );
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData.status === "OK" && geoData.results?.length > 0) {
            const top = geoData.results[0];
            result.latitude = top.geometry.location.lat;
            result.longitude = top.geometry.location.lng;
            if (top.formatted_address) {
              result.address = top.formatted_address;
            }
          }
        }
      } catch {
        // Leave latitude/longitude null — better than a wrong guess
      }

      // Once we have real coordinates, look up real nearby places too —
      // same API, same trust level, no extra AI call needed.
      if (result.latitude && result.longitude) {
        result.nearbyPlaces = await findNearbyPlaces(result.latitude, result.longitude, googleApiKey);
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Lookup project error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Error" }, { status: 500 });
  }
}
