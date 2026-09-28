"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, RefreshCw, ArrowLeft, FileText, CheckCircle2, Clock, XCircle } from "lucide-react";
import AgentCommissionPanel, { type AgentCommission } from "@/components/admin/AgentCommissionPanel";
import ContractQuickActions from "@/components/admin/ContractQuickActions";
import { avatarColor, initials } from "@/lib/avatar";

interface RecentContract {
  id: number;
  contractNumber: string;
  lesseeName: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  status: string;
  shareToken: string | null;
  signedPdfUrl: string | null;
  property: { id: number; titleTh: string; projectName: string } | null;
}

interface Stats {
  draft: number;
  active: number;
  expiringSoon: number;
  expired: number;
  recentContracts: RecentContract[];
  commission: AgentCommission | null;
  agentName: string | null;
}

const STATUS_META: Record<string, { label: string; color: string; dot: string }> = {
  DRAFT:      { label: "Draft",     color: "bg-gray-100 text-gray-600",   dot: "bg-gray-400" },
  ACTIVE:     { label: "Active",    color: "bg-green-100 text-green-700", dot: "bg-green-500" },
  EXPIRED:    { label: "Expired",   color: "bg-red-100 text-red-600",     dot: "bg-red-500" },
  TERMINATED: { label: "Terminated",color: "bg-orange-100 text-orange-600", dot: "bg-orange-500" },
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
}
function fmtMoney(n: number) {
  return n?.toLocaleString("th-TH") ?? "-";
}

export default function AgentCommissionDetailPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "th";
  const agentId = params?.agentId as string;

  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/agent-stats?agentId=${agentId}`);
      const d = await res.json();
      if (!d.success) throw new Error(d.error || "Load failed");
      setStats(d.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const cards = stats ? [
    { titleTh: "แบบร่าง", value: stats.draft, icon: FileText, bg: "bg-gray-50", border: "border-gray-200", iconColor: "text-gray-500", valueColor: "text-gray-800" },
    { titleTh: "กำลังใช้งาน", value: stats.active, icon: CheckCircle2, bg: "bg-green-50", border: "border-green-200", iconColor: "text-green-600", valueColor: "text-green-700" },
    { titleTh: "ใกล้หมดสัญญา", value: stats.expiringSoon, icon: Clock, bg: "bg-amber-50", border: "border-amber-200", iconColor: "text-amber-600", valueColor: "text-amber-700" },
    { titleTh: "หมดสัญญา", value: stats.expired, icon: XCircle, bg: "bg-red-50", border: "border-red-200", iconColor: "text-red-500", valueColor: "text-red-700" },
  ] : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href={`/${locale}/admin/commission-overview`}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> กลับไปภาพรวม
          </Link>
          <div className="flex items-center gap-3">
            {stats?.agentName && (
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${avatarColor(stats.agentName)}`}
              >
                {initials(stats.agentName)}
              </div>
            )}
            <h1 className="text-2xl font-bold text-gray-900">
              {stats?.agentName || "รายละเอียด Agent"}
            </h1>
          </div>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          รีเฟรช
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading && !stats ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : stats ? (
        <>
          <h2 className="text-sm font-semibold text-gray-800 mb-3">สถานะสัญญา</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {cards.map((card) => (
              <div key={card.titleTh} className={`rounded-xl border p-5 ${card.bg} ${card.border}`}>
                <div className={`inline-flex p-2 rounded-lg bg-white/70 mb-3 ${card.iconColor}`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <div className={`text-3xl font-bold mb-1 ${card.valueColor}`}>{card.value}</div>
                <div className="text-sm font-semibold text-gray-700">{card.titleTh}</div>
              </div>
            ))}
          </div>

          {stats.commission ? (
            <AgentCommissionPanel commission={stats.commission} locale={locale} title="ค่าคอมมิชชั่น" />
          ) : (
            <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-xl border border-gray-200">
              ไม่พบข้อมูลค่าคอมมิชชั่น
            </div>
          )}

          {/* Recent contracts — scoped to this agent only */}
          <div className="bg-white rounded-xl border border-gray-200 mt-8">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">สัญญาล่าสุด</h2>
            </div>

            {!stats.recentContracts?.length ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                ยังไม่มีสัญญา
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {stats.recentContracts.map((c) => {
                  const meta = STATUS_META[c.status] ?? STATUS_META.DRAFT;
                  return (
                    <div
                      key={c.id}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                    >
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${meta.dot}`} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-800 truncate">
                            {c.contractNumber}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${meta.color}`}>
                            {meta.label}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 truncate mt-0.5">
                          {c.lesseeName} · {c.property?.titleTh || c.property?.projectName || "—"}
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 hidden sm:block">
                        <div className="text-xs text-gray-600 font-medium">
                          {fmtMoney(c.monthlyRent)} ฿/เดือน
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          {fmtDate(c.startDate)} – {fmtDate(c.endDate)}
                        </div>
                      </div>

                      <ContractQuickActions
                        contract={{
                          id: c.id,
                          contractNumber: c.contractNumber,
                          signedPdfUrl: c.signedPdfUrl,
                          shareToken: c.shareToken,
                          subtitle: c.property?.titleTh || c.property?.projectName || undefined,
                        }}
                        locale={locale}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
