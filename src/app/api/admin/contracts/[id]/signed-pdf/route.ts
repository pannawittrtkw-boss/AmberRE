import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import path from "path";
import { randomUUID } from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const contractId = parseInt(id, 10);

  const contract = await prisma.contract.findUnique({ where: { id: contractId } });
  if (!contract) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ success: false, error: "Only PDF files are allowed" }, { status: 400 });
  }

  const maxMB = 20;
  if (file.size > maxMB * 1024 * 1024) {
    return NextResponse.json({ success: false, error: `File too large (max ${maxMB}MB)` }, { status: 400 });
  }

  const ext = path.extname(file.name) || ".pdf";
  const fileName = `signed-contracts/${Date.now()}-${Math.random().toString(36).substring(2)}${ext}`;

  let fileUrl: string;

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (blobToken) {
    const { put } = await import("@vercel/blob");
    const blob = await put(fileName, file, {
      access: "public",
      token: blobToken,
      contentType: "application/pdf",
    });
    fileUrl = blob.url;
  } else {
    // Local fallback
    const { writeFile, mkdir } = await import("fs/promises");
    const uploadDir = path.join(process.cwd(), "public", "uploads", "signed-contracts");
    await mkdir(uploadDir, { recursive: true });
    const localName = path.basename(fileName);
    await writeFile(path.join(uploadDir, localName), Buffer.from(await file.arrayBuffer()));
    fileUrl = `/uploads/signed-contracts/${localName}`;
  }

  // Generate share token if not already set
  const shareToken = contract.shareToken || randomUUID().replace(/-/g, "");

  const updated = await prisma.contract.update({
    where: { id: contractId },
    data: { signedPdfUrl: fileUrl, shareToken },
    select: { id: true, signedPdfUrl: true, shareToken: true },
  });

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const updated = await prisma.contract.update({
    where: { id: parseInt(id, 10) },
    data: { signedPdfUrl: null },
    select: { id: true, signedPdfUrl: true, shareToken: true },
  });

  return NextResponse.json({ success: true, data: updated });
}
