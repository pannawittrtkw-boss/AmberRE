import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { BookingPdf, BookingPdfData } from "@/lib/booking-pdf";

export const runtime = "nodejs";
export const maxDuration = 60;

const TH_DIGITS: Record<number, string> = {
  0: "ศูนย์", 1: "หนึ่ง", 2: "สอง", 3: "สาม", 4: "สี่",
  5: "ห้า", 6: "หก", 7: "เจ็ด", 8: "แปด", 9: "เก้า",
};

function bahtText(num: number): string {
  if (num === 0) return "ศูนย์บาทถ้วน";
  const str = String(Math.floor(Math.abs(num)));
  const len = str.length;
  const places = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
  const readChunk = (chunk: string): string => {
    let result = "";
    const n = chunk.length;
    for (let i = 0; i < n; i++) {
      const d = parseInt(chunk[i], 10);
      const place = n - i - 1;
      if (d === 0) continue;
      if (place === 1 && d === 1) result += "สิบ";
      else if (place === 1 && d === 2) result += "ยี่สิบ";
      else if (place === 0 && d === 1 && n > 1) result += "เอ็ด";
      else result += TH_DIGITS[d] + (places[place] || "");
    }
    return result;
  };
  let result = "";
  if (len > 6) {
    result += readChunk(str.slice(0, len - 6)) + "ล้าน";
    const rest = str.slice(len - 6);
    if (rest && parseInt(rest, 10) > 0) result += readChunk(rest);
  } else {
    result += readChunk(str);
  }
  return result + "บาทถ้วน";
}

const TH_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

function fmtDate(d: Date | null): string | null {
  if (!d) return null;
  const date = new Date(d);
  return `${date.getDate()} ${TH_MONTHS[date.getMonth()]} ${date.getFullYear() + 543}`;
}

function fmtDateTime(d: Date | null): string | null {
  if (!d) return null;
  const date = new Date(d);
  return `${fmtDate(date)} ${date.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}`;
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
  const [booking, company] = await Promise.all([
    prisma.booking.findUnique({ where: { id: parseInt(id, 10) } }),
    prisma.accountingCompany.findFirst(),
  ]);
  if (!booking) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }

  const data: BookingPdfData = {
    docNumber: booking.docNumber,
    date: fmtDate(booking.date) || "",

    companyName: company?.name ?? null,

    projectName: booking.projectName,
    unitNumber: booking.unitNumber,
    propertyAddress: booking.propertyAddress,

    ownerName: booking.ownerName,
    ownerIdCard: booking.ownerIdCard,
    ownerAddress: booking.ownerAddress,
    ownerPhone: booking.ownerPhone,
    ownerIdCardImage: booking.ownerIdCardImage,
    ownerBankName: booking.ownerBankName,
    ownerBankAccountNumber: booking.ownerBankAccountNumber,
    ownerBankAccountName: booking.ownerBankAccountName,
    ownerSignature: booking.ownerSignature,
    signedAtText: fmtDateTime(booking.signedAt),

    tenantName: booking.tenantName,
    tenantIdCard: booking.tenantIdCard,
    tenantAddress: booking.tenantAddress,
    tenantPhone: booking.tenantPhone,
    tenantIdCardImage: booking.tenantIdCardImage,

    depositAmount: Number(booking.depositAmount),
    depositAmountText: bahtText(Number(booking.depositAmount)),
    monthlyRent: booking.monthlyRent ? Number(booking.monthlyRent) : null,
    leaseTermMonths: booking.leaseTermMonths,
    depositDate: fmtDate(booking.depositDate),
    appointmentDate: fmtDate(booking.appointmentDate),
    moveInDate: fmtDate(booking.moveInDate),

    transferSlipImage: booking.transferSlipImage,

    issuerName: booking.issuerName,
    witnessName: booking.witnessName,
  };

  try {
    const buffer = await renderToBuffer(<BookingPdf data={data} />);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${booking.docNumber}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("Booking PDF render error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "PDF render failed" },
      { status: 500 }
    );
  }
}
