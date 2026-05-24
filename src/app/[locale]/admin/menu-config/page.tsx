"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Save, RotateCcw, CheckCircle2 } from "lucide-react";

const TIERS = ["STANDARD", "PRO", "ELITE", "ADMIN"] as const;
type Tier = (typeof TIERS)[number];

// Two groups — "admin-only" keys can only appear in ADMIN column,
// "shared" keys can be enabled for any role including agents.
const MENU_ITEMS = [
  // ─── Admin-only pages ─────────────────────────────────────────────────────
  { key: "dashboard",              labelTh: "Dashboard (Admin)",            labelEn: "Dashboard (Admin)",    group: "admin" },
  { key: "users",                  labelTh: "จัดการผู้ใช้",                  labelEn: "User Management",      group: "admin" },
  { key: "subscriptions",          labelTh: "จัดการ Package",               labelEn: "Subscriptions",        group: "admin" },
  { key: "menu-config",            labelTh: "เมนูตาม Package",              labelEn: "Menu Config",          group: "admin" },
  { key: "settings",               labelTh: "ตั้งค่า",                       labelEn: "Settings",             group: "admin" },
  { key: "languages",              labelTh: "ตั้งค่าภาษา",                  labelEn: "Language Settings",    group: "admin" },
  // ─── Shared pages (Admin + Agent Workspace) ───────────────────────────────
  { key: "agent-dashboard",        labelTh: "ภาพรวม (Agent Dashboard)",     labelEn: "Agent Dashboard",      group: "shared" },
  { key: "properties",             labelTh: "ทรัพย์สิน",                     labelEn: "Properties",           group: "shared" },
  { key: "projects",               labelTh: "โครงการ",                       labelEn: "Projects",             group: "shared" },
  { key: "contracts",              labelTh: "สัญญาเช่า",                     labelEn: "Contracts",            group: "shared" },
  { key: "closed-contracts",       labelTh: "สัญญาที่ปิดแล้ว",               labelEn: "Closed Contracts",     group: "shared" },
  { key: "electricity-calculator", labelTh: "คำนวณค่าไฟ",                   labelEn: "Electricity Calc",     group: "shared" },
  { key: "accounting",             labelTh: "งบการเงิน / บัญชี",             labelEn: "Accounting",           group: "shared" },
  { key: "messages",               labelTh: "ข้อความติดต่อ",                  labelEn: "Messages",             group: "shared" },
  { key: "reviews",                labelTh: "รีวิว",                         labelEn: "Reviews",              group: "shared" },
  { key: "portfolio",              labelTh: "Portfolio",                    labelEn: "Portfolio",            group: "shared" },
  { key: "articles",               labelTh: "บทความ",                        labelEn: "Articles",             group: "shared" },
];

const ALL_KEYS = [...new Set(MENU_ITEMS.map((m) => m.key))];

const DEFAULT_CONFIG: Record<Tier, string[]> = {
  STANDARD: ["agent-dashboard", "properties"],
  PRO:      ["agent-dashboard", "properties", "projects", "contracts", "electricity-calculator", "accounting"],
  ELITE:    ["agent-dashboard", "properties", "projects", "contracts", "closed-contracts", "electricity-calculator", "accounting", "messages", "reviews"],
  ADMIN:    ALL_KEYS,
};

const TIER_META: Record<Tier, { color: string; badge: string; desc: string }> = {
  STANDARD: { color: "text-gray-700 bg-gray-100",   badge: "Standard", desc: "แพ็กเกจพื้นฐาน" },
  PRO:      { color: "text-blue-700 bg-blue-100",    badge: "Pro",      desc: "แพ็กเกจโปร" },
  ELITE:    { color: "text-amber-700 bg-amber-100",  badge: "Elite",    desc: "แพ็กเกจพรีเมียม" },
  ADMIN:    { color: "text-purple-700 bg-purple-100",badge: "Admin",    desc: "ผู้ดูแลระบบ" },
};

const GROUP_LABEL: Record<string, string> = {
  admin:  "Admin เท่านั้น",
  shared: "ใช้งานได้ทุก Role",
};

