import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Returns the current user's subscriptionTier direct from DB (bypasses JWT cache).
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = Number((session.user as any).id);

    const rows = await prisma.$queryRaw<{ subscriptionTier: string }[]>`
      SELECT "subscriptionTier" FROM "User" WHERE id = ${userId} LIMIT 1
    `;

    const tier = rows[0]?.subscriptionTier ?? "STANDARD";
    return NextResponse.json({ success: true, tier });
  } catch (err: any) {
    return NextResponse.json({ success: true, tier: "STANDARD" }); // safe fallback
  }
}
