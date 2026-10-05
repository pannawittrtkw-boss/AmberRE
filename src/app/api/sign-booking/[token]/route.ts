import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Public endpoint — no auth required. Token is the only secret.
// A booking has three independent sign tokens (owner, tenant, witness) —
// whichever column the token matches determines the signer's role.

type Role = "OWNER" | "TENANT" | "WITNESS";

function roleFor(
  token: string,
  booking: { signToken: string | null; tenantSignToken: string | null; witnessSignToken: string | null }
): Role | null {
  if (booking.signToken === token) return "OWNER";
  if (booking.tenantSignToken === token) return "TENANT";
  if (booking.witnessSignToken === token) return "WITNESS";
  return null;
}

function computeStatus(b: {
  ownerSignature: string | null;
  tenantSignature: string | null;
  witnessSignature: string | null;
  witnessName: string | null;
}): string {
  const ownerDone = !!b.ownerSignature;
  const tenantDone = !!b.tenantSignature;
  const witnessDone = !b.witnessName || !!b.witnessSignature; // no witness assigned = not required
  if (ownerDone && tenantDone && witnessDone) return "SIGNED";
  if (ownerDone || tenantDone || (b.witnessName && b.witnessSignature)) return "PARTIALLY_SIGNED";
  return "DRAFT";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const booking = await prisma.booking.findFirst({
    where: { OR: [{ signToken: token }, { tenantSignToken: token }, { witnessSignToken: token }] },
    select: {
      docNumber: true,
      projectName: true,
      unitNumber: true,
      ownerName: true,
      tenantName: true,
      witnessName: true,
      depositAmount: true,
      signToken: true,
      tenantSignToken: true,
      witnessSignToken: true,
      signedAt: true,
      tenantSignedAt: true,
      witnessSignedAt: true,
    },
  });

  if (!booking) {
    return NextResponse.json({ success: false, error: "Invalid link" }, { status: 404 });
  }

  const role = roleFor(token, booking);
  if (!role) {
    return NextResponse.json({ success: false, error: "Invalid link" }, { status: 404 });
  }
  if (role === "WITNESS" && !booking.witnessName) {
    return NextResponse.json({ success: false, error: "No witness assigned" }, { status: 404 });
  }

  const signerName =
    role === "OWNER" ? booking.ownerName : role === "TENANT" ? booking.tenantName : booking.witnessName;
  const signedAt =
    role === "OWNER" ? booking.signedAt : role === "TENANT" ? booking.tenantSignedAt : booking.witnessSignedAt;

  return NextResponse.json({
    success: true,
    data: {
      role,
      signerName,
      docNumber: booking.docNumber,
      projectName: booking.projectName,
      unitNumber: booking.unitNumber,
      ownerName: booking.ownerName,
      tenantName: booking.tenantName,
      depositAmount: Number(booking.depositAmount),
      alreadySigned: !!signedAt,
      signedAt,
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const booking = await prisma.booking.findFirst({
    where: { OR: [{ signToken: token }, { tenantSignToken: token }, { witnessSignToken: token }] },
    select: {
      id: true,
      signToken: true,
      tenantSignToken: true,
      witnessSignToken: true,
      signedAt: true,
      tenantSignedAt: true,
      witnessSignedAt: true,
      ownerSignature: true,
      tenantSignature: true,
      witnessSignature: true,
      witnessName: true,
    },
  });

  if (!booking) {
    return NextResponse.json({ success: false, error: "Invalid link" }, { status: 404 });
  }

  const role = roleFor(token, booking);
  if (!role) {
    return NextResponse.json({ success: false, error: "Invalid link" }, { status: 404 });
  }
  if (role === "WITNESS" && !booking.witnessName) {
    return NextResponse.json({ success: false, error: "No witness assigned" }, { status: 404 });
  }

  const alreadySigned =
    role === "OWNER" ? booking.signedAt : role === "TENANT" ? booking.tenantSignedAt : booking.witnessSignedAt;
  if (alreadySigned) {
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
  const newStatus = computeStatus({
    ownerSignature: role === "OWNER" ? signature : booking.ownerSignature,
    tenantSignature: role === "TENANT" ? signature : booking.tenantSignature,
    witnessSignature: role === "WITNESS" ? signature : booking.witnessSignature,
    witnessName: booking.witnessName,
  });

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      ...(role === "OWNER" && { ownerSignature: signature, signedAt: now }),
      ...(role === "TENANT" && { tenantSignature: signature, tenantSignedAt: now }),
      ...(role === "WITNESS" && { witnessSignature: signature, witnessSignedAt: now }),
      status: newStatus,
    },
  });

  return NextResponse.json({ success: true });
}
