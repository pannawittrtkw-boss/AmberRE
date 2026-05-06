"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, Download, Pencil, FileText } from "lucide-react";
import { getIntlLocale } from "@/lib/utils";

export default function ViewContractPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const [locale, setLocale] = useState("th");
  const [id, setId] = useState<string>("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(({ locale: l, id }) => {
      setLocale(l);
      setId(id);
      fetch(`/api/admin/contracts/${id}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setData(d.data);
        })
        .finally(() => setLoading(false));
    });
  }, [params]);

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );

  if (!data)
    return (
      <div className="text-center py-12 text-gray-400">
        {locale === "th" ? "ไม่พบสัญญา" : "Contract not found"}
      </div>
    );

  const intlLocale = getIntlLocale(locale);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6">
        <Link
          href={`/${locale}/admin/contracts`}
          className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-[#C8A951] self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          {locale === "th" ? "กลับ" : "Back"}
        </Link>
        <div className="flex gap-2">
          <Link
            href={`/${locale}/admin/contracts/${id}/edit`}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg text-sm hover:bg-gray-50"
          >
            <Pencil className="w-4 h-4" />
            {locale === "th" ? "แก้ไข" : "Edit"}
          </Link>
          <a
            href={`/api/admin/contracts/${id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#C8A951] hover:bg-[#B8993F] text-white rounded-lg text-sm font-semibold"
          >
            <Download className="w-4 h-4" />
            {locale === "th" ? "ดาวน์โหลด PDF" : "Download PDF"}
          </a>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4 sm:p-6 mb-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2 break-all">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-[#C8A951] shrink-0" />
              {data.contractNumber}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {data.projectName} #{data.unitNumber}
            </p>
          </div>
          <span
            className={`text-xs px-3 py-1 rounded-full font-medium ${
              data.status === "ACTIVE"
                ? "bg-green-100 text-green-700"
                : data.status === "DRAFT"
                ? "bg-gray-100 text-gray-700"
                : data.status === "EXPIRED"
                ? "bg-stone-100 text-stone-600"
                : "bg-red-100 text-red-700"
            }`}
          >
            {data.status}
          </span>
        </div>

        <Section title={locale === "th" ? "ข้อมูลสัญญา" : "Contract Info"}>
          <Row label={locale === "th" ? "วันที่ทำสัญญา" : "Contract Date"}>
            {new Date(data.contractDate).toLocaleDateString(intlLocale)}
          </Row>
          <Row label={locale === "th" ? "วันเริ่มสัญญา" : "Start"}>
            {new Date(data.startDate).toLocaleDateString(intlLocale)}
          </Row>
          <Row label={locale === "th" ? "วันสิ้นสุด" : "End"}>
            {new Date(data.endDate).toLocaleDateString(intlLocale)}
          </Row>
          <Row label={locale === "th" ? "ระยะเวลา" : "Term"}>
            {data.termMonths} {locale === "th" ? "เดือน" : "months"}
          </Row>
        </Section>

        <Section title={locale === "th" ? "ผู้ให้เช่า" : "Lessor"}>
          <Row label={locale === "th" ? "ชื่อ" : "Name"}>{data.lessorName}</Row>
          {data.lessorIdCard && <Row label="ID">{data.lessorIdCard}</Row>}
          {data.lessorPhone && (
            <Row label={locale === "th" ? "เบอร์โทร" : "Phone"}>{data.lessorPhone}</Row>
          )}
        </Section>

        <Section title={locale === "th" ? "ผู้เช่า" : "Lessee"}>
          <Row label={locale === "th" ? "ชื่อ" : "Name"}>{data.lesseeName}</Row>
          {data.lesseeNationality && (
            <Row label={locale === "th" ? "สัญชาติ" : "Nationality"}>{data.lesseeNationality}</Row>
          )}
          {data.lesseeIdCard && <Row label="ID/Passport">{data.lesseeIdCard}</Row>}
          {data.lesseePhone && (
            <Row label={locale === "th" ? "เบอร์โทร" : "Phone"}>{data.lesseePhone}</Row>
          )}
        </Section>

        <Section title={locale === "th" ? "ค่าเช่า" : "Rent"}>
          <Row label={locale === "th" ? "ค่าเช่า/เดือน" : "Monthly Rent"}>
            ฿{Number(data.monthlyRent).toLocaleString()}
          </Row>
          <Row label={locale === "th" ? "เงินประกัน" : "Deposit"}>
            ฿{Number(data.securityDeposit).toLocaleString()}
          </Row>
          <Row label={locale === "th" ? "ชำระทุกวันที่" : "Due day"}>{data.paymentDay}</Row>
          <Row label={locale === "th" ? "ค่าปรับ" : "Late fee"}>
            ฿{Number(data.latePaymentFee).toLocaleString()}
          </Row>
          {data.bankName && (
            <Row label={locale === "th" ? "ธนาคาร" : "Bank"}>
              {data.bankName} {data.bankAccountNumber && `— ${data.bankAccountNumber}`}
            </Row>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t py-4">
      <h3 className="font-semibold mb-2 text-sm uppercase tracking-wider text-gray-500">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex">
      <div className="w-40 text-sm text-gray-500">{label}</div>
      <div className="flex-1 text-sm font-medium">{children}</div>
    </div>
  );
}
