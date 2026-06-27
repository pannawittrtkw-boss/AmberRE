import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
      "image/x-icon",
      "video/mp4",
      "video/webm",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type" },
        { status: 400 }
      );
    }

    const isVideo = file.type.startsWith("video/");
    const url = new URL(req.url);
    const maxMBParam = parseInt(url.searchParams.get("maxMB") || "0");
    const defaultImageMB = 10;
    const defaultVideoMB = 50;
    const limitMB = isVideo
      ? Math.max(maxMBParam || 0, defaultVideoMB)
      : Math.max(maxMBParam || 0, defaultImageMB);
    const maxSize = limitMB * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: `File too large (max ${limitMB}MB)` },
        { status: 400 }
      );
    }

    const ext = path.extname(file.name);
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}${ext}`;

    // Storage priority:
    //  1. Cloudflare R2 (if R2 env vars set) — no egress fees
    //  2. Vercel Blob (if BLOB_READ_WRITE_TOKEN set) — fallback
    //  3. Local filesystem — dev
    const { isR2Configured, uploadToR2 } = await import("@/lib/r2");

    if (isR2Configured()) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const url = await uploadToR2(`uploads/${fileName}`, buffer, file.type);
      return NextResponse.json({ success: true, data: { url, fileName } });
    }

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (blobToken) {
      const { put } = await import("@vercel/blob");
      const blob = await put(`uploads/${fileName}`, file, {
        access: "public",
        token: blobToken,
        contentType: file.type,
      });
      return NextResponse.json({
        success: true,
        data: { url: blob.url, fileName },
      });
    }

    // Local filesystem path
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      data: { url: `/uploads/${fileName}`, fileName },
    });
  } catch (error) {
    console.error("Upload error:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
