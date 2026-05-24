import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = Number((session.user as any).id);
    const existing = await prisma.coAgentApplication.findUnique({ where: { userId } });
    if (existing) {
      return NextResponse.json({ success: false, error: "Application already exists" }, { status: 409 });
    }

    const body = await req.json();
    const { companyName, licenseNumber, experienceYears, lineId, phone } = body;

    // Save lineId + phone to User profile
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(lineId !== undefined && { lineId: lineId || null }),
        ...(phone !== undefined && { phone: phone || null }),
      },
    });

    const application = await prisma.coAgentApplication.create({
      data: {
        userId,
        companyName: companyName || null,
        licenseNumber: licenseNumber || null,
        experienceYears: experienceYears || null,
      },
    });

    return NextResponse.json({ success: true, data: application }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = Number((session.user as any).id);
    const application = await prisma.coAgentApplication.findUnique({
      where: { userId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true, lineId: true, profileImage: true } },
      },
    });

    return NextResponse.json({ success: true, data: application });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
