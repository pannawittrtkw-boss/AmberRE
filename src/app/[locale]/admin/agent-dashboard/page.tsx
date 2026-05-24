"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Loader2, FileText, CheckCircle2, Clock, XCircle,
  TrendingUp, RefreshCw, ChevronRight,
} from "lucide-react";

interface Stats {
  draft: number;
  active: number;
  expiringSoon: number;
  expired: number;
  recentContracts: {
    id: number;
    contractNumber: string;
    lesseeName: string;
    startDate: string;
    endDate: string;
    monthlyRent: number;
    status: string;
    property: { id: number; titleTh: string; projectName: string } | null;
  }[];
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

export default function AgentDashboardPage() {
  const { data: session } = useSession();
  const params = useParams();
  const locale = (params?.locale as string) || "th";

  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/agent-stats");
      const d = await res.json();
      if (!d.success) throw new Error(d.error || "Load failed");
      setStats(d.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const agentName = `${(session?.user as any)?.firstName ?? ""} ${(session?.user as any)?.lastName ?? ""}`.trim();

  const cards = stats ? [
    {
      title: "Draft",
      titleTh: "แบบร่าง",
      value: stats.draft,
      icon: FileText,
      bg: "bg-gray-50",
      border: "border-gray-200",
      iconColor: "text-gray-500",
      valueColor: "text-gray-800",
      desc: "สัญญาที่ยังไม่ได้เปิดใช้งาน",
    },
    {
      title: "Active",
      titleTh: "กำลังใช้งาน",
      value: stats.active,
      icon: CheckCircle2,
      bg: "bg-green-50",
      border: "border-green-200",
      iconColor: "text-green-600",
      valueColor: "text-green-700",
      desc: "สัญญาที่อยู่ในช่วงสัญญา",
    },
    {
      title: "Expiring Soon",
      titleTh: "ใกล้หมดสัญญา",
      value: stats.expiringSoon,
      icon: Clock,
      bg: "bg-amber-50",
      border: "border-amber-200",
      iconColor: "text-amber-600",
      valueColor: "text-amber-700",
      desc: "หมดสัญญาภายใน 45 วัน",
    },
    {
      title: "Expired",
      titleTh: "หมดสัญญา",
      value: stats.expired,
      icon: XCircle,
      bg: "bg-red-50",
      border: "border-red-200",
      iconColor: "text-red-500",
      valueColor: "text-red-700",
      desc: "สัญญาที่หมดอายุแล้ว",
    },
  ] : [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {locale === "th" ? "ภาพรวม" : "Dashboard"}
          </h1>
          {agentName && (
            <p className="text-sm text-gray-500 mt-0.5">ยินดีต้อนรับ, {agentName}</p>
          )}
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
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {cards.map((card) => (
              <div
                key={card.title}
                className={`rounded-xl border p-5 ${card.bg} ${card.border}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg bg-white/70 ${card.iconColor}`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  <TrendingUp className="w-4 h-4 text-gray-300" />
                </div>
                <div className={`text-3xl font-bold mb-1 ${card.valueColor}`}>
                  {card.value}
                </div>
                <div className="text-sm font-semibold text-gray-700">{card.titleTh}</div>
                <div className="text-xs text-gray-500 mt-0.5">{card.desc}</div>
              </div>
            ))}
          </div>

          {/* Recent contracts */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">สัญญาล่าสุด</h2>
              <Link
                href={`/${locale}/admin/contracts`}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                ดูทั้งหมด <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {!stats?.recentContracts?.length ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                ยังไม่มีสัญญา
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {stats.recentContracts.map((c) => {
                  const meta = STATUS_META[c.status] ?? STATUS_META.DRAFT;
                  return (
                    <Link
                      key={c.id}
                      href={`/${locale}/admin/contracts/${c.id}`}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors group"
                    >
                      {/* Status dot */}
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${meta.dot}`} />

                      {/* Contract info */}
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

                      {/* Dates */}
                      <div className="text-right flex-shrink-0 hidden sm:block">
                        <div className="text-xs text-gray-600 font-medium">
                          {fmtMoney(c.monthlyRent)} ฿/เดือน
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          {fmtDate(c.startDate)} – {fmtDate(c.endDate)}
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
