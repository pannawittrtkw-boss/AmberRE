"use client";

import { useState, useEffect, useCallback } from "react";
import { Crown, Loader2, Search, RefreshCw, Calendar, Users, Unlock, TrendingUp } from "lucide-react";

type Agent = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  subscriptionTier: string;
  tierExpiredAt: string | null;
  isActive: boolean;
  createdAt: string;
  coAgentApplication: { companyName: string | null; status: string } | null;
  unlocksTotal: number;
  unlocksThisMonth: number;
};

const TIERS = ["STANDARD", "PRO", "ELITE"] as const;

const TIER_STYLE: Record<string, { badge: string; row: string }> = {
  STANDARD: { badge: "bg-stone-100 text-stone-700 border border-stone-200", row: "" },
  PRO:      { badge: "bg-blue-50 text-blue-700 border border-blue-200",     row: "bg-blue-50/30" },
  ELITE:    { badge: "bg-amber-50 text-amber-700 border border-amber-200",  row: "bg-amber-50/30" },
};

const QUOTA: Record<string, number | null> = { STANDARD: 5, PRO: null, ELITE: null };

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function isExpired(tierExpiredAt: string | null) {
  if (!tierExpiredAt) return false;
  return new Date(tierExpiredAt) < new Date();
}

export default function SubscriptionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const [locale, setLocale] = useState("th");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ tier: string; expiry: string }>({ tier: "STANDARD", expiry: "" });

  useEffect(() => {
    params.then(({ locale: l }) => setLocale(l));
  }, [params]);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/subscriptions");
    const d = await res.json();
    if (d.success) setAgents(d.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  const startEdit = (agent: Agent) => {
    setEditingId(agent.id);
    setEditForm({
      tier: agent.subscriptionTier,
      expiry: agent.tierExpiredAt ? agent.tierExpiredAt.slice(0, 10) : "",
    });
  };

  const saveEdit = async (agentId: number) => {
    setSaving(agentId);
    await fetch("/api/admin/subscriptions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: agentId,
        tier: editForm.tier,
        tierExpiredAt: editForm.expiry || null,
      }),
    });
    setEditingId(null);
    setSaving(null);
    fetchAgents();
  };

  const filtered = agents.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.firstName.toLowerCase().includes(q) ||
      a.lastName.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.coAgentApplication?.companyName || "").toLowerCase().includes(q)
    );
  });

  // Summary stats
  const counts = agents.reduce((acc, a) => {
    acc[a.subscriptionTier] = (acc[a.subscriptionTier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalUnlocksMonth = agents.reduce((s, a) => s + a.unlocksThisMonth, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {locale === "th" ? "จัดการ Package / Subscription" : "Package Management"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {locale === "th" ? "ควบคุมแผนบริการและโควตาของ Agent แต่ละราย" : "Control agent plans and contact-unlock quotas"}
          </p>
        </div>
        <button onClick={fetchAgents} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg border hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" />
          {locale === "th" ? "รีเฟรช" : "Refresh"}
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <SummaryCard icon={<Users className="w-5 h-5 text-stone-500" />} label="Total Agents" value={agents.length} color="stone" />
        <SummaryCard icon={<Crown className="w-5 h-5 text-blue-500" />} label="PRO" value={counts.PRO || 0} color="blue" />
        <SummaryCard icon={<Crown className="w-5 h-5 text-amber-500" />} label="ELITE" value={counts.ELITE || 0} color="amber" />
        <SummaryCard icon={<Unlock className="w-5 h-5 text-green-500" />} label={locale === "th" ? "Unlock เดือนนี้" : "Unlocks/month"} value={totalUnlocksMonth} color="green" />
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={locale === "th" ? "ค้นหาชื่อ, อีเมล, บริษัท..." : "Search name, email, company..."}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            {search ? "ไม่พบ Agent ที่ตรงกับการค้นหา" : "ยังไม่มี CO_AGENT ในระบบ"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">{locale === "th" ? "Agent" : "Agent"}</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">{locale === "th" ? "บริษัท" : "Company"}</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">Plan</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">
                    <div className="flex items-center justify-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {locale === "th" ? "วันหมดอายุ" : "Expiry"}
                    </div>
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">
                    <div className="flex items-center justify-center gap-1">
                      <Unlock className="w-3.5 h-3.5" />
                      {locale === "th" ? "Unlock/เดือน" : "Unlocks/mo"}
                    </div>
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">
                    <div className="flex items-center justify-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {locale === "th" ? "ทั้งหมด" : "Total"}
                    </div>
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600">{locale === "th" ? "จัดการ" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((agent) => {
                  const style = TIER_STYLE[agent.subscriptionTier] || TIER_STYLE.STANDARD;
                  const expired = isExpired(agent.tierExpiredAt);
                  const quota = QUOTA[agent.subscriptionTier];
                  const isEditing = editingId === agent.id;

                  return (
                    <tr key={agent.id} className={`border-t hover:bg-gray-50 transition-colors ${style.row}`}>
                      {/* Agent */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{agent.firstName} {agent.lastName}</div>
                        <div className="text-xs text-gray-400">{agent.email}</div>
                        {agent.phone && <div className="text-xs text-gray-400">{agent.phone}</div>}
                      </td>

                      {/* Company */}
                      <td className="py-3 px-4 text-gray-600 text-xs">
                        {agent.coAgentApplication?.companyName || <span className="text-gray-300">Freelance</span>}
                      </td>

                      {/* Plan */}
                      <td className="py-3 px-4 text-center">
                        {isEditing ? (
                          <select
                            value={editForm.tier}
                            onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
                            className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                          >
                            {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${style.badge}`}>
                            {agent.subscriptionTier !== "STANDARD" && <Crown className="w-3 h-3" />}
                            {agent.subscriptionTier}
                          </span>
                        )}
                      </td>

                      {/* Expiry */}
                      <td className="py-3 px-4 text-center">
                        {isEditing ? (
                          <input
                            type="date"
                            value={editForm.expiry}
                            onChange={(e) => setEditForm({ ...editForm, expiry: e.target.value })}
                            className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                          />
                        ) : (
                          <span className={`text-xs ${expired ? "text-red-500 font-medium" : "text-gray-600"}`}>
                            {agent.tierExpiredAt ? (
                              <>
                                {fmtDate(agent.tierExpiredAt)}
                                {expired && <span className="ml-1 text-red-400">(หมดอายุ)</span>}
                              </>
                            ) : (
                              <span className="text-gray-300">ไม่จำกัด</span>
                            )}
                          </span>
                        )}
                      </td>

                      {/* Unlock this month */}
                      <td className="py-3 px-4 text-center">
                        <div className="text-xs">
                          <span className={`font-semibold ${quota !== null && agent.unlocksThisMonth >= quota ? "text-red-500" : "text-gray-700"}`}>
                            {agent.unlocksThisMonth}
                          </span>
                          <span className="text-gray-400">/{quota ?? "∞"}</span>
                        </div>
                        {quota !== null && (
                          <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-16 mx-auto">
                            <div
                              className={`h-full rounded-full ${agent.unlocksThisMonth >= quota ? "bg-red-400" : "bg-blue-400"}`}
                              style={{ width: `${Math.min(100, (agent.unlocksThisMonth / quota) * 100)}%` }}
                            />
                          </div>
                        )}
                      </td>

                      {/* Unlock total */}
                      <td className="py-3 px-4 text-center text-xs text-gray-600">
                        {agent.unlocksTotal}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => saveEdit(agent.id)}
                              disabled={saving === agent.id}
                              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
                            >
                              {saving === agent.id && <Loader2 className="w-3 h-3 animate-spin" />}
                              {locale === "th" ? "บันทึก" : "Save"}
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg border hover:bg-gray-50"
                            >
                              {locale === "th" ? "ยกเลิก" : "Cancel"}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(agent)}
                            className="text-xs text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
                          >
                            {locale === "th" ? "แก้ไข" : "Edit"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-stone-200" />
          STANDARD — 5 unlocks/เดือน
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-300" />
          PRO — ไม่จำกัด
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-300" />
          ELITE — ไม่จำกัด + สิทธิพิเศษ
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    stone: "bg-stone-50 border-stone-200",
    blue:  "bg-blue-50 border-blue-200",
    amber: "bg-amber-50 border-amber-200",
    green: "bg-green-50 border-green-200",
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color] || colors.stone}`}>
      <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs text-gray-500">{label}</span></div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
