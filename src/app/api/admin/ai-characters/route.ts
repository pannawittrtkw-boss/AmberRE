import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const CHAR_FILES = [
  "01.jpg","02.jpeg","03.jpeg","04.jpeg","05.jpeg","06.jpeg",
  "07.jpeg","09.jpeg","10.jpeg","11.jpeg","12.jpeg",
];

// GET — return character image URLs (R2 if configured, else local)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const workerUrl = process.env.R2_WORKER_URL?.replace(/\/$/, "");
  const secret    = process.env.R2_UPLOAD_SECRET;

  if (workerUrl && secret) {
    const urls = Object.fromEntries(
      CHAR_FILES.map(f => [f, `${workerUrl}/characters/${f}`])
    );
    return NextResponse.json({ success: true, data: { urls, source: "r2" } });
  }

  // Fallback: serve from public directory
  const urls = Object.fromEntries(
    CHAR_FILES.map(f => [f, `/images/Agent%20Charecter/${encodeURIComponent(f)}`])
  );
  return NextResponse.json({ success: true, data: { urls, source: "local" } });
}

// POST — upload all character images from public/ to R2
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { isR2Configured, uploadToR2 } = await import("@/lib/r2");
  if (!isR2Configured()) {
    return NextResponse.json({ success: false, error: "R2 not configured" }, { status: 400 });
  }

  const { readFile } = await import("fs/promises");
  const path = await import("path");

  const results: Record<string, string> = {};
  const errors: string[] = [];

  for (const file of CHAR_FILES) {
    try {
      const localPath = path.join(process.cwd(), "public", "images", "Agent Charecter", file);
      const buffer    = await readFile(localPath);
      const ext       = path.extname(file).slice(1).toLowerCase();
      const contentType = ext === "jpg" || ext === "jpeg" ? "image/jpeg"
                        : ext === "png"                   ? "image/png"
                        : "image/jpeg";
      const url = await uploadToR2(`characters/${file}`, buffer, contentType);
      results[file] = url;
    } catch (err) {
      errors.push(`${file}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({
    success: errors.length === 0,
    data: { uploaded: Object.keys(results).length, urls: results, errors },
  });
}
