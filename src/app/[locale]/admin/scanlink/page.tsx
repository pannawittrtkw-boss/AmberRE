"use client";

import { useState, useEffect, useCallback } from "react";
import { ExternalLink, RefreshCw, Loader2, CheckCircle2, XCircle, Clock, PhoneOff, Ban, Trash2, Repeat, BarChart3 } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { LINES } from "@/components/admin/StationMapSelector";

// ── Types ──────────────────────────────────────────────────────────────────────
// Only populated once a link has been reviewed and accepted (which creates a
// Property linked back via sourceLink) — null for links still pending review,
// since that data is only ever typed in at accept-time, not stored earlier.
interface PropertySummary {
  projectName: string | null;
  propertyType: string;
  listingType: string;
  price: number;
  salePrice: number | null;
  nearbyStations: string | null;
  availableDate: string | null;
}

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
  property: PropertySummary | null;
}

interface StatItem { status: string; _count: { status: number } }

interface DashboardBucket { key: string; total: number; reviewed: number; pending: number }
interface DashboardData { daily: DashboardBucket[]; monthly: DashboardBucket[]; yearly: DashboardBucket[] }
type DashboardView = "daily" | "monthly" | "yearly";

const TH_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

// dateKey is "YYYY-MM-DD" (daily), "YYYY-MM" (monthly), or "YYYY" (yearly) —
// format each into a short Thai label for the chart's x-axis.
function fmtBucketLabel(view: DashboardView, key: string): string {
  if (view === "daily") {
    const [, m, d] = key.split("-").map(Number);
    return `${d} ${TH_MONTHS_SHORT[m - 1]}`;
  }
  if (view === "monthly") {
    const [y, m] = key.split("-").map(Number);
    return `${TH_MONTHS_SHORT[m - 1]} ${String(y + 543).slice(-2)}`;
  }
  return String(Number(key) + 543); // yearly — Buddhist era
}

const PROPERTY_TYPE_LABEL: Record<string, string> = {
  CONDO: "คอนโด",
  HOUSE: "บ้านเดี่ยว",
  TOWNHOUSE: "ทาวน์เฮาส์",
  LAND: "ที่ดิน",
};

const LISTING_TYPE_LABEL: Record<string, string> = {
  RENT: "เช่า",
  SALE: "ขาย",
  RENT_AND_SALE: "เช่า & ขาย",
};

function getStationName(code: string): string {
  for (const line of LINES) {
    const station = line.stations.find((s) => s.id === code || s.code === code);
    if (station) return `${station.code} ${station.nameTh}`;
  }
  return code;
}

