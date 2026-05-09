"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Save, Check } from "lucide-react";
import CustomClausesEditor from "../CustomClausesEditor";
import StandardClausesEditor from "../StandardClausesEditor";
import type { CustomClause, ClauseOverrideMap } from "@/lib/contract-clauses";

export default function ContractTemplatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState("th");
  const [appendedClauses, setAppendedClauses] = useState<CustomClause[]>([]);
  const [overrides, setOverrides] = useState<ClauseOverrideMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"override" | "appended">("override");

  useEffect(() => {
    params.then(({ locale: l }) => setLocale(l));
  }, [params]);

  useEffect(() => {
    fetch("/api/admin/contract-defaults")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setAppendedClauses(data.data?.clauses || []);
          setOverrides(data.data?.clauseOverrides || {});
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/contract-defaults", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clauses: appendedClauses,
          clauseOverrides: overrides,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || (locale === "th" ? "บันทึกไม่สำเร็จ" : "Save failed"));
        return;
      }
      setAppendedClauses(data.data?.clauses || []);
      setOverrides(data.data?.clauseOverrides || {});
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError(locale === "th" ? "บันทึกไม่สำเร็จ" : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#C8A951]" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6">
        <Link
          href={`/${locale}/admin/contracts`}
          className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-[#C8A951] self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          {locale === "th" ? "กลับ" : "Back"}
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold">
          {locale === "th"
            ? "Template สัญญา (Standard)"
            : "Contract Template (Standard)"}
        </h1>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 mb-5">
        <p className="font-semibold mb-1">
          {locale === "th" ? "เกี่ยวกับ template" : "About this template"}
        </p>
        <p className="text-xs leading-relaxed">
          {locale === "th"
            ? "การแก้ template ที่นี่จะใช้กับสัญญาที่สร้างใหม่หลังจากนี้เท่านั้น สัญญาเก่าที่มีอยู่แล้วจะคงค่าเดิม (แต่ละสัญญาเก็บสำเนาของตัวเอง) ดังนั้นแก้ template นี้ปลอดภัยไม่กระทบสัญญาเก่า"
            : "Edits here apply to NEW contracts only. Existing contracts retain their own snapshot — editing the template will not retroactively change them."}
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-stone-200 mb-4">
        <button
          type="button"
          onClick={() => setTab("override")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === "override"
              ? "border-[#C8A951] text-[#C8A951]"
              : "border-transparent text-stone-500 hover:text-stone-700"
          }`}
        >
          {locale === "th" ? "แก้ข้อมาตรฐาน (2-10)" : "Override Standard (2-10)"}
        </button>
        <button
          type="button"
          onClick={() => setTab("appended")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === "appended"
              ? "border-[#C8A951] text-[#C8A951]"
              : "border-transparent text-stone-500 hover:text-stone-700"
          }`}
        >
          {locale === "th" ? "ข้อ 11 — อื่นๆ" : "Section 11 — Misc"}
        </button>
      </div>

      {tab === "override" && (
        <div className="bg-white border rounded-xl p-4 sm:p-5">
          <StandardClausesEditor
            value={overrides}
            onChange={setOverrides}
            locale={locale}
            sectionsFilter={["2", "3", "4", "5", "6", "7", "8", "9", "10"]}
          />
        </div>
      )}

      {tab === "appended" && (
        <div className="space-y-4">
          {/* Standard 11.1-11.6 — editable like other sections */}
          <div className="bg-white border rounded-xl p-4 sm:p-5">
            <h3 className="text-sm font-semibold mb-3">
              {locale === "th"
                ? "ข้อมาตรฐาน 11.1-11.6"
                : "Standard clauses 11.1-11.6"}
            </h3>
            <StandardClausesEditor
              value={overrides}
              onChange={setOverrides}
              locale={locale}
              sectionsFilter={["11"]}
              hideHeader
            />
          </div>
          {/* Custom appended clauses 11.7+ */}
          <div className="bg-white border rounded-xl p-4 sm:p-5">
            <h3 className="text-sm font-semibold mb-3">
              {locale === "th"
                ? "ข้อสัญญาเพิ่มเติม (11.7+)"
                : "Additional clauses (11.7+)"}
            </h3>
            <CustomClausesEditor
              value={appendedClauses}
              onChange={setAppendedClauses}
              locale={locale}
            />
          </div>
        </div>
      )}

      <div
        className="fixed sm:static bottom-0 left-0 right-0 z-30 flex justify-end gap-2 px-4 py-3 sm:p-0 sm:mt-5 bg-white sm:bg-transparent border-t sm:border-0"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
      >
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C8A951] hover:bg-[#B8993F] text-white rounded-lg text-sm font-semibold disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saved
            ? locale === "th"
              ? "บันทึกแล้ว"
              : "Saved"
            : locale === "th"
            ? "บันทึก template"
            : "Save template"}
        </button>
      </div>
    </div>
  );
}
