"use client";

import { useState } from "react";
import { Loader2, UserPlus, Pencil, Check } from "lucide-react";

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
  onCustomerUpdated?: (c: Customer) => void;
}

export function CustomerSection({
  customers,
  customerId,
  onCustomerIdChange,
  onCustomerCreated,
  onCustomerUpdated,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState(EMPTY_CUST);
  const [editForm, setEditForm] = useState(EMPTY_CUST);
  const [saving, setSaving] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [error, setError] = useState("");
  const [editError, setEditError] = useState("");

  const set = (k: keyof typeof EMPTY_CUST) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const setEdit = (k: keyof typeof EMPTY_CUST) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setEditForm((p) => ({ ...p, [k]: e.target.value }));

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

  const openEdit = (c: Customer) => {
    setEditForm({
      name: c.name,
      address: c.address ?? "",
      taxId: c.taxId ?? "",
      phone: c.phone ?? "",
      email: c.email ?? "",
      contactName: c.contactName ?? "",
    });
    setEditError("");
    setShowEdit(true);
  };

  const handleEdit = async () => {
    if (!editForm.name.trim()) { setEditError("กรุณากรอกชื่อลูกค้า"); return; }
    if (!sel) return;
    setEditSaving(true);
    setEditError("");
    try {
      const res = await fetch(`/api/admin/acc/customers/${sel.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim(),
          address: editForm.address.trim() || null,
          taxId: editForm.taxId.trim() || null,
          phone: editForm.phone.trim() || null,
          email: editForm.email.trim() || null,
          contactName: editForm.contactName.trim() || null,
        }),
      });
      const data = await res.json();
      if (!data.success) { setEditError(data.error || "บันทึกไม่สำเร็จ"); return; }
      onCustomerUpdated?.(data.data);
      setShowEdit(false);
    } catch { setEditError("เกิดข้อผิดพลาด"); }
    finally { setEditSaving(false); }
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
              onChange={(e) => { onCustomerIdChange(e.target.value); setShowEdit(false); }}
              className="flex-1 px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
            >
              <option value="">-- เลือกลูกค้า --</option>
              {customers.filter((c) => c.isActive !== false).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => { setShowForm(true); setShowEdit(false); }}
              className="inline-flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 whitespace-nowrap text-gray-700"
            >
              <UserPlus className="w-3.5 h-3.5" />
              ลูกค้าใหม่
            </button>
          </div>

          {/* Selected customer info + edit */}
          {sel && !showEdit && (
            <div className="px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg text-xs text-gray-600">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5 flex-1">
                  {sel.address ? <p>{sel.address}</p> : <p className="text-amber-400 italic">ยังไม่มีที่อยู่</p>}
                  {sel.taxId ? <p>เลขผู้เสียภาษี: {sel.taxId}</p> : <p className="text-amber-400 italic">ยังไม่มีเลขผู้เสียภาษี</p>}
                  {sel.phone ? <p>โทร: {sel.phone}</p> : <p className="text-amber-400 italic">ยังไม่มีเบอร์โทร</p>}
                  {sel.email && <p>Email: {sel.email}</p>}
                  {sel.contactName && <p>ผู้ติดต่อ: {sel.contactName}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => openEdit(sel)}
                  className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200"
                  title="แก้ไขข้อมูลลูกค้า"
                >
                  <Pencil className="w-3 h-3" />
                  แก้ไข
                </button>
              </div>
            </div>
          )}

          {/* Inline edit form for selected customer */}
          {sel && showEdit && (
            <div className="border border-blue-200 rounded-xl p-4 bg-blue-50 space-y-3">
              <p className="text-xs font-semibold text-blue-800 flex items-center gap-1.5">
                <Pencil className="w-3.5 h-3.5" />
                แก้ไขข้อมูลลูกค้า: {sel.name}
              </p>

              <div>
                <label className="block text-xs text-gray-600 mb-1">ชื่อบริษัท / บุคคล <span className="text-red-500">*</span></label>
                <input
                  value={editForm.name} onChange={setEdit("name")}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">ที่อยู่</label>
                <textarea
                  value={editForm.address} onChange={setEdit("address")} rows={2}
                  placeholder="ที่อยู่สำหรับออกเอกสาร"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">เลขประจำตัวผู้เสียภาษี</label>
                  <input
                    value={editForm.taxId} onChange={setEdit("taxId")} placeholder="0-0000-00000-00-0"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">เบอร์โทรศัพท์</label>
                  <input
                    value={editForm.phone} onChange={setEdit("phone")} placeholder="02-xxx-xxxx"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">ผู้ติดต่อ</label>
                  <input
                    value={editForm.contactName} onChange={setEdit("contactName")} placeholder="ชื่อผู้ติดต่อ"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">อีเมล</label>
                  <input
                    type="email" value={editForm.email} onChange={setEdit("email")} placeholder="email@example.com"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                  />
                </div>
              </div>

              {editError && <p className="text-xs text-red-600">{editError}</p>}

              <div className="flex gap-2 pt-1">
                <button
                  type="button" onClick={handleEdit} disabled={editSaving || !editForm.name.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-blue-700"
                >
                  {editSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  บันทึก
                </button>
                <button
                  type="button" onClick={() => { setShowEdit(false); setEditError(""); }}
                  className="px-4 py-2 border rounded-lg text-sm hover:bg-white"
                >
                  ยกเลิก
                </button>
              </div>
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
