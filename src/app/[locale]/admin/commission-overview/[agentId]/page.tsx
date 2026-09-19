"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, RefreshCw, ArrowLeft, FileText, CheckCircle2, Clock, XCircle, TrendingUp } from "lucide-react";
import AgentCommissionPanel, { type AgentCommission } from "@/components/admin/AgentCommissionPanel";

interface Stats {
  draft: number;
  active: number;
  expiringSoon: number;
  expired: number;
  commission: AgentCommission | null;
  agentName: string | null;
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
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> กลับไปภาพรวม
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {stats?.agentName || "รายละเอียด Agent"}
          </h1>
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {cards.map((card) => (
              <div key={card.titleTh} className={`rounded-xl border p-5 ${card.bg} ${card.border}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg bg-white/70 ${card.iconColor}`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  <TrendingUp className="w-4 h-4 text-gray-300" />
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
        </>
      ) : null}
    </div>
  );
}
