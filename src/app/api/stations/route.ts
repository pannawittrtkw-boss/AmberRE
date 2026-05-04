import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const stations = await prisma.bTSMRTStation.findMany({ orderBy: { line: "asc" } });
    return NextResponse.json({ success: true, data: stations });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
