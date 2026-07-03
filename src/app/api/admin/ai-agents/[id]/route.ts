import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ success: false, error: "Invalid body" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.position !== undefined) data.position = String(body.position).trim();
  if (body.duties !== undefined) data.duties = String(body.duties).trim();
  if (body.icon !== undefined) data.icon = String(body.icon).trim();
  if (body.color !== undefined) data.color = String(body.color).trim();
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
  if (body.actionType !== undefined) data.actionType = String(body.actionType).trim();
  if (body.appearance !== undefined) data.appearance = body.appearance ? JSON.stringify(body.appearance) : null;

  const agent = await prisma.aiAgent.update({
    where: { id: parseInt(id, 10) },
    data,
  });
  return NextResponse.json({ success: true, data: agent });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.aiAgent.delete({ where: { id: parseInt(id, 10) } });
  return NextResponse.json({ success: true });
}
