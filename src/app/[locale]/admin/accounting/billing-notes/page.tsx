"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Loader2, Plus, ClipboardList, Trash2, Pencil, X, ExternalLink } from "lucide-react";
import { CustomerSection, type Customer } from "../CustomerSection";

interface Invoice {
  id: number;
  docNumber: string;
  status: string;
  totalAmount: number;
  items: AccItem[];
  vatRate: number;
  subtotal: number;
  vatAmount: number;
}

interface AccItem {
  description: string;
  qty: number;
  unitPrice: number;
  discountPct: number;
  amount: number;
}

interface BillingNote {
  id: number;
  docNumber: string;
  date: string;
  dueDate?: string;
  customerId: number;
  customer: Customer;
  invoiceId?: number;
  invoice?: Invoice;
  items: AccItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  note?: string;
  status: string;
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "รอดำเนินการ", cls: "bg-yellow-100 text-yellow-800" },
  PAID: { label: "ชำระแล้ว", cls: "bg-green-100 text-green-800" },
  CANCELLED: { label: "ยกเลิก", cls: "bg-gray-100 text-gray-600" },
};

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" });
}
function calcItem(item: AccItem) {
  return (item.qty || 0) * (item.unitPrice || 0) * (1 - (item.discountPct || 0) / 100);
}
function calcTotals(items: AccItem[], vatRate: number) {
  const subtotal = items.reduce((s, it) => s + calcItem(it), 0);
  const vatAmount = subtotal * (vatRate / 100);
  return { subtotal, vatAmount, totalAmount: subtotal + vatAmount };
}

const EMPTY_ITEM: AccItem = { description: "", qty: 1, unitPrice: 0, discountPct: 0, amount: 0 };

