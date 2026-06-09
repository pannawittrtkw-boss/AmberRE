"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2, Plus, Pencil, Trash2, UserCheck, UserX, X, Users,
} from "lucide-react";

interface Customer {
  id: number;
  name: string;
  address?: string;
  taxId?: string;
  phone?: string;
  email?: string;
  contactName?: string;
  isActive: boolean;
  createdAt: string;
  _count?: { invoices: number; billingNotes: number; receipts: number };
}

const EMPTY = { name: "", address: "", taxId: "", phone: "", email: "", contactName: "" };

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/acc/customers?all=1");
    const d = await res.json();
    if (d.success) setCustomers(d.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const toggleActive = async (c: Customer) => {
    const docCount = (c._count?.invoices ?? 0) + (c._count?.billingNotes ?? 0) + (c._count?.receipts ?? 0);
    if (!c.isActive && docCount > 0) {
      // reactivate always allowed
    }
    await fetch(`/api/admin/acc/customers/${c.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    fetchCustomers();
  };

  const handleDelete = async (c: Customer) => {
    const docCount = (c._count?.invoices ?? 0) + (c._count?.billingNotes ?? 0) + (c._count?.receipts ?? 0);
    if (docCount > 0) {
      alert(`ไม่สามารถลบได้ เนื่องจากมีเอกสารที่เชื่อมอยู่ ${docCount} รายการ\nให้ Inactive แทนครับ`);
      return;
    }
    if (!confirm(`ลบลูกค้า "${c.name}" ?`)) return;
    const res = await fetch(`/api/admin/acc/customers/${c.id}`, { method: "DELETE" });
    const d = await res.json();
    if (!d.success) { alert(d.error || "ลบไม่สำเร็จ"); return; }
    fetchCustomers();
  };

  const visible = showAll ? customers : customers.filter((c) => c.isActive);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">จัดการลูกค้า</h1>
          <p className="text-sm text-gray-500 mt-1">รายชื่อลูกค้าที่ใช้ในเอกสารบัญชี</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
              className="rounded"
            />
            แสดง Inactive
          </label>
          <button
            onClick={() => { setEditing(null); setShowModal(true); }}
            className="inline-flex items-center gap-2 bg-[#C8A951] hover:bg-[#B8993F] text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            เพิ่มลูกค้า
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#C8A951]" />
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">ยังไม่มีลูกค้า</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-gray-500 text-xs">
                  <th className="text-left px-4 py-3 font-medium">ชื่อ</th>
                  <th className="text-left px-4 py-3 font-medium">เลขผู้เสียภาษี</th>
                  <th className="text-left px-4 py-3 font-medium">เบอร์โทร</th>
                  <th className="text-left px-4 py-3 font-medium">อีเมล</th>
                  <th className="text-center px-4 py-3 font-medium">เอกสาร</th>
                  <th className="text-center px-4 py-3 font-medium">สถานะ</th>
                  <th className="w-28"></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => {
                  const docCount = (c._count?.invoices ?? 0) + (c._count?.billingNotes ?? 0) + (c._count?.receipts ?? 0);
                  return (
                    <tr
                      key={c.id}
                      className={`border-b last:border-b-0 hover:bg-gray-50 ${!c.isActive ? "opacity-50" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{c.name}</p>
                        {c.address && <p className="text-xs text-gray-400 truncate max-w-[200px]">{c.address}</p>}
                        {c.contactName && <p className="text-xs text-gray-400">ผู้ติดต่อ: {c.contactName}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{c.taxId || "—"}</td>
                      <td className="px-4 py-3 text-gray-500">{c.phone || "—"}</td>
                      <td className="px-4 py-3 text-gray-500">{c.email || "—"}</td>
                      <td className="px-4 py-3 text-center">
                        {docCount > 0 ? (
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                            {docCount}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {c.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            <UserCheck className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                            <UserX className="w-3 h-3" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => { setEditing(c); setShowModal(true); }}
                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"
                            title="แก้ไข"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => toggleActive(c)}
                            className={`p-1.5 rounded ${c.isActive
                              ? "text-gray-400 hover:text-orange-500 hover:bg-orange-50"
                              : "text-gray-400 hover:text-green-600 hover:bg-green-50"}`}
                            title={c.isActive ? "Inactive" : "Active"}
                          >
                            {c.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleDelete(c)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                            title="ลบ"
                            disabled={docCount > 0}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <CustomerModal
          editing={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSaved={() => { setShowModal(false); setEditing(null); fetchCustomers(); }}
        />
      )}
    </div>
  );
}

function CustomerModal({
  editing, onClose, onSaved,
}: { editing: Customer | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState(
    editing
      ? { name: editing.name, address: editing.address ?? "", taxId: editing.taxId ?? "", phone: editing.phone ?? "", email: editing.email ?? "", contactName: editing.contactName ?? "" }
      : { ...EMPTY }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof EMPTY) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError("กรุณากรอกชื่อลูกค้า"); return; }
    setSaving(true);
    setError("");
    const url = editing ? `/api/admin/acc/customers/${editing.id}` : "/api/admin/acc/customers";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
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
    const d = await res.json();
    if (!d.success) { setError(d.error || "บันทึกไม่สำเร็จ"); setSaving(false); return; }
    onSaved();
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#C8A951]" />
            <h3 className="font-bold text-gray-900">{editing ? "แก้ไขข้อมูลลูกค้า" : "เพิ่มลูกค้าใหม่"}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              ชื่อบริษัท / บุคคล <span className="text-red-500">*</span>
            </label>
            <input
              value={form.name} onChange={set("name")}
              placeholder="เช่น บริษัท ABC จำกัด / นายสมชาย ใจดี"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">ที่อยู่</label>
            <textarea
              value={form.address} onChange={set("address")} rows={3}
              placeholder="ที่อยู่สำหรับออกเอกสาร"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">เลขประจำตัวผู้เสียภาษี</label>
              <input
                value={form.taxId} onChange={set("taxId")} placeholder="0-0000-00000-00-0"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">เบอร์โทรศัพท์</label>
              <input
                value={form.phone} onChange={set("phone")} placeholder="02-xxx-xxxx"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ผู้ติดต่อ</label>
              <input
                value={form.contactName} onChange={set("contactName")} placeholder="ชื่อผู้ติดต่อ"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">อีเมล</label>
              <input
                type="email" value={form.email} onChange={set("email")} placeholder="email@example.com"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
              ยกเลิก
            </button>
            <button
              onClick={handleSave} disabled={saving || !form.name.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-[#C8A951] text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-[#B8993F]"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              บันทึก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
