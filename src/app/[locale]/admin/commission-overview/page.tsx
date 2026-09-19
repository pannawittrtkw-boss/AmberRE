"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, RefreshCw, Users, Home, Wallet, PiggyBank, Clock, CheckCircle2, CalendarRange } from "lucide-react";

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

const AVATAR_COLORS = [
  "bg-[#C8A951]",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-cyan-600",
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
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

function MiniStat({ icon, value, label, valueClass }: { icon: React.ReactNode; value: string; label: string; valueClass?: string }) {
  return (
    <div className="rounded-xl bg-gray-50 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-gray-400 mb-1">
        {icon}
        <span className="text-[11px] font-medium">{label}</span>
      </div>
      <div className={`text-sm font-bold ${valueClass ?? "text-gray-800"}`}>{value}</div>
    </div>
  );
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

          {/* Per-agent cards */}
          {data.rows.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
              ยังไม่มี Agent ในระบบ
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {data.rows.map((r) => (
                <div key={r.agentId} className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${avatarColor(r.name)}`}>
                        {initials(r.name)}
                      </div>
                      <span className="font-semibold text-gray-900">{r.name}</span>
                    </div>
                    {r.selectedMonth.tierPercent != null ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                        Tier {r.selectedMonth.tierPercent}%
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">ยังไม่มี Tier</span>
                    )}
                  </div>

                  {/* This month */}
                  <div className="px-5 pt-4 pb-2">
                    <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      {fmtMonthLabel(r.selectedMonth.monthKey)}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <MiniStat icon={<Home className="w-3.5 h-3.5" />} label="ปิดได้" value={String(r.selectedMonth.closedCount)} />
                      <MiniStat icon={<Wallet className="w-3.5 h-3.5" />} label="ยอดค่าคอม" value={`฿${fmtMoney(r.selectedMonth.revenue)}`} />
                      <MiniStat icon={<Clock className="w-3.5 h-3.5" />} label="รอจ่าย" value={`฿${fmtMoney(r.selectedMonth.pendingCommission)}`} valueClass="text-orange-600" />
                      <MiniStat icon={<CheckCircle2 className="w-3.5 h-3.5" />} label="จ่ายแล้ว" value={`฿${fmtMoney(r.selectedMonth.paidCommission)}`} valueClass="text-emerald-600" />
                    </div>
                  </div>

                  {/* All-time */}
                  <div className="px-5 pt-2 pb-4">
                    <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">สะสมทั้งหมด</div>
                    <div className="grid grid-cols-3 gap-2">
                      <MiniStat icon={<Home className="w-3.5 h-3.5" />} label="ปิดได้" value={String(r.allTimeClosedCount)} />
                      <MiniStat icon={<Clock className="w-3.5 h-3.5" />} label="รอจ่าย" value={`฿${fmtMoney(r.allTimePending)}`} valueClass="text-orange-600" />
                      <MiniStat icon={<PiggyBank className="w-3.5 h-3.5" />} label="จ่ายแล้ว" value={`฿${fmtMoney(r.allTimePaid)}`} valueClass="text-[#C8A951]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-400 mt-5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            &ldquo;รอจ่าย&rdquo; = ค่าคอมที่รับจากเจ้าของแล้วแต่ยังไม่ได้จ่ายให้ Agent · &ldquo;จ่ายแล้ว&rdquo; = โอนให้ Agent เรียบร้อยแล้ว
          </p>
        </>
      ) : null}
    </div>
  );
}
