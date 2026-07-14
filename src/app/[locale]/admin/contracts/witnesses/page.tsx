"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import WitnessSignature from "../WitnessSignature";

const KEYS = {
  witness1Name: "contract_witness1_name",
  witness1Signature: "contract_witness1_signature",
  witness2Name: "contract_witness2_name",
  witness2Signature: "contract_witness2_signature",
};

export default function ContractWitnessesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState("th");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [witness1Name, setWitness1Name] = useState("");
  const [witness1Signature, setWitness1Signature] = useState("");
  const [witness2Name, setWitness2Name] = useState("");
  const [witness2Signature, setWitness2Signature] = useState("");

  useEffect(() => {
    params.then(({ locale: l }) => setLocale(l));
  }, [params]);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const s = data.data || {};
          setWitness1Name(s[KEYS.witness1Name]?.valueTh || "");
          setWitness1Signature(s[KEYS.witness1Signature]?.valueTh || "");
          setWitness2Name(s[KEYS.witness2Name]?.valueTh || "");
          setWitness2Signature(s[KEYS.witness2Signature]?.valueTh || "");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const saveKey = (key: string, value: string) =>
    fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, valueTh: value, valueEn: value }),
    });

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const results = await Promise.all([
        saveKey(KEYS.witness1Name, witness1Name),
        saveKey(KEYS.witness1Signature, witness1Signature),
        saveKey(KEYS.witness2Name, witness2Name),
        saveKey(KEYS.witness2Signature, witness2Signature),
      ]);
      if (results.some((r) => !r.ok)) throw new Error("save failed");
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
    <div className="max-w-3xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6">
        <Link
          href={`/${locale}/admin/contracts`}
          className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-[#C8A951] self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          {locale === "th" ? "กลับ" : "Back"}
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold">
          {locale === "th" ? "พยาน (Witnesses)" : "Witnesses"}
        </h1>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 mb-5">
        <p className="text-xs leading-relaxed">
          {locale === "th"
            ? "ตั้งค่าพยานทั้ง 2 คนที่นี่ครั้งเดียว ระบบจะฝังชื่อและลายเซ็นนี้ลงในสัญญาเช่าทุกฉบับที่สร้าง PDF โดยอัตโนมัติ ไม่ต้องกรอกซ้ำในแต่ละสัญญา"
            : "Set both witnesses here once — their name and signature are embedded into every generated contract PDF automatically. No need to re-enter them per contract."}
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      <div className="bg-white border rounded-xl p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {locale === "th" ? "ชื่อพยานคนที่ 1" : "Witness 1 name"}
            </label>
            <input
              value={witness1Name}
              onChange={(e) => setWitness1Name(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A951]/30 focus:border-[#C8A951] mb-3"
            />
            <label className="block text-sm font-medium mb-1.5">
              {locale === "th" ? "ลายเซ็นพยานคนที่ 1" : "Witness 1 signature"}
            </label>
            <WitnessSignature
              locale={locale}
              value={witness1Signature}
              onChange={setWitness1Signature}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {locale === "th" ? "ชื่อพยานคนที่ 2" : "Witness 2 name"}
            </label>
            <input
              value={witness2Name}
              onChange={(e) => setWitness2Name(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A951]/30 focus:border-[#C8A951] mb-3"
            />
            <label className="block text-sm font-medium mb-1.5">
              {locale === "th" ? "ลายเซ็นพยานคนที่ 2" : "Witness 2 signature"}
            </label>
            <WitnessSignature
              locale={locale}
              value={witness2Signature}
              onChange={setWitness2Signature}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-[#C8A951] hover:bg-[#B8993F] disabled:opacity-60 text-white px-6 py-2.5 rounded-lg text-sm font-semibold"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saved
            ? locale === "th" ? "บันทึกแล้ว ✓" : "Saved ✓"
            : locale === "th" ? "บันทึกข้อมูล" : "Save"}
        </button>
      </div>
    </div>
  );
}
