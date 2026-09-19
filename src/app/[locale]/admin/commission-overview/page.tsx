"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, RefreshCw, Users, Home, Wallet, PiggyBank, Clock } from "lucide-react";

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

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function CommissionOverviewPage() {
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ภาพรวมค่าคอมมิชชั่น Agent</h1>
          <p className="text-sm text-gray-500 mt-0.5">จำนวนทรัพย์ที่ปิดได้ ยอดค่าคอม และ tier ของแต่ละ Agent รายเดือน</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={() => fetchData(month)}
            disabled={loading}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : data ? (
        <>
          {/* Totals for the selected month */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="rounded-xl border p-5 bg-gray-50 border-gray-200">
              <div className="p-2 rounded-lg bg-white/70 text-gray-500 w-fit mb-3"><Users className="w-5 h-5" /></div>
              <div className="text-3xl font-bold mb-1 text-gray-800">{data.rows.length}</div>
              <div className="text-sm font-semibold text-gray-700">Agent ทั้งหมด</div>
            </div>
            <div className="rounded-xl border p-5 bg-gray-50 border-gray-200">
              <div className="p-2 rounded-lg bg-white/70 text-gray-500 w-fit mb-3"><Home className="w-5 h-5" /></div>
              <div className="text-3xl font-bold mb-1 text-gray-800">{data.totals.closedCount}</div>
              <div className="text-sm font-semibold text-gray-700">ทรัพย์ที่ปิดได้เดือนนี้</div>
            </div>
            <div className="rounded-xl border p-5 bg-blue-50 border-blue-200">
              <div className="p-2 rounded-lg bg-white/70 text-blue-600 w-fit mb-3"><Wallet className="w-5 h-5" /></div>
              <div className="text-2xl font-bold mb-1 text-blue-700">฿{fmtMoney(data.totals.revenue)}</div>
              <div className="text-sm font-semibold text-gray-700">ยอดค่าคอมรวมเดือนนี้</div>
            </div>
            <div className="rounded-xl border p-5 bg-green-50 border-green-200">
              <div className="p-2 rounded-lg bg-white/70 text-green-600 w-fit mb-3"><PiggyBank className="w-5 h-5" /></div>
              <div className="text-2xl font-bold mb-1 text-green-700">฿{fmtMoney(data.totals.earnedCommission)}</div>
              <div className="text-sm font-semibold text-gray-700">Agent ได้รับรวมเดือนนี้</div>
            </div>
          </div>

          {/* Per-agent table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {data.rows.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">ยังไม่มี Agent ในระบบ</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th rowSpan={2} className="text-left py-3 px-4 font-medium text-gray-600 align-bottom">Agent</th>
                      <th rowSpan={2} className="text-center py-3 px-4 font-medium text-gray-600 align-bottom">ทรัพย์ที่ปิดได้<br />เดือนนี้</th>
                      <th rowSpan={2} className="text-right py-3 px-4 font-medium text-gray-600 align-bottom">ยอดค่าคอม<br />เดือนนี้</th>
                      <th rowSpan={2} className="text-center py-3 px-4 font-medium text-gray-600 align-bottom">Tier</th>
                      <th colSpan={2} className="text-center py-2 px-4 font-medium text-gray-600 border-b">Agent ได้เดือนนี้</th>
                      <th rowSpan={2} className="text-center py-3 px-4 font-medium text-gray-600 align-bottom">ปิดได้<br />สะสม</th>
                      <th colSpan={2} className="text-center py-2 px-4 font-medium text-gray-600 border-b">สะสมทั้งหมด</th>
                    </tr>
                    <tr>
                      <th className="text-right py-2 px-4 font-medium text-amber-600">รอจ่าย</th>
                      <th className="text-right py-2 px-4 font-medium text-green-600">จ่ายแล้ว</th>
                      <th className="text-right py-2 px-4 font-medium text-amber-600">รอจ่าย</th>
                      <th className="text-right py-2 px-4 font-medium text-green-600">จ่ายแล้ว</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((r) => (
                      <tr key={r.agentId} className="border-t hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-800">{r.name}</td>
                        <td className="py-3 px-4 text-center">{r.selectedMonth.closedCount}</td>
                        <td className="py-3 px-4 text-right">฿{fmtMoney(r.selectedMonth.revenue)}</td>
                        <td className="py-3 px-4 text-center">
                          {r.selectedMonth.tierPercent != null ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                              {r.selectedMonth.tierPercent}%
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right text-amber-600">฿{fmtMoney(r.selectedMonth.pendingCommission)}</td>
                        <td className="py-3 px-4 text-right text-green-700">฿{fmtMoney(r.selectedMonth.paidCommission)}</td>
                        <td className="py-3 px-4 text-center font-medium text-gray-700">{r.allTimeClosedCount}</td>
                        <td className="py-3 px-4 text-right font-medium text-amber-600">฿{fmtMoney(r.allTimePending)}</td>
                        <td className="py-3 px-4 text-right font-bold text-[#C8A951]">฿{fmtMoney(r.allTimePaid)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            &ldquo;รอจ่าย&rdquo; = ค่าคอมที่รับจากเจ้าของแล้วแต่ยังไม่ได้จ่ายให้ Agent · &ldquo;จ่ายแล้ว&rdquo; = โอนให้ Agent เรียบร้อยแล้ว
          </p>
        </>
      ) : null}
    </div>
  );
}
