import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Public endpoint — no auth required. Token is the only secret.

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const booking = await prisma.booking.findUnique({
    where: { signToken: token },
    select: {
      docNumber: true,
      projectName: true,
      unitNumber: true,
      ownerName: true,
      tenantName: true,
      depositAmount: true,
      signedAt: true,
    },
  });

  if (!booking) {
    return NextResponse.json({ success: false, error: "Invalid link" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      docNumber: booking.docNumber,
      projectName: booking.projectName,
      unitNumber: booking.unitNumber,
      ownerName: booking.ownerName,
      tenantName: booking.tenantName,
      depositAmount: Number(booking.depositAmount),
      alreadySigned: !!booking.signedAt,
      signedAt: booking.signedAt,
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const booking = await prisma.booking.findUnique({
    where: { signToken: token },
    select: { id: true, signedAt: true },
  });

  if (!booking) {
    return NextResponse.json({ success: false, error: "Invalid link" }, { status: 404 });
  }
  if (booking.signedAt) {
    return NextResponse.json({ success: false, error: "Already signed" }, { status: 400 });
  }

  const body = await req.json();
  const { signature } = body;
  if (!signature || typeof signature !== "string" || !signature.startsWith("data:image/")) {
    return NextResponse.json({ success: false, error: "Invalid signature data" }, { status: 400 });
  }
  if (signature.length > 700_000) {
    return NextResponse.json({ success: false, error: "Signature too large" }, { status: 400 });
  }

  const now = new Date();
  await prisma.booking.update({
    where: { id: booking.id },
    data: { ownerSignature: signature, signedAt: now, status: "SIGNED" },
  });

  return NextResponse.json({ success: true });
}
