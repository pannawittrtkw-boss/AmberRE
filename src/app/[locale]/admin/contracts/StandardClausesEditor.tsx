"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, RotateCcw } from "lucide-react";
import {
  STANDARD_CLAUSES,
  ClauseOverrideMap,
  type ContractClause,
  type ClauseType,
} from "@/lib/contract-clauses";

interface Props {
  /**
   * Current overrides — keyed by clause.key. Empty/missing overrides fall
   * through to the standard text shown next to each input.
   */
  value: ClauseOverrideMap;
  onChange: (overrides: ClauseOverrideMap) => void;
  locale: string;
}

const inputCls =
  "w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A951]/30 focus:border-[#C8A951]";

const TYPE_LABEL: Record<ClauseType, { th: string; en: string }> = {
  section_bar: { th: "หัวข้อ section", en: "Section header" },
  paragraph: { th: "ย่อหน้า", en: "Paragraph" },
  bullet: { th: "ข้อย่อย", en: "Bullet" },
  sub_bullet: { th: "ข้อย่อย (ลึก)", en: "Sub-bullet" },
  small: { th: "หมายเหตุเล็ก", en: "Small note" },
};

// Group clauses by section for collapsible UI
function groupClauses(clauses: ContractClause[]): {
  title: string;
  items: ContractClause[];
}[] {
  const groups: Record<string, ContractClause[]> = {};
  for (const c of clauses) {
    // Section group is the part before the first dot, or "section.X"
    const section = c.key.startsWith("section.")
      ? c.key.slice("section.".length)
      : c.key.split(".")[0];
    if (!groups[section]) groups[section] = [];
    groups[section].push(c);
  }
  return Object.entries(groups).map(([sec, items]) => ({
    title: `Section ${sec}`,
    items,
  }));
}

export default function StandardClausesEditor({ value, onChange, locale }: Props) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggle = (title: string) =>
    setOpenSections((s) => ({ ...s, [title]: !s[title] }));

  const setOverride = (key: string, lang: "th" | "en", text: string) => {
    const current = value[key] || {};
    const next: ClauseOverrideMap = { ...value };
    if (text.trim() === "") {
      // Clear the override on this language so it falls back to standard
      const cleared = { ...current };
      delete cleared[lang];
      if (Object.keys(cleared).length === 0) delete next[key];
      else next[key] = cleared;
    } else {
      next[key] = { ...current, [lang]: text };
    }
    onChange(next);
  };

  const resetClause = (key: string) => {
    const next = { ...value };
    delete next[key];
    onChange(next);
  };

  const groups = groupClauses(STANDARD_CLAUSES);
  const overrideCount = Object.keys(value).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-stone-500">
        <span>
          {locale === "th"
            ? `แก้ไขเฉพาะข้อที่ต้องการ — ${overrideCount} ข้อ จาก ${STANDARD_CLAUSES.length} ข้อ ถูกแก้`
            : `Edit only the clauses you need — ${overrideCount} of ${STANDARD_CLAUSES.length} clauses overridden`}
        </span>
        {overrideCount > 0 && (
          <button
            type="button"
            onClick={() => onChange({})}
            className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700"
          >
            <RotateCcw className="w-3 h-3" />
            {locale === "th" ? "รีเซ็ตทั้งหมด" : "Reset all"}
          </button>
        )}
      </div>

      {groups.map((group) => {
        const open = !!openSections[group.title];
        const editedInGroup = group.items.filter((c) => value[c.key]).length;
        return (
          <div
            key={group.title}
            className="border border-stone-200 rounded-xl overflow-hidden"
          >
            <button
              type="button"
              onClick={() => toggle(group.title)}
              className="w-full flex items-center justify-between px-4 py-3 bg-stone-50 hover:bg-stone-100"
            >
              <div className="flex items-center gap-2">
                {open ? (
                  <ChevronDown className="w-4 h-4 text-stone-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-stone-500" />
                )}
                <span className="font-semibold text-sm text-stone-700">
                  {group.title}
                </span>
                <span className="text-xs text-stone-400">
                  ({group.items.length})
                </span>
              </div>
              {editedInGroup > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  {locale === "th"
                    ? `แก้แล้ว ${editedInGroup}`
                    : `${editedInGroup} edited`}
                </span>
              )}
            </button>
            {open && (
              <div className="divide-y divide-stone-100">
                {group.items.map((clause) => {
                  const override = value[clause.key] || {};
                  const isEdited = override.th !== undefined || override.en !== undefined;
                  return (
                    <div
                      key={clause.key}
                      className={`px-4 py-3 space-y-2 ${
                        isEdited ? "bg-amber-50/40" : "bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono font-semibold text-stone-700">
                            {clause.key}
                          </span>
                          <span className="text-stone-400">
                            ({TYPE_LABEL[clause.type][locale === "th" ? "th" : "en"]})
                          </span>
                          {isEdited && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              {locale === "th" ? "แก้แล้ว" : "edited"}
                            </span>
                          )}
                        </div>
                        {isEdited && (
                          <button
                            type="button"
                            onClick={() => resetClause(clause.key)}
                            className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-rose-600"
                          >
                            <RotateCcw className="w-3 h-3" />
                            {locale === "th" ? "Reset" : "Reset"}
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] text-stone-500 mb-1">
                            {locale === "th" ? "ภาษาไทย (มาตรฐาน)" : "Thai (standard)"}
                          </label>
                          <p className="text-[11px] text-stone-400 mb-1 line-clamp-2 italic">
                            {clause.th}
                          </p>
                          <textarea
                            rows={3}
                            value={override.th ?? ""}
                            onChange={(e) =>
                              setOverride(clause.key, "th", e.target.value)
                            }
                            placeholder={
                              locale === "th"
                                ? "(ปล่อยว่างเพื่อใช้ข้อความมาตรฐาน)"
                                : "(leave empty to use standard text)"
                            }
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-stone-500 mb-1">
                            {locale === "th"
                              ? "ภาษาอังกฤษ (มาตรฐาน)"
                              : "English (standard)"}
                          </label>
                          <p className="text-[11px] text-stone-400 mb-1 line-clamp-2 italic">
                            {clause.en}
                          </p>
                          <textarea
                            rows={3}
                            value={override.en ?? ""}
                            onChange={(e) =>
                              setOverride(clause.key, "en", e.target.value)
                            }
                            placeholder="(leave empty to use standard)"
                            className={inputCls}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
