/* eslint-disable jsx-a11y/alt-text */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
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
import {
  parseCustomClauses,
  parseClauseOverrides,
  applyOverrides,
  STANDARD_CLAUSES,
} from "@/lib/contract-clauses";

export const runtime = "nodejs";
export const maxDuration = 60;

const TH_DIGITS_TO_TEXT: Record<number, string> = {
  0: "ศูนย์", 1: "หนึ่ง", 2: "สอง", 3: "สาม", 4: "สี่",
  5: "ห้า", 6: "หก", 7: "เจ็ด", 8: "แปด", 9: "เก้า",
};

function bahtText(num: number): string {
  if (num === 0) return "ศูนย์บาทถ้วน";
  const intStr = String(Math.floor(num));
  const len = intStr.length;
  const places = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
  const readChunk = (chunk: string): string => {
    let result = "";
    const n = chunk.length;
    for (let i = 0; i < n; i++) {
      const d = parseInt(chunk[i], 10);
      const p = n - i - 1;
      if (d === 0) continue;
      if (p === 1 && d === 1) result += "สิบ";
      else if (p === 1 && d === 2) result += "ยี่สิบ";
      else if (p === 0 && d === 1 && n > 1) result += "เอ็ด";
      else result += TH_DIGITS_TO_TEXT[d] + (places[p] || "");
    }
    return result;
  };
  let result = "";
  if (len > 6) {
    result += readChunk(intStr.slice(0, len - 6)) + "ล้าน";
    const rest = intStr.slice(len - 6);
    if (parseInt(rest, 10) > 0) result += readChunk(rest);
  } else {
    result += readChunk(intStr);
  }
  return result + "บาทถ้วน";
}

function fmtThaiDate(d: Date): string {
  const months = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function fmtEnDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

function buildChecklist(json: string | null | undefined, options: Bilingual[]): PdfChecklistItem[] {
  const selected = parseContractItems(json);
  const catalogRows = options.map((opt) => {
    const sel = selected.find((s) => s.key === opt.key);
    return { th: opt.th, en: opt.en, checked: !!sel, qty: sel?.qty };
  });
  const catalogKeys = new Set(options.map((o) => o.key));
  const customRows: PdfChecklistItem[] = selected
    .filter((s) => !catalogKeys.has(s.key))
    .filter((s) => (s.th && s.th.trim() !== "") || (s.en && s.en.trim() !== ""))
    .map((s) => ({ th: (s.th || s.en || "").trim(), en: (s.en || s.th || "").trim(), checked: true, qty: s.qty }));
  return [...catalogRows, ...customRows];
}

// Public PDF endpoint — authenticated by sign token (lessor or lessee token).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const contract = await prisma.contract.findFirst({
    where: {
      OR: [
        { lessorSignToken: token },
        { lesseeSignToken: token },
        { jointLesseeSignToken: token },
      ],
    },
  });

  if (!contract) {
    return NextResponse.json({ success: false, error: "Invalid link" }, { status: 404 });
  }

  const hdrs = await headers();
  const host = hdrs.get("host") || "";
  const proto = hdrs.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
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
    lessorNameEn: contract.lessorNameEn,
    lessorNationality: contract.lessorNationality,
    lessorIdCard: contract.lessorIdCard,
    lessorAddress: contract.lessorAddress,
    lessorAddressEn: contract.lessorAddressEn,
    lessorPhone: contract.lessorPhone,
    lesseeName: contract.lesseeName,
    lesseeNameEn: contract.lesseeNameEn,
    lesseeNationality: contract.lesseeNationality,
    lesseeIdCard: contract.lesseeIdCard,
    lesseeAddress: contract.lesseeAddress,
    lesseeAddressEn: contract.lesseeAddressEn,
    lesseePhone: contract.lesseePhone,
    jointLesseeName: contract.jointLesseeName,
    jointLesseeNameEn: contract.jointLesseeNameEn,
    jointLesseeNationality: contract.jointLesseeNationality,
    jointLesseeIdCard: contract.jointLesseeIdCard,
    jointLesseeAddress: contract.jointLesseeAddress,
    jointLesseeAddressEn: contract.jointLesseeAddressEn,
    jointLesseePhone: contract.jointLesseePhone,
    projectName: contract.projectName,
    unitNumber: contract.unitNumber,
    buildingName: contract.buildingName,
    floorNumber: contract.floorNumber,
    propertyAddress: contract.propertyAddress,
    propertyAddressEn: contract.propertyAddressEn,
    sizeSqm: contract.sizeSqm ? Number(contract.sizeSqm) : null,
    monthlyRent: Number(contract.monthlyRent),
    monthlyRentText: bahtText(Number(contract.monthlyRent)),
    paymentDay: contract.paymentDay,
    bankName: contract.bankName,
    bankBranch: contract.bankBranch,
    bankBranchEn: contract.bankBranchEn,
    bankAccountName: contract.bankAccountName,
    bankAccountNameEn: contract.bankAccountNameEn,
    bankAccountNumber: contract.bankAccountNumber,
    latePaymentFee: Number(contract.latePaymentFee),
    latePaymentFeeText: bahtText(Number(contract.latePaymentFee)),
    securityDeposit: Number(contract.securityDeposit),
    securityDepositText: bahtText(Number(contract.securityDeposit)),
    furnitureList: buildChecklist(contract.furnitureList, FURNITURE_OPTIONS),
    applianceList: buildChecklist(contract.applianceList, APPLIANCE_OPTIONS),
    otherItems: buildChecklist(contract.otherItems, OTHER_ITEM_OPTIONS),
    furnitureNone: !!contract.furnitureNone,
    applianceNone: !!contract.applianceNone,
    otherItemsNone: !!contract.otherItemsNone,
    customClauses: parseCustomClauses(contract.customClauses),
    clauses: applyOverrides(STANDARD_CLAUSES, parseClauseOverrides(contract.clauseOverrides)),
    lessorIdImage: toAbs(contract.lessorIdImage),
    lesseeIdImage: toAbs(contract.lesseeIdImage),
    jointLesseeIdImage: toAbs(contract.jointLesseeIdImage),
    lessorSignature: contract.lessorSignature,
    lesseeSignature: contract.lesseeSignature,
    jointLesseeSignature: contract.jointLesseeSignature,
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "PDF render failed";
    console.error("Sign PDF render error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
