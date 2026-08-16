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
      OR: [
        { lessorSignToken: token },
        { lesseeSignToken: token },
        { jointLesseeSignToken: token },
        { commissionSignToken: token },
      ],
    },
    select: {
      id: true,
      contractNumber: true,
      projectName: true,
      unitNumber: true,
      lessorName: true,
      lesseeName: true,
      jointLesseeName: true,
      lessorSignToken: true,
      lesseeSignToken: true,
      jointLesseeSignToken: true,
      commissionSignToken: true,
      lessorSignedAt: true,
      lesseeSignedAt: true,
      jointLesseeSignedAt: true,
      commissionSignedAt: true,
    },
  });

  if (!contract) {
    return NextResponse.json({ success: false, error: "Invalid link" }, { status: 404 });
  }

  const isLessor = contract.lessorSignToken === token;
  const isJointLessee = contract.jointLesseeSignToken === token;
  const isCommission = contract.commissionSignToken === token;
  // else it's the primary lessee

  const role: "lessor" | "lessee" | "joint_lessee" | "commission" = isLessor
    ? "lessor"
    : isJointLessee
    ? "joint_lessee"
    : isCommission
    ? "commission"
    : "lessee";

  const signerName = isJointLessee
    ? (contract.jointLesseeName ?? "Joint Lessee")
    : isLessor || isCommission
    ? contract.lessorName
    : contract.lesseeName;

  const alreadySigned = isLessor
    ? !!contract.lessorSignedAt
    : isJointLessee
    ? !!contract.jointLesseeSignedAt
    : isCommission
    ? !!contract.commissionSignedAt
    : !!contract.lesseeSignedAt;

  const signedAt = isLessor
    ? contract.lessorSignedAt
    : isJointLessee
    ? contract.jointLesseeSignedAt
    : isCommission
    ? contract.commissionSignedAt
    : contract.lesseeSignedAt;

  return NextResponse.json({
    success: true,
    data: {
      contractNumber: contract.contractNumber,
      projectName: contract.projectName,
      unitNumber: contract.unitNumber,
      signerName,
      role,
      alreadySigned,
      signedAt,
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
      OR: [
        { lessorSignToken: token },
        { lesseeSignToken: token },
        { jointLesseeSignToken: token },
        { commissionSignToken: token },
      ],
    },
    select: {
      id: true,
      lessorSignToken: true,
      lesseeSignToken: true,
      jointLesseeSignToken: true,
      commissionSignToken: true,
      lessorSignedAt: true,
      lesseeSignedAt: true,
      jointLesseeSignedAt: true,
      commissionSignedAt: true,
    },
  });

  if (!contract) {
    return NextResponse.json({ success: false, error: "Invalid link" }, { status: 404 });
  }

  const isLessor = contract.lessorSignToken === token;
  const isJointLessee = contract.jointLesseeSignToken === token;
  const isCommission = contract.commissionSignToken === token;

  const alreadySigned = isLessor
    ? !!contract.lessorSignedAt
    : isJointLessee
    ? !!contract.jointLesseeSignedAt
    : isCommission
    ? !!contract.commissionSignedAt
    : !!contract.lesseeSignedAt;

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
  await prisma.contract.update({
    where: { id: contract.id },
    data: isLessor
      ? { lessorSignature: signature, lessorSignedAt: now }
      : isJointLessee
      ? { jointLesseeSignature: signature, jointLesseeSignedAt: now }
      : isCommission
      ? { commissionSignature: signature, commissionSignedAt: now }
      : { lesseeSignature: signature, lesseeSignedAt: now },
  });

  return NextResponse.json({ success: true });
}
