import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "CO_AGENT"].includes((session.user as any).role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const leads = await prisma.customerLead.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return NextResponse.json({ success: true, data: leads });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "CO_AGENT"].includes((session.user as any).role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      name, phone, lineId, facebook, projectName,
      province, district, subdistrict, btsStation,
      budgetMin, budgetMax, bedrooms, note, status,
    } = body;

    const lead = await prisma.customerLead.create({
      data: {
        name: name || null,
        phone: phone || null,
        lineId: lineId || null,
        facebook: facebook || null,
        projectName: projectName || null,
        province: province || null,
        district: district || null,
        subdistrict: subdistrict || null,
        btsStation: btsStation || null,
        budgetMin: budgetMin ? parseFloat(budgetMin) : null,
        budgetMax: budgetMax ? parseFloat(budgetMax) : null,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        note: note || null,
        status: status || "ACTIVE",
        createdById: parseInt((session.user as any).id) || null,
      },
    });

    return NextResponse.json({ success: true, data: lead });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
