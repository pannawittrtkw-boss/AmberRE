"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Download, Paperclip, Share2, Eye, Pencil, CheckCircle2,
  X, Upload, FileText, Loader2, ExternalLink, BellRing, PenLine, RotateCcw,
} from "lucide-react";

export type QuickActionContract = {
  id: number;
  contractNumber: string;
  signedPdfUrl?: string | null;
  shareToken?: string | null;
  subtitle?: string;
  lesseeName?: string;
  latePaymentFee?: number;
};

// Extracted from admin/contracts/page.tsx's per-row "แนบสัญญาที่เซ็นแล้ว" modal
// so agents (not just admins) can attach/replace/remove the signed copy of
// their own contract from the recent-contracts widgets.
function SignedPdfModal({
  contract,
  locale,
  onClose,
  onSaved,
}: {
  contract: QuickActionContract;
  locale: string;
  onClose: () => void;
  onSaved: (updated: Pick<QuickActionContract, "id" | "signedPdfUrl" | "shareToken">) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const shareUrl = contract.shareToken
    ? `${window.location.origin}/${locale}/contracts/share/${contract.shareToken}`
    : null;

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/admin/contracts/${contract.id}/signed-pdf`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Upload failed");
      onSaved({ id: contract.id, signedPdfUrl: data.data.signedPdfUrl, shareToken: data.data.shareToken });
    } catch (e: any) {
      setError(e.message || "Upload failed");
    }
    setUploading(false);
  };

  const handleRemove = async () => {
    if (!confirm("ลบไฟล์สัญญาที่เซ็นแล้ว?")) return;
    const res = await fetch(`/api/admin/contracts/${contract.id}/signed-pdf`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) onSaved({ id: contract.id, signedPdfUrl: null, shareToken: contract.shareToken });
  };

  const copyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-lg w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-amber-600" />
            <h3 className="font-semibold text-gray-900">
              {locale === "th" ? "สัญญาที่เซ็นแล้ว" : "Signed Contract"}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <p className="text-sm text-gray-500">
            {contract.contractNumber}{contract.subtitle ? ` · ${contract.subtitle}` : ""}
          </p>

          {contract.signedPdfUrl && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <span className="text-sm font-medium text-green-800">มีไฟล์สัญญาที่เซ็นแล้ว</span>
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={contract.signedPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 text-xs bg-white border border-green-300 text-green-700 rounded hover:bg-green-50 flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" /> ดู
                  </a>
                  <button
                    onClick={handleRemove}
                    className="px-2 py-1 text-xs bg-white border border-red-200 text-red-500 rounded hover:bg-red-50"
                  >
                    ลบ
                  </button>
                </div>
              </div>
            </div>
          )}

          {shareUrl && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs font-medium text-blue-700 mb-2 flex items-center gap-1">
                <Share2 className="w-3.5 h-3.5" />
                {locale === "th" ? "ลิงก์แชร์สำหรับดู PDF Online" : "Share link to view PDF online"}
              </p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  className="flex-1 text-xs bg-white border border-blue-200 rounded px-2 py-1.5 text-gray-700 select-all"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  onClick={copyLink}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${copied ? "bg-green-500 text-white" : "bg-blue-600 text-white hover:bg-blue-700"}`}
                >
                  {copied ? "✓ Copied" : locale === "th" ? "คัดลอก" : "Copy"}
                </button>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={locale === "th" ? "เปิดลิงก์" : "Open link"}
                  className="shrink-0 flex items-center justify-center px-2 py-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded border border-blue-200"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              {contract.signedPdfUrl
                ? (locale === "th" ? "อัปโหลดไฟล์ใหม่ (แทนที่เดิม)" : "Upload replacement file")
                : (locale === "th" ? "แนบไฟล์สัญญาที่เซ็นแล้ว (.pdf สูงสุด 20MB)" : "Attach signed contract PDF (max 20MB)")}
            </label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-amber-400 transition-colors cursor-pointer"
              onClick={() => inputRef.current?.click()}
            >
              {file ? (
                <div className="flex items-center justify-center gap-2 text-sm text-green-700">
                  <FileText className="w-4 h-4" />
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              ) : (
                <div className="text-sm text-gray-400 space-y-1">
                  <Upload className="w-6 h-6 mx-auto text-gray-300" />
                  <p>คลิกเพื่อเลือกไฟล์ PDF</p>
                </div>
              )}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => { setFile(e.target.files?.[0] || null); setError(""); }}
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
            {locale === "th" ? "ปิด" : "Close"}
          </button>
          {file && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-60"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? (locale === "th" ? "กำลังอัปโหลด..." : "Uploading...") : (locale === "th" ? "อัปโหลด" : "Upload")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function fmtScheduleDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
}

