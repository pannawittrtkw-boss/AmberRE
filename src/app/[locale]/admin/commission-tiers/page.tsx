"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Save, Plus, Trash2, CheckCircle2 } from "lucide-react";

interface Tier {
  dealCategory: "RENT" | "SALE";
  minAmount: number;
  maxAmount: number | null;
  agentPercent: number;
  sortOrder: number;
}

const CATEGORY_LABEL: Record<string, string> = {
  RENT: "งานเช่า",
  SALE: "งานขาย",
};

export default function CommissionTiersPage() {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTiers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/commission-tiers");
      const d = await res.json();
      if (d.success) setTiers(d.data);
    } catch {
      // keep whatever's already loaded
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTiers(); }, [fetchTiers]);

  const updateTier = (idx: number, patch: Partial<Tier>) => {
    setTiers((prev) => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
    setSaved(false);
  };

  const addTier = (category: "RENT" | "SALE") => {
    setTiers((prev) => [
      ...prev,
      {
        dealCategory: category,
        minAmount: 0,
        maxAmount: null,
        agentPercent: 0,
        sortOrder: prev.filter((t) => t.dealCategory === category).length,
      },
    ]);
    setSaved(false);
  };

  const removeTier = (idx: number) => {
    setTiers((prev) => prev.filter((_, i) => i !== idx));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/commission-tiers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tiers }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error || "Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      fetchTiers();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const groups: Array<"RENT" | "SALE"> = ["RENT", "SALE"];

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ตั้งค่าค่าคอมมิชชั่น Agent</h1>
        <p className="text-sm text-gray-500 mt-1">
          กำหนดช่วงยอดค่าคอมของบริษัทต่อเดือน และสัดส่วนที่ Agent ได้รับในแต่ละช่วง
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {groups.map((group) => {
        const rows = tiers
          .map((t, idx) => ({ t, idx }))
          .filter(({ t }) => t.dealCategory === group);

        return (
          <div key={group} className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">{CATEGORY_LABEL[group]}</h2>
              <button
                onClick={() => addTier(group)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              >
                <Plus className="w-3.5 h-3.5" />
                เพิ่มช่วง
              </button>
            </div>

            {rows.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">ยังไม่มีช่วงยอดสำหรับ{CATEGORY_LABEL[group]}</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50/60 text-xs text-gray-400">
                  <tr>
                    <th className="text-left px-5 py-2 font-medium">ยอดค่าคอมขั้นต่ำ (บาท)</th>
                    <th className="text-left px-5 py-2 font-medium">ยอดค่าคอมสูงสุด (บาท)</th>
                    <th className="text-left px-5 py-2 font-medium">Agent ได้ (%)</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ t, idx }) => (
                    <tr key={idx} className="border-t border-gray-100">
                      <td className="px-5 py-2.5">
                        <input
                          type="number"
                          value={t.minAmount}
                          onChange={(e) => updateTier(idx, { minAmount: Number(e.target.value) })}
                          className="w-32 border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                        />
                      </td>
                      <td className="px-5 py-2.5">
                        <input
                          type="number"
                          value={t.maxAmount ?? ""}
                          placeholder="ไม่จำกัด"
                          onChange={(e) =>
                            updateTier(idx, { maxAmount: e.target.value === "" ? null : Number(e.target.value) })
                          }
                          className="w-32 border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                        />
                      </td>
                      <td className="px-5 py-2.5">
                        <input
                          type="number"
                          value={t.agentPercent}
                          onChange={(e) => updateTier(idx, { agentPercent: Number(e.target.value) })}
                          className="w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                        />
                      </td>
                      <td className="px-2 py-2.5">
                        <button onClick={() => removeTier(idx)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })}

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
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
