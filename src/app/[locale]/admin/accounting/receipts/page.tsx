"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Loader2, Plus, Receipt, Trash2, Pencil, X, ExternalLink } from "lucide-react";

interface Customer { id: number; name: string; }
interface BillingNote { id: number; docNumber: string; status: string; totalAmount: number; items: AccItem[]; vatRate: number; subtotal: number; vatAmount: number; }
interface Invoice { id: number; docNumber: string; status: string; totalAmount: number; items: AccItem[]; vatRate: number; subtotal: number; vatAmount: number; }

interface AccItem {
  description: string;
  qty: number;
  unitPrice: number;
  discountPct: number;
  amount: number;
}

interface AccReceipt {
  id: number;
  docNumber: string;
  date: string;
  customerId: number;
  customer: Customer;
  billingNoteId?: number;
  billingNote?: BillingNote;
  invoiceId?: number;
  invoice?: Invoice;
  items: AccItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  paymentMethod: string;
  note?: string;
}

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "เงินสด", CHEQUE: "เช็ค", TRANSFER: "โอนเงิน", CREDIT: "บัตรเครดิต",
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

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<AccReceipt[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AccReceipt | null>(null);

  const fetchReceipts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/acc/receipts");
      const data = await res.json();
      if (data.success) setReceipts(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReceipts();
    fetch("/api/admin/acc/customers").then((r) => r.json()).then((d) => { if (d.success) setCustomers(d.data); });
  }, [fetchReceipts]);

  const handleDelete = async (r: AccReceipt) => {
    if (!confirm(`ลบ ${r.docNumber}?`)) return;
    await fetch(`/api/admin/acc/receipts/${r.id}`, { method: "DELETE" });
    fetchReceipts();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">ใบเสร็จรับเงิน</h1>
          <p className="text-sm text-gray-500 mt-1">จัดการใบเสร็จรับเงินทั้งหมด</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="inline-flex items-center gap-2 bg-[#C8A951] hover:bg-[#B8993F] text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          สร้างใบเสร็จ
        </button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#C8A951]" /></div>
        ) : receipts.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">ยังไม่มีใบเสร็จ</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-gray-500 text-xs">
                  <th className="text-left px-4 py-3 font-medium">เลขที่</th>
                  <th className="text-left px-4 py-3 font-medium">วันที่</th>
                  <th className="text-left px-4 py-3 font-medium">ลูกค้า</th>
                  <th className="text-left px-4 py-3 font-medium">อ้างอิง</th>
                  <th className="text-right px-4 py-3 font-medium">ยอดรวม</th>
                  <th className="text-left px-4 py-3 font-medium">วิธีชำระ</th>
                  <th className="w-28"></th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((rc) => (
                  <tr key={rc.id} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{rc.docNumber}</td>
                    <td className="px-4 py-3 text-gray-600">{fmtDate(rc.date)}</td>
                    <td className="px-4 py-3 font-medium">{rc.customer.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {rc.billingNote?.docNumber ?? rc.invoice?.docNumber ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">฿{fmt(Number(rc.totalAmount))}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded text-xs">
                        {PAYMENT_LABELS[rc.paymentMethod] ?? rc.paymentMethod}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <a href={`/api/admin/acc/receipts/${rc.id}/pdf`} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 text-gray-400 hover:text-[#C8A951] hover:bg-amber-50 rounded" title="ดู PDF">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button onClick={() => { setEditing(rc); setShowModal(true); }}
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded" title="แก้ไข">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(rc)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded" title="ลบ">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <ReceiptModal
          editing={editing}
          customers={customers}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSaved={() => { setShowModal(false); setEditing(null); fetchReceipts(); }}
          onCustomerCreated={(c) => setCustomers((prev) => [...prev, c])}
        />
      )}
    </div>
  );
}

function ReceiptModal({
  editing,
  customers,
  onClose,
  onSaved,
  onCustomerCreated,
}: {
  editing: AccReceipt | null;
  customers: Customer[];
  onClose: () => void;
  onSaved: () => void;
  onCustomerCreated: (c: Customer) => void;
}) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(editing ? editing.date.split("T")[0] : today);
  const [customerId, setCustomerId] = useState(editing ? String(editing.customerId) : "");
  const [billingNoteId, setBillingNoteId] = useState(editing?.billingNoteId ? String(editing.billingNoteId) : "");
  const [invoiceId, setInvoiceId] = useState(editing?.invoiceId ? String(editing.invoiceId) : "");
  const [paymentMethod, setPaymentMethod] = useState(editing?.paymentMethod ?? "CASH");
  const [vatRate, setVatRate] = useState(editing ? Number(editing.vatRate) : 7);
  const [note, setNote] = useState(editing?.note ?? "");
  const [items, setItems] = useState<AccItem[]>(editing?.items?.length ? editing.items : [{ ...EMPTY_ITEM }]);
  const [saving, setSaving] = useState(false);
  const [billingNotes, setBillingNotes] = useState<BillingNote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [creatingCust, setCreatingCust] = useState(false);

  useEffect(() => {
    if (!customerId) { setBillingNotes([]); setInvoices([]); return; }
    Promise.all([
      fetch(`/api/admin/acc/billing-notes?customerId=${customerId}&status=PENDING`).then((r) => r.json()),
      fetch(`/api/admin/acc/invoices?customerId=${customerId}`).then((r) => r.json()),
    ]).then(([bn, inv]) => {
      if (bn.success) setBillingNotes(bn.data);
      if (inv.success) setInvoices(inv.data.filter((i: Invoice) => ["PENDING", "BILLED"].includes(i.status)));
    });
  }, [customerId]);

  const prefillFromBN = (id: string) => {
    const bn = billingNotes.find((b) => String(b.id) === id);
    if (bn) { setItems(bn.items?.length ? bn.items : [{ ...EMPTY_ITEM }]); setVatRate(bn.vatRate ?? 7); }
    setBillingNoteId(id);
    setInvoiceId("");
  };

  const prefillFromInv = (id: string) => {
    const inv = invoices.find((i) => String(i.id) === id);
    if (inv) { setItems(inv.items?.length ? inv.items : [{ ...EMPTY_ITEM }]); setVatRate(inv.vatRate ?? 7); }
    setInvoiceId(id);
    setBillingNoteId("");
  };

  const { subtotal, vatAmount, totalAmount } = calcTotals(items, vatRate);

  const updateItem = (idx: number, patch: Partial<AccItem>) =>
    setItems((prev) => prev.map((it, i) => {
      if (i !== idx) return it;
      const m = { ...it, ...patch };
      m.amount = calcItem(m);
      return m;
    }));

  const createCustomer = async () => {
    if (!newCustName.trim()) return;
    setCreatingCust(true);
    const res = await fetch("/api/admin/acc/customers", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCustName.trim() }),
    });
    const data = await res.json();
    if (data.success) { onCustomerCreated(data.data); setCustomerId(String(data.data.id)); setShowNewCustomer(false); setNewCustName(""); }
    setCreatingCust(false);
  };

  const handleSave = async () => {
    if (!date || !customerId) return;
    setSaving(true);
    const url = editing ? `/api/admin/acc/receipts/${editing.id}` : "/api/admin/acc/receipts";
    const res = await fetch(url, {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date, customerId, billingNoteId: billingNoteId || null, invoiceId: invoiceId || null,
        items, subtotal, vatRate, vatAmount, totalAmount, paymentMethod, note,
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
            <Receipt className="w-5 h-5 text-[#C8A951]" />
            <h3 className="font-bold text-gray-900">{editing ? "แก้ไขใบเสร็จ" : "สร้างใบเสร็จรับเงิน"}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">วันที่ออกเอกสาร *</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-200" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">ลูกค้า *</label>
            {showNewCustomer ? (
              <div className="flex gap-2">
                <input value={newCustName} onChange={(e) => setNewCustName(e.target.value)} placeholder="ชื่อลูกค้าใหม่"
                  className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-200" />
                <button onClick={createCustomer} disabled={creatingCust || !newCustName}
                  className="px-4 py-2 bg-[#C8A951] text-white rounded-lg text-sm disabled:opacity-50">
                  {creatingCust ? <Loader2 className="w-4 h-4 animate-spin" /> : "เพิ่ม"}
                </button>
                <button onClick={() => setShowNewCustomer(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">ยกเลิก</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <select value={customerId} onChange={(e) => { setCustomerId(e.target.value); setBillingNoteId(""); setInvoiceId(""); }}
                  className="flex-1 px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-200">
                  <option value="">-- เลือกลูกค้า --</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button onClick={() => setShowNewCustomer(true)} className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 whitespace-nowrap">+ ลูกค้าใหม่</button>
              </div>
            )}
          </div>

          {customerId && billingNotes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">อ้างอิงใบวางบิล (จะดึงรายการมาเติม)</label>
              <select value={billingNoteId} onChange={(e) => prefillFromBN(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-200">
                <option value="">-- ไม่อ้างอิง --</option>
                {billingNotes.map((b) => <option key={b.id} value={b.id}>{b.docNumber} — ฿{fmt(Number(b.totalAmount))}</option>)}
              </select>
            </div>
          )}

          {customerId && !billingNoteId && invoices.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">อ้างอิงใบแจ้งหนี้ (จะดึงรายการมาเติม)</label>
              <select value={invoiceId} onChange={(e) => prefillFromInv(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-200">
                <option value="">-- ไม่อ้างอิง --</option>
                {invoices.map((i) => <option key={i.id} value={i.id}>{i.docNumber} — ฿{fmt(Number(i.totalAmount))}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">วิธีชำระเงิน</label>
            <div className="flex gap-4 flex-wrap">
              {["CASH", "CHEQUE", "TRANSFER", "CREDIT"].map((m) => (
                <label key={m} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={paymentMethod === m} onChange={() => setPaymentMethod(m)}
                    className="text-[#C8A951] focus:ring-amber-300" />
                  <span className="text-sm">{PAYMENT_LABELS[m]}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">รายการ</label>
              <button onClick={() => setItems((p) => [...p, { ...EMPTY_ITEM }])} className="text-xs text-[#C8A951] hover:underline">+ เพิ่มรายการ</button>
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
                          className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-amber-200" placeholder="รายละเอียด" />
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
                      <td className="px-2 py-1.5 text-right text-xs font-medium text-gray-700">{fmt(calcItem(item))}</td>
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
                <div className="flex justify-between text-gray-600"><span>รวมเป็นเงิน</span><span>฿{fmt(subtotal)}</span></div>
                <div className="flex justify-between text-gray-600"><span>VAT {vatRate}%</span><span>฿{fmt(vatAmount)}</span></div>
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
