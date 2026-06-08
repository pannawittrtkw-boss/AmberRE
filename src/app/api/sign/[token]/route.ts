import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Public endpoint — no auth required. Token is the only secret.

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const contract = await prisma.contract.findFirst({
    where: {
      OR: [{ lessorSignToken: token }, { lesseeSignToken: token }],
    },
    select: {
      id: true,
      contractNumber: true,
      projectName: true,
      unitNumber: true,
      lessorName: true,
      lesseeName: true,
      lessorSignToken: true,
      lesseeSignToken: true,
      lessorSignedAt: true,
      lesseeSignedAt: true,
    },
  });

  if (!contract) {
    return NextResponse.json({ success: false, error: "Invalid link" }, { status: 404 });
  }

  const isLessor = contract.lessorSignToken === token;
  const alreadySigned = isLessor ? !!contract.lessorSignedAt : !!contract.lesseeSignedAt;

  return NextResponse.json({
    success: true,
    data: {
      contractNumber: contract.contractNumber,
      projectName: contract.projectName,
      unitNumber: contract.unitNumber,
      signerName: isLessor ? contract.lessorName : contract.lesseeName,
      role: isLessor ? "lessor" : "lessee",
      alreadySigned,
      signedAt: isLessor ? contract.lessorSignedAt : contract.lesseeSignedAt,
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const contract = await prisma.contract.findFirst({
    where: {
      OR: [{ lessorSignToken: token }, { lesseeSignToken: token }],
    },
    select: {
      id: true,
      lessorSignToken: true,
      lesseeSignToken: true,
      lessorSignedAt: true,
      lesseeSignedAt: true,
    },
  });

  if (!contract) {
    return NextResponse.json({ success: false, error: "Invalid link" }, { status: 404 });
  }

  const isLessor = contract.lessorSignToken === token;
  const alreadySigned = isLessor ? !!contract.lessorSignedAt : !!contract.lesseeSignedAt;
  if (alreadySigned) {
    return NextResponse.json({ success: false, error: "Already signed" }, { status: 400 });
  }

  const body = await req.json();
  const { signature } = body;
  if (!signature || typeof signature !== "string" || !signature.startsWith("data:image/")) {
    return NextResponse.json({ success: false, error: "Invalid signature data" }, { status: 400 });
  }

  // Limit signature size (~500KB base64 ≈ 375KB binary)
  if (signature.length > 700_000) {
    return NextResponse.json({ success: false, error: "Signature too large" }, { status: 400 });
  }

  const now = new Date();
  await prisma.contract.update({
    where: { id: contract.id },
    data: isLessor
      ? { lessorSignature: signature, lessorSignedAt: now }
      : { lesseeSignature: signature, lesseeSignedAt: now },
  });

  return NextResponse.json({ success: true });
}
