"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Home, Percent, PiggyBank, Clock, ExternalLink } from "lucide-react";

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
  commissionReceived: boolean;
  commissionReceivedDate: string | null;
  commissionPaid: boolean;
  shareToken: string | null;
  signedPdfUrl: string | null;
}

export interface MonthHistory {
  monthKey: string;
  closedCount: number;
  contracts: HistoryContract[];
}

export interface AgentCommission {
  currentMonth: CommissionMonth;
  allTimeClosedCount: number;
  allTimeEarned: number;
  allTimePaid: number;
  allTimePending: number;
  history: MonthHistory[];
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

  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-gray-800 mb-3">{title}</h2>

      {/* Hero: current month */}
      <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/70 via-white to-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1">
              {fmtMonthKey(cm.monthKey)} · ยอดค่าคอมมิชชั่นที่ได้รับ
            </div>
            <div className="text-4xl font-bold text-gray-900">฿{fmtMoney(cm.earnedCommission)}</div>
            <div className="text-xs text-gray-400 mt-1.5">จากยอดค่าคอมรวม ฿{fmtMoney(cm.revenue)}</div>
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
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-800">{fmtMonthKey(h.monthKey)}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">{h.closedCount} สัญญา</span>
                      <span className="text-xs font-semibold text-gray-700">
                        ฿{fmtMoney(h.contracts.reduce((sum, c) => sum + c.commissionAmount, 0))}
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
                              <div className="text-xs text-gray-600 font-medium">ค่าคอม ฿{fmtMoney(c.commissionAmount)}</div>
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
