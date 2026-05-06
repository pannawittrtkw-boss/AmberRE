"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, FileText, Plus, Eye, Pencil, Trash2, Download } from "lucide-react";
import { getIntlLocale } from "@/lib/utils";

type Contract = {
  id: number;
  contractNumber: string;
  contractDate: string;
  startDate: string;
  endDate: string;
  lessorName: string;
  lesseeName: string;
  projectName: string;
  unitNumber: string;
  monthlyRent: string;
  status: string;
  property?: { id: number; titleTh: string; projectName: string | null } | null;
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  ACTIVE: "bg-green-100 text-green-700",
  EXPIRED: "bg-stone-100 text-stone-600",
  TERMINATED: "bg-red-100 text-red-700",
};

export default function AdminContractsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState("th");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(({ locale: l }) => setLocale(l));
  }, [params]);

  const refresh = async () => {
    const res = await fetch("/api/admin/contracts");
    const data = await res.json();
    if (data.success) setContracts(data.data);
  };

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const handleDelete = async (c: Contract) => {
    if (!confirm(locale === "th" ? `ลบสัญญา ${c.contractNumber}?` : `Delete ${c.contractNumber}?`)) return;
    await fetch(`/api/admin/contracts/${c.id}`, { method: "DELETE" });
    await refresh();
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            {locale === "th" ? "สัญญาเช่า" : "Rental Contracts"}
          </h1>
          <p className="text-gray-500 mt-1 text-xs sm:text-sm">
            {locale === "th"
              ? "สร้างและจัดการสัญญาเช่าในรูปแบบ PDF"
              : "Create and manage rental contracts as PDF"}
          </p>
        </div>
        <Link
          href={`/${locale}/admin/contracts/new`}
          className="inline-flex items-center justify-center gap-2 bg-[#C8A951] text-white px-4 py-2.5 rounded-lg hover:bg-[#B8993F] text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          {locale === "th" ? "สร้างสัญญาใหม่" : "New Contract"}
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4">เลขที่</th>
                <th className="text-left py-3 px-4">{locale === "th" ? "ทรัพย์" : "Property"}</th>
                <th className="text-left py-3 px-4">{locale === "th" ? "ผู้เช่า" : "Lessee"}</th>
                <th className="text-left py-3 px-4">{locale === "th" ? "ระยะเวลา" : "Period"}</th>
                <th className="text-right py-3 px-4">{locale === "th" ? "ค่าเช่า/เดือน" : "Rent"}</th>
                <th className="text-center py-3 px-4">{locale === "th" ? "สถานะ" : "Status"}</th>
                <th className="text-right py-3 px-4">{locale === "th" ? "จัดการ" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {contracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    {locale === "th" ? "ยังไม่มีสัญญา" : "No contracts yet"}
                  </td>
                </tr>
              ) : (
                contracts.map((c) => (
                  <tr key={c.id} className="border-t hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-xs">{c.contractNumber}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{c.projectName}</div>
                      <div className="text-xs text-gray-500">#{c.unitNumber}</div>
                    </td>
                    <td className="py-3 px-4">{c.lesseeName}</td>
                    <td className="py-3 px-4 text-xs">
                      {new Date(c.startDate).toLocaleDateString(getIntlLocale(locale))} →{" "}
                      {new Date(c.endDate).toLocaleDateString(getIntlLocale(locale))}
                    </td>
                    <td className="py-3 px-4 text-right">
                      ฿{Number(c.monthlyRent).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          STATUS_COLORS[c.status] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`/api/admin/contracts/${c.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={locale === "th" ? "ดาวน์โหลด PDF" : "Download PDF"}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <Link
                          href={`/${locale}/admin/contracts/${c.id}`}
                          title={locale === "th" ? "ดู" : "View"}
                          className="p-1.5 text-stone-600 hover:bg-stone-50 rounded"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/${locale}/admin/contracts/${c.id}/edit`}
                          title={locale === "th" ? "แก้ไข" : "Edit"}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(c)}
                          title={locale === "th" ? "ลบ" : "Delete"}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
