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

    // Storage strategy:
    //  - If BLOB_READ_WRITE_TOKEN env var is set → use Vercel Blob (production)
    //  - Otherwise → write to public/uploads/ (local dev / VPS)
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

    if (blobToken) {
      // Vercel Blob path — works on Vercel/serverless filesystems
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
