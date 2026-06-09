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
  const customers = await prisma.accCustomer.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ success: true, data: customers });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { name, address, taxId, phone, email, contactName } = body;
  if (!name) return NextResponse.json({ success: false, error: "name required" }, { status: 400 });
  const customer = await prisma.accCustomer.create({
    data: { name, address, taxId, phone, email, contactName },
  });
  return NextResponse.json({ success: true, data: customer }, { status: 201 });
}
