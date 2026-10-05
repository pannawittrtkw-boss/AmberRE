"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Loader2, Plus, FileText, Trash2, Pencil, X, ExternalLink,
  CheckCircle2, PenLine, ImagePlus,
} from "lucide-react";

interface Booking {
  id: number;
  docNumber: string;
  date: string;
  projectName: string | null;
  unitNumber: string | null;
  propertyAddress: string | null;
  ownerName: string;
  ownerIdCard: string | null;
  ownerIdCardImage: string | null;
  ownerAddress: string | null;
  ownerPhone: string | null;
  ownerBankName: string | null;
  ownerBankAccountNumber: string | null;
  ownerBankAccountName: string | null;
  tenantName: string;
  tenantIdCard: string | null;
  tenantAddress: string | null;
  tenantPhone: string | null;
  depositAmount: number;
  monthlyRent: number | null;
  leaseTermMonths: number | null;
  depositDate: string | null;
  appointmentDate: string | null;
  moveInDate: string | null;
  transferSlipImage: string | null;
  issuerName: string | null;
  witnessName: string | null;
  agentPhone: string | null;
  signToken: string | null;
  signedAt: string | null;
  tenantSignToken: string | null;
  tenantSignedAt: string | null;
  witnessSignToken: string | null;
  witnessSignedAt: string | null;
  status: string;
  createdAt: string;
}