export default function BillingNotesPage() {
  const [notes, setNotes] = useState<BillingNote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<BillingNote | null>(null);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/acc/billing-notes");
      const data = await res.json();
      if (data.success) setNotes(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
    fetch("/api/admin/acc/customers").then((r) => r.json()).then((d) => { if (d.success) setCustomers(d.data); });
  }, [fetchNotes]);

  const handleDelete = async (note: BillingNote) => {
    if (note.status !== "PENDING") { alert("ลบได้เฉพาะสถานะ PENDING"); return; }
    if (!confirm(`ลบ ${note.docNumber}?`)) return;
    await fetch(`/api/admin/acc/billing-notes/${note.id}`, { method: "DELETE" });
    fetchNotes();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">ใบวางบิล</h1>
          <p className="text-sm text-gray-500 mt-1">จัดการใบวางบิลทั้งหมด</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          สร้างใบวางบิล
        </button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-600" /></div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">ยังไม่มีใบวางบิล</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-gray-500 text-xs">
                  <th className="text-left px-4 py-3 font-medium">เลขที่</th>
                  <th className="text-left px-4 py-3 font-medium">วันที่</th>
                  <th className="text-left px-4 py-3 font-medium">ครบกำหนด</th>
                  <th className="text-left px-4 py-3 font-medium">ลูกค้า</th>
                  <th className="text-left px-4 py-3 font-medium">อ้างอิง INV</th>
                  <th className="text-right px-4 py-3 font-medium">ยอดรวม</th>
                  <th className="text-left px-4 py-3 font-medium">สถานะ</th>
                  <th className="w-28"></th>
                </tr>
              </thead>
              <tbody>
                {notes.map((note) => {
                  const st = STATUS_LABELS[note.status] ?? { label: note.status, cls: "bg-gray-100 text-gray-600" };
                  return (
                    <tr key={note.id} className="border-b last:border-b-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{note.docNumber}</td>
                      <td className="px-4 py-3 text-gray-600">{fmtDate(note.date)}</td>
                      <td className="px-4 py-3 text-gray-500">{note.dueDate ? fmtDate(note.dueDate) : "—"}</td>
                      <td className="px-4 py-3 font-medium">{note.customer.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{note.invoice?.docNumber ?? "—"}</td>
                      <td className="px-4 py-3 text-right font-semibold">฿{fmt(Number(note.totalAmount))}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <a href={`/api/admin/acc/billing-notes/${note.id}/pdf`} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded" title="ดู PDF">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button onClick={() => { setEditing(note); setShowModal(true); }}
                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded" title="แก้ไข">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(note)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded" title="ลบ">
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
        <BillingNoteModal
          editing={editing}
          customers={customers}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSaved={() => { setShowModal(false); setEditing(null); fetchNotes(); }}
          onCustomerCreated={(c) => setCustomers((prev) => [...prev, c])}
        />
      )}
    </div>
  );
}

function BillingNoteModal({
  editing,
  customers,
  onClose,
  onSaved,
  onCustomerCreated,
}: {
  editing: BillingNote | null;
  customers: Customer[];
  onClose: () => void;
  onSaved: () => void;
  onCustomerCreated: (c: Customer) => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(editing ? editing.date.split("T")[0] : today);
  const [dueDate, setDueDate] = useState(editing?.dueDate ? editing.dueDate.split("T")[0] : "");
  const [customerId, setCustomerId] = useState(editing ? String(editing.customerId) : "");
  const [invoiceId, setInvoiceId] = useState(editing?.invoiceId ? String(editing.invoiceId) : "");
  const [vatRate, setVatRate] = useState(editing ? Number(editing.vatRate) : 7);
  const [note, setNote] = useState(editing?.note ?? "");
  const [items, setItems] = useState<AccItem[]>(editing?.items?.length ? editing.items : [{ ...EMPTY_ITEM }]);
  const [saving, setSaving] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    if (!customerId) { setInvoices([]); return; }
    fetch(`/api/admin/acc/invoices?customerId=${customerId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setInvoices(d.data.filter((i: Invoice) => ["PENDING", "BILLED"].includes(i.status)));
      });
  }, [customerId]);

  const prefillFromInvoice = (id: string) => {
    const inv = invoices.find((i) => String(i.id) === id);
    if (inv) setItems(inv.items?.length ? inv.items : [{ ...EMPTY_ITEM }]);
    setInvoiceId(id);
  };

  const { subtotal, vatAmount, totalAmount } = calcTotals(items, vatRate);

  const updateItem = (idx: number, patch: Partial<AccItem>) =>
    setItems((prev) => prev.map((it, i) => {
      if (i !== idx) return it;
      const m = { ...it, ...patch };
      m.amount = calcItem(m);
      return m;
    }));

  const handleSave = async () => {
    if (!date || !customerId) return;
    setSaving(true);
    const url = editing ? `/api/admin/acc/billing-notes/${editing.id}` : "/api/admin/acc/billing-notes";
    const res = await fetch(url, {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, dueDate: dueDate || null, customerId, invoiceId: invoiceId || null, items, subtotal, vatRate, vatAmount, totalAmount, note }),
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
            <ClipboardList className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-gray-900">{editing ? "แก้ไขใบวางบิล" : "สร้างใบวางบิล"}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">วันที่ออกเอกสาร *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">วันครบกำหนดชำระ</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-200" />
            </div>
          </div>

          <CustomerSection
            customers={customers}
            customerId={customerId}
            onCustomerIdChange={(id) => { setCustomerId(id); setInvoiceId(""); }}
            onCustomerCreated={(c) => { onCustomerCreated(c); setCustomerId(String(c.id)); setInvoiceId(""); }}
          />

          {customerId && invoices.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                อ้างอิงใบแจ้งหนี้ (จะดึงรายการมาเติม)
              </label>
              <select value={invoiceId} onChange={(e) => prefillFromInvoice(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-200">
                <option value="">-- ไม่อ้างอิง --</option>
                {invoices.map((i) => <option key={i.id} value={i.id}>{i.docNumber} — ฿{fmt(Number(i.totalAmount))}</option>)}
              </select>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">รายการ</label>
              <button onClick={() => setItems((p) => [...p, { ...EMPTY_ITEM }])} className="text-xs text-teal-600 hover:underline">+ เพิ่มรายการ</button>
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
                          className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-teal-200" placeholder="รายละเอียด" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={item.qty} onChange={(e) => updateItem(idx, { qty: Number(e.target.value) })}
                          className="w-full px-2 py-1 border rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-teal-200" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={item.unitPrice} onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) })}
                          className="w-full px-2 py-1 border rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-teal-200" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={item.discountPct} min={0} max={100}
                          onChange={(e) => updateItem(idx, { discountPct: Number(e.target.value) })}
                          className="w-full px-2 py-1 border rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-teal-200" />
                      </td>
                      <td className="px-2 py-1.5 text-right text-xs font-medium text-gray-700">
                        {fmt(calcItem(item))}
                      </td>
                      <td className="px-1 py-1.5">
                        {items.length > 1 && (
                          <button onClick={() => setItems((p) => p.filter((_, i) => i !== idx))} className="p-1 text-gray-300 hover:text-red-500"><X className="w-3 h-3" /></button>
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
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 resize-none" />
            </div>
            <div className="space-y-1">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">VAT</label>
                <select value={vatRate} onChange={(e) => setVatRate(Number(e.target.value))}
                  className="px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-200">
                  <option value={0}>0%</option>
                  <option value={7}>7%</option>
                </select>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between text-gray-600"><span>รวมเป็นเงิน</span><span>฿{fmt(subtotal)}</span></div>
                <div className="flex justify-between text-gray-600"><span>VAT {vatRate}%</span><span>฿{fmt(vatAmount)}</span></div>
                <div className="flex justify-between font-bold text-gray-900 border-t pt-1">
                  <span>รวมทั้งสิ้น</span><span className="text-teal-600">฿{fmt(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button onClick={onClose} className="px-5 py-2 border rounded-lg text-sm hover:bg-gray-50">ยกเลิก</button>
          <button onClick={handleSave} disabled={saving || !date || !customerId}
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-medium">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            บันทึก
          </button>
        </div>
      </div>
    </div>
  );
}
