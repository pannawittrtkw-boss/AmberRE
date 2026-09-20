"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Home, Percent, PiggyBank, Clock, ExternalLink, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import Sparkline from "./Sparkline";

const TH_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

export interface YearlyMonth {
  monthKey: string;
  month: number;
  earnedCommission: number;
  closedCount: number;
}

export interface YearlySeries {
  currentYear: number;
  previousYear: number;
  current: YearlyMonth[];
  previous: YearlyMonth[];
}

export interface CommissionMonth {
  monthKey: string;
  closedCount: number;
  revenue: number;
  tierPercent: number | null;
  earnedCommission: number;
  paidCommission: number;
  pendingCommission: number;
}

export interface HistoryContract {
  id: number;
  contractNumber: string;
  contractType: string;
  projectName: string;
  unitNumber: string;
  lesseeName: string;
  monthlyRent: number;
  commissionAmount: number;
  agentEarnedCommission: number | null;
  commissionReceived: boolean;
  commissionReceivedDate: string | null;
  commissionPaid: boolean;
  shareToken: string | null;
  signedPdfUrl: string | null;
}

export interface MonthHistory {
  monthKey: string;
  closedCount: number;
  totalContractValue: number;
  totalEarnedCommission: number;
  contracts: HistoryContract[];
}

export interface AgentCommission {
  currentMonth: CommissionMonth;
  allTimeClosedCount: number;
  allTimeEarned: number;
  allTimePaid: number;
  allTimePending: number;
  history: MonthHistory[];
  yearlySeries: YearlySeries;
}

function fmtMoney(n: number) {
  return n?.toLocaleString("th-TH") ?? "-";
}
function fmtMonthKey(monthKey: string) {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("th-TH", { month: "long", year: "numeric" });
}

