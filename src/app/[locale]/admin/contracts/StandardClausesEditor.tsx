"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, RotateCcw, Info } from "lucide-react";
import {
  STANDARD_CLAUSES,
  ClauseOverrideMap,
  type ContractClause,
  type ClauseType,
} from "@/lib/contract-clauses";

interface Props {
  /**
   * Current overrides — keyed by clause.key. Empty/missing overrides fall
   * through to the baseline (if provided) and then to STANDARD_CLAUSES.
   */
  value: ClauseOverrideMap;
  onChange: (overrides: ClauseOverrideMap) => void;
  locale: string;
  /**
   * Optional whitelist of section identifiers (e.g. ["5", "6", "7"]). When
   * set, the editor only renders clauses belonging to those sections.
   * Lets us split the standard editor across multiple tabs / cards
   * (e.g. "sections 2-10" vs "section 11 only").
   */
  sectionsFilter?: string[];
  /**
   * Hide the global summary header ("X of Y clauses overridden" + reset
   * all + the info banner). Useful when this editor is embedded as a
   * sub-section of a larger editor that already shows its own summary.
   */
  hideHeader?: boolean;
  /**
   * Frozen "Standard" snapshot. When provided, the textarea pre-fills
   * with `override[lang] ?? baseline[key][lang] ?? clause[lang]`, and
   * Reset drops the override (falls back to baseline). "Edited" badges
   * track only the override layer above the baseline.
   */
  baseline?: ClauseOverrideMap;
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

export default function StandardClausesEditor({
  value,
  onChange,
  locale,
  sectionsFilter,
  hideHeader,
  baseline,
}: Props) {
  // Effective "standard" text after the baseline layer is applied. This is
  // what an unedited textarea shows, and what we compare against to decide
  // whether the user has actually overridden a clause.
  const standardOf = (clause: ContractClause, lang: "th" | "en"): string => {
    const b = baseline?.[clause.key]?.[lang];
    if (typeof b === "string" && b.length > 0) return b;
    return clause[lang];
  };
  // When the editor is filtered to just one or two sections, expand them
  // by default — there's no point making the user click. Otherwise start
  // collapsed so the page is scannable.
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    () => {
      if (sectionsFilter && sectionsFilter.length <= 2) {
        const out: Record<string, boolean> = {};
        for (const s of sectionsFilter) out[`Section ${s}`] = true;
        return out;
      }
      return {};
    }
  );

  const toggle = (title: string) =>
    setOpenSections((s) => ({ ...s, [title]: !s[title] }));

  const setOverride = (
    clause: ContractClause,
    lang: "th" | "en",
    text: string
  ) => {
    const current = value[clause.key] || {};
    const next: ClauseOverrideMap = { ...value };
    const standardText = standardOf(clause, lang);
    // Treat "matches the standard (baseline-merged) text exactly" as
    // no-override so the clause falls back automatically. Lets the
    // textarea start out pre-filled with the standard copy without
    // dirtying every clause.
    if (text === standardText || text.trim() === "") {
      const cleared = { ...current };
      delete cleared[lang];
      if (Object.keys(cleared).length === 0) delete next[clause.key];
      else next[clause.key] = cleared;
    } else {
      next[clause.key] = { ...current, [lang]: text };
    }
    onChange(next);
  };

  const resetClause = (key: string) => {
    const next = { ...value };
    delete next[key];
    onChange(next);
  };

  const visibleClauses = sectionsFilter
    ? STANDARD_CLAUSES.filter((c) => {
        const section = c.key.startsWith("section.")
          ? c.key.slice("section.".length)
          : c.key.split(".")[0];
        return sectionsFilter.includes(section);
      })
    : STANDARD_CLAUSES;
  const groups = groupClauses(visibleClauses);
  const visibleKeys = new Set(visibleClauses.map((c) => c.key));
  const overrideCount = Object.keys(value).filter((k) =>
    visibleKeys.has(k)
  ).length;

  const resetVisible = () => {
    const next = { ...value };
    for (const k of visibleKeys) delete next[k];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {!hideHeader && (
        <>
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-900">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p>
                {locale === "th"
                  ? "ระบบเติมข้อความมาตรฐานให้แล้ว — แก้เฉพาะส่วนที่ต้องการได้เลย ถ้าข้อความตรงกับมาตรฐานจะไม่บันทึกเป็น override (ใช้ข้อความมาตรฐานเดิม)"
                  : "Each clause is pre-filled with the standard text — edit just the parts you want to change. Untouched clauses are not saved as overrides."}
              </p>
              <p className="text-[11px] text-blue-700">
                {locale === "th"
                  ? "ตัวแปร {{ค่าเช่า}}, {{เงินประกัน}}, ... จะถูกเติมข้อมูลของสัญญาแต่ละฉบับอัตโนมัติเวลาสร้าง PDF — อย่าลบออก แต่จัดวาง/แก้ข้อความรอบๆ ได้"
                  : "Tokens like {{monthlyRent}}, {{securityDeposit}}, ... are filled per contract at PDF render time. Keep them intact; you can rearrange the text around them."}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>
              {locale === "th"
                ? `แก้ไขเฉพาะข้อที่ต้องการ — ${overrideCount} ข้อ จาก ${visibleClauses.length} ข้อ ถูกแก้`
                : `Edit only the clauses you need — ${overrideCount} of ${visibleClauses.length} clauses overridden`}
            </span>
            {overrideCount > 0 && (
              <button
                type="button"
                onClick={resetVisible}
                className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700"
              >
                <RotateCcw className="w-3 h-3" />
                {locale === "th" ? "รีเซ็ตทั้งหมด" : "Reset all"}
              </button>
            )}
          </div>
        </>
      )}

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
                            {locale === "th" ? "ภาษาไทย" : "Thai"}
                          </label>
                          <textarea
                            rows={Math.max(3, Math.ceil(standardOf(clause, "th").length / 60))}
                            value={override.th ?? standardOf(clause, "th")}
                            onChange={(e) =>
                              setOverride(clause, "th", e.target.value)
                            }
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-stone-500 mb-1">
                            English
                          </label>
                          <textarea
                            rows={Math.max(3, Math.ceil(standardOf(clause, "en").length / 60))}
                            value={override.en ?? standardOf(clause, "en")}
                            onChange={(e) =>
                              setOverride(clause, "en", e.target.value)
                            }
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
