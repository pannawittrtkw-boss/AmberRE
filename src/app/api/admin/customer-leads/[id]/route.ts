import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "CO_AGENT"].includes((session.user as any).role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const leadId = parseInt(id);

  try {
    const body = await req.json();
    const {
      name, phone, lineId, facebook, projectName,
      province, district, subdistrict, btsStation,
      budgetMin, budgetMax, bedrooms, note, status,
    } = body;

    const lead = await prisma.customerLead.update({
      where: { id: leadId },
      data: {
        name: name !== undefined ? (name || null) : undefined,
        phone: phone !== undefined ? (phone || null) : undefined,
        lineId: lineId !== undefined ? (lineId || null) : undefined,
        facebook: facebook !== undefined ? (facebook || null) : undefined,
        projectName: projectName !== undefined ? (projectName || null) : undefined,
        province: province !== undefined ? (province || null) : undefined,
        district: district !== undefined ? (district || null) : undefined,
        subdistrict: subdistrict !== undefined ? (subdistrict || null) : undefined,
        btsStation: btsStation !== undefined ? (btsStation || null) : undefined,
        budgetMin: budgetMin !== undefined ? (budgetMin ? parseFloat(budgetMin) : null) : undefined,
        budgetMax: budgetMax !== undefined ? (budgetMax ? parseFloat(budgetMax) : null) : undefined,
        bedrooms: bedrooms !== undefined ? (bedrooms ? parseInt(bedrooms) : null) : undefined,
        note: note !== undefined ? (note || null) : undefined,
        status: status || undefined,
      },
    });

    return NextResponse.json({ success: true, data: lead });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "CO_AGENT"].includes((session.user as any).role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const leadId = parseInt(id);

  try {
    await prisma.customerLead.delete({ where: { id: leadId } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
