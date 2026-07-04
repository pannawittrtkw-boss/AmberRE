import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  const agents = await prisma.aiAgent.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({ success: true, data: agents });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.position || !body?.duties) {
    return NextResponse.json({ success: false, error: "name, position, duties required" }, { status: 400 });
  }
  const agent = await prisma.aiAgent.create({
    data: {
      name: String(body.name).trim(),
      position: String(body.position).trim(),
      duties: String(body.duties).trim(),
      icon: body.icon ? String(body.icon).trim() : "🤖",
      color: body.color ? String(body.color).trim() : "#6366f1",
      isActive: body.isActive !== false,
      actionType: body.actionType ? String(body.actionType).trim() : "NONE",
      appearance: body.appearance
        ? (typeof body.appearance === "string" ? body.appearance : JSON.stringify(body.appearance))
        : null,
    },
  });
  return NextResponse.json({ success: true, data: agent }, { status: 201 });
}
