"use client";

import { useState } from "react";
import { Loader2, UserPlus } from "lucide-react";

export interface Customer {
  id: number;
  name: string;
  address?: string;
  taxId?: string;
  phone?: string;
  email?: string;
  contactName?: string;
  isActive?: boolean;
}

const EMPTY_CUST = { name: "", address: "", taxId: "", phone: "", email: "", contactName: "" };

interface Props {
  customers: Customer[];
  customerId: string;
  onCustomerIdChange: (id: string) => void;
  onCustomerCreated: (c: Customer) => void;
}

export function CustomerSection({ customers, customerId, onCustomerIdChange, onCustomerCreated }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_CUST);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof EMPTY_CUST) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleCreate = async () => {
    if (!form.name.trim()) { setError("กรุณากรอกชื่อลูกค้า"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/acc/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          address: form.address.trim() || null,
          taxId: form.taxId.trim() || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          contactName: form.contactName.trim() || null,
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || "บันทึกไม่สำเร็จ"); return; }
      onCustomerCreated(data.data);
      onCustomerIdChange(String(data.data.id));
      setShowForm(false);
      setForm(EMPTY_CUST);
    } catch { setError("เกิดข้อผิดพลาด"); }
    finally { setSaving(false); }
  };

  const sel = customerId ? customers.find((c) => String(c.id) === customerId) : null;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">ลูกค้า *</label>

      {!showForm ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <select
              value={customerId}
              onChange={(e) => onCustomerIdChange(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
            >
              <option value="">-- เลือกลูกค้า --</option>
              {customers.filter((c) => c.isActive !== false).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 whitespace-nowrap text-gray-700"
            >
              <UserPlus className="w-3.5 h-3.5" />
              ลูกค้าใหม่
            </button>
          </div>
          {/* Show selected customer info */}
          {sel && (sel.address || sel.taxId || sel.phone || sel.email) && (
            <div className="px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg text-xs text-gray-600 space-y-0.5">
              {sel.address && <p>{sel.address}</p>}
              {sel.taxId && <p>เลขผู้เสียภาษี: {sel.taxId}</p>}
              {sel.phone && <p>โทร: {sel.phone}</p>}
              {sel.email && <p>Email: {sel.email}</p>}
            </div>
          )}
        </div>
      ) : (
        <div className="border border-amber-200 rounded-xl p-4 bg-amber-50 space-y-3">
          <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5" />
            เพิ่มลูกค้าใหม่
          </p>

          <div>
            <label className="block text-xs text-gray-600 mb-1">ชื่อบริษัท / บุคคล <span className="text-red-500">*</span></label>
            <input
              value={form.name} onChange={set("name")} placeholder="เช่น บริษัท ABC จำกัด / นายสมชาย ใจดี"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">ที่อยู่</label>
            <textarea
              value={form.address} onChange={set("address")} rows={2}
              placeholder="ที่อยู่สำหรับออกเอกสาร"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 resize-none bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">เลขประจำตัวผู้เสียภาษี</label>
              <input
                value={form.taxId} onChange={set("taxId")} placeholder="0-0000-00000-00-0"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">เบอร์โทรศัพท์</label>
              <input
                value={form.phone} onChange={set("phone")} placeholder="02-xxx-xxxx"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">ผู้ติดต่อ</label>
              <input
                value={form.contactName} onChange={set("contactName")} placeholder="ชื่อผู้ติดต่อ"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">อีเมล</label>
              <input
                type="email" value={form.email} onChange={set("email")} placeholder="email@example.com"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 bg-white"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button" onClick={handleCreate} disabled={saving || !form.name.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#C8A951] text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-[#B8993F]"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              บันทึกลูกค้า
            </button>
            <button
              type="button" onClick={() => { setShowForm(false); setForm(EMPTY_CUST); setError(""); }}
              className="px-4 py-2 border rounded-lg text-sm hover:bg-white"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
