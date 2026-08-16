import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { CommissionPdf, CommissionPdfData } from "@/lib/commission-pdf";
import { getCommissionAgentSettings } from "@/lib/contract-commission-agent";

export const runtime = "nodejs";
export const maxDuration = 60;

function fmtThaiDate(d: Date): string {
  const months = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
    "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
    "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const contract = await prisma.contract.findUnique({ where: { id: parseInt(id, 10) } });
  if (!contract) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  const agent = await getCommissionAgentSettings();

  const data: CommissionPdfData = {
    contractDateTh: fmtThaiDate(contract.contractDate),
    startDateTh: fmtThaiDate(contract.startDate),
    endDateTh: fmtThaiDate(contract.endDate),

    projectName: contract.projectName,
    unitNumber: contract.unitNumber,
    buildingName: contract.buildingName,
    floorNumber: contract.floorNumber,
    propertyAddress: contract.propertyAddress,
    sizeSqm: contract.sizeSqm ? Number(contract.sizeSqm) : null,

    monthlyRentText: new Intl.NumberFormat("en-US").format(Number(contract.monthlyRent)),

    ownerName: contract.lessorName,
    ownerAddress: contract.lessorAddress,
    ownerIdCard: contract.lessorIdCard,
    ownerPhone: contract.lessorPhone,
    ownerIdImage: contract.lessorIdImage,
    ownerSignature: contract.commissionSignature,

    agentName: agent.agentName,
    agentAddress: agent.agentAddress,
    agentIdCard: agent.agentIdCard,
    agentPhone: agent.agentPhone,
    agentIdImage: agent.agentIdImage,
    agentSignature: agent.agentSignature,
  };

  try {
    const buffer = await renderToBuffer(<CommissionPdf data={data} />);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${contract.contractNumber}-commission.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("Commission PDF render error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "PDF render failed" },
      { status: 500 }
    );
  }
}
