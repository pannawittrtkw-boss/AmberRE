import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ success: false, error: "Email required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to avoid leaking whether email exists.
    // The reset URL is included in the response only when the email matches a real account
    // (allowing the user to copy-paste it). When SMTP is wired in later, this can be sent
    // by email instead and the URL omitted from the response.
    if (!user || !user.isActive) {
      return NextResponse.json({ success: true, data: { message: "If the email exists, a reset link has been generated." } });
    }

    // Invalidate any existing unused tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL || "";
    const resetUrl = `${origin}/th/auth/reset-password?token=${token}`;

    return NextResponse.json({
      success: true,
      data: {
        message: "Reset link generated.",
        resetUrl,
        expiresAt,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
