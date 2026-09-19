"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Home, Wallet, Percent, PiggyBank, Clock, ExternalLink } from "lucide-react";

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

  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-gray-800 mb-3">{title}</h2>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl border p-5 bg-gray-50 border-gray-200">
          <div className="p-2 rounded-lg bg-white/70 text-gray-500 w-fit mb-3">
            <Home className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold mb-1 text-gray-800">{commission.currentMonth.closedCount}</div>
          <div className="text-sm font-semibold text-gray-700">ทรัพย์ที่ปิดได้เดือนนี้</div>
        </div>
        <div className="rounded-xl border p-5 bg-blue-50 border-blue-200">
          <div className="p-2 rounded-lg bg-white/70 text-blue-600 w-fit mb-3">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold mb-1 text-blue-700">฿{fmtMoney(commission.currentMonth.revenue)}</div>
          <div className="text-sm font-semibold text-gray-700">ยอดค่าคอมเดือนนี้</div>
        </div>
        <div className="rounded-xl border p-5 bg-amber-50 border-amber-200">
          <div className="p-2 rounded-lg bg-white/70 text-amber-600 w-fit mb-3">
            <Percent className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold mb-1 text-amber-700">{commission.currentMonth.tierPercent ?? "-"}%</div>
          <div className="text-sm font-semibold text-gray-700">Tier เดือนนี้</div>
        </div>
        <div className="rounded-xl border p-5 bg-orange-50 border-orange-200">
          <div className="p-2 rounded-lg bg-white/70 text-orange-600 w-fit mb-3">
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold mb-1 text-orange-700">฿{fmtMoney(commission.currentMonth.pendingCommission)}</div>
          <div className="text-sm font-semibold text-gray-700">รอจ่ายเดือนนี้</div>
        </div>
        <div className="rounded-xl border p-5 bg-green-50 border-green-200">
          <div className="p-2 rounded-lg bg-white/70 text-green-600 w-fit mb-3">
            <PiggyBank className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold mb-1 text-green-700">฿{fmtMoney(commission.currentMonth.paidCommission)}</div>
          <div className="text-sm font-semibold text-gray-700">จ่ายแล้วเดือนนี้</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
          <div className="text-sm font-semibold text-gray-700 mb-1">ทรัพย์ที่ปิดได้สะสม</div>
          <div className="text-xl font-bold text-gray-800">{commission.allTimeClosedCount}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
          <div className="text-sm font-semibold text-gray-700 mb-1">รอจ่ายสะสม</div>
          <div className="text-xl font-bold text-orange-600">฿{fmtMoney(commission.allTimePending)}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
          <div className="text-sm font-semibold text-gray-700 mb-1">จ่ายแล้วสะสม</div>
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
                          <div key={c.id} className="flex items-center gap-4 px-5 py-3 pl-8">
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
