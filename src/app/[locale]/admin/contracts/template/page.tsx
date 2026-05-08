"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Save, Check } from "lucide-react";
import CustomClausesEditor from "../CustomClausesEditor";
import type { CustomClause } from "@/lib/contract-clauses";

export default function ContractTemplatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState("th");
  const [clauses, setClauses] = useState<CustomClause[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then(({ locale: l }) => setLocale(l));
  }, [params]);

  useEffect(() => {
    fetch("/api/admin/contract-defaults")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setClauses(data.data?.clauses || []);
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
        body: JSON.stringify({ clauses }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || (locale === "th" ? "บันทึกไม่สำเร็จ" : "Save failed"));
        return;
      }
      setClauses(data.data?.clauses || []);
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
    <div className="max-w-4xl mx-auto">
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
            ? "Template ข้อสัญญาเพิ่มเติม (Standard)"
            : "Custom Clauses Template (Standard)"}
        </h1>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 mb-5">
        <p className="font-semibold mb-1">
          {locale === "th" ? "เกี่ยวกับ template นี้" : "About this template"}
        </p>
        <p className="text-xs leading-relaxed">
          {locale === "th"
            ? "ข้อสัญญาที่ตั้งไว้ที่นี่จะถูกใช้เป็นค่าเริ่มต้น (default) สำหรับสัญญาที่สร้างใหม่ — แก้ template ที่นี่จะไม่กระทบสัญญาเก่าที่มีอยู่แล้ว เนื่องจากแต่ละสัญญาเก็บสำเนาของตัวเอง"
            : "Clauses set here are used as the default for new contracts. Changes here do NOT affect existing contracts — each contract holds its own snapshot."}
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      <div className="bg-white border rounded-xl p-4 sm:p-5">
        <CustomClausesEditor
          value={clauses}
          onChange={setClauses}
          locale={locale}
        />
      </div>

      <div className="flex justify-end mt-5">
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