// Shared between an agent's own "ภาพรวม" page and the admin's per-agent
// drill-down from Commission Overview — same stat cards + collapsible
// monthly history with signed-contract links either way.
export default function AgentCommissionPanel({
  commission,
  locale,
  title = "ค่าคอมมิชชั่น",
}: {
  commission: AgentCommission;
  locale: string;
  title?: string;
}) {
  const [expandedMonth, setExpandedMonth] = useState<string | null>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const cm = commission.currentMonth;
  const { yearlySeries } = commission;

  // Trend of earned commission for the elapsed months of the current year,
  // used for the hero card's inline sparkline (last up to 6 months).
  const elapsedMonths = new Date().getMonth() + 1;
  const sparklineData = yearlySeries.current
    .slice(0, elapsedMonths)
    .slice(-6)
    .map((m) => m.earnedCommission);

  // Year-over-year chart data — only the months that have actually
  // happened this year (no forecasted/future months plotted).
  const chartData = yearlySeries.current.slice(0, elapsedMonths).map((m, i) => ({
    label: TH_MONTHS_SHORT[m.month - 1],
    current: m.earnedCommission,
    previous: yearlySeries.previous[i]?.earnedCommission ?? 0,
  }));
  const ytdEarned = chartData.reduce((sum, d) => sum + d.current, 0);
  const ytdClosed = yearlySeries.current.slice(0, elapsedMonths).reduce((sum, m) => sum + m.closedCount, 0);
  const avgPerDeal = ytdClosed > 0 ? ytdEarned / ytdClosed : 0;

  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-gray-800 mb-3">{title}</h2>

      {/* Hero: current month */}
      <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/70 via-white to-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div className="flex items-end gap-5 flex-1 min-w-[220px]">
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">
                {fmtMonthKey(cm.monthKey)} · ยอดค่าคอมมิชชั่นที่ได้รับ
              </div>
              <div className="text-4xl font-bold text-gray-900">฿{fmtMoney(cm.earnedCommission)}</div>
              <div className="text-xs text-gray-400 mt-1.5">จากยอดค่าคอมรวม ฿{fmtMoney(cm.revenue)}</div>
            </div>
            {sparklineData.length > 1 && (
              <div className="hidden sm:block w-32 h-12 mb-1 shrink-0">
                <Sparkline data={sparklineData} color="#C8A951" />
              </div>
            )}
          </div>
          {cm.tierPercent != null && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-amber-100 text-amber-700 font-bold text-sm shrink-0">
              <Percent className="w-4 h-4" /> Tier {cm.tierPercent}%
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4 pt-5 border-t border-amber-100/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white text-gray-500 shrink-0">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-gray-800">{cm.closedCount}</div>
              <div className="text-xs text-gray-500">ทรัพย์ที่ปิดได้</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white text-orange-500 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-orange-600">฿{fmtMoney(cm.pendingCommission)}</div>
              <div className="text-xs text-gray-500">รอจ่าย</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white text-emerald-600 shrink-0">
              <PiggyBank className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-emerald-600">฿{fmtMoney(cm.paidCommission)}</div>
              <div className="text-xs text-gray-500">จ่ายแล้ว</div>
            </div>
          </div>
        </div>
      </div>

      {/* Commission performance — this year vs last year, by month */}
      {chartData.length > 1 && (
        <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-6">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-gray-400" /> ค่าคอมมิชชั่นรายเดือน
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">เทียบปีนี้กับปีก่อน</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C8A951]" /> {yearlySeries.currentYear}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-300" /> {yearlySeries.previousYear}
              </span>
            </div>
          </div>
          <div className="h-64 w-full mt-3 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="currentYearFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C8A951" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#C8A951" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="previousYearFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#cbd5e1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#cbd5e1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toString())}
                />
                <Tooltip
                  formatter={(value, name) => [
                    `฿${Number(value ?? 0).toLocaleString("th-TH")}`,
                    name === "current" ? String(yearlySeries.currentYear) : String(yearlySeries.previousYear),
                  ]}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <Area type="monotone" dataKey="previous" stroke="#94a3b8" strokeWidth={2} fill="url(#previousYearFill)" />
                <Area type="monotone" dataKey="current" stroke="#C8A951" strokeWidth={2.5} fill="url(#currentYearFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div>
              <div className="text-xs text-gray-500 mb-1">ค่าคอมสะสมปีนี้ (YTD)</div>
              <div className="text-lg font-bold text-gray-800">฿{fmtMoney(ytdEarned)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">สัญญาปิดได้ปีนี้</div>
              <div className="text-lg font-bold text-gray-800">{ytdClosed}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">เฉลี่ยค่าคอมต่อสัญญา</div>
              <div className="text-lg font-bold text-gray-800">฿{fmtMoney(Math.round(avgPerDeal))}</div>
            </div>
          </div>
        </div>
      )}

      {/* All-time */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
          <div className="text-xs font-medium text-gray-500 mb-1">ทรัพย์ที่ปิดได้สะสม</div>
          <div className="text-xl font-bold text-gray-800">{commission.allTimeClosedCount}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
          <div className="text-xs font-medium text-gray-500 mb-1">รอจ่ายสะสม</div>
          <div className="text-xl font-bold text-orange-600">฿{fmtMoney(commission.allTimePending)}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
          <div className="text-xs font-medium text-gray-500 mb-1">จ่ายแล้วสะสม</div>
          <div className="text-xl font-bold text-[#C8A951]">฿{fmtMoney(commission.allTimePaid)}</div>
        </div>
      </div>

      {/* Monthly history — which contracts closed each month, with a link to the signed contract */}
      {commission.history.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">ประวัติย้อนหลังรายเดือน</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {commission.history.map((h) => {
              const isOpen = expandedMonth === h.monthKey;
              return (
                <div key={h.monthKey}>
                  <button
                    onClick={() => setExpandedMonth(isOpen ? null : h.monthKey)}
                    className="w-full flex items-center justify-between flex-wrap gap-2 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-800">{fmtMonthKey(h.monthKey)}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">{h.closedCount} สัญญา</span>
                      <span className="text-xs text-gray-500">มูลค่ารวม ฿{fmtMoney(h.totalContractValue)}</span>
                      <span className="text-xs font-semibold text-gray-700">
                        ค่าคอมที่ได้ ฿{fmtMoney(h.totalEarnedCommission)}
                      </span>
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="divide-y divide-gray-50 bg-gray-50/40">
                      {h.contracts.map((c) => {
                        const signedUrl = c.signedPdfUrl
                          ? c.signedPdfUrl
                          : c.shareToken
                          ? `/${locale}/contracts/share/${c.shareToken}`
                          : null;
                        return (
                          <div key={c.id} className="flex items-center gap-3 px-5 py-3 pl-8">
                            <span
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                c.commissionPaid ? "bg-emerald-500" : c.commissionReceived ? "bg-orange-400" : "bg-gray-300"
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-800 truncate">{c.contractNumber}</span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                                  {c.contractType === "RENEW" ? "ต่อสัญญา" : "สัญญาใหม่"}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 truncate mt-0.5">
                                {c.projectName} #{c.unitNumber} · {c.lesseeName}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 hidden sm:block">
                              <div className="text-xs text-gray-500">มูลค่าสัญญา ฿{fmtMoney(c.monthlyRent)}</div>
                              <div className="text-xs text-gray-800 font-semibold mt-0.5">
                                ค่าคอมที่ได้ {c.agentEarnedCommission != null ? `฿${fmtMoney(c.agentEarnedCommission)}` : "-"}
                              </div>
                              <div className="text-[11px] mt-0.5">
                                {c.commissionPaid ? (
                                  <span className="text-green-600">จ่ายแล้ว</span>
                                ) : c.commissionReceived ? (
                                  <span className="text-orange-600">รอจ่าย</span>
                                ) : (
                                  <span className="text-gray-400">ยังไม่รับเงิน</span>
                                )}
                              </div>
                            </div>
                            {signedUrl ? (
                              <a
                                href={signedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium flex-shrink-0"
                              >
                                ดูสัญญา <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            ) : (
                              <span className="text-xs text-gray-300 flex-shrink-0">ยังไม่มีลิงก์</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