export default function MenuConfigPage() {
  const [config, setConfig] = useState<Record<Tier, string[]>>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/menu-config");
      const d = await res.json();
      if (d.success) setConfig(d.data);
    } catch {
      // keep defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const toggle = (tier: Tier, key: string) => {
    setConfig((prev) => {
      const current = prev[tier] ?? [];
      const next = current.includes(key)
        ? current.filter((k) => k !== key)
        : [...current, key];
      return { ...prev, [tier]: next };
    });
    setSaved(false);
  };

  const toggleAll = (tier: Tier) => {
    const current = config[tier] ?? [];
    const allChecked = ALL_KEYS.every((k) => current.includes(k));
    setConfig((prev) => ({ ...prev, [tier]: allChecked ? [] : ALL_KEYS }));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/menu-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error || "Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = () => {
    setConfig(DEFAULT_CONFIG);
    setSaved(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const groups = ["admin", "shared"] as const;

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">จัดการเมนูตาม Package</h1>
        <p className="text-sm text-gray-500 mt-1">
          กำหนดสิทธิ์การเข้าถึงเมนูสำหรับแต่ละ Package / Role
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="grid border-b border-gray-200 bg-gray-50" style={{ gridTemplateColumns: "1fr repeat(4, 110px)" }}>
          <div className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">เมนู / Feature</div>
          {TIERS.map((tier) => (
            <div key={tier} className="px-2 py-3 text-center">
              <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${TIER_META[tier].color}`}>
                {TIER_META[tier].badge}
              </span>
              {/* Select-all toggle */}
              <button
                onClick={() => toggleAll(tier)}
                className="block mx-auto mt-1.5 text-[10px] text-gray-400 hover:text-blue-500 transition-colors"
              >
                {ALL_KEYS.every((k) => (config[tier] ?? []).includes(k)) ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
              </button>
            </div>
          ))}
        </div>

        {/* Rows grouped by section */}
        {groups.map((group) => {
          const items = MENU_ITEMS.filter((m) => m.group === group);
          return (
            <div key={group}>
              {/* Group header */}
              <div className="px-5 py-2 bg-gray-50/60 border-y border-gray-100">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  {GROUP_LABEL[group]}
                </span>
              </div>

              {items.map((item, idx) => (
                <div
                  key={item.key}
                  className={`grid items-center ${idx !== items.length - 1 ? "border-b border-gray-100" : ""}`}
                  style={{ gridTemplateColumns: "1fr repeat(4, 110px)" }}
                >
                  <div className="px-5 py-3.5">
                    <div className="text-sm font-medium text-gray-800">{item.labelTh}</div>
                    <div className="text-xs text-gray-400">{item.labelEn}</div>
                  </div>
                  {TIERS.map((tier) => {
                    const checked = (config[tier] ?? []).includes(item.key);
                    return (
                      <div key={tier} className="px-2 py-3.5 flex justify-center">
                        <button
                          onClick={() => toggle(tier, item.key)}
                          className={`w-5 h-5 rounded flex items-center justify-center transition-colors border-2 flex-shrink-0 ${
                            checked
                              ? tier === "ADMIN"
                                ? "bg-purple-600 border-purple-600 text-white"
                                : "bg-blue-600 border-blue-600 text-white"
                              : "border-gray-300 bg-white hover:border-blue-400"
                          }`}
                        >
                          {checked && (
                            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3 mt-4">
        {TIERS.map((tier) => (
          <div key={tier} className="bg-white rounded-lg border border-gray-200 p-3">
            <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-2 ${TIER_META[tier].color}`}>
              {TIER_META[tier].badge}
            </span>
            <div className="text-xs text-gray-500 mb-1.5">{TIER_META[tier].desc}</div>
            <div className="text-lg font-bold text-gray-800">
              {(config[tier] ?? []).length}
              <span className="text-xs font-normal text-gray-400"> / {ALL_KEYS.length} เมนู</span>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-5">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
        </button>
        <button
          onClick={resetDefaults}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 px-4 py-2.5 rounded-lg text-sm border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          รีเซ็ตเป็นค่าเริ่มต้น
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            บันทึกสำเร็จ
          </span>
        )}
      </div>
    </div>
  );
}
