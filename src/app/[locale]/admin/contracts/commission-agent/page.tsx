"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import WitnessSignature from "../WitnessSignature";
import IdCardUpload from "../IdCardUpload";
import { COMMISSION_AGENT_SETTING_KEYS as KEYS } from "@/lib/contract-commission-agent";

export default function CommissionAgentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState("th");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [idCard, setIdCard] = useState("");
  const [phone, setPhone] = useState("");
  const [idImage, setIdImage] = useState("");
  const [signature, setSignature] = useState("");

  useEffect(() => {
    params.then(({ locale: l }) => setLocale(l));
  }, [params]);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const s = data.data || {};
          setName(s[KEYS.name]?.valueTh || "");
          setAddress(s[KEYS.address]?.valueTh || "");
          setIdCard(s[KEYS.idCard]?.valueTh || "");
          setPhone(s[KEYS.phone]?.valueTh || "");
          setIdImage(s[KEYS.idImage]?.valueTh || "");
          setSignature(s[KEYS.signature]?.valueTh || "");
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
        saveKey(KEYS.name, name),
        saveKey(KEYS.address, address),
        saveKey(KEYS.idCard, idCard),
        saveKey(KEYS.phone, phone),
        saveKey(KEYS.idImage, idImage),
        saveKey(KEYS.signature, signature),
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
          {locale === "th" ? "ข้อมูลนายหน้า (สัญญาแต่งตั้งนายหน้า)" : "Commission Agent Info"}
        </h1>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 mb-5">
        <p className="text-xs leading-relaxed">
          {locale === "th"
            ? "ตั้งค่าข้อมูลฝั่งนายหน้า/ผู้รับจ้างที่นี่ครั้งเดียว ระบบจะฝังลงในสัญญารับค่าคอมมิชชั่นและข้อตกลงตัวแทนอสังหาริมทรัพย์ทุกฉบับโดยอัตโนมัติ (ฝั่งเจ้าของทรัพย์สินดึงจากข้อมูลผู้ให้เช่าของแต่ละสัญญา)"
            : "Set the agent/broker side here once — it's embedded into every generated commission agreement automatically. The owner side is pulled from each contract's lessor info."}
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      <div className="bg-white border rounded-xl p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {locale === "th" ? "ชื่อนายหน้า" : "Agent name"}
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A951]/30 focus:border-[#C8A951]"
              placeholder="นางสาว..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {locale === "th" ? "เบอร์โทรศัพท์" : "Phone"}
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A951]/30 focus:border-[#C8A951]"
              placeholder="095-680-9191"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            {locale === "th" ? "ที่อยู่" : "Address"}
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A951]/30 focus:border-[#C8A951] resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            {locale === "th" ? "เลขประจำตัวประชาชน" : "ID card number"}
          </label>
          <input
            value={idCard}
            onChange={(e) => setIdCard(e.target.value)}
            className="w-full max-w-xs px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A951]/30 focus:border-[#C8A951]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div>
            <IdCardUpload
              label={locale === "th" ? "รูปบัตรประชาชน" : "ID card photo"}
              value={idImage}
              onChange={setIdImage}
              locale={locale}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {locale === "th" ? "ลายเซ็นนายหน้า" : "Agent signature"}
            </label>
            <WitnessSignature locale={locale} value={signature} onChange={setSignature} />
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
