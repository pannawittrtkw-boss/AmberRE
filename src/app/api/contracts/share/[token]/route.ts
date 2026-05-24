import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const contract = await prisma.contract.findUnique({
    where: { shareToken: token },
    select: {
      id: true,
      contractNumber: true,
      startDate: true,
      endDate: true,
      lessorName: true,
      lesseeName: true,
      projectName: true,
      unitNumber: true,
      monthlyRent: true,
      signedPdfUrl: true,
    },
  });

  if (!contract || !contract.signedPdfUrl) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: contract });
}
