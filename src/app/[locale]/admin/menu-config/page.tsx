"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Save, RotateCcw, CheckCircle2 } from "lucide-react";

const TIERS = ["STANDARD", "PRO", "ELITE"] as const;
type Tier = (typeof TIERS)[number];

const MENU_ITEMS = [
  { key: "properties",             label: "ทรัพย์ของฉัน",        labelEn: "My Properties" },
  { key: "contracts",              label: "สัญญาเช่า",           labelEn: "Contracts" },
  { key: "electricity-calculator", label: "คำนวณค่าไฟ",          labelEn: "Electricity Calculator" },
  { key: "accounting",             label: "บัญชี / รายรับ-รายจ่าย", labelEn: "Accounting" },
];

const TIER_LABEL: Record<Tier, { color: string; badge: string }> = {
  STANDARD: { color: "text-gray-700 bg-gray-100",  badge: "Standard" },
  PRO:      { color: "text-blue-700 bg-blue-100",   badge: "Pro" },
  ELITE:    { color: "text-amber-700 bg-amber-100", badge: "Elite" },
};

const DEFAULT_CONFIG: Record<Tier, string[]> = {
  STANDARD: ["properties"],
  PRO: ["properties", "contracts", "electricity-calculator"],
  ELITE: ["properties", "contracts", "electricity-calculator", "accounting"],
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

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">จัดการเมนูตาม Package</h1>
        <p className="text-sm text-gray-500 mt-1">
          กำหนดว่า Agent แต่ละ Package จะสามารถเข้าใช้งานหน้าใดได้บ้าง
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_repeat(3,_120px)] bg-gray-50 border-b border-gray-200">
          <div className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            ฟีเจอร์ / Feature
          </div>
          {TIERS.map((tier) => (
            <div key={tier} className="px-3 py-3 text-center">
              <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${TIER_LABEL[tier].color}`}>
                {TIER_LABEL[tier].badge}
              </span>
            </div>
          ))}
        </div>

        {/* Feature rows */}
        {MENU_ITEMS.map((item, idx) => (
          <div
            key={item.key}
            className={`grid grid-cols-[1fr_repeat(3,_120px)] items-center ${
              idx !== MENU_ITEMS.length - 1 ? "border-b border-gray-100" : ""
            }`}
          >
            <div className="px-5 py-4">
              <div className="text-sm font-medium text-gray-800">{item.label}</div>
              <div className="text-xs text-gray-400">{item.labelEn}</div>
            </div>
            {TIERS.map((tier) => {
              const checked = (config[tier] ?? []).includes(item.key);
              return (
                <div key={tier} className="px-3 py-4 flex justify-center">
                  <button
                    onClick={() => toggle(tier, item.key)}
                    className={`w-6 h-6 rounded flex items-center justify-center transition-colors border-2 ${
                      checked
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "border-gray-300 bg-white hover:border-blue-400"
                    }`}
                    title={checked ? "คลิกเพื่อปิดการใช้งาน" : "คลิกเพื่อเปิดการใช้งาน"}
                  >
                    {checked && (
                      <svg className="w-3.5 h-3.5" viewBox="0 0 12 12" fill="none">
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

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        {TIERS.map((tier) => (
          <div key={tier} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-2 ${TIER_LABEL[tier].color}`}>
              {TIER_LABEL[tier].badge}
            </div>
            <ul className="space-y-1">
              {MENU_ITEMS.map((item) => {
                const has = (config[tier] ?? []).includes(item.key);
                return (
                  <li key={item.key} className={`text-xs flex items-center gap-1.5 ${has ? "text-gray-700" : "text-gray-300"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${has ? "bg-green-500" : "bg-gray-200"}`} />
                    {item.label}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 mt-6">
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
