"use client";

import { useState, useEffect, useCallback } from "react";
import { ExternalLink, RefreshCw, Loader2, CheckCircle2, XCircle, Clock, PhoneOff, Ban, Filter } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface UrlRecord {
  id: number;
  groupId: string;
  url: string;
  sentBy: string | null;
  dateKey: string;
  dailySeq: number;
  status: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  sentAt: string;
}

interface StatItem { status: string; _count: { status: number } }

// ── Constants ──────────────────────────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PENDING:                    { label: "รอตรวจสอบ",          color: "text-amber-700",  bg: "bg-amber-100",  icon: <Clock className="w-3 h-3" /> },
  ACCEPT_ALL:                 { label: "Agent & Foreigner",  color: "text-green-700",  bg: "bg-green-100",  icon: <CheckCircle2 className="w-3 h-3" /> },
  ACCEPT_AGENT_NOT_FOREIGNER: { label: "Agent (ไม่ Foreigner)", color: "text-teal-700", bg: "bg-teal-100",  icon: <CheckCircle2 className="w-3 h-3" /> },
  NOT_ACCEPT_AGENT:           { label: "ไม่รับ Agent",         color: "text-red-700",   bg: "bg-red-100",    icon: <XCircle className="w-3 h-3" /> },
  UNABLE_TO_CONTACT:          { label: "ติดต่อไม่ได้",         color: "text-orange-700",bg: "bg-orange-100", icon: <PhoneOff className="w-3 h-3" /> },
  WAIT_FOR_REPLY:             { label: "รอตอบกลับ",           color: "text-blue-700",  bg: "bg-blue-100",   icon: <Clock className="w-3 h-3" /> },
  NOT_AVAILABLE:              { label: "ไม่ว่าง",              color: "text-gray-700",  bg: "bg-gray-100",   icon: <Ban className="w-3 h-3" /> },
};