function parseStations(val: string | null): string[] {
  if (!val) return [];
  try {
    const p = JSON.parse(val);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

function fmtMoney(n: number) {
  return n.toLocaleString("th-TH");
}

// ── Constants ──────────────────────────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PENDING:                    { label: "รอตรวจสอบ",          color: "text-amber-700",  bg: "bg-amber-100",  icon: <Clock className="w-3 h-3" /> },
  ACCEPT_ALL:                 { label: "Agent & Foreigner",  color: "text-green-700",  bg: "bg-green-100",  icon: <CheckCircle2 className="w-3 h-3" /> },
  ACCEPT_AGENT_NOT_FOREIGNER: { label: "Agent (ไม่ Foreigner)", color: "text-teal-700", bg: "bg-teal-100",  icon: <CheckCircle2 className="w-3 h-3" /> },
  NOT_ACCEPT_AGENT:           { label: "ไม่รับ Agent",         color: "text-red-700",   bg: "bg-red-100",    icon: <XCircle className="w-3 h-3" /> },
  UNABLE_TO_CONTACT:          { label: "ติดต่อไม่ได้",         color: "text-orange-700",bg: "bg-orange-100", icon: <PhoneOff className="w-3 h-3" /> },
  WAIT_FOR_REPLY:             { label: "รอตอบกลับ",           color: "text-blue-700",  bg: "bg-blue-100",   icon: <Clock className="w-3 h-3" /> },
  NOT_AVAILABLE:              { label: "ไม่ว่าง",              color: "text-gray-700",  bg: "bg-gray-100",   icon: <Ban className="w-3 h-3" /> },
  REPEAT:                     { label: "ซ้ำ",                  color: "text-purple-700", bg: "bg-purple-100", icon: <Repeat className="w-3 h-3" /> },
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
  { key: "REPEAT",                     label: "ซ้ำ" },
];

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? { label: status, color: "text-gray-600", bg: "bg-gray-100", icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${m.bg} ${m.color}`}>
      {m.icon}{m.label}
    </span>
  );
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
  const [deleting,   setDeleting]   = useState<number | null>(null);
  const [page,       setPage]       = useState(1);
  const limit = 100;

  const [dashboard,      setDashboard]      = useState<DashboardData | null>(null);
  const [dashboardView,  setDashboardView]  = useState<DashboardView>("daily");
  const [dashboardLoading, setDashboardLoading] = useState(true);

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

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const res = await fetch("/api/admin/scanlink/dashboard");
      const d = await res.json();
      if (d.success) setDashboard(d.data);
    } finally { setDashboardLoading(false); }
  }, []);

  useEffect(() => { load(filter, page); }, [load, filter, page]);
  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  // Daily view can span 100+ distinct days — cap to the most recent 30 so
  // the chart stays readable; monthly/yearly are naturally few buckets.
  const chartData = (dashboard?.[dashboardView] ?? [])
    .slice(dashboardView === "daily" ? -30 : -36)
    .map((b) => ({ ...b, label: fmtBucketLabel(dashboardView, b.key) }));

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

  const deleteIds = async (ids: number[]) => {
    if (ids.length === 0) return;
    const confirmed = window.confirm(`ต้องการลบ ${ids.length} รายการ? ไม่สามารถกู้คืนได้`);
    if (!confirmed) return;
    if (ids.length === 1) setDeleting(ids[0]);
    else setUpdating(true);
    try {
      await fetch("/api/admin/scanlink", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      setSelected(new Set());
      await load(filter, page);
    } finally { setDeleting(null); setUpdating(false); }
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

      {/* Trend chart */}
      <div className="bg-white rounded-2xl border shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-800">เปรียบเทียบจำนวนลิงก์ตามช่วงเวลา</h2>
          </div>
          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
            {([
              { key: "daily",   label: "รายวัน" },
              { key: "monthly", label: "รายเดือน" },
              { key: "yearly",  label: "รายปี" },
            ] as { key: DashboardView; label: string }[]).map((v) => (
              <button
                key={v.key}
                onClick={() => setDashboardView(v.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  dashboardView === v.key ? "bg-white shadow-sm text-[#112240]" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {dashboardLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
        ) : chartData.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">ยังไม่มีข้อมูล</div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="total" name="ส่งเข้ามา" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="reviewed" name="ตรวจสอบแล้ว" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" name="ค้าง/รอตรวจสอบ" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
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
              { s: "REPEAT",                     l: "🔁 ซ้ำ" },
            ].map(b => (
              <button key={b.s} onClick={() => bulkUpdate(b.s)} disabled={updating || deleting !== null}
                className="px-3 py-1.5 bg-white border rounded-lg text-xs font-medium hover:bg-gray-50 disabled:opacity-50">
                {b.l}
              </button>
            ))}
            <button onClick={() => deleteIds([...selected])} disabled={updating || deleting !== null}
              className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 disabled:opacity-50 flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" />ลบ
            </button>
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
                  <th className="px-3 py-3 text-center w-28">ลิงก์</th>
                  <th className="px-3 py-3 text-left w-40">ชื่อโครงการ</th>
                  <th className="px-3 py-3 text-left w-32">ประเภท</th>
                  <th className="px-3 py-3 text-left w-32">ราคา</th>
                  <th className="px-3 py-3 text-left w-36">สถานีใกล้เคียง</th>
                  <th className="px-3 py-3 text-left w-24">เข้าอยู่ได้</th>
                  <th className="px-3 py-3 text-left w-28">ผู้ส่ง</th>
                  <th className="px-3 py-3 text-left w-24">วันที่</th>
                  <th className="px-3 py-3 text-left w-40">สถานะ</th>
                  <th className="px-3 py-3 text-left w-28">ตรวจสอบโดย</th>
                  <th className="px-3 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map(r => {
                  const p = r.property;
                  const stations = p ? parseStations(p.nearbyStations) : [];
                  return (
                  <tr key={r.id} className={`hover:bg-gray-50 transition-colors ${selected.has(r.id) ? "bg-indigo-50" : ""}`}>
                    <td className="pl-4 pr-2 py-3">
                      <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} className="rounded" />
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-bold text-amber-600">#{r.dailySeq || r.id}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <a href={r.url} target="_blank" rel="noopener noreferrer" title={r.url}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors whitespace-nowrap">
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />เปิดลิงก์
                      </a>
                    </td>
                    <td className="px-3 py-3 text-gray-700 max-w-[10rem] truncate" title={p?.projectName || undefined}>
                      {p?.projectName || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-3 text-gray-600 text-xs">
                      {p ? (
                        <>
                          {PROPERTY_TYPE_LABEL[p.propertyType] || p.propertyType}
                          <span className="text-gray-300"> · </span>
                          {LISTING_TYPE_LABEL[p.listingType] || p.listingType}
                        </>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-3 text-gray-700 text-xs">
                      {p ? (
                        <div className="space-y-0.5">
                          {p.price > 0 && <div>เช่า ฿{fmtMoney(p.price)}</div>}
                          {p.salePrice != null && p.salePrice > 0 && <div>ขาย ฿{fmtMoney(p.salePrice)}</div>}
                          {!(p.price > 0) && !(p.salePrice != null && p.salePrice > 0) && <span className="text-gray-300">—</span>}
                        </div>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {stations.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {stations.slice(0, 2).map((code) => (
                            <span key={code} className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-medium">
                              {getStationName(code)}
                            </span>
                          ))}
                          {stations.length > 2 && (
                            <span className="text-gray-400 text-[10px]">+{stations.length - 2}</span>
                          )}
                        </div>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-3 text-gray-500 text-xs">
                      {p?.availableDate
                        ? new Date(p.availableDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })
                        : p ? "พร้อมอยู่" : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-3 text-gray-700">{r.sentBy || "—"}</td>
                    <td className="px-3 py-3 text-gray-500 text-xs">{r.dateKey}</td>
                    <td className="px-3 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-3 py-3 text-gray-500 text-xs">{r.reviewedBy || "—"}</td>
                    <td className="px-3 py-3">
                      <button onClick={() => deleteIds([r.id])} disabled={deleting === r.id || updating}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                        title="ลบรายการ">
                        {deleting === r.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                  </tr>
                  );
                })}
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
