import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { ContractPdf, ContractPdfData, PdfChecklistItem } from "@/lib/contract-pdf";
import { FURNITURE_OPTIONS, APPLIANCE_OPTIONS, OTHER_ITEM_OPTIONS, Bilingual } from "@/lib/contract-items";
import {
  parseCustomClauses,
  parseClauseOverrides,
  applyOverrides,
  STANDARD_CLAUSES,
  DEFAULT_CLAUSES_SETTING_KEY,
  CLAUSE_OVERRIDES_SETTING_KEY,
  CLAUSE_BASELINE_SETTING_KEY,
} from "@/lib/contract-clauses";
import { getWitnessSettings } from "@/lib/contract-witnesses";

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
      const digit = parseInt(chunk[i], 10);
      const placeIdx = n - i - 1;
      if (digit === 0) continue;
      if (placeIdx === 1 && digit === 1) result += "สิบ";
      else if (placeIdx === 1 && digit === 2) result += "ยี่สิบ";
      else if (placeIdx === 0 && digit === 1 && n > 1) result += "เอ็ด";
      else result += TH_DIGITS_TO_TEXT[digit] + (places[placeIdx] || "");
    }
    return result;
  };
  let result = "";
  if (len > 6) {
    result += readChunk(intStr.slice(0, len - 6)) + "ล้าน";
    const rest = intStr.slice(len - 6);
    if (rest && parseInt(rest, 10) > 0) result += readChunk(rest);
  } else {
    result += readChunk(intStr);
  }
  return result + "บาทถ้วน";
}

