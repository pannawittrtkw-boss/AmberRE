import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Public read-only endpoint for site settings.
 * Optionally filter by ?keys=key1,key2
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const keysParam = searchParams.get("keys");
    const where = keysParam
      ? { key: { in: keysParam.split(",").filter(Boolean) } }
      : undefined;

    const settings = await prisma.siteSetting.findMany({ where });
    const data: Record<string, string | null> = {};
    for (const s of settings) {
      data[s.key] = s.valueTh;
    }
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
