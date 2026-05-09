import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * Google Translate v2 proxy. Used by the standard-clause editor to
 * auto-translate Thai overrides into English so admins only have to
 * write the Thai version.
 *
 * Configuration: GOOGLE_TRANSLATE_API_KEY env var. The key needs the
 * "Cloud Translation API" enabled on its Google Cloud project. Falls
 * back to GOOGLE_VISION_API_KEY when both APIs share the same key.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  const apiKey =
    process.env.GOOGLE_TRANSLATE_API_KEY ||
    process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Translate not configured: set GOOGLE_TRANSLATE_API_KEY in the environment.",
      },
      { status: 503 }
    );
  }

  let body: { text?: string; source?: string; target?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const text = (body.text || "").trim();
  if (!text) {
    return NextResponse.json({ success: true, data: { text: "" } });
  }
  const source = body.source || "th";
  const target = body.target || "en";

  // Protect {{placeholders}} from being translated. Google Translate
  // may otherwise mangle them ("{{monthlyRent}}" → "{{เช่ารายเดือน}}").
  // Replace each one with a stable token, translate, then restore.
  const placeholderRe = /\{\{(\w+)\}\}/g;
  const matches: string[] = [];
  let i = 0;
  const protectedText = text.replace(placeholderRe, (m) => {
    matches.push(m);
    return `[[P${i++}]]`;
  });

  try {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: protectedText,
        source,
        target,
        format: "text",
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Translate API error:", res.status, errBody);
      return NextResponse.json(
        {
          success: false,
          error: `Translate API ${res.status}: ${errBody.slice(0, 200)}`,
        },
        { status: 502 }
      );
    }

    const data = await res.json();
    const translatedRaw = data?.data?.translations?.[0]?.translatedText || "";

    // Restore protected placeholders. They may also have come back with
    // slightly different bracket styles depending on the engine.
    const restored = translatedRaw.replace(
      /\[\[P(\d+)\]\]/g,
      (_: string, idx: string) => matches[Number(idx)] ?? `[[P${idx}]]`
    );

    return NextResponse.json({ success: true, data: { text: restored } });
  } catch (err) {
    console.error("Translate endpoint error:", err);
    const message = err instanceof Error ? err.message : "Translate failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