function fmtThaiDate(d: Date): string {
  const months = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function fmtEnDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

function buildChecklist(selectedKeys: string[], options: Bilingual[]): PdfChecklistItem[] {
  return options.map((opt) => ({
    th: opt.th,
    en: opt.en,
    checked: selectedKeys.includes(opt.key),
    qty: selectedKeys.includes(opt.key) ? 1 : undefined,
  }));
}

// A handful of plausible example items so the preview's furniture/appliance
// tables look like a filled-in contract, not an empty catalog.
const SAMPLE_FURNITURE_KEYS = ["bed", "mattress", "wardrobe", "sofa", "diningTable", "chairs"];
const SAMPLE_APPLIANCE_KEYS = ["airConditioner", "tv", "refrigerator", "washingMachine", "waterHeater"];
const SAMPLE_OTHER_KEYS = ["roomKey", "roomKeycard"];

// Preview a sample-data contract through the EXACT same ContractPdf
// renderer real contracts use (with a "SAMPLE" watermark stamped on),
// using the current site-wide template (standard clauses + saved
// baseline/override layers + appended clauses) so staff can send a
// customer something that reads exactly like a real contract will, before
// one is actually drawn up.
// Public — no auth. This renders a sample contract with fabricated
// lessor/lessee/property data and the site's live template text, meant to
// be sent directly to a prospective customer to read before any real
// contract exists, so it must be openable without an admin login. Witness
// *signatures* are still stripped out below even though the rest of this
// payload is public, since those are the same images used on binding
// contracts and shouldn't be exposed to anyone with the link.
export async function GET(_req: NextRequest) {
  const [appendedSetting, overridesSetting, baselineSetting, witnesses, company] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { key: DEFAULT_CLAUSES_SETTING_KEY } }),
    prisma.siteSetting.findUnique({ where: { key: CLAUSE_OVERRIDES_SETTING_KEY } }),
    prisma.siteSetting.findUnique({ where: { key: CLAUSE_BASELINE_SETTING_KEY } }),
    getWitnessSettings(),
    prisma.accountingCompany.findFirst(),
  ]);

  const baseline = parseClauseOverrides(baselineSetting?.valueTh);
  const overrides = parseClauseOverrides(overridesSetting?.valueTh);
  const appendedClauses = parseCustomClauses(appendedSetting?.valueTh);

  const today = new Date();
  const oneYearLater = new Date(today);
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

  const monthlyRent = 15000;
  const latePaymentFee = 500;
  const securityDeposit = 30000;

  const data: ContractPdfData = {
    companyName: company?.name ?? null,
    companyAddress: company?.address ?? null,
    companyTaxId: company?.taxId ?? null,
    companyPhone: company?.phone ?? null,
    companyLogoUrl: company?.logoUrl ?? null,

    contractNumber: "SAMPLE-0000",
    contractDateTh: fmtThaiDate(today),
    contractDateEn: fmtEnDate(today),
    startDateTh: fmtThaiDate(today),
    startDateEn: fmtEnDate(today),
    endDateTh: fmtThaiDate(oneYearLater),
    endDateEn: fmtEnDate(oneYearLater),
    termMonths: 12,

    lessorName: "สมชาย ใจดี (ตัวอย่าง)",
    lessorNameEn: "Somchai Jaidee (Sample)",
    lessorNationality: "ไทย",
    lessorIdCard: "1-1111-11111-11-1",
    lessorAddress: "123 ถนนตัวอย่าง แขวงตัวอย่าง เขตตัวอย่าง กรุงเทพมหานคร 10110",
    lessorAddressEn: "123 Example Road, Example Sub-district, Example District, Bangkok 10110",
    lessorPhone: "081-111-1111",

    lesseeName: "สมหญิง รักเรียน (ตัวอย่าง)",
    lesseeNameEn: "Somying Rakrian (Sample)",
    lesseeNationality: "ไทย",
    lesseeIdCard: "2-2222-22222-22-2",
    lesseeAddress: "456 ถนนสมมติ แขวงสมมติ เขตสมมติ กรุงเทพมหานคร 10220",
    lesseeAddressEn: "456 Sample Road, Sample Sub-district, Sample District, Bangkok 10220",
    lesseePhone: "082-222-2222",

    projectName: "ตัวอย่างคอนโด (Example Condo)",
    unitNumber: "999",
    buildingName: "A",
    floorNumber: "9",
    propertyAddress: "999/99 ถนนตัวอย่าง แขวงตัวอย่าง เขตตัวอย่าง กรุงเทพมหานคร 10110",
    propertyAddressEn: "999/99 Example Road, Example Sub-district, Example District, Bangkok 10110",
    sizeSqm: 30,

    monthlyRent,
    monthlyRentText: bahtText(monthlyRent),
    paymentDay: 5,
    bankName: "ธนาคารตัวอย่าง",
    bankBranch: "สาขาตัวอย่าง",
    bankBranchEn: "Example Branch",
    bankAccountName: "สมชาย ใจดี",
    bankAccountNameEn: "Somchai Jaidee",
    bankAccountNumber: "123-4-56789-0",
    latePaymentFee,
    latePaymentFeeText: bahtText(latePaymentFee),

    securityDeposit,
    securityDepositText: bahtText(securityDeposit),

    furnitureList: buildChecklist(SAMPLE_FURNITURE_KEYS, FURNITURE_OPTIONS),
    applianceList: buildChecklist(SAMPLE_APPLIANCE_KEYS, APPLIANCE_OPTIONS),
    otherItems: buildChecklist(SAMPLE_OTHER_KEYS, OTHER_ITEM_OPTIONS),

    customClauses: appendedClauses,
    // Live site-wide template: STANDARD_CLAUSES + saved baseline + saved
    // overrides — reflects whatever's currently saved on this page, not
    // any particular contract's frozen snapshot.
    clauses: applyOverrides(STANDARD_CLAUSES, baseline, overrides),
    documentLanguage: "BOTH",
    showBranding: true,

    lessorIdImage: null,
    lesseeIdImage: null,
    jointLesseeIdImage: null,
    lessorSignature: null,
    lesseeSignature: null,
    jointLesseeSignature: null,

    ...witnesses,
    // Strip the real witness signature images — this route is public, and
    // those signatures are the same ones used on binding contracts.
    witness1Signature: null,
    witness2Signature: null,

    sampleWatermarkText: "ตัวอย่าง / SAMPLE",
  };

  try {
    const buffer = await renderToBuffer(<ContractPdf data={data} />);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="sample-contract-preview.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("Contract template preview PDF render error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "PDF render failed" },
      { status: 500 }
    );
  }
}
