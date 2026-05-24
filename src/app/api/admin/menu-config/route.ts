import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const SETTING_KEY = "agent_menu_config";

export const DEFAULT_MENU_CONFIG: Record<string, string[]> = {
  STANDARD: ["properties"],
  PRO: ["properties", "contracts", "electricity-calculator"],
  ELITE: ["properties", "contracts", "electricity-calculator", "accounting"],
};

export async function GET() {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: SETTING_KEY } });
    if (!row?.valueTh) {
      return NextResponse.json({ success: true, data: DEFAULT_MENU_CONFIG });
    }
    const data = JSON.parse(row.valueTh);
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: true, data: DEFAULT_MENU_CONFIG });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    // body: { STANDARD: string[], PRO: string[], ELITE: string[] }
    await prisma.siteSetting.upsert({
      where: { key: SETTING_KEY },
      update: { valueTh: JSON.stringify(body) },
      create: { key: SETTING_KEY, valueTh: JSON.stringify(body) },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Menu config PUT error:", err);
    return NextResponse.json({ success: false, error: err?.message || "Internal server error" }, { status: 500 });
  }
}
