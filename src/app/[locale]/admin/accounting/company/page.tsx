"use client";

import { useState, useEffect } from "react";
import { Loader2, Save, Building2 } from "lucide-react";

interface CompanyForm {
  name: string;
  address: string;
  taxId: string;
  phone: string;
  logoUrl: string;
  signatureUrl: string;
  authorizedName: string;
}

const EMPTY: CompanyForm = {
  name: "", address: "", taxId: "", phone: "",
  logoUrl: "", signatureUrl: "", authorizedName: "",
};

export default function AccountingCompanyPage() {
  const [form, setForm] = useState<CompanyForm>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/acc/company")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.id) {
          setForm({
            name: d.data.name ?? "",
            address: d.data.address ?? "",
            taxId: d.data.taxId ?? "",
            phone: d.data.phone ?? "",
            logoUrl: d.data.logoUrl ?? "",
            signatureUrl: d.data.signatureUrl ?? "",
            authorizedName: d.data.authorizedName ?? "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/acc/company", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  const set = (k: keyof CompanyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#C8A951]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-[#C8A951]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">ตั้งค่าบริษัท</h1>
          <p className="text-sm text-gray-500">ข้อมูลบริษัทที่จะแสดงในเอกสารบัญชี</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            ชื่อบริษัท / ร้านค้า <span className="text-red-500">*</span>
          </label>
          <input
            value={form.name}
            onChange={set("name")}
            className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
            placeholder="เช่น บริษัท แอมเบอร์ รีเอสเตท จำกัด"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">ที่อยู่</label>
          <textarea
            value={form.address}
            onChange={set("address")}
            rows={3}
            className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 resize-none"
            placeholder="ที่อยู่บริษัท"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              เลขประจำตัวผู้เสียภาษี
            </label>
            <input
              value={form.taxId}
              onChange={set("taxId")}
              className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
              placeholder="0-0000-00000-00-0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">เบอร์โทรศัพท์</label>
            <input
              value={form.phone}
              onChange={set("phone")}
              className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
              placeholder="02-xxx-xxxx"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อผู้มีอำนาจลงนาม</label>
          <input
            value={form.authorizedName}
            onChange={set("authorizedName")}
            className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
            placeholder="ชื่อ-นามสกุล"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Logo URL</label>
          <input
            value={form.logoUrl}
            onChange={set("logoUrl")}
            className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
            placeholder="https://..."
          />
          {form.logoUrl && (
            <div className="mt-2 p-2 border rounded-lg bg-gray-50">
              <img
                src={form.logoUrl}
                alt="Logo preview"
                className="h-16 object-contain"
                onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            ลายเซ็นผู้มีอำนาจ URL
          </label>
          <input
            value={form.signatureUrl}
            onChange={set("signatureUrl")}
            className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
            placeholder="https://..."
          />
          {form.signatureUrl && (
            <div className="mt-2 p-2 border rounded-lg bg-gray-50">
              <img
                src={form.signatureUrl}
                alt="Signature preview"
                className="h-16 object-contain"
                onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saving || !form.name}
            className="inline-flex items-center gap-2 bg-[#C8A951] hover:bg-[#B8993F] disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saved ? "บันทึกแล้ว!" : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}
