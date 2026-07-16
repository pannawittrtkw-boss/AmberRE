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
  const [note, company] = await Promise.all([
    prisma.accBillingNote.findUnique({
      where: { id: parseInt(id, 10) },
      include: { customer: true, invoice: true },
    }),
    prisma.accountingCompany.findFirst(),
  ]);
  if (!note) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  const items = Array.isArray(note.items) ? (note.items as any[]) : [];
  const data: AccPdfData = {
    docType: "BILLING_NOTE",
    docNumber: note.docNumber,
    date: formatAccDate(note.date, lang),
    dueDate: note.dueDate ? formatAccDate(note.dueDate, lang) : undefined,
    refDocNumber: note.invoice?.docNumber ?? undefined,
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
    companyCurrency: company?.currency ?? undefined,
    customerName: note.customer.name,
    customerAddress: note.customer.address ?? undefined,
    customerTaxId: note.customer.taxId ?? undefined,
    customerPhone: note.customer.phone ?? undefined,
    customerEmail: note.customer.email ?? undefined,
    customerContactName: note.customer.contactName ?? undefined,
    items,
    subtotal: Number(note.subtotal),
    vatRate: Number(note.vatRate),
    vatAmount: Number(note.vatAmount),
    totalAmount: Number(note.totalAmount),
    note: note.note ?? undefined,
    lang,
  };

  try {
    const buffer = await renderToBuffer(<AccPdf data={data} />);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${note.docNumber}${lang !== "BOTH" ? "-" + lang : ""}.pdf"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "PDF render failed" }, { status: 500 });
  }
}
