import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { ContractPdf, ContractPdfData, PdfChecklistItem } from "@/lib/contract-pdf";
import {
  FURNITURE_OPTIONS,
  APPLIANCE_OPTIONS,
  OTHER_ITEM_OPTIONS,
  parseContractItems,
  Bilingual,
} from "@/lib/contract-items";

export const runtime = "nodejs";
export const maxDuration = 60;

const TH_DIGITS_TO_TEXT: Record<number, string> = {
  0: "ศูนย์", 1: "หนึ่ง", 2: "สอง", 3: "สาม", 4: "สี่",
  5: "ห้า", 6: "หก", 7: "เจ็ด", 8: "แปด", 9: "เก้า",
};

// Convert number to Thai text reading (basic implementation up to billions)
function bahtText(num: number): string {
  if (num === 0) return "ศูนย์บาทถ้วน";

  const intPart = Math.floor(num);
  const intStr = String(intPart);
  const len = intStr.length;
  const places = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];

  const readChunk = (chunk: string): string => {
    let result = "";
    const chunkLen = chunk.length;
    for (let i = 0; i < chunkLen; i++) {
      const digit = parseInt(chunk[i], 10);
      const placeIdx = chunkLen - i - 1;
      if (digit === 0) continue;
      // Special cases
      if (placeIdx === 1 && digit === 1) {
        result += "สิบ"; // "สิบ" not "หนึ่งสิบ"
      } else if (placeIdx === 1 && digit === 2) {
        result += "ยี่สิบ";
      } else if (placeIdx === 0 && digit === 1 && chunkLen > 1) {
        result += "เอ็ด"; // "เอ็ด" not "หนึ่ง" at the unit place when there's a higher digit
      } else {
        result += TH_DIGITS_TO_TEXT[digit] + (places[placeIdx] || "");
      }
    }
    return result;
  };

  let result = "";
  if (len > 6) {
    const millions = intStr.slice(0, len - 6);
    const rest = intStr.slice(len - 6);
    result += readChunk(millions) + "ล้าน";
    if (rest && parseInt(rest, 10) > 0) result += readChunk(rest);
  } else {
    result += readChunk(intStr);
  }

  return result + "บาทถ้วน";
}

function fmtThaiDate(d: Date): string {
  const months = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
    "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
    "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function fmtEnDate(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// Build a full checklist of every catalog option, marking which ones the
// admin selected for this contract. The PDF prints all rows so the printed
// copy can be hand-amended; ticked rows include the agreed quantity.
function buildChecklist(
  json: string | null | undefined,
  options: Bilingual[]
): PdfChecklistItem[] {
  const selected = parseContractItems(json);
  return options.map((opt) => {
    const sel = selected.find((s) => s.key === opt.key);
    return {
      th: opt.th,
      en: opt.en,
      checked: !!sel,
      qty: sel?.qty,
    };
  });
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
  const contract = await prisma.contract.findUnique({
    where: { id: parseInt(id, 10) },
  });
  if (!contract) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  // react-pdf renders server-side and needs absolute URLs to fetch the ID
  // images. Vercel Blob already returns full https:// URLs, but local /uploads
  // paths must be prefixed with the request origin.
  const hdrs = await headers();
  const host = hdrs.get("host") || "";
  const proto =
    hdrs.get("x-forwarded-proto") ||
    (host.startsWith("localhost") ? "http" : "https");
  const toAbs = (u: string | null | undefined): string | null => {
    if (!u) return null;
    if (/^https?:\/\//i.test(u)) return u;
    if (!host) return null;
    return `${proto}://${host}${u.startsWith("/") ? "" : "/"}${u}`;
  };

  const data: ContractPdfData = {
    contractNumber: contract.contractNumber,
    contractDateTh: fmtThaiDate(contract.contractDate),
    contractDateEn: fmtEnDate(contract.contractDate),
    startDateTh: fmtThaiDate(contract.startDate),
    startDateEn: fmtEnDate(contract.startDate),
    endDateTh: fmtThaiDate(contract.endDate),
    endDateEn: fmtEnDate(contract.endDate),
    termMonths: contract.termMonths,

    lessorName: contract.lessorName,
    lessorIdCard: contract.lessorIdCard,
    lessorAddress: contract.lessorAddress,
    lessorPhone: contract.lessorPhone,

    lesseeName: contract.lesseeName,
    lesseeNationality: contract.lesseeNationality,
    lesseeIdCard: contract.lesseeIdCard,
    lesseeAddress: contract.lesseeAddress,
    lesseePhone: contract.lesseePhone,

    jointLesseeName: contract.jointLesseeName,
    jointLesseeNationality: contract.jointLesseeNationality,
    jointLesseeIdCard: contract.jointLesseeIdCard,
    jointLesseeAddress: contract.jointLesseeAddress,
    jointLesseePhone: contract.jointLesseePhone,

    projectName: contract.projectName,
    unitNumber: contract.unitNumber,
    buildingName: contract.buildingName,
    floorNumber: contract.floorNumber,
    propertyAddress: contract.propertyAddress,
    sizeSqm: contract.sizeSqm ? Number(contract.sizeSqm) : null,

    monthlyRent: Number(contract.monthlyRent),
    monthlyRentText: bahtText(Number(contract.monthlyRent)),
    paymentDay: contract.paymentDay,
    bankName: contract.bankName,
    bankBranch: contract.bankBranch,
    bankAccountName: contract.bankAccountName,
    bankAccountNumber: contract.bankAccountNumber,
    latePaymentFee: Number(contract.latePaymentFee),
    latePaymentFeeText: bahtText(Number(contract.latePaymentFee)),

    securityDeposit: Number(contract.securityDeposit),
    securityDepositText: bahtText(Number(contract.securityDeposit)),

    furnitureList: buildChecklist(contract.furnitureList, FURNITURE_OPTIONS),
    applianceList: buildChecklist(contract.applianceList, APPLIANCE_OPTIONS),
    otherItems: buildChecklist(contract.otherItems, OTHER_ITEM_OPTIONS),

    lessorIdImage: toAbs(contract.lessorIdImage),
    lesseeIdImage: toAbs(contract.lesseeIdImage),
    jointLesseeIdImage: toAbs(contract.jointLesseeIdImage),
  };

  try {
    const buffer = await renderToBuffer(<ContractPdf data={data} />);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${contract.contractNumber}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("PDF render error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "PDF render failed" },
      { status: 500 }
    );
  }
}
