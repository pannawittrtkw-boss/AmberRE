"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Loader2, RefreshCw, Users, Home, Wallet, PiggyBank, Clock, CalendarRange, ChevronRight } from "lucide-react";
import { avatarColor, initials } from "@/lib/avatar";

interface Row {
  agentId: number;
  name: string;
  selectedMonth: {
    monthKey: string;
    closedCount: number;
    revenue: number;
    tierPercent: number | null;
    earnedCommission: number;
    paidCommission: number;
    pendingCommission: number;
  };
  allTimeClosedCount: number;
  allTimeEarned: number;
  allTimePaid: number;
  allTimePending: number;
}

interface Overview {
  monthKey: string;
  rows: Row[];
  totals: {
    closedCount: number;
    revenue: number;
    earnedCommission: number;
    allTimeClosedCount: number;
    allTimeEarned: number;
    allTimePaid: number;
    allTimePending: number;
  };
}

function fmtMoney(n: number) {
  return n.toLocaleString("th-TH", { maximumFractionDigits: 0 });
}

function fmtMonthLabel(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("th-TH", { month: "long", year: "numeric" });
}

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function SummaryCard({
  icon,
  value,
  label,
  accent,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl mb-4 ${accent}`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-0.5">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}


export default function CommissionOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "th";
  const [month, setMonth] = useState(currentMonthKey());
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (m: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/commission-overview?month=${m}`);
      const d = await res.json();
      if (!d.success) throw new Error(d.error || "Load failed");
      setData(d.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(month); }, [month, fetchData]);

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ภาพรวมค่าคอมมิชชั่น Agent</h1>
          <p className="text-sm text-gray-500 mt-0.5">จำนวนทรัพย์ที่ปิดได้ ยอดค่าคอม และ tier ของแต่ละ Agent รายเดือน</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-1.5 shadow-sm">
          <CalendarRange className="w-4 h-4 text-gray-400 ml-1.5" />
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="text-sm outline-none bg-transparent"
          />
          <button
            onClick={() => fetchData(month)}
            disabled={loading}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#C8A951]" />
        </div>
      ) : data ? (
        <>
          {/* Totals for the selected month */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <SummaryCard
              icon={<Users className="w-5 h-5 text-gray-500" />}
              accent="bg-gray-100"
              value={String(data.rows.length)}
              label="Agent ทั้งหมด"
            />
            <SummaryCard
              icon={<Home className="w-5 h-5 text-indigo-600" />}
              accent="bg-indigo-50"
              value={String(data.totals.closedCount)}
              label="ทรัพย์ที่ปิดได้เดือนนี้"
            />
            <SummaryCard
              icon={<Wallet className="w-5 h-5 text-blue-600" />}
              accent="bg-blue-50"
              value={`฿${fmtMoney(data.totals.revenue)}`}
              label="ยอดค่าคอมรวมเดือนนี้"
            />
            <SummaryCard
              icon={<PiggyBank className="w-5 h-5 text-emerald-600" />}
              accent="bg-emerald-50"
              value={`฿${fmtMoney(data.totals.earnedCommission)}`}
              label="Agent ได้รับรวมเดือนนี้"
            />
          </div>

          {/* Per-agent table */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            {data.rows.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm">ยังไม่มี Agent ในระบบ</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      <th rowSpan={2} className="text-left py-3 px-5 font-semibold text-gray-500 text-xs align-bottom border-b border-gray-100">
                        Agent
                      </th>
                      <th colSpan={5} className="py-2.5 px-4 text-center font-semibold text-indigo-600 text-xs bg-indigo-50/60 border-b border-indigo-100">
                        {fmtMonthLabel(month)}
                      </th>
                      <th colSpan={3} className="py-2.5 px-4 text-center font-semibold text-amber-700 text-xs bg-amber-50/60 border-b border-amber-100 border-l border-gray-100">
                        สะสมทั้งหมด
                      </th>
                      <th rowSpan={2} className="w-8 border-b border-gray-100" />
                    </tr>
                    <tr className="text-[11px] text-gray-400">
                      <th className="py-2 px-4 text-center font-medium bg-indigo-50/30">ปิดได้</th>
                      <th className="py-2 px-4 text-right font-medium bg-indigo-50/30">ยอดค่าคอม</th>
                      <th className="py-2 px-4 text-center font-medium bg-indigo-50/30">Tier</th>
                      <th className="py-2 px-4 text-right font-medium bg-indigo-50/30 text-orange-500">รอจ่าย</th>
                      <th className="py-2 px-4 text-right font-medium bg-indigo-50/30 text-emerald-600">จ่ายแล้ว</th>
                      <th className="py-2 px-4 text-center font-medium bg-amber-50/30 border-l border-gray-100">ปิดได้</th>
                      <th className="py-2 px-4 text-right font-medium bg-amber-50/30 text-orange-500">รอจ่าย</th>
                      <th className="py-2 px-4 text-right font-medium bg-amber-50/30 text-[#C8A951]">จ่ายแล้ว</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((r, idx) => (
                      <tr
                        key={r.agentId}
                        onClick={() => router.push(`/${locale}/admin/commission-overview/${r.agentId}`)}
                        className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/70 transition-colors cursor-pointer ${idx % 2 === 1 ? "bg-gray-50/30" : ""}`}
                      >
                        <td className="py-3.5 px-5">
                          <Link
                            href={`/${locale}/admin/commission-overview/${r.agentId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2.5 hover:underline w-fit"
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${avatarColor(r.name)}`}>
                              {initials(r.name)}
                            </div>
                            <span className="font-medium text-gray-800 whitespace-nowrap">{r.name}</span>
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 text-center text-gray-700">{r.selectedMonth.closedCount}</td>
                        <td className="py-3.5 px-4 text-right text-gray-700">฿{fmtMoney(r.selectedMonth.revenue)}</td>
                        <td className="py-3.5 px-4 text-center">
                          {r.selectedMonth.tierPercent != null ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                              {r.selectedMonth.tierPercent}%
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-orange-600">฿{fmtMoney(r.selectedMonth.pendingCommission)}</td>
                        <td className="py-3.5 px-4 text-right font-medium text-emerald-600">฿{fmtMoney(r.selectedMonth.paidCommission)}</td>
                        <td className="py-3.5 px-4 text-center text-gray-700 border-l border-gray-50">{r.allTimeClosedCount}</td>
                        <td className="py-3.5 px-4 text-right font-medium text-orange-600">฿{fmtMoney(r.allTimePending)}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-[#C8A951]">฿{fmtMoney(r.allTimePaid)}</td>
                        <td className="pr-4">
                          <ChevronRight className="w-4 h-4 text-gray-300" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400 mt-5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            &ldquo;รอจ่าย&rdquo; = ค่าคอมที่รับจากเจ้าของแล้วแต่ยังไม่ได้จ่ายให้ Agent · &ldquo;จ่ายแล้ว&rdquo; = โอนให้ Agent เรียบร้อยแล้ว
          </p>
        </>
      ) : null}
    </div>
  );
}
