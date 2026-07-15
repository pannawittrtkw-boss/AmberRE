import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { AccPdf, AccPdfData, parseAccLang, formatAccDate } from "@/lib/acc-pdf";
import React from "react";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const lang = parseAccLang(req.nextUrl.searchParams.get("lang"));
  const [receipt, company] = await Promise.all([
    prisma.accReceipt.findUnique({
      where: { id: parseInt(id, 10) },
      include: { customer: true, billingNote: true, invoice: true },
    }),
    prisma.accountingCompany.findFirst(),
  ]);
  if (!receipt) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  const items = Array.isArray(receipt.items) ? (receipt.items as any[]) : [];
  const refDoc = receipt.billingNote?.docNumber ?? receipt.invoice?.docNumber ?? undefined;

  const data: AccPdfData = {
    docType: "RECEIPT",
    docNumber: receipt.docNumber,
    date: formatAccDate(receipt.date, lang),
    refDocNumber: refDoc,
    companyName: company?.name ?? "",
    companyNameEn: company?.nameEn ?? undefined,
    companyAddress: company?.address ?? undefined,
    companyAddressEn: company?.addressEn ?? undefined,
    companyTaxId: company?.taxId ?? undefined,
    companyPhone: company?.phone ?? undefined,
    companyLogoUrl: company?.logoUrl ?? null,
    companySignatureUrl: company?.signatureUrl ?? null,
    companyAuthorizedName: company?.authorizedName ?? undefined,
    companyAuthorizedNameEn: company?.authorizedNameEn ?? undefined,
    customerName: receipt.customer.name,
    customerAddress: receipt.customer.address ?? undefined,
    customerTaxId: receipt.customer.taxId ?? undefined,
    customerPhone: receipt.customer.phone ?? undefined,
    customerEmail: receipt.customer.email ?? undefined,
    customerContactName: receipt.customer.contactName ?? undefined,
    items,
    subtotal: Number(receipt.subtotal),
    vatRate: Number(receipt.vatRate),
    vatAmount: Number(receipt.vatAmount),
    totalAmount: Number(receipt.totalAmount),
    paymentMethod: receipt.paymentMethod,
    note: receipt.note ?? undefined,
    lang,
  };

  try {
    const buffer = await renderToBuffer(<AccPdf data={data} />);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${receipt.docNumber}${lang !== "BOTH" ? "-" + lang : ""}.pdf"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "PDF render failed" }, { status: 500 });
  }
}