type RentPayment = {
  id: number;
  dueDate: string;
  amount: number;
  isPaid: boolean;
};

// Extracted from admin/contracts/page.tsx's "ตารางแจ้งเตือนค่าเช่า" modal.
function PaymentScheduleModal({
  contract,
  locale,
  onClose,
}: {
  contract: QuickActionContract;
  locale: string;
  onClose: () => void;
}) {
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/admin/rent-payments?contractId=${contract.id}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setPayments(d.data); })
      .finally(() => setLoading(false));
  }, [contract.id]);

  const markPaid = async (paymentId: number) => {
    setMarkingId(paymentId);
    try {
      const res = await fetch(`/api/admin/rent-payments/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPaid: true }),
      });
      const d = await res.json();
      if (d.success) {
        setPayments((prev) => prev.map((p) => (p.id === paymentId ? { ...p, isPaid: true } : p)));
      }
    } finally {
      setMarkingId(null);
    }
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const paid = payments.filter((p) => p.isPaid).length;
  const pending = payments.filter((p) => !p.isPaid).length;
  const perDayFee = contract.latePaymentFee ?? 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl w-full max-w-md shadow-xl flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <BellRing className="w-4 h-4 text-amber-600" />
            <h3 className="font-semibold text-gray-900 text-sm">
              {locale === "th" ? "ตารางแจ้งเตือนค่าเช่า" : "Rent Payment Schedule"}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-3 border-b bg-gray-50 shrink-0">
          <p className="text-xs font-medium text-gray-800">
            {contract.contractNumber}{contract.subtitle ? ` · ${contract.subtitle}` : ""}
          </p>
          {contract.lesseeName && (
            <p className="text-xs text-gray-500 mt-0.5">{contract.lesseeName}</p>
          )}
          {!loading && (
            <div className="flex gap-2 mt-2">
              <span className="text-[11px] bg-white border border-gray-200 rounded-full px-2 py-0.5 text-gray-600">
                {payments.length} {locale === "th" ? "รายการ" : "records"}
              </span>
              <span className="text-[11px] bg-green-50 border border-green-200 rounded-full px-2 py-0.5 text-green-700">
                {paid} {locale === "th" ? "ชำระแล้ว" : "paid"}
              </span>
              <span className="text-[11px] bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 text-amber-700">
                {pending} {locale === "th" ? "รอชำระ" : "pending"}
              </span>
            </div>
          )}
        </div>

        <div className="overflow-y-auto flex-1 py-2">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
            </div>
          ) : payments.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-10">
              {locale === "th" ? "ไม่มีรายการ" : "No records"}
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {payments.map((p, i) => {
                const dueDateStr = new Date(p.dueDate).toISOString().slice(0, 10);
                const isOverdue = !p.isPaid && dueDateStr < todayStr;
                const isToday = !p.isPaid && dueDateStr === todayStr;

                const overdueDays = isOverdue
                  ? Math.ceil((Date.now() - new Date(p.dueDate).getTime()) / 86400000)
                  : 0;
                const penalty = overdueDays * perDayFee;

                let statusEl: React.ReactNode;
                if (p.isPaid) {
                  statusEl = (
                    <span className="flex items-center gap-1 text-[11px] text-green-600">
                      <CheckCircle2 className="w-3 h-3" />
                      {locale === "th" ? "ชำระแล้ว" : "Paid"}
                    </span>
                  );
                } else if (isToday) {
                  statusEl = (
                    <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                      {locale === "th" ? "วันนี้" : "Today"}
                    </span>
                  );
                } else if (isOverdue) {
                  statusEl = (
                    <span className="text-[11px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                      {locale === "th" ? `เกิน ${overdueDays} วัน` : `${overdueDays}d overdue`}
                    </span>
                  );
                } else {
                  statusEl = (
                    <span className="text-[11px] text-gray-400">
                      {locale === "th" ? "รออยู่" : "Upcoming"}
                    </span>
                  );
                }

                return (
                  <li
                    key={p.id}
                    className={`px-5 py-2.5 ${p.isPaid ? "opacity-40" : ""} ${isOverdue ? "bg-red-50/40" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-gray-400 w-5 text-right shrink-0">{i + 1}</span>
                      <span className={`text-xs font-medium w-24 shrink-0 ${isOverdue ? "text-red-600" : isToday ? "text-amber-600" : "text-gray-700"}`}>
                        {fmtScheduleDate(p.dueDate)}
                      </span>
                      <span className="text-xs text-gray-700 flex-1">
                        ฿{p.amount.toLocaleString()}
                      </span>
                      <div className="shrink-0">{statusEl}</div>
                      {!p.isPaid && (
                        <button
                          onClick={() => markPaid(p.id)}
                          disabled={markingId === p.id}
                          className="shrink-0 flex items-center gap-1 text-[11px] font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-60 px-2 py-1 rounded"
                        >
                          {markingId === p.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                          {locale === "th" ? "ชำระแล้ว" : "Mark paid"}
                        </button>
                      )}
                    </div>
                    {isOverdue && (
                      <p className="text-[11px] text-red-600 mt-1 ml-8">
                        {locale === "th"
                          ? `ค้างชำระมาแล้ว ${overdueDays} วัน · ค่าปรับ ฿${penalty.toLocaleString()}${perDayFee ? ` (฿${perDayFee.toLocaleString()}/วัน)` : ""}`
                          : `${overdueDays} days overdue · Penalty ฿${penalty.toLocaleString()}${perDayFee ? ` (฿${perDayFee.toLocaleString()}/day)` : ""}`}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="px-5 py-3 border-t bg-gray-50 rounded-b-xl shrink-0">
          <button onClick={onClose} className="w-full py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
            {locale === "th" ? "ปิด" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}

type ESignInfo = {
  lessorName: string;
  lesseeName: string;
  jointLesseeName?: string | null;
  lessorSignToken?: string | null;
  lesseeSignToken?: string | null;
  jointLesseeSignToken?: string | null;
  commissionSignToken?: string | null;
  lessorSignedAt?: string | null;
  lesseeSignedAt?: string | null;
  jointLesseeSignedAt?: string | null;
  commissionSignedAt?: string | null;
};

// Extracted from admin/contracts/page.tsx's E-Sign modal — lets an agent
// generate/copy signing links and save the fully-signed PDF back onto
// their own contract, same as an admin can.
function ESignModal({
  contract,
  locale,
  onClose,
  onSaved,
}: {
  contract: QuickActionContract;
  locale: string;
  onClose: () => void;
  onSaved: (updated: Pick<QuickActionContract, "id" | "signedPdfUrl" | "shareToken">) => void;
}) {
  const [info, setInfo] = useState<ESignInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [savingPdf, setSavingPdf] = useState(false);
  const [savedJustNow, setSavedJustNow] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/contracts/${contract.id}/esign`);
      const d = await res.json();
      if (d.success) setInfo(d.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [contract.id]);

  const generate = async (regenerate?: "lessor" | "lessee" | "joint_lessee" | "commission" | "both") => {
    setGenerating(true);
    setError("");
    try {
      const body = regenerate ? { regenerate } : {};
      const res = await fetch(`/api/admin/contracts/${contract.id}/esign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error || "Failed");
      setInfo(d.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    }
    setGenerating(false);
  };

  const buildSignUrl = (token: string) =>
    `${window.location.origin}/${locale}/sign/${token}`;

  const copyLink = (key: string, token: string) => {
    navigator.clipboard.writeText(buildSignUrl(token));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const fmtSignedAt = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : null;

  const hasTokens = info?.lessorSignToken && info?.lesseeSignToken;
  const needsJointLesseeToken = !!info?.jointLesseeName && !info?.jointLesseeSignToken;
  const allSigned =
    !!info?.lessorSignedAt &&
    !!info?.lesseeSignedAt &&
    (!info?.jointLesseeName || !!info?.jointLesseeSignedAt);

  const saveToAttachment = async () => {
    setSavingPdf(true);
    setError("");
    try {
      const pdfRes = await fetch(`/api/admin/contracts/${contract.id}/pdf`);
      if (!pdfRes.ok) throw new Error("สร้าง PDF ไม่สำเร็จ");
      const blob = await pdfRes.blob();
      const file = new File([blob], `${contract.contractNumber}.pdf`, { type: "application/pdf" });
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/admin/contracts/${contract.id}/signed-pdf`, {
        method: "POST",
        body: fd,
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error || "บันทึกไฟล์ไม่สำเร็จ");
      onSaved({ id: contract.id, signedPdfUrl: d.data.signedPdfUrl, shareToken: d.data.shareToken });
      setSavedJustNow(true);
      setTimeout(() => setSavedJustNow(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    }
    setSavingPdf(false);
  };

  const partyRow = (
    key: string,
    label: string,
    name: string,
    token: string,
    signedAt: string | null | undefined,
    onRegenerate: () => void,
  ) => (
    <div className={`rounded-xl border p-4 ${signedAt ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-xs font-semibold text-gray-700">{label}</p>
          <p className="text-sm font-medium text-gray-900">{name}</p>
        </div>
        {signedAt ? (
          <span className="flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full shrink-0">
            <CheckCircle2 className="w-3 h-3" /> เซ็นแล้ว
          </span>
        ) : (
          <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full shrink-0">
            รอเซ็น
          </span>
        )}
      </div>
      {signedAt && (
        <p className="text-xs text-green-600 mb-2">เซ็นเมื่อ {fmtSignedAt(signedAt)}</p>
      )}
      <div className="flex gap-2 items-center">
        <input
          readOnly
          value={buildSignUrl(token)}
          className="flex-1 text-xs bg-white border border-gray-200 rounded px-2 py-1.5 text-gray-600 select-all min-w-0"
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <button
          onClick={() => copyLink(key, token)}
          className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded transition-colors ${copiedKey === key ? "bg-green-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
        >
          {copiedKey === key ? "✓" : locale === "th" ? "คัดลอก" : "Copy"}
        </button>
        <a
          href={buildSignUrl(token)}
          target="_blank"
          rel="noopener noreferrer"
          title={locale === "th" ? "เปิดลิงก์" : "Open link"}
          className="shrink-0 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <button
          onClick={() => { if (confirm("สร้างลิงก์ใหม่? ลิงก์เดิมและลายเซ็นจะถูกลบ")) onRegenerate(); }}
          disabled={generating}
          title="สร้างลิงก์ใหม่"
          className="shrink-0 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-lg w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <PenLine className="w-4 h-4 text-amber-600" />
            <h3 className="font-semibold text-gray-900">E-Sign</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <p className="text-sm text-gray-500">
            {contract.contractNumber}{contract.subtitle ? ` · ${contract.subtitle}` : ""}
          </p>

          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-amber-600" /></div>
          ) : (
            <>
              {!hasTokens && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 mb-4">
                    {locale === "th"
                      ? "สร้างลิงก์สำหรับผู้ให้เช่าและผู้เช่าเพื่อลงลายมือชื่อออนไลน์"
                      : "Generate signing links for lessor and lessee to sign online"}
                  </p>
                  <button
                    onClick={() => generate()}
                    disabled={generating}
                    className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-[#C8A951] text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-60"
                  >
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
                    {locale === "th" ? "สร้างลิงก์ E-Sign" : "Generate E-Sign Links"}
                  </button>
                </div>
              )}

              {info?.lessorSignToken && partyRow(
                "lessor", "ผู้ให้เช่า / Lessor", info.lessorName, info.lessorSignToken,
                info.lessorSignedAt, () => generate("lessor"),
              )}

              {info?.lesseeSignToken && partyRow(
                "lessee", "ผู้เช่า / Lessee", info.lesseeName, info.lesseeSignToken,
                info.lesseeSignedAt, () => generate("lessee"),
              )}

              {info?.jointLesseeName && needsJointLesseeToken && (
                <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4">
                  <p className="text-xs font-semibold text-gray-700 mb-0.5">ผู้เช่าร่วม / Joint Lessee</p>
                  <p className="text-sm font-medium text-gray-900 mb-3">{info.jointLesseeName}</p>
                  <button
                    onClick={() => generate("joint_lessee")}
                    disabled={generating}
                    className="flex items-center gap-2 px-4 py-2 bg-[#C8A951] text-white text-xs font-medium rounded-lg hover:bg-amber-600 disabled:opacity-60"
                  >
                    {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PenLine className="w-3.5 h-3.5" />}
                    สร้างลิงก์ Joint Lessee
                  </button>
                </div>
              )}

              {info?.jointLesseeName && info?.jointLesseeSignToken && partyRow(
                "joint_lessee", "ผู้เช่าร่วม / Joint Lessee", info.jointLesseeName, info.jointLesseeSignToken,
                info.jointLesseeSignedAt, () => generate("joint_lessee"),
              )}

              {info?.lessorName && !info?.commissionSignToken && (
                <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4">
                  <p className="text-xs font-semibold text-gray-700 mb-0.5">
                    สัญญาแต่งตั้งนายหน้า / Commission Agreement (ผู้ให้เช่า)
                  </p>
                  <p className="text-sm font-medium text-gray-900 mb-3">{info.lessorName}</p>
                  <button
                    onClick={() => generate("commission")}
                    disabled={generating}
                    className="flex items-center gap-2 px-4 py-2 bg-[#C8A951] text-white text-xs font-medium rounded-lg hover:bg-amber-600 disabled:opacity-60"
                  >
                    {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PenLine className="w-3.5 h-3.5" />}
                    สร้างลิงก์สัญญาแต่งตั้งนายหน้า
                  </button>
                </div>
              )}

              {info?.commissionSignToken && partyRow(
                "commission", "สัญญาแต่งตั้งนายหน้า / Commission Agreement (ผู้ให้เช่า)",
                info.lessorName, info.commissionSignToken, info.commissionSignedAt,
                () => generate("commission"),
              )}

              {error && <p className="text-xs text-red-600">{error}</p>}
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t bg-gray-50 rounded-b-xl">
          {allSigned && (
            <button
              onClick={saveToAttachment}
              disabled={savingPdf}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-60 rounded-lg"
            >
              {savingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : savedJustNow ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Paperclip className="w-4 h-4" />
              )}
              {savedJustNow
                ? locale === "th" ? "บันทึกแล้ว" : "Saved"
                : locale === "th" ? "บันทึกไฟล์เข้าไฟล์แนบ" : "Save to attachment"}
            </button>
          )}
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
            {locale === "th" ? "ปิด" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}

// A row of icon buttons for acting on a single contract, used by both the
// admin's per-agent commission-overview page and the agent's own dashboard.
// Which functions show is controlled by the show* props so each surface can
// offer the set that makes sense there (e.g. the agent dashboard swaps Edit
// out for E-Sign + Payment schedule).
export default function ContractQuickActions({
  contract,
  locale,
  onUpdate,
  showEdit = true,
  showEsign = false,
  showSchedule = false,
}: {
  contract: QuickActionContract;
  locale: string;
  onUpdate?: (updated: Pick<QuickActionContract, "id" | "signedPdfUrl" | "shareToken">) => void;
  showEdit?: boolean;
  showEsign?: boolean;
  showSchedule?: boolean;
}) {
  const [signedModalOpen, setSignedModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [esignModalOpen, setEsignModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [local, setLocal] = useState(contract);

  const copyShareLink = () => {
    if (!local.shareToken) return;
    const url = `${window.location.origin}/${locale}/contracts/share/${local.shareToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaved = (updated: Pick<QuickActionContract, "id" | "signedPdfUrl" | "shareToken">) => {
    setLocal((prev) => ({ ...prev, ...updated }));
    onUpdate?.(updated);
  };

  return (
    <>
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <a
          href={`/api/admin/contracts/${local.id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          title={locale === "th" ? "ดาวน์โหลด PDF" : "Download PDF"}
          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
        >
          <Download className="w-4 h-4" />
        </a>
        <button
          onClick={() => setSignedModalOpen(true)}
          title={locale === "th" ? "แนบสัญญาที่เซ็นแล้ว" : "Attach signed contract"}
          className={`p-1.5 rounded transition-colors ${local.signedPdfUrl ? "text-green-600 bg-green-50 hover:bg-green-100" : "text-gray-400 hover:bg-gray-100"}`}
        >
          <Paperclip className="w-4 h-4" />
        </button>
        {local.signedPdfUrl && local.shareToken && (
          <button
            onClick={copyShareLink}
            title={locale === "th" ? "คัดลอกลิงก์แชร์" : "Copy share link"}
            className={`p-1.5 rounded transition-colors ${copied ? "text-green-600 bg-green-50" : "text-blue-500 hover:bg-blue-50"}`}
          >
            {copied ? <CheckCircle2 className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          </button>
        )}
        <Link
          href={`/${locale}/admin/contracts/${local.id}`}
          title={locale === "th" ? "ดู" : "View"}
          className="p-1.5 text-stone-600 hover:bg-stone-50 rounded"
        >
          <Eye className="w-4 h-4" />
        </Link>
        {showEdit && (
          <Link
            href={`/${locale}/admin/contracts/${local.id}/edit`}
            title={locale === "th" ? "แก้ไข" : "Edit"}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
          >
            <Pencil className="w-4 h-4" />
          </Link>
        )}
        {showEsign && (
          <button
            onClick={() => setEsignModalOpen(true)}
            title="E-Sign"
            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
          >
            <PenLine className="w-4 h-4" />
          </button>
        )}
        {showSchedule && (
          <button
            onClick={() => setScheduleModalOpen(true)}
            title={locale === "th" ? "ตารางแจ้งเตือนค่าเช่า" : "Payment schedule"}
            className="p-1.5 text-amber-500 hover:bg-amber-50 rounded"
          >
            <BellRing className="w-4 h-4" />
          </button>
        )}
      </div>

      {signedModalOpen && (
        <SignedPdfModal
          contract={local}
          locale={locale}
          onClose={() => setSignedModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
      {scheduleModalOpen && (
        <PaymentScheduleModal
          contract={local}
          locale={locale}
          onClose={() => setScheduleModalOpen(false)}
        />
      )}
      {esignModalOpen && (
        <ESignModal
          contract={local}
          locale={locale}
          onClose={() => setEsignModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
