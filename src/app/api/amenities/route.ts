import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const amenities = await prisma.amenity.findMany({ orderBy: { nameTh: "asc" } });
    return NextResponse.json({ success: true, data: amenities });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
