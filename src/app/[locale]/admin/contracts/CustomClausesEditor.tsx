"use client";

import { Plus, Trash2, RotateCcw } from "lucide-react";
import type { CustomClause } from "@/lib/contract-clauses";

interface Props {
  value: CustomClause[];
  onChange: (clauses: CustomClause[]) => void;
  onResetFromTemplate?: () => void;
  locale: string;
}

const inputCls =
  "w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A951]/30 focus:border-[#C8A951]";

export default function CustomClausesEditor({
  value,
  onChange,
  onResetFromTemplate,
  locale,
}: Props) {
  const addClause = () => onChange([...value, { th: "", en: "" }]);
  const removeAt = (idx: number) =>
    onChange(value.filter((_, i) => i !== idx));
  const updateAt = (idx: number, patch: Partial<CustomClause>) =>
    onChange(value.map((c, i) => (i === idx ? { ...c, ...patch } : c)));

  return (
    <div className="space-y-3">
      <p className="text-xs text-stone-500">
        {locale === "th"
          ? "ข้อสัญญาเหล่านี้จะถูกเพิ่มต่อท้ายข้อ 11 ของสัญญา (เริ่มเลขที่ 11.7) — แต่ละสัญญาแก้ไขได้อิสระ ไม่กระทบ template"
          : "These clauses are appended after section 11 of the contract (numbered 11.7+). Edits per contract don't affect the global template."}
      </p>

      {value.length === 0 ? (
        <div className="border-2 border-dashed border-stone-200 rounded-xl px-4 py-8 text-center text-sm text-stone-400">
          {locale === "th"
            ? "ยังไม่มีข้อสัญญาเพิ่มเติม"
            : "No additional clauses yet"}
        </div>
      ) : (
        <div className="space-y-3">
          {value.map((clause, idx) => (
            <div
              key={idx}
              className="border border-stone-200 rounded-xl p-3 sm:p-4 bg-stone-50/50 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-700">
                  11.{idx + 7}
                </span>
                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {locale === "th" ? "ลบ" : "Remove"}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-stone-500 mb-1">
                    {locale === "th" ? "ภาษาไทย" : "Thai"}
                  </label>
                  <textarea
                    rows={3}
                    value={clause.th}
                    onChange={(e) => updateAt(idx, { th: e.target.value })}
                    placeholder={
                      locale === "th"
                        ? "เช่น ห้ามนำสัตว์เลี้ยงเข้ามาในห้อง"
                        : "e.g. ห้ามนำสัตว์เลี้ยงเข้ามาในห้อง"
                    }
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs text-stone-500 mb-1">
                    English
                  </label>
                  <textarea
                    rows={3}
                    value={clause.en}
                    onChange={(e) => updateAt(idx, { en: e.target.value })}
                    placeholder="e.g. No pets allowed in the unit."
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={addClause}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#C8A951] hover:bg-[#B8993F] text-white text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          {locale === "th" ? "เพิ่มข้อสัญญา" : "Add clause"}
        </button>
        {onResetFromTemplate && (
          <button
            type="button"
            onClick={onResetFromTemplate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-700 text-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {locale === "th"
              ? "โหลดจาก template มาตรฐาน"
              : "Reset from template"}
          </button>
        )}
      </div>
    </div>
  );
}
