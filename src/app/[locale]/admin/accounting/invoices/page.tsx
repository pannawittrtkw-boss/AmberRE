"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Loader2, Plus, FileText, Trash2, Pencil, X, ExternalLink } from "lucide-react";
import { CustomerSection, type Customer } from "../CustomerSection";

interface AccItem {
  description: string;
  qty: number;
  unitPrice: number;
  discountPct: number;
  amount: number;
}

interface Invoice {
  id: number;
  docNumber: string;
  date: string;
  dueDate?: string;
  customerId: number;
  customer: Customer;
  items: AccItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  note?: string;
  status: string;
  createdAt: string;
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "รอดำเนินการ", cls: "bg-yellow-100 text-yellow-800" },
  BILLED: { label: "วางบิลแล้ว", cls: "bg-blue-100 text-blue-800" },
  PAID: { label: "ชำระแล้ว", cls: "bg-green-100 text-green-800" },
  CANCELLED: { label: "ยกเลิก", cls: "bg-gray-100 text-gray-600" },
};

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" });
}

function calcItem(item: AccItem): number {
  const base = (item.qty || 0) * (item.unitPrice || 0);
  return base * (1 - (item.discountPct || 0) / 100);
}

function calcTotals(items: AccItem[], vatRate: number) {
  const subtotal = items.reduce((s, it) => s + calcItem(it), 0);
  const vatAmount = subtotal * (vatRate / 100);
  const totalAmount = subtotal + vatAmount;
  return { subtotal, vatAmount, totalAmount };
}

