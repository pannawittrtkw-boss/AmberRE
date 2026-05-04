"use client";

import { Bilingual, ContractItem } from "@/lib/contract-items";

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
      onChange([]);
    } else {
      onChange(
        options.map((o) => find(o.key) || { key: o.key, qty: 1 })
      );
    }
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
    </div>
  );
}
