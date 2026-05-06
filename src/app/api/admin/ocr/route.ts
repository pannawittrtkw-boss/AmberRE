import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * OCR endpoint backed by Google Cloud Vision (DOCUMENT_TEXT_DETECTION).
 *
 * Used by the admin contract form to read Thai ID cards, passports, and
 * bank-book images. Quality is dramatically better than the in-browser
 * Tesseract path the form falls back to when this endpoint is unavailable.
 *
 * Configuration: set GOOGLE_VISION_API_KEY in the deployment env. The key
 * needs the Cloud Vision API enabled on its Google Cloud project. Restrict
 * the key to the Vision API only — it is server-side, never exposed to the
 * browser.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,
        error:
          "OCR not configured: set GOOGLE_VISION_API_KEY in the environment.",
      },
      { status: 503 }
    );
  }

  let file: File | null = null;
  try {
    const formData = await req.formData();
    file = formData.get("file") as File | null;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid form data" },
      { status: 400 }
    );
  }

  if (!file) {
    return NextResponse.json(
      { success: false, error: "No file provided" },
      { status: 400 }
    );
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { success: false, error: "Only image files are supported" },
      { status: 400 }
    );
  }
  // Vision API hard limit is 20MB per request; we cap lower to keep
  // base64 inflation safe under Next request limits.
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json(
      { success: false, error: "Image too large (max 8MB)" },
      { status: 413 }
    );
  }

  try {
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    const visionRes = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64 },
              features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
              // Hint Thai + English so the engine doesn't pick a wrong
              // primary language on noisy photos.
              imageContext: { languageHints: ["th", "en"] },
            },
          ],
        }),
      }
    );

    if (!visionRes.ok) {
      const errText = await visionRes.text();
      console.error("Vision API error:", visionRes.status, errText);
      return NextResponse.json(
        {
          success: false,
          error: `Vision API ${visionRes.status}: ${errText.slice(0, 300)}`,
        },
        { status: 502 }
      );
    }

    const data = await visionRes.json();
    const resp = data.responses?.[0];
    if (resp?.error) {
      return NextResponse.json(
        { success: false, error: resp.error.message || "Vision API error" },
        { status: 502 }
      );
    }

    const text =
      resp?.fullTextAnnotation?.text ||
      // Fallback for general TEXT_DETECTION shape (not requested but defensive)
      resp?.textAnnotations?.[0]?.description ||
      "";

    return NextResponse.json({ success: true, data: { text } });
  } catch (err) {
    console.error("OCR endpoint error:", err);
    const message = err instanceof Error ? err.message : "OCR failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
