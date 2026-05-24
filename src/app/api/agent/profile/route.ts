import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

function requireAgent(session: any) {
  const role = (session?.user as any)?.role;
  return role === "CO_AGENT" || role === "ADMIN";
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !requireAgent(session)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const userId = Number((session.user as any).id);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, firstName: true, lastName: true, email: true,
        phone: true, lineId: true, profileImage: true,
        coAgentApplication: { select: { id: true, companyName: true, status: true } },
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !requireAgent(session)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const userId = Number((session.user as any).id);
    const { firstName, lastName, phone, lineId, profileImage, companyName } = await req.json();

    const [user] = await Promise.all([
      prisma.user.update({
        where: { id: userId },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(phone !== undefined && { phone: phone || null }),
          ...(lineId !== undefined && { lineId: lineId || null }),
          ...(profileImage !== undefined && { profileImage: profileImage || null }),
        },
        select: { id: true, firstName: true, lastName: true, phone: true, lineId: true, profileImage: true },
      }),
      companyName !== undefined
        ? prisma.coAgentApplication.updateMany({
            where: { userId },
            data: { companyName: companyName || null },
          })
        : Promise.resolve(),
    ]);

    return NextResponse.json({ success: true, data: user });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
