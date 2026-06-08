import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

// GET — return current E-Sign status for a contract
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session?.user || !["ADMIN", "CO_AGENT"].includes(role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const contract = await prisma.contract.findUnique({
      where: { id: parseInt(id, 10) },
      select: {
        id: true,
        lessorName: true,
        lesseeName: true,
        lessorSignToken: true,
        lesseeSignToken: true,
        lessorSignedAt: true,
        lesseeSignedAt: true,
      },
    });

    if (!contract) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: contract });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("E-Sign GET error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST — generate (or regenerate) sign tokens for a contract.
// Body: { regenerate?: "lessor" | "lessee" | "both" }
// Regenerating invalidates the old link — any previous signature is also cleared.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session?.user || !["ADMIN", "CO_AGENT"].includes(role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const contractId = parseInt(id, 10);

    const existing = await prisma.contract.findUnique({
      where: { id: contractId },
      select: {
        lessorSignToken: true,
        lesseeSignToken: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const regen: "lessor" | "lessee" | "both" | undefined = body.regenerate;

    const needsLessor = !existing.lessorSignToken || regen === "lessor" || regen === "both";
    const needsLessee = !existing.lesseeSignToken || regen === "lessee" || regen === "both";

    const updateData: Record<string, unknown> = {};
    if (needsLessor) {
      updateData.lessorSignToken = generateToken();
      updateData.lessorSignature = null;
      updateData.lessorSignedAt = null;
    }
    if (needsLessee) {
      updateData.lesseeSignToken = generateToken();
      updateData.lesseeSignature = null;
      updateData.lesseeSignedAt = null;
    }

    const updated = await prisma.contract.update({
      where: { id: contractId },
      data: updateData,
      select: {
        id: true,
        lessorName: true,
        lesseeName: true,
        lessorSignToken: true,
        lesseeSignToken: true,
        lessorSignedAt: true,
        lesseeSignedAt: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("E-Sign POST error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
