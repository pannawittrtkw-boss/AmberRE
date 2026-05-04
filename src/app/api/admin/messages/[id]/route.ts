import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const messageId = parseInt(id, 10);
  if (Number.isNaN(messageId)) {
    return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
  }

  const body = await req.json();
  const { isRead } = body;

  const updated = await prisma.contactMessage.update({
    where: { id: messageId },
    data: { isRead: isRead ?? true },
  });

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const messageId = parseInt(id, 10);
  if (Number.isNaN(messageId)) {
    return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
  }

  await prisma.contactMessage.delete({ where: { id: messageId } });
  return NextResponse.json({ success: true });
}
