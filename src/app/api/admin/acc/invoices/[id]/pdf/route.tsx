import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { AccPdf, AccPdfData, parseAccLang, formatAccDate, formatCreditTerm } from "@/lib/acc-pdf";
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
  const [invoice, company] = await Promise.all([
    prisma.accInvoice.findUnique({
      where: { id: parseInt(id, 10) },
      include: { customer: true },
    }),
    prisma.accountingCompany.findFirst(),
  ]);
  if (!invoice) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  const items = Array.isArray(invoice.items) ? (invoice.items as any[]) : [];
  const data: AccPdfData = {
    docType: "INVOICE",
    docNumber: invoice.docNumber,
    date: formatAccDate(invoice.date, lang),
    dueDate: invoice.dueDate ? formatAccDate(invoice.dueDate, lang) : undefined,
    creditTermText: formatCreditTerm(invoice.creditTerm, lang),
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
    companyBankName: company?.bankName ?? undefined,
    companyBankNameEn: company?.bankNameEn ?? undefined,
    companyBankAccountNumber: company?.bankAccountNumber ?? undefined,
    companyBankAccountName: company?.bankAccountName ?? undefined,
    companyBankAccountNameEn: company?.bankAccountNameEn ?? undefined,
    companySwiftCode: company?.swiftCode ?? undefined,
    companyBankBranchName: company?.bankBranchName ?? undefined,
    companyBankAddress: company?.bankAddress ?? undefined,
    companyBankAddressEn: company?.bankAddressEn ?? undefined,
    companyCurrency: company?.currency ?? undefined,
    customerName: invoice.customer.name,
    customerAddress: invoice.customer.address ?? undefined,
    customerTaxId: invoice.customer.taxId ?? undefined,
    customerPhone: invoice.customer.phone ?? undefined,
    customerEmail: invoice.customer.email ?? undefined,
    customerContactName: invoice.customer.contactName ?? undefined,
    items,
    subtotal: Number(invoice.subtotal),
    vatRate: Number(invoice.vatRate),
    vatAmount: Number(invoice.vatAmount),
    totalAmount: Number(invoice.totalAmount),
    note: invoice.note ?? undefined,
    lang,
  };

  try {
    const buffer = await renderToBuffer(<AccPdf data={data} />);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${invoice.docNumber}${lang !== "BOTH" ? "-" + lang : ""}.pdf"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "PDF render failed" }, { status: 500 });
  }
}
