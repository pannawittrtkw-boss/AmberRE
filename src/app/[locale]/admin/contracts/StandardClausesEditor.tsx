"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Info,
  Loader2,
} from "lucide-react";
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

  // Hold latest override map in a ref so debounced async work always
  // sees current state without stale-closure bugs.
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const [translating, setTranslating] = useState<Record<string, boolean>>({});

  const setOverrideMap = (next: ClauseOverrideMap) => {
    valueRef.current = next;
    onChange(next);
  };

  const setOverride = (
    clause: ContractClause,
    lang: "th" | "en",
    text: string
  ) => {
    const current = valueRef.current[clause.key] || {};
    const next: ClauseOverrideMap = { ...valueRef.current };
    const standardText = clause[lang];
    // Treat "matches the standard exactly" as no-override so the clause
    // falls back automatically. Lets the textarea start out pre-filled
    // with the standard copy without dirtying every clause.
    if (text === standardText || text.trim() === "") {
      const cleared = { ...current };
      delete cleared[lang];
      if (Object.keys(cleared).length === 0) delete next[clause.key];
      else next[clause.key] = cleared;
    } else {
      next[clause.key] = { ...current, [lang]: text };
    }
    setOverrideMap(next);
  };

  // Debounced auto-translate: when Thai changes and differs from the
  // standard, hit /api/admin/translate after 800ms idle and store the
  // translated English as an override on the same clause.
  const translateTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const scheduleTranslate = (clause: ContractClause, thaiText: string) => {
    const key = clause.key;
    const existing = translateTimers.current[key];
    if (existing) clearTimeout(existing);

    if (thaiText.trim() === "" || thaiText === clause.th) {
      // Thai is back to standard / empty — clear any English override too
      const current = valueRef.current[key];
      if (current?.en !== undefined) {
        const next = { ...valueRef.current };
        const cleared = { ...current };
        delete cleared.en;
        if (Object.keys(cleared).length === 0) delete next[key];
        else next[key] = cleared;
        setOverrideMap(next);
      }
      return;
    }

    translateTimers.current[key] = setTimeout(async () => {
      setTranslating((s) => ({ ...s, [key]: true }));
      try {
        const res = await fetch("/api/admin/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: thaiText, source: "th", target: "en" }),
        });
        const data = await res.json();
        if (data?.success && typeof data.data?.text === "string") {
          const translated = data.data.text;
          const next = { ...valueRef.current };
          const cur = next[key] || {};
          // Only set EN override if the translation differs from standard
          if (translated && translated !== clause.en) {
            next[key] = { ...cur, en: translated };
          } else {
            const cleared = { ...cur };
            delete cleared.en;
            if (Object.keys(cleared).length === 0) delete next[key];
            else next[key] = cleared;
          }
          setOverrideMap(next);
        }
      } catch {
        // Translation failed — leave EN as standard (no override)
      } finally {
        setTranslating((s) => {
          const copy = { ...s };
          delete copy[key];
          return copy;
        });
      }
    }, 800);
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

                      <div>
                        <label className="block text-[11px] text-stone-500 mb-1">
                          {locale === "th" ? "ภาษาไทย" : "Thai"}
                        </label>
                        <textarea
                          rows={Math.max(3, Math.ceil(clause.th.length / 60))}
                          value={override.th ?? clause.th}
                          onChange={(e) => {
                            const newTh = e.target.value;
                            setOverride(clause, "th", newTh);
                            scheduleTranslate(clause, newTh);
                          }}
                          className={inputCls}
                        />
                        <div className="flex items-center justify-between mt-1.5">
                          <p className="text-[11px] text-stone-500">
                            {locale === "th"
                              ? "ภาษาอังกฤษ (แปลอัตโนมัติ)"
                              : "English (auto-translated)"}
                          </p>
                          {translating[clause.key] && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-stone-400">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              {locale === "th" ? "กำลังแปล..." : "Translating..."}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-600 italic px-3 py-2 rounded-lg bg-stone-50 border border-stone-200">
                          {override.en ?? clause.en}
                        </p>
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
