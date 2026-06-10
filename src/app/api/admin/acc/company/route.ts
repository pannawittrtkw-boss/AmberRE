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
  const company = await prisma.accountingCompany.findFirst();
  return NextResponse.json({ success: true, data: company ?? {} });
}

export async function PUT(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { name, address, taxId, phone, logoUrl, signatureUrl, authorizedName,
          bankName, bankNameEn, bankAccountNumber, bankAccountName, bankAccountNameEn } = body;
  const company = await prisma.accountingCompany.upsert({
    where: { id: 1 },
    update: { name, address, taxId, phone, logoUrl, signatureUrl, authorizedName,
              bankName, bankNameEn, bankAccountNumber, bankAccountName, bankAccountNameEn },
    create: { id: 1, name: name || "", address, taxId, phone, logoUrl, signatureUrl, authorizedName,
              bankName, bankNameEn, bankAccountNumber, bankAccountName, bankAccountNameEn },
  });
  return NextResponse.json({ success: true, data: company });
}