const FILTERS = [
  { key: "ALL",     label: "ทั้งหมด" },
  { key: "PENDING", label: "รอตรวจสอบ" },
  { key: "ACCEPT_ALL",                 label: "Agent & Foreigner" },
  { key: "ACCEPT_AGENT_NOT_FOREIGNER", label: "Agent เท่านั้น" },
  { key: "NOT_ACCEPT_AGENT",           label: "ไม่รับ Agent" },
  { key: "UNABLE_TO_CONTACT",          label: "ติดต่อไม่ได้" },
  { key: "WAIT_FOR_REPLY",             label: "รอตอบ" },
  { key: "NOT_AVAILABLE",              label: "ไม่ว่าง" },
];

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? { label: status, color: "text-gray-600", bg: "bg-gray-100", icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${m.bg} ${m.color}`}>
      {m.icon}{m.label}
    </span>
  );
}

function shortUrl(url: string, max = 70) {
  return url.length > max ? url.slice(0, max - 2) + "…" : url;
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ScanlinkPage() {
  const [records,    setRecords]    = useState<UrlRecord[]>([]);
  const [total,      setTotal]      = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [stats,      setStats]      = useState<StatItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState("ALL");
  const [selected,   setSelected]   = useState<Set<number>>(new Set());
  const [updating,   setUpdating]   = useState(false);
  const [page,       setPage]       = useState(1);
  const limit = 100;

  const load = useCallback(async (status: string, p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/scanlink?status=${status}&page=${p}&limit=${limit}`);
      const d   = await res.json();
      if (d.success) {
        setRecords(d.data.records);
        setTotal(d.data.total);
        setGrandTotal(d.data.grandTotal);
        setStats(d.data.stats);
      }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(filter, page); }, [load, filter, page]);

  const changeFilter = (key: string) => { setFilter(key); setPage(1); setSelected(new Set()); };

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const toggleAll = () => {
    setSelected(prev => prev.size === records.length ? new Set() : new Set(records.map(r => r.id)));
  };

  const bulkUpdate = async (status: string) => {
    if (selected.size === 0) return;
    setUpdating(true);
    try {
      await fetch("/api/admin/scanlink", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selected], status }),
      });
      setSelected(new Set());
      await load(filter, page);
    } finally { setUpdating(false); }
  };

  const countByStatus = (s: string) => stats.find(x => x.status === s)?._count.status ?? 0;
  const pending  = countByStatus("PENDING");
  const accepted = countByStatus("ACCEPT_ALL") + countByStatus("ACCEPT_AGENT_NOT_FOREIGNER");
  const rejected = countByStatus("NOT_ACCEPT_AGENT") + countByStatus("NOT_AVAILABLE");

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="rounded-2xl mb-6 p-6 text-white"
        style={{ background: "linear-gradient(135deg,#112240,#1e3a5f)" }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold">🔗 ScanLink Dashboard</h1>
            <p className="text-white/60 text-sm mt-1">รายการลิงค์จาก LINE bot ทั้งหมด</p>
          </div>
          <button onClick={() => load(filter, page)} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-sm font-medium border border-white/20 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />รีเฟรช
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-3 mt-5 flex-wrap">
          {[
            { l: "ทั้งหมด",      v: grandTotal, c: "text-white" },
            { l: "รอตรวจสอบ",    v: pending,  c: "text-amber-300" },
            { l: "รับ Agent",    v: accepted, c: "text-green-300" },
            { l: "ไม่รับ/ไม่ว่าง", v: rejected, c: "text-red-300" },
          ].map(s => (
            <div key={s.l} className="bg-white/10 backdrop-blur rounded-xl px-4 py-2.5 text-center min-w-[80px]">
              <p className={`text-2xl font-bold ${s.c}`}>{s.v}</p>
              <p className="text-white/60 text-xs">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-4">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => changeFilter(f.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${filter === f.key
              ? "bg-[#112240] text-white border-[#112240]"
              : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
            {f.label}
            {f.key !== "ALL" && (
              <span className="ml-1.5 opacity-60">{countByStatus(f.key)}</span>
            )}
          </button>
        ))}
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-2 flex-wrap bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5">
          <span className="text-sm font-semibold text-indigo-700">เลือก {selected.size} รายการ</span>
          <div className="flex gap-2 ml-auto flex-wrap">
            {[
              { s: "NOT_ACCEPT_AGENT",           l: "❌ ไม่รับ Agent" },
              { s: "ACCEPT_AGENT_NOT_FOREIGNER", l: "✅ Agent เท่านั้น" },
              { s: "ACCEPT_ALL",                 l: "✅ Agent & Foreigner" },
              { s: "NOT_AVAILABLE",              l: "🚫 ไม่ว่าง" },
            ].map(b => (
              <button key={b.s} onClick={() => bulkUpdate(b.s)} disabled={updating}
                className="px-3 py-1.5 bg-white border rounded-lg text-xs font-medium hover:bg-gray-50 disabled:opacity-50">
                {b.l}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-indigo-600" /></div>
        ) : records.length === 0 ? (
          <div className="text-center py-16 text-gray-400">ไม่มีรายการ</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-xs text-gray-500 font-semibold uppercase tracking-wide">
                  <th className="pl-4 pr-2 py-3 w-10">
                    <input type="checkbox"
                      checked={selected.size === records.length && records.length > 0}
                      onChange={toggleAll}
                      className="rounded" />
                  </th>
                  <th className="px-3 py-3 text-left w-12">#</th>
                  <th className="px-3 py-3 text-left">URL</th>
                  <th className="px-3 py-3 text-left w-28">ผู้ส่ง</th>
                  <th className="px-3 py-3 text-left w-24">วันที่</th>
                  <th className="px-3 py-3 text-left w-40">สถานะ</th>
                  <th className="px-3 py-3 text-left w-28">ตรวจสอบโดย</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map(r => (
                  <tr key={r.id} className={`hover:bg-gray-50 transition-colors ${selected.has(r.id) ? "bg-indigo-50" : ""}`}>
                    <td className="pl-4 pr-2 py-3">
                      <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} className="rounded" />
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-bold text-amber-600">#{r.dailySeq || r.id}</span>
                    </td>
                    <td className="px-3 py-3 max-w-xs">
                      <a href={r.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-start gap-1.5 text-indigo-600 hover:text-indigo-800 hover:underline break-all leading-snug group">
                        <ExternalLink className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-50 group-hover:opacity-100" />
                        <span className="text-xs">{shortUrl(r.url)}</span>
                      </a>
                    </td>
                    <td className="px-3 py-3 text-gray-700">{r.sentBy || "—"}</td>
                    <td className="px-3 py-3 text-gray-500 text-xs">{r.dateKey}</td>
                    <td className="px-3 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-3 py-3 text-gray-500 text-xs">{r.reviewedBy || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 text-sm">
            <span className="text-gray-500">แสดง {(page - 1) * limit + 1}–{Math.min(page * limit, total)} จาก {total} รายการ</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading}
                className="px-3 py-1.5 border rounded-lg text-xs font-medium hover:bg-white disabled:opacity-40">← ก่อนหน้า</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * limit >= total || loading}
                className="px-3 py-1.5 border rounded-lg text-xs font-medium hover:bg-white disabled:opacity-40">ถัดไป →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
