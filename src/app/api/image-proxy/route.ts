import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// The R2/Blob buckets serve images without CORS headers, so client-side
// fetch(url, { mode: "cors" }) (needed to turn an image into a File for
// navigator.share / the download button) fails silently on every image.
// Proxying through our own origin sidesteps CORS entirely — the browser
// only ever talks to us, and the outbound fetch here is server-to-server.
function isAllowedHost(hostname: string): boolean {
  return hostname.endsWith(".r2.dev") || hostname.endsWith("blob.vercel-storage.com");
}

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("url");
  if (!target) {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  if (!isAllowedHost(parsed.hostname)) {
    return NextResponse.json({ error: "host not allowed" }, { status: 403 });
  }

  const upstream = await fetch(parsed.toString());
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "upstream fetch failed" }, { status: 502 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "application/octet-stream",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
