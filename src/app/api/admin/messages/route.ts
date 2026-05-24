import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "ADMIN" && role !== "CO_AGENT") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const [messages, unreadCount] = await Promise.all([
    prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.contactMessage.count({ where: { isRead: false } }),
  ]);

  return NextResponse.json({ success: true, data: { messages, unreadCount } });
}