const EMPTY_ITEM: AccItem = { description: "", qty: 1, unitPrice: 0, discountPct: 0, amount: 0 };

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/acc/invoices");
      const data = await res.json();
      if (data.success) setInvoices(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
    fetch("/api/admin/acc/customers")
      .then((r) => r.json())
      .then((d) => { if (d.success) setCustomers(d.data); });
  }, [fetchInvoices]);

  const handleDelete = async (inv: Invoice) => {
    if (inv.status !== "PENDING") { alert("ลบได้เฉพาะสถานะ PENDING"); return; }
    if (!confirm(`ลบ ${inv.docNumber}?`)) return;
    await fetch(`/api/admin/acc/invoices/${inv.id}`, { method: "DELETE" });
    fetchInvoices();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">ใบแจ้งหนี้</h1>
          <p className="text-sm text-gray-500 mt-1">จัดการใบแจ้งหนี้ทั้งหมด</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="inline-flex items-center gap-2 bg-[#C8A951] hover:bg-[#B8993F] text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          สร้างใบแจ้งหนี้
        </button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#C8A951]" /></div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">ยังไม่มีใบแจ้งหนี้</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-gray-500 text-xs">
                  <th className="text-left px-4 py-3 font-medium">เลขที่</th>
                  <th className="text-left px-4 py-3 font-medium">วันที่</th>
                  <th className="text-left px-4 py-3 font-medium">ครบกำหนด</th>
                  <th className="text-left px-4 py-3 font-medium">ลูกค้า</th>
                  <th className="text-right px-4 py-3 font-medium">ยอดรวม</th>
                  <th className="text-left px-4 py-3 font-medium">สถานะ</th>
                  <th className="w-28"></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const st = STATUS_LABELS[inv.status] ?? { label: inv.status, cls: "bg-gray-100 text-gray-600" };
                  return (
                    <tr key={inv.id} className="border-b last:border-b-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{inv.docNumber}</td>
                      <td className="px-4 py-3 text-gray-600">{fmtDate(inv.date)}</td>
                      <td className="px-4 py-3 text-gray-500">{inv.dueDate ? fmtDate(inv.dueDate) : "—"}</td>
                      <td className="px-4 py-3 font-medium">{inv.customer.name}</td>
                      <td className="px-4 py-3 text-right font-semibold">฿{fmt(Number(inv.totalAmount))}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <a
                            href={`/api/admin/acc/invoices/${inv.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-400 hover:text-[#C8A951] hover:bg-amber-50 rounded"
                            title="ดู PDF"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => { setEditing(inv); setShowModal(true); }}
                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"
                            title="แก้ไข"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(inv)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                            title="ลบ"
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
        <InvoiceModal
          editing={editing}
          customers={customers}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSaved={() => { setShowModal(false); setEditing(null); fetchInvoices(); }}
          onCustomerCreated={(c) => setCustomers((prev) => [...prev, c])}
        />
      )}
    </div>
  );
}

function InvoiceModal({
  editing,
  customers,
  onClose,
  onSaved,
  onCustomerCreated,
}: {
  editing: Invoice | null;
  customers: Customer[];
  onClose: () => void;
  onSaved: () => void;
  onCustomerCreated: (c: Customer) => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(editing ? editing.date.split("T")[0] : today);
  const [dueDate, setDueDate] = useState(editing?.dueDate ? editing.dueDate.split("T")[0] : "");
  const [customerId, setCustomerId] = useState(editing ? String(editing.customerId) : "");
  const [vatRate, setVatRate] = useState(editing ? Number(editing.vatRate) : 7);
  const [note, setNote] = useState(editing?.note ?? "");
  const [items, setItems] = useState<AccItem[]>(
    editing?.items?.length ? editing.items : [{ ...EMPTY_ITEM }]
  );
  const [saving, setSaving] = useState(false);

  const { subtotal, vatAmount, totalAmount } = calcTotals(items, vatRate);

  const updateItem = (idx: number, patch: Partial<AccItem>) => {
    setItems((prev) => {
      const next = prev.map((it, i) => {
        if (i !== idx) return it;
        const merged = { ...it, ...patch };
        merged.amount = calcItem(merged);
        return merged;
      });
      return next;
    });
  };

  const addItem = () => setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!date || !customerId || items.length === 0) return;
    setSaving(true);
    const url = editing ? `/api/admin/acc/invoices/${editing.id}` : "/api/admin/acc/invoices";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date, dueDate: dueDate || null, customerId, items,
        subtotal, vatRate, vatAmount, totalAmount, note,
      }),
    });
    const data = await res.json();
    if (data.success) onSaved();
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#C8A951]" />
            <h3 className="font-bold text-gray-900">
              {editing ? "แก้ไขใบแจ้งหนี้" : "สร้างใบแจ้งหนี้"}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">วันที่ออกเอกสาร *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">วันครบกำหนด</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-200" />
            </div>
          </div>

          <CustomerSection
            customers={customers}
            customerId={customerId}
            onCustomerIdChange={setCustomerId}
            onCustomerCreated={(c) => { onCustomerCreated(c); setCustomerId(String(c.id)); }}
          />

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">รายการ</label>
              <button onClick={addItem} className="text-xs text-[#C8A951] hover:underline">+ เพิ่มรายการ</button>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">รายละเอียด</th>
                    <th className="text-right px-2 py-2 font-medium w-16">จำนวน</th>
                    <th className="text-right px-2 py-2 font-medium w-24">ราคา/หน่วย</th>
                    <th className="text-right px-2 py-2 font-medium w-16">ส่วนลด%</th>
                    <th className="text-right px-2 py-2 font-medium w-24">มูลค่า</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-2 py-1.5">
                        <input value={item.description} onChange={(e) => updateItem(idx, { description: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-200"
                          placeholder="รายละเอียด" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={item.qty} onChange={(e) => updateItem(idx, { qty: Number(e.target.value) })}
                          className="w-full px-2 py-1 border rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-amber-200" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={item.unitPrice} onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) })}
                          className="w-full px-2 py-1 border rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-amber-200" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={item.discountPct} min={0} max={100}
                          onChange={(e) => updateItem(idx, { discountPct: Number(e.target.value) })}
                          className="w-full px-2 py-1 border rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-amber-200" />
                      </td>
                      <td className="px-2 py-1.5 text-right text-xs font-medium text-gray-700">
                        {fmt(calcItem(item))}
                      </td>
                      <td className="px-1 py-1.5">
                        {items.length > 1 && (
                          <button onClick={() => removeItem(idx)} className="p-1 text-gray-300 hover:text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">หมายเหตุ</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 resize-none" />
            </div>
            <div className="space-y-1">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">VAT</label>
                <select value={vatRate} onChange={(e) => setVatRate(Number(e.target.value))}
                  className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-200">
                  <option value={0}>0%</option>
                  <option value={7}>7%</option>
                </select>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>รวมเป็นเงิน</span><span>฿{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>VAT {vatRate}%</span><span>฿{fmt(vatAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 border-t pt-1">
                  <span>รวมทั้งสิ้น</span><span className="text-[#C8A951]">฿{fmt(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button onClick={onClose} className="px-5 py-2 border rounded-lg text-sm hover:bg-gray-50">ยกเลิก</button>
          <button onClick={handleSave} disabled={saving || !date || !customerId}
            className="inline-flex items-center gap-2 bg-[#C8A951] hover:bg-[#B8993F] disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-medium">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            บันทึก
          </button>
        </div>
      </div>
    </div>
  );
}
