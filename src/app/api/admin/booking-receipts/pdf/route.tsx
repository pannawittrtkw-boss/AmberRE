import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { BookingReceiptPdf, BookingReceiptData } from "@/lib/booking-receipt-pdf";

export const runtime = "nodejs";
export const maxDuration = 60;

const THAI_DIGITS: Record<number, string> = {
  0: "ศูนย์", 1: "หนึ่ง", 2: "สอง", 3: "สาม", 4: "สี่",
  5: "ห้า", 6: "หก", 7: "เจ็ด", 8: "แปด", 9: "เก้า",
};

function bahtText(num: number): string {
  if (num === 0) return "ศูนย์บาทถ้วน";
  const intPart = Math.floor(Math.abs(num));
  const str = String(intPart);
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
      else result += THAI_DIGITS[d] + (places[place] || "");
    }
    return result;
  };

  let result = "";
  if (len > 6) {
    const millions = str.slice(0, len - 6);
    const rest = str.slice(len - 6);
    result += readChunk(millions) + "ล้าน";
    if (rest && parseInt(rest, 10) > 0) result += readChunk(rest);
  } else {
    result += readChunk(str);
  }
  return result + "บาทถ้วน";
}

const TH_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
  "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
  "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

function fmtThaiDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return `${d.getDate()} ${TH_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function fmtEnDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

function fmtDate(iso: string): string {
  return `${fmtThaiDate(iso)} / ${fmtEnDate(iso)}`;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  let body: {
    docNumber?: string;
    date?: string;
    ownerName?: string;
    ownerPhone?: string;
    tenantName?: string;
    tenantPhone?: string;
    agentPhone?: string;
    unitNumber?: string;
    depositAmount?: number;
    moveInDate?: string;
    ownerIdImage?: string | null;
    tenantIdImage?: string | null;
    transferSlipImage?: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const depositAmount = Number(body.depositAmount) || 0;

  const data: BookingReceiptData = {
    docNumber: body.docNumber || "",
    date: body.date ? fmtDate(body.date) : "",
    ownerName: body.ownerName || "",
    ownerPhone: body.ownerPhone || "",
    tenantName: body.tenantName || "",
    tenantPhone: body.tenantPhone || "",
    agentPhone: body.agentPhone || "",
    unitNumber: body.unitNumber || "",
    depositAmount,
    depositAmountText: bahtText(depositAmount),
    moveInDate: body.moveInDate ? fmtDate(body.moveInDate) : "",
    ownerIdImage: body.ownerIdImage || null,
    tenantIdImage: body.tenantIdImage || null,
    transferSlipImage: body.transferSlipImage || null,
  };

  try {
    const buffer = await renderToBuffer(<BookingReceiptPdf data={data} />);
    const filename = `receipt-${data.docNumber || "booking"}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error("Booking receipt PDF error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "PDF render failed" },
      { status: 500 }
    );
  }
}
