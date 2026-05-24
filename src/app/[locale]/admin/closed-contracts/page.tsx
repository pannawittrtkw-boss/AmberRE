"use client";

import { useState, useEffect } from "react";
import { Lock, AlertTriangle, Loader2, ChevronRight } from "lucide-react";
import Link from "next/link";

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

function daysLeft(iso: string | null | undefined) {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function DaysBadge({ iso }: { iso: string | null | undefined }) {
  const d = daysLeft(iso);
  if (d === null) return <span className="text-gray-400 text-xs">ไม่ระบุ</span>;
  if (d < 0)
    return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">หมดแล้ว {Math.abs(d)}ว</span>;
  if (d <= 45)
    return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">{d} วัน</span>;
  return <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">{d} วัน</span>;
}

function propertyLabel(p: any) {
  return [p.projectName, p.building && `ตึก ${p.building}`, p.floor && `ชั้น ${p.floor}`, p.estCode && `ห้อง ${p.estCode}`]
    .filter(Boolean).join("  ") || p.titleTh || `#${p.id}`;
}

export default function ClosedContractsPage({ params }: { params: Promise<{ locale: string }> }) {
  const [locale, setLocale] = useState("th");
  const [data, setData] = useState<{ count: number; list: any[]; expiringSoon: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "expiring">("all");

  useEffect(() => {
    params.then(({ locale: l }) => setLocale(l));
  }, [params]);

  useEffect(() => {
    fetch("/api/admin/closed-contracts")
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-600" /></div>;

  const list = data?.list || [];
  const expiringSoon = data?.expiringSoon || [];
  const displayed = activeTab === "expiring" ? expiringSoon : list;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
            {locale === "th" ? "Closed Contracts / สัญญาปิด" : "Closed Contracts"}
          </h1>
          <p className="text-gray-500 mt-1 text-xs sm:text-sm">
            {locale === "th"
              ? "ห้องที่ทำสัญญาปิดกับเจ้าของ — Amber Real Estate มีสิทธิ์เป็นผู้หาผู้เช่า/ผู้ซื้อแต่เพียงผู้เดียว"
              : "Properties with exclusive listing agreements"}
          </p>
        </div>
        <Link
          href={`/${locale}/admin/properties`}
          className="inline-flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium"
        >
          จัดการห้องพัก <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border shadow-sm p-5 flex items-center gap-4">
          <div className="bg-amber-500 p-3 rounded-lg">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500">สัญญาปิดทั้งหมด</p>
            <p className="text-3xl font-bold text-amber-700">{data?.count || 0} <span className="text-base font-normal text-gray-500">ห้อง</span></p>
          </div>
        </div>
        <div className={`bg-white rounded-xl border shadow-sm p-5 flex items-center gap-4 ${expiringSoon.length > 0 ? "border-yellow-300" : ""}`}>
          <div className={`p-3 rounded-lg ${expiringSoon.length > 0 ? "bg-yellow-400" : "bg-gray-200"}`}>
            <AlertTriangle className={`w-6 h-6 ${expiringSoon.length > 0 ? "text-white" : "text-gray-400"}`} />
          </div>
          <div>
            <p className="text-sm text-gray-500">ใกล้หมดสัญญา (ภายใน 45 วัน)</p>
            <p className={`text-3xl font-bold ${expiringSoon.length > 0 ? "text-yellow-600" : "text-gray-400"}`}>
              {expiringSoon.length} <span className="text-base font-normal text-gray-500">รายการ</span>
            </p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b mb-4">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "all" ? "border-amber-500 text-amber-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          ทั้งหมด ({list.length})
        </button>
        <button
          onClick={() => setActiveTab("expiring")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === "expiring" ? "border-yellow-500 text-yellow-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
        >
          ใกล้หมดสัญญา
          {expiringSoon.length > 0 && (
            <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {expiringSoon.length}
            </span>
          )}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {displayed.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            {activeTab === "expiring" ? "ไม่มีสัญญาปิดที่ใกล้หมดอายุ" : "ยังไม่มีสัญญาปิด"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">ห้อง</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">เจ้าของ</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">ประเภท</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">ราคา</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">ช่วงสัญญา</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">คงเหลือ</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((p: any) => {
                  const d = daysLeft(p.exclusiveEndDate);
                  const isExpiringSoon = d !== null && d >= 0 && d <= 45;
                  return (
                    <tr key={p.id} className={`border-b transition-colors ${isExpiringSoon ? "bg-yellow-50 hover:bg-yellow-100" : "hover:bg-amber-50"}`}>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-800">{propertyLabel(p)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-gray-700">{p.ownerName || "-"}</div>
                        {p.ownerPhone && <div className="text-xs text-gray-400">{p.ownerPhone}</div>}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {p.listingType === "RENT" ? "เช่า" : p.listingType === "SALE" ? "ขาย" : "เช่า&ขาย"}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {p.price ? `฿${Number(p.price).toLocaleString()}` : "-"}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600">
                        <div>{fmtDate(p.exclusiveStartDate)}</div>
                        <div className="text-gray-400">ถึง {fmtDate(p.exclusiveEndDate)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <DaysBadge iso={p.exclusiveEndDate} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
