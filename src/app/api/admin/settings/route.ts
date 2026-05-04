import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// GET all site settings
export async function GET() {
  try {
    const settings = await prisma.siteSetting.findMany();
    const map: Record<string, { valueTh: string | null; valueEn: string | null }> = {};
    for (const s of settings) {
      map[s.key] = { valueTh: s.valueTh, valueEn: s.valueEn };
    }
    return NextResponse.json({ success: true, data: map });
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch settings" }, { status: 500 });
  }
}

// PUT update a single setting
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { key, valueTh, valueEn } = await req.json();
    if (!key) {
      return NextResponse.json({ success: false, error: "Key is required" }, { status: 400 });
    }

    const setting = await prisma.siteSetting.upsert({
      where: { key },
      update: { valueTh: valueTh ?? null, valueEn: valueEn ?? null },
      create: { key, valueTh: valueTh ?? null, valueEn: valueEn ?? null },
    });

    // Revalidate all pages so layout picks up new settings
    revalidatePath("/", "layout");

    return NextResponse.json({ success: true, data: setting });
  } catch (error) {
    console.error("Settings PUT error:", error);
    return NextResponse.json({ success: false, error: "Failed to update setting" }, { status: 500 });
  }
}