function fmt(n: number) {
  return n.toLocaleString("en-US");
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" });
}
function toDateInput(d: string | null) {
  return d ? d.split("T")[0] : "";
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function IdUploadBox({
  label, value, onChange,
}: { label: string; value: string | null; onChange: (v: string | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try { onChange(await fileToBase64(file)); } catch {}
    e.target.value = "";
  };
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-700">{label}</p>
        {value && (
          <button type="button" onClick={() => onChange(null)} className="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {value ? (
        <div className="relative rounded-lg overflow-hidden border border-gray-200 cursor-pointer group" onClick={() => ref.current?.click()}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="w-full h-24 object-contain bg-gray-50" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 bg-black/60 px-2 py-1 rounded">เปลี่ยนรูป</span>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()}
          className="w-full h-24 rounded-lg border-2 border-dashed border-gray-200 hover:border-amber-400 hover:bg-amber-50/50 flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:text-amber-600">
          <ImagePlus className="w-5 h-5" />
          <span className="text-xs">อัปโหลดรูป</span>
        </button>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactElement<{ id?: string }> }) {
  const id = React.useId();
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      {React.cloneElement(children, { id })}
    </div>
  );
}

const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent";

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: "รอเซ็น", cls: "bg-amber-100 text-amber-800" },
  PARTIALLY_SIGNED: { label: "เซ็นบางส่วน", cls: "bg-blue-100 text-blue-800" },
  SIGNED: { label: "เซ็นครบแล้ว", cls: "bg-green-100 text-green-800" },
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [signLinkFor, setSignLinkFor] = useState<Booking | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/bookings");
      const data = await res.json();
      if (data.success) setBookings(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleDelete = async (b: Booking) => {
    if (!confirm(`ลบ ${b.docNumber}?`)) return;
    await fetch(`/api/admin/bookings/${b.id}`, { method: "DELETE" });
    fetchBookings();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">ใบจอง</h1>
          <p className="text-sm text-gray-500 mt-1">
            เอกสารรับเงินมัดจำระหว่างเจ้าของกับผู้เช่า — รองรับให้เจ้าของเซ็นออนไลน์
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="inline-flex items-center gap-2 bg-[#C8A951] hover:bg-[#B8993F] text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          สร้างใบจอง
        </button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#C8A951]" /></div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">ยังไม่มีใบจอง</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-gray-500 text-xs">
                  <th className="text-left px-4 py-3 font-medium">เลขที่</th>
                  <th className="text-left px-4 py-3 font-medium">วันที่</th>
                  <th className="text-left px-4 py-3 font-medium">เจ้าของ</th>
                  <th className="text-left px-4 py-3 font-medium">ผู้เช่า</th>
                  <th className="text-left px-4 py-3 font-medium">ทรัพย์สิน</th>
                  <th className="text-right px-4 py-3 font-medium">เงินมัดจำ</th>
                  <th className="text-left px-4 py-3 font-medium">สถานะ</th>
                  <th className="w-36"></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const st = STATUS_LABELS[b.status] ?? { label: b.status, cls: "bg-gray-100 text-gray-600" };
                  return (
                    <tr key={b.id} className="border-b last:border-b-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-700">{b.docNumber}</td>
                      <td className="px-4 py-3 text-gray-600">{fmtDate(b.date)}</td>
                      <td className="px-4 py-3 font-medium">{b.ownerName}</td>
                      <td className="px-4 py-3">{b.tenantName}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {[b.projectName, b.unitNumber].filter(Boolean).join(" #")}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">฿{fmt(Number(b.depositAmount))}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <a
                            href={`/api/admin/bookings/${b.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-400 hover:text-[#C8A951] hover:bg-amber-50 rounded"
                            title="ดู PDF"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => setSignLinkFor(b)}
                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"
                            title="ลิงก์เซ็นออนไลน์"
                          >
                            <PenLine className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => { setEditing(b); setShowModal(true); }}
                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"
                            title="แก้ไข"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(b)}
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
        <BookingModal
          editing={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSaved={() => { setShowModal(false); setEditing(null); fetchBookings(); }}
        />
      )}

      {signLinkFor && (
        <SignLinkModal booking={signLinkFor} onClose={() => setSignLinkFor(null)} />
      )}
    </div>
  );
}

function SignLinkRow({
  label, personName, token, signedAt, emptyHint,
}: {
  label: string;
  personName: string | null;
  token: string | null;
  signedAt: string | null;
  emptyHint?: string;
}) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" && token
    ? `${window.location.origin}/th/sign-booking/${token}`
    : "";

  const copy = () => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`rounded-xl border p-4 ${signedAt ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
      <p className="text-xs font-semibold text-gray-700 mb-1">{label}{personName ? ` · ${personName}` : ""}</p>
      {!token ? (
        <p className="text-xs text-gray-400">{emptyHint || "ยังไม่มีลิงก์"}</p>
      ) : signedAt ? (
        <p className="flex items-center gap-1 text-xs text-green-700 mb-2">
          <CheckCircle2 className="w-3.5 h-3.5" />
          เซ็นแล้วเมื่อ {new Date(signedAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}
        </p>
      ) : (
        <p className="text-xs text-amber-700 mb-2">ยังไม่ได้เซ็น — ส่งลิงก์นี้เมื่อพร้อม</p>
      )}
      {token && (
        <div className="flex gap-2 items-center">
          <input
            readOnly
            value={url}
            className="flex-1 text-xs bg-white border border-gray-200 rounded px-2 py-1.5 text-gray-600 select-all min-w-0"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            onClick={copy}
            className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded transition-colors ${copied ? "bg-green-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            {copied ? "✓" : "คัดลอก"}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}

function SignLinkModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <PenLine className="w-4 h-4 text-amber-600" />
            <h3 className="font-semibold text-gray-900">ลิงก์เซ็นออนไลน์</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-sm text-gray-500">{booking.docNumber}</p>
          <SignLinkRow
            label="เจ้าของ"
            personName={booking.ownerName}
            token={booking.signToken}
            signedAt={booking.signedAt}
          />
          <SignLinkRow
            label="ผู้เช่า"
            personName={booking.tenantName}
            token={booking.tenantSignToken}
            signedAt={booking.tenantSignedAt}
          />
          <SignLinkRow
            label="พยาน"
            personName={booking.witnessName}
            token={booking.witnessSignToken}
            signedAt={booking.witnessSignedAt}
            emptyHint="ยังไม่ได้ระบุชื่อพยาน"
          />
        </div>
      </div>
    </div>
  );
}

function BookingModal({
  editing, onClose, onSaved,
}: { editing: Booking | null; onClose: () => void; onSaved: () => void }) {
  const [projectName, setProjectName] = useState(editing?.projectName ?? "");
  const [unitNumber, setUnitNumber] = useState(editing?.unitNumber ?? "");
  const [propertyAddress, setPropertyAddress] = useState(editing?.propertyAddress ?? "");

  const [ownerName, setOwnerName] = useState(editing?.ownerName ?? "");
  const [ownerIdCard, setOwnerIdCard] = useState(editing?.ownerIdCard ?? "");
  const [ownerIdCardImage, setOwnerIdCardImage] = useState<string | null>(editing?.ownerIdCardImage ?? null);
  const [ownerAddress, setOwnerAddress] = useState(editing?.ownerAddress ?? "");
  const [ownerPhone, setOwnerPhone] = useState(editing?.ownerPhone ?? "");
  const [ownerBankName, setOwnerBankName] = useState(editing?.ownerBankName ?? "");
  const [ownerBankAccountNumber, setOwnerBankAccountNumber] = useState(editing?.ownerBankAccountNumber ?? "");
  const [ownerBankAccountName, setOwnerBankAccountName] = useState(editing?.ownerBankAccountName ?? "");

  const [tenantName, setTenantName] = useState(editing?.tenantName ?? "");
  const [tenantIdCard, setTenantIdCard] = useState(editing?.tenantIdCard ?? "");
  const [tenantAddress, setTenantAddress] = useState(editing?.tenantAddress ?? "");
  const [tenantPhone, setTenantPhone] = useState(editing?.tenantPhone ?? "");

  const [depositAmount, setDepositAmount] = useState(editing ? String(editing.depositAmount) : "");
  const [monthlyRent, setMonthlyRent] = useState(editing?.monthlyRent != null ? String(editing.monthlyRent) : "");
  const [leaseTermMonths, setLeaseTermMonths] = useState(editing?.leaseTermMonths != null ? String(editing.leaseTermMonths) : "");
  const [depositDate, setDepositDate] = useState(toDateInput(editing?.depositDate ?? null) || new Date().toISOString().split("T")[0]);
  const [appointmentDate, setAppointmentDate] = useState(toDateInput(editing?.appointmentDate ?? null));
  const [moveInDate, setMoveInDate] = useState(toDateInput(editing?.moveInDate ?? null));

  const [transferSlipImage, setTransferSlipImage] = useState<string | null>(editing?.transferSlipImage ?? null);

  const [issuerName, setIssuerName] = useState(editing?.issuerName ?? "");
  const [witnessName, setWitnessName] = useState(editing?.witnessName ?? "");
  const [agentPhone, setAgentPhone] = useState(editing?.agentPhone ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!ownerName.trim() || !tenantName.trim()) {
      setError("กรุณากรอกชื่อเจ้าของและผู้เช่า");
      return;
    }
    const amount = Number(depositAmount);
    if (!amount || amount <= 0) {
      setError("กรุณากรอกจำนวนเงินมัดจำ");
      return;
    }
    setError("");
    setSaving(true);
    const url = editing ? `/api/admin/bookings/${editing.id}` : "/api/admin/bookings";
    const method = editing ? "PUT" : "POST";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName, unitNumber, propertyAddress,
          ownerName, ownerIdCard, ownerIdCardImage, ownerAddress, ownerPhone,
          ownerBankName, ownerBankAccountNumber, ownerBankAccountName,
          tenantName, tenantIdCard, tenantAddress, tenantPhone,
          depositAmount: amount,
          monthlyRent: monthlyRent ? Number(monthlyRent) : null,
          leaseTermMonths: leaseTermMonths ? Number(leaseTermMonths) : null,
          depositDate: depositDate || null,
          appointmentDate: appointmentDate || null,
          moveInDate: moveInDate || null,
          transferSlipImage,
          issuerName, witnessName, agentPhone,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "บันทึกไม่สำเร็จ");
      onSaved();
    } catch (e: any) {
      setError(e?.message || "เกิดข้อผิดพลาด");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#C8A951]" />
            <h3 className="font-bold text-gray-900">{editing ? "แก้ไขใบจอง" : "สร้างใบจอง"}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Property */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">ทรัพย์สิน</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Field label="โครงการ"><input value={projectName} onChange={(e) => setProjectName(e.target.value)} className={inputCls} /></Field>
              <Field label="เลขห้อง"><input value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} className={inputCls} /></Field>
            </div>
            <Field label="ที่อยู่ห้องพัก">
              <textarea value={propertyAddress} onChange={(e) => setPropertyAddress(e.target.value)} rows={2} className={inputCls + " resize-none"} />
            </Field>
          </div>

          <div className="border-t border-gray-100" />

          {/* Owner */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">เจ้าของทรัพย์สิน (ผู้รับเงิน)</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Field label="ชื่อ-นามสกุล *"><input value={ownerName} onChange={(e) => { setOwnerName(e.target.value); setError(""); }} className={inputCls} /></Field>
              <Field label="เลขบัตรประชาชน"><input value={ownerIdCard} onChange={(e) => setOwnerIdCard(e.target.value)} className={inputCls} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Field label="โทร"><input value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} className={inputCls} /></Field>
              <Field label="ที่อยู่"><input value={ownerAddress} onChange={(e) => setOwnerAddress(e.target.value)} className={inputCls} /></Field>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <Field label="ธนาคาร"><input value={ownerBankName} onChange={(e) => setOwnerBankName(e.target.value)} className={inputCls} /></Field>
              <Field label="เลขที่บัญชี"><input value={ownerBankAccountNumber} onChange={(e) => setOwnerBankAccountNumber(e.target.value)} className={inputCls} /></Field>
              <Field label="ชื่อบัญชี"><input value={ownerBankAccountName} onChange={(e) => setOwnerBankAccountName(e.target.value)} className={inputCls} /></Field>
            </div>
            <IdUploadBox label="สำเนาบัตรประชาชนเจ้าของ" value={ownerIdCardImage} onChange={setOwnerIdCardImage} />
          </div>

          <div className="border-t border-gray-100" />

          {/* Tenant */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">ผู้เช่า (ผู้จ่ายเงิน)</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Field label="ชื่อ-นามสกุล *"><input value={tenantName} onChange={(e) => { setTenantName(e.target.value); setError(""); }} className={inputCls} /></Field>
              <Field label="เลขบัตรประชาชน / พาสปอร์ต"><input value={tenantIdCard} onChange={(e) => setTenantIdCard(e.target.value)} className={inputCls} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Field label="โทร"><input value={tenantPhone} onChange={(e) => setTenantPhone(e.target.value)} className={inputCls} /></Field>
              <Field label="ที่อยู่"><input value={tenantAddress} onChange={(e) => setTenantAddress(e.target.value)} className={inputCls} /></Field>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Deal terms */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">ข้อมูลการเงิน</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Field label="จำนวนเงินมัดจำ (฿) *">
                <input type="number" min="0" value={depositAmount} onChange={(e) => { setDepositAmount(e.target.value); setError(""); }} className={inputCls} />
              </Field>
              <Field label="ค่าเช่าต่อเดือน (฿)">
                <input type="number" min="0" value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Field label="ระยะเวลาเช่า (เดือน)">
                <input type="number" min="0" value={leaseTermMonths} onChange={(e) => setLeaseTermMonths(e.target.value)} className={inputCls} />
              </Field>
              <Field label="วันที่วางเงินจอง">
                <input type="date" value={depositDate} onChange={(e) => setDepositDate(e.target.value)} className={inputCls} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Field label="วันที่นัดทำสัญญา">
                <input type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} className={inputCls} />
              </Field>
              <Field label="วันที่เข้าอยู่โดยประมาณ">
                <input type="date" value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} className={inputCls} />
              </Field>
            </div>
            <IdUploadBox label="สลิปการโอนเงินมัดจำ" value={transferSlipImage} onChange={setTransferSlipImage} />
          </div>

          <div className="border-t border-gray-100" />

          {/* Issuer / Witness */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Amber Real Estate (ผู้ออกเอกสาร / พยาน เท่านั้น)
            </p>
            <div className="grid grid-cols-3 gap-3">
              <Field label="ผู้ออกเอกสาร"><input value={issuerName} onChange={(e) => setIssuerName(e.target.value)} className={inputCls} /></Field>
              <Field label="พยาน"><input value={witnessName} onChange={(e) => setWitnessName(e.target.value)} className={inputCls} /></Field>
              <Field label="โทรติดต่อ"><input value={agentPhone} onChange={(e) => setAgentPhone(e.target.value)} className={inputCls} /></Field>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button onClick={onClose} className="px-5 py-2 border rounded-lg text-sm hover:bg-gray-50">ยกเลิก</button>
          <button onClick={handleSave} disabled={saving}
            className="inline-flex items-center gap-2 bg-[#C8A951] hover:bg-[#B8993F] disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-medium">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}
