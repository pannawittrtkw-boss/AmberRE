import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const SETTING_KEY = "agent_menu_config";

const ALL_KEYS = [
  "dashboard", "properties", "projects", "customer-leads", "users", "messages", "articles",
  "portfolio", "electricity-calculator", "accounting", "contracts", "contract-calendar",
  "closed-contracts", "subscriptions", "menu-config", "reviews", "settings", "languages",
  "agent-dashboard",
];

export const DEFAULT_MENU_CONFIG: Record<string, string[]> = {
  STANDARD: ["agent-dashboard", "properties"],
  PRO:      ["agent-dashboard", "properties", "projects", "customer-leads", "contracts", "electricity-calculator", "accounting"],
  ELITE:    ["agent-dashboard", "properties", "projects", "customer-leads", "contracts", "closed-contracts", "electricity-calculator", "accounting", "messages", "reviews"],
  ADMIN:    ALL_KEYS,
};

export async function GET() {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: SETTING_KEY } });
    if (!row?.valueTh) {
      return NextResponse.json({ success: true, data: DEFAULT_MENU_CONFIG });
    }
    const stored = JSON.parse(row.valueTh);
    // ADMIN always gets all keys — merge stored with any newly added keys
    stored.ADMIN = ALL_KEYS;
    return NextResponse.json({ success: true, data: stored });
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
    // body: { STANDARD: string[], PRO: string[], ELITE: string[], ADMIN: string[] }
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
