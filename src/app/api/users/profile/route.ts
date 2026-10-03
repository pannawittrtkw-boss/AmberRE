import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: Number((session.user as any).id) },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        nickname: true,
        phone: true,
        phone2: true,
        lineId: true,
        lineId2: true,
        role: true,
        language: true,
        profileImage: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { firstName, lastName, nickname, phone, phone2, lineId, lineId2, language } = body;

    const user = await prisma.user.update({
      where: { id: Number((session.user as any).id) },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(nickname !== undefined && { nickname }),
        ...(phone !== undefined && { phone }),
        ...(phone2 !== undefined && { phone2 }),
        ...(lineId !== undefined && { lineId }),
        ...(lineId2 !== undefined && { lineId2 }),
        ...(language && { language }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        nickname: true,
        phone: true,
        phone2: true,
        lineId: true,
        lineId2: true,
        role: true,
        language: true,
        profileImage: true,
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
