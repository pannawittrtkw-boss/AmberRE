"use client";

import { Plus, X } from "lucide-react";
import {
  Bilingual,
  ContractItem,
  isCustomItem,
  makeCustomKey,
} from "@/lib/contract-items";

interface ItemSelectorProps {
  options: Bilingual[];
  value: ContractItem[];
  onChange: (items: ContractItem[]) => void;
  locale: string;
}

export default function ItemSelector({
  options,
  value,
  onChange,
  locale,
}: ItemSelectorProps) {
  const find = (key: string) => value.find((v) => v.key === key);

  const toggle = (key: string) => {
    const sel = find(key);
    if (sel) {
      onChange(value.filter((v) => v.key !== key));
    } else {
      onChange([...value, { key, qty: 1 }]);
    }
  };

  const updateQty = (key: string, qty: number) => {
    onChange(
      value.map((v) => (v.key === key ? { ...v, qty: Math.max(1, qty) } : v))
    );
  };

  const allChecked = options.length > 0 && options.every((o) => find(o.key));

  const toggleAll = () => {
    if (allChecked) {
      // Keep custom rows when "Deselect all" is clicked — those are user
      // input that shouldn't be wiped along with the catalog selections.
      onChange(value.filter((v) => isCustomItem(v)));
    } else {
      const customs = value.filter((v) => isCustomItem(v));
      onChange([
        ...options.map((o) => find(o.key) || { key: o.key, qty: 1 }),
        ...customs,
      ]);
    }
  };

  const customs = value.filter((v) => isCustomItem(v));

  const addCustom = () => {
    onChange([...value, { key: makeCustomKey(), qty: 1, th: "", en: "" }]);
  };

  const updateCustom = (
    key: string,
    patch: Partial<Pick<ContractItem, "th" | "en" | "qty">>
  ) => {
    onChange(
      value.map((v) =>
        v.key === key
          ? {
              ...v,
              ...patch,
              ...(patch.qty != null ? { qty: Math.max(1, patch.qty) } : {}),
            }
          : v
      )
    );
  };

  const removeCustom = (key: string) => {
    onChange(value.filter((v) => v.key !== key));
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={toggleAll}
            className="w-4 h-4 accent-[#C8A951]"
          />
          {locale === "th" ? "เลือกทั้งหมด" : "Select all"}
        </label>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((o) => {
          const sel = find(o.key);
          const checked = !!sel;
          return (
            <label
              key={o.key}
              className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer transition-colors ${
                checked
                  ? "bg-amber-50 border-[#C8A951]"
                  : "bg-white border-stone-200 hover:border-stone-300"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(o.key)}
                className="w-4 h-4 accent-[#C8A951]"
              />
              <span className="flex-1 text-sm">
                {locale === "th" ? `${o.th} / ${o.en}` : `${o.en} / ${o.th}`}
              </span>
              <input
                type="number"
                min={1}
                value={sel?.qty ?? ""}
                placeholder="-"
                disabled={!checked}
                onChange={(e) => updateQty(o.key, Number(e.target.value))}
                onClick={(e) => e.stopPropagation()}
                className="w-14 text-center border rounded-md px-1 py-0.5 text-sm disabled:bg-stone-100 disabled:text-stone-400"
              />
            </label>
          );
        })}
      </div>

      {/* Custom items — visible only on this contract */}
      {customs.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-stone-200">
          <p className="text-xs text-stone-500">
            {locale === "th" ? "รายการที่เพิ่มเอง" : "Custom items"}
          </p>
          {customs.map((c) => (
            <div
              key={c.key}
              className="flex flex-col sm:flex-row gap-2 px-3 py-2 border border-amber-200 bg-amber-50/40 rounded-lg"
            >
              <input
                type="text"
                value={c.th ?? ""}
                onChange={(e) => updateCustom(c.key, { th: e.target.value })}
                placeholder={locale === "th" ? "ชื่อ (ไทย)" : "Name (TH)"}
                className="flex-1 px-2 py-1 text-sm border rounded-md"
              />
              <input
                type="text"
                value={c.en ?? ""}
                onChange={(e) => updateCustom(c.key, { en: e.target.value })}
                placeholder={locale === "th" ? "ชื่อ (EN)" : "Name (EN)"}
                className="flex-1 px-2 py-1 text-sm border rounded-md"
              />
              <input
                type="number"
                min={1}
                value={c.qty}
                onChange={(e) =>
                  updateCustom(c.key, { qty: Number(e.target.value) })
                }
                className="w-16 text-center border rounded-md px-1 py-1 text-sm"
              />
              <button
                type="button"
                onClick={() => removeCustom(c.key)}
                className="inline-flex items-center justify-center w-8 h-8 text-stone-500 hover:text-rose-600 self-center"
                title={locale === "th" ? "ลบรายการ" : "Remove"}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addCustom}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-700 border border-stone-300 hover:bg-stone-50 rounded-lg"
      >
        <Plus className="w-3.5 h-3.5" />
        {locale === "th" ? "เพิ่มรายการเอง" : "Add custom item"}
      </button>
    </div>
  );
}
