"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Loader2,
  FileText,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Download,
  Settings,
  Copy,
  Paperclip,
  Share2,
  X,
  CheckCircle2,
  Upload,
  Clock,
  XCircle,
  BellRing,
  PenLine,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { getIntlLocale } from "@/lib/utils";

type Contract = {
  id: number;
  contractNumber: string;
  contractDate: string;
  startDate: string;
  endDate: string;
  lessorName: string;
  lesseeName: string;
  projectName: string;
  unitNumber: string;
  monthlyRent: string;
  contractType: string;
  status: string;
  signedPdfUrl?: string | null;
  shareToken?: string | null;
  property?: { id: number; titleTh: string; projectName: string | null } | null;
};

type ESignInfo = {
  id: number;
  lessorName: string;
  lesseeName: string;
  jointLesseeName?: string | null;
  lessorSignToken?: string | null;
  lesseeSignToken?: string | null;
  jointLesseeSignToken?: string | null;
  lessorSignedAt?: string | null;
  lesseeSignedAt?: string | null;
  jointLesseeSignedAt?: string | null;
};

function daysRemaining(endDate: string): number {
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  return Math.ceil((end.getTime() - Date.now()) / 86400000);
}

function fmtRemaining(days: number): string {
  if (days <= 0) return "0";
  const months = Math.floor(days / 30);
  const remainDays = days % 30;
  if (months === 0) return `${days}ว`;
  if (remainDays === 0) return `${months}ด`;
  return `${months}ด ${remainDays}ว`;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  ACTIVE: "bg-green-100 text-green-700",
  EXPIRED: "bg-stone-100 text-stone-600",
  TERMINATED: "bg-red-100 text-red-700",
};

const STATUS_OPTIONS = ["DRAFT", "ACTIVE", "EXPIRED", "TERMINATED"] as const;

// ── Upload signed PDF modal ──────────────────────────────────────────────────
function SignedPdfModal({
  contract,
  locale,
  onClose,
  onSaved,
}: {
  contract: Contract;
  locale: string;
  onClose: () => void;
  onSaved: (updated: Pick<Contract, "id" | "signedPdfUrl" | "shareToken">) => void;
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
        {/* Header */}
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
            {contract.contractNumber} · {contract.projectName} #{contract.unitNumber}
          </p>

          {/* Existing signed PDF */}
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

          {/* Share link */}
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

          {/* Upload new file */}
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

        {/* Footer */}
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

type RentPayment = {
  id: number;
  dueDate: string;
  amount: number;
  isPaid: boolean;
  paidAt: string | null;
  note: string | null;
};

const MONTHS_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function fmtDate(d: string) {
  const dt = new Date(d);
  return `${String(dt.getUTCDate()).padStart(2,"0")} ${MONTHS_EN[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`;
}

// ── Payment schedule modal ───────────────────────────────────────────────────
function PaymentScheduleModal({
  contract,
  locale,
  onClose,
}: {
  contract: Contract;
  locale: string;
  onClose: () => void;
}) {
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch(`/api/admin/rent-payments?contractId=${contract.id}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setPayments(d.data); })
      .finally(() => setLoading(false));
  }, [contract.id]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const paid     = payments.filter((p) => p.isPaid).length;
  const pending  = payments.filter((p) => !p.isPaid).length;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl w-full max-w-md shadow-xl flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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

        {/* Sub-header */}
        <div className="px-5 py-3 border-b bg-gray-50 shrink-0">
          <p className="text-xs font-medium text-gray-800">{contract.projectName} #{contract.unitNumber}</p>
          <p className="text-xs text-gray-500 mt-0.5">{contract.lesseeName} · {contract.contractNumber}</p>
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

        {/* Body */}
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
                const isOverdue  = !p.isPaid && dueDateStr < todayStr;
                const isToday    = !p.isPaid && dueDateStr === todayStr;

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
                  const days = Math.ceil((Date.now() - new Date(p.dueDate).getTime()) / 86400000);
                  statusEl = (
                    <span className="text-[11px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                      {locale === "th" ? `เกิน ${days} วัน` : `${days}d overdue`}
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
                    className={`flex items-center gap-3 px-5 py-2.5 ${p.isPaid ? "opacity-40" : ""}`}
                  >
                    <span className="text-[11px] text-gray-400 w-5 text-right shrink-0">{i + 1}</span>
                    <span className={`text-xs font-medium w-24 shrink-0 ${isOverdue ? "text-red-600" : isToday ? "text-amber-600" : "text-gray-700"}`}>
                      {fmtDate(p.dueDate)}
                    </span>
                    <span className="text-xs text-gray-700 flex-1">
                      ฿{p.amount.toLocaleString()}
                    </span>
                    <div className="shrink-0">{statusEl}</div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t bg-gray-50 rounded-b-xl shrink-0">
          <button onClick={onClose} className="w-full py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
            {locale === "th" ? "ปิด" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── E-Sign modal ─────────────────────────────────────────────────────────────
function ESignModal({
  contract,
  locale,
  onClose,
  onSaved,
}: {
  contract: Contract;
  locale: string;
  onClose: () => void;
  onSaved: (updated: Pick<Contract, "id" | "signedPdfUrl" | "shareToken">) => void;
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

  const generate = async (regenerate?: "lessor" | "lessee" | "joint_lessee" | "both") => {
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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-lg w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <PenLine className="w-4 h-4 text-amber-600" />
            <h3 className="font-semibold text-gray-900">E-Sign</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <p className="text-sm text-gray-500">
            {contract.contractNumber} · {contract.projectName} #{contract.unitNumber}
          </p>

          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-amber-600" /></div>
          ) : (
            <>
              {/* Generate button when no tokens yet */}
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

              {/* Lessor */}
              {info?.lessorSignToken && (
                <div className={`rounded-xl border p-4 ${info.lessorSignedAt ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-700">ผู้ให้เช่า / Lessor</p>
                      <p className="text-sm font-medium text-gray-900">{info.lessorName}</p>
                    </div>
                    {info.lessorSignedAt ? (
                      <span className="flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> เซ็นแล้ว
                      </span>
                    ) : (
                      <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full shrink-0">
                        รอเซ็น
                      </span>
                    )}
                  </div>
                  {info.lessorSignedAt && (
                    <p className="text-xs text-green-600 mb-2">เซ็นเมื่อ {fmtSignedAt(info.lessorSignedAt)}</p>
                  )}
                  <div className="flex gap-2 items-center">
                    <input
                      readOnly
                      value={buildSignUrl(info.lessorSignToken)}
                      className="flex-1 text-xs bg-white border border-gray-200 rounded px-2 py-1.5 text-gray-600 select-all min-w-0"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      onClick={() => copyLink("lessor", info.lessorSignToken!)}
                      className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded transition-colors ${copiedKey === "lessor" ? "bg-green-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                    >
                      {copiedKey === "lessor" ? "✓" : locale === "th" ? "คัดลอก" : "Copy"}
                    </button>
                    <a
                      href={buildSignUrl(info.lessorSignToken)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={locale === "th" ? "เปิดลิงก์" : "Open link"}
                      className="shrink-0 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => { if (confirm("สร้างลิงก์ใหม่? ลิงก์เดิมและลายเซ็นจะถูกลบ")) generate("lessor"); }}
                      disabled={generating}
                      title="สร้างลิงก์ใหม่"
                      className="shrink-0 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Lessee */}
              {info?.lesseeSignToken && (
                <div className={`rounded-xl border p-4 ${info.lesseeSignedAt ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-700">ผู้เช่า / Lessee</p>
                      <p className="text-sm font-medium text-gray-900">{info.lesseeName}</p>
                    </div>
                    {info.lesseeSignedAt ? (
                      <span className="flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> เซ็นแล้ว
                      </span>
                    ) : (
                      <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full shrink-0">
                        รอเซ็น
                      </span>
                    )}
                  </div>
                  {info.lesseeSignedAt && (
                    <p className="text-xs text-green-600 mb-2">เซ็นเมื่อ {fmtSignedAt(info.lesseeSignedAt)}</p>
                  )}
                  <div className="flex gap-2 items-center">
                    <input
                      readOnly
                      value={buildSignUrl(info.lesseeSignToken)}
                      className="flex-1 text-xs bg-white border border-gray-200 rounded px-2 py-1.5 text-gray-600 select-all min-w-0"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      onClick={() => copyLink("lessee", info.lesseeSignToken!)}
                      className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded transition-colors ${copiedKey === "lessee" ? "bg-green-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                    >
                      {copiedKey === "lessee" ? "✓" : locale === "th" ? "คัดลอก" : "Copy"}
                    </button>
                    <a
                      href={buildSignUrl(info.lesseeSignToken)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={locale === "th" ? "เปิดลิงก์" : "Open link"}
                      className="shrink-0 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => { if (confirm("สร้างลิงก์ใหม่? ลิงก์เดิมและลายเซ็นจะถูกลบ")) generate("lessee"); }}
                      disabled={generating}
                      title="สร้างลิงก์ใหม่"
                      className="shrink-0 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Joint Lessee — generate link if token missing */}
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

              {/* Joint Lessee — only shown when the contract has a joint lessee */}
              {info?.jointLesseeName && info?.jointLesseeSignToken && (
                <div className={`rounded-xl border p-4 ${info.jointLesseeSignedAt ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-700">ผู้เช่าร่วม / Joint Lessee</p>
                      <p className="text-sm font-medium text-gray-900">{info.jointLesseeName}</p>
                    </div>
                    {info.jointLesseeSignedAt ? (
                      <span className="flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> เซ็นแล้ว
                      </span>
                    ) : (
                      <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full shrink-0">
                        รอเซ็น
                      </span>
                    )}
                  </div>
                  {info.jointLesseeSignedAt && (
                    <p className="text-xs text-green-600 mb-2">เซ็นเมื่อ {fmtSignedAt(info.jointLesseeSignedAt)}</p>
                  )}
                  <div className="flex gap-2 items-center">
                    <input
                      readOnly
                      value={buildSignUrl(info.jointLesseeSignToken)}
                      className="flex-1 text-xs bg-white border border-gray-200 rounded px-2 py-1.5 text-gray-600 select-all min-w-0"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      onClick={() => copyLink("joint_lessee", info.jointLesseeSignToken!)}
                      className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded transition-colors ${copiedKey === "joint_lessee" ? "bg-green-500 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                    >
                      {copiedKey === "joint_lessee" ? "✓" : locale === "th" ? "คัดลอก" : "Copy"}
                    </button>
                    <a
                      href={buildSignUrl(info.jointLesseeSignToken)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={locale === "th" ? "เปิดลิงก์" : "Open link"}
                      className="shrink-0 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => { if (confirm("สร้างลิงก์ใหม่? ลิงก์เดิมและลายเซ็นจะถูกลบ")) generate("joint_lessee"); }}
                      disabled={generating}
                      title="สร้างลิงก์ใหม่"
                      className="shrink-0 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
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

// ── Main page ───────────────────────────────────────────────────────────────
export default function AdminContractsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState("th");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedModal, setSignedModal] = useState<Contract | null>(null);
  const [scheduleModal, setScheduleModal] = useState<Contract | null>(null);
  const [esignModal, setEsignModal] = useState<Contract | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [stats, setStats] = useState<{ draft: number; active: number; expiringSoon: number; expired: number } | null>(null);
  const [filterYear, setFilterYear] = useState<string>(String(new Date().getFullYear()));
  const [filterMonth, setFilterMonth] = useState<string>(String(new Date().getMonth() + 1));

  useEffect(() => {
    params.then(({ locale: l }) => setLocale(l));
  }, [params]);

  const refresh = async () => {
    const [contractsRes, statsRes] = await Promise.all([
      fetch("/api/admin/contracts"),
      fetch("/api/admin/agent-stats"),
    ]);
    const contractsData = await contractsRes.json();
    if (contractsData.success) setContracts(contractsData.data);
    const statsData = await statsRes.json();
    if (statsData.success) setStats(statsData.data);
  };

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const handleDelete = async (c: Contract) => {
    if (!confirm(locale === "th" ? `ลบสัญญา ${c.contractNumber}?` : `Delete ${c.contractNumber}?`)) return;
    await fetch(`/api/admin/contracts/${c.id}`, { method: "DELETE" });
    await refresh();
  };

  const handleStatusChange = async (c: Contract, status: string) => {
    if (status === c.status) return;
    setContracts((prev) => prev.map((x) => (x.id === c.id ? { ...x, status } : x)));
    try {
      const res = await fetch(`/api/admin/contracts/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed");
    } catch {
      await refresh();
    }
  };

  const handleSignedSaved = (updated: Pick<Contract, "id" | "signedPdfUrl" | "shareToken">) => {
    setContracts((prev) =>
      prev.map((x) => x.id === updated.id ? { ...x, ...updated } : x)
    );
    // Reopen modal with updated data
    setSignedModal((prev) => prev ? { ...prev, ...updated } : null);
  };

  // Derive available years from contracts
  const availableYears = Array.from(
    new Set(contracts.map((c) => new Date(c.startDate).getFullYear()))
  ).sort((a, b) => b - a);

  const filteredContracts = contracts.filter((c) => {
    const d = new Date(c.startDate);
    if (filterYear !== "all" && d.getFullYear() !== parseInt(filterYear)) return false;
    if (filterMonth !== "all" && d.getMonth() + 1 !== parseInt(filterMonth)) return false;
    return true;
  });

  const copyShareLink = (c: Contract) => {
    if (!c.shareToken) return;
    const url = `${window.location.origin}/${locale}/contracts/share/${c.shareToken}`;
    navigator.clipboard.writeText(url);
    setCopiedId(c.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            {locale === "th" ? "สัญญาเช่า" : "Rental Contracts"}
          </h1>
          <p className="text-gray-500 mt-1 text-xs sm:text-sm">
            {locale === "th"
              ? "สร้างและจัดการสัญญาเช่าในรูปแบบ PDF"
              : "Create and manage rental contracts as PDF"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/${locale}/admin/contracts/template`}
            className="inline-flex items-center justify-center gap-2 bg-white border border-stone-300 hover:bg-stone-50 px-4 py-2.5 rounded-lg text-sm font-medium text-stone-700"
          >
            <Settings className="w-4 h-4" />
            {locale === "th" ? "Template มาตรฐาน" : "Standard Template"}
          </Link>
          <Link
            href={`/${locale}/admin/contracts/witnesses`}
            className="inline-flex items-center justify-center gap-2 bg-white border border-stone-300 hover:bg-stone-50 px-4 py-2.5 rounded-lg text-sm font-medium text-stone-700"
          >
            <PenLine className="w-4 h-4" />
            {locale === "th" ? "พยาน" : "Witnesses"}
          </Link>
          <Link
            href={`/${locale}/admin/contracts/new`}
            className="inline-flex items-center justify-center gap-2 bg-[#C8A951] text-white px-4 py-2.5 rounded-lg hover:bg-[#B8993F] text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            {locale === "th" ? "สร้างสัญญาใหม่" : "New Contract"}
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[
            { label: locale === "th" ? "แบบร่าง" : "Draft",           value: stats.draft,         icon: FileText,     bg: "bg-gray-50",   border: "border-gray-200",  val: "text-gray-800",  icon_: "text-gray-500" },
            { label: locale === "th" ? "กำลังใช้งาน" : "Active",       value: stats.active,        icon: CheckCircle2, bg: "bg-green-50",  border: "border-green-200", val: "text-green-700", icon_: "text-green-600" },
            { label: locale === "th" ? "ใกล้หมดสัญญา" : "Expiring",    value: stats.expiringSoon,  icon: Clock,        bg: "bg-amber-50",  border: "border-amber-200", val: "text-amber-700", icon_: "text-amber-600" },
            { label: locale === "th" ? "หมดสัญญาแล้ว" : "Expired",     value: stats.expired,       icon: XCircle,      bg: "bg-red-50",    border: "border-red-200",   val: "text-red-700",   icon_: "text-red-500" },
          ].map((card) => (
            <div key={card.label} className={`rounded-xl border px-5 py-4 flex items-center gap-4 ${card.bg} ${card.border}`}>
              <div className={`p-2.5 rounded-lg bg-white/70 ${card.icon_}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div>
                <div className={`text-2xl font-bold leading-none ${card.val}`}>{card.value}</div>
                <div className="text-xs text-gray-500 mt-1">{card.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">{locale === "th" ? "ปี" : "Year"}</label>
          <select
            value={filterYear}
            onChange={(e) => { setFilterYear(e.target.value); setFilterMonth("all"); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
          >
            <option value="all">{locale === "th" ? "ทั้งหมด" : "All"}</option>
            {availableYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">{locale === "th" ? "เดือน" : "Month"}</label>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            disabled={filterYear === "all"}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <option value="all">{locale === "th" ? "ทั้งหมด" : "All"}</option>
            {(locale === "th"
              ? ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"]
              : ["January","February","March","April","May","June","July","August","September","October","November","December"]
            ).map((name, i) => (
              <option key={i + 1} value={i + 1}>{name}</option>
            ))}
          </select>
        </div>
        {(filterYear !== "all" || filterMonth !== "all") && (
          <button
            onClick={() => { setFilterYear("all"); setFilterMonth("all"); }}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            {locale === "th" ? "ล้างตัวกรอง" : "Clear"}
          </button>
        )}
        <span className="text-xs text-gray-400 ml-auto">
          {filteredContracts.length} {locale === "th" ? "รายการ" : "contracts"}
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4">เลขที่</th>
                <th className="text-left py-3 px-4">{locale === "th" ? "ทรัพย์" : "Property"}</th>
                <th className="text-left py-3 px-4">{locale === "th" ? "ผู้เช่า" : "Lessee"}</th>
                <th className="text-left py-3 px-4">{locale === "th" ? "ระยะเวลา" : "Period"}</th>
                <th className="text-right py-3 px-4">{locale === "th" ? "ค่าเช่า/เดือน" : "Rent"}</th>
                <th className="text-center py-3 px-4">{locale === "th" ? "คงเหลือ" : "Remaining"}</th>
                <th className="text-center py-3 px-4">{locale === "th" ? "สถานะ" : "Status"}</th>
                <th className="text-right py-3 px-4">{locale === "th" ? "จัดการ" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    {locale === "th" ? "ไม่พบสัญญาในช่วงเวลาที่เลือก" : "No contracts found"}
                  </td>
                </tr>
              ) : (
                filteredContracts.map((c) => (
                  <tr key={c.id} className="border-t hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-mono text-xs">{c.contractNumber}</div>
                      {/* Contract type badge */}
                      <span className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full mt-1 font-medium ${
                        c.contractType === "RENEW"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-50 text-amber-700"
                      }`}>
                        {c.contractType === "RENEW"
                          ? (locale === "th" ? "ต่อสัญญา" : "Renewal")
                          : (locale === "th" ? "สัญญาใหม่" : "New")}
                      </span>
                      {/* Signed badge */}
                      {c.signedPdfUrl && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full mt-1 font-medium">
                          <Paperclip className="w-2.5 h-2.5" />
                          {locale === "th" ? "เซ็นแล้ว" : "Signed"}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{c.projectName}</div>
                      <div className="text-xs text-gray-500">#{c.unitNumber}</div>
                    </td>
                    <td className="py-3 px-4">{c.lesseeName}</td>
                    <td className="py-3 px-4 text-xs">
                      {new Date(c.startDate).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                      {" → "}
                      {new Date(c.endDate).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      ฿{Number(c.monthlyRent).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {(() => {
                        if (c.status === "TERMINATED") return <span className="text-xs text-gray-400">—</span>;
                        const days = daysRemaining(c.endDate);
                        if (days < 0) return <span className="text-xs text-stone-400">{locale === "th" ? "หมดแล้ว" : "Expired"}</span>;
                        const color = days <= 30 ? "text-red-600 bg-red-50" : days <= 60 ? "text-amber-600 bg-amber-50" : "text-green-700 bg-green-50";
                        return (
                          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>
                            {fmtRemaining(days)}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <select
                        value={c.status}
                        onChange={(e) => handleStatusChange(c, e.target.value)}
                        className={`text-xs px-2 py-1 rounded border-0 focus:outline-none focus:ring-1 focus:ring-stone-300 cursor-pointer ${STATUS_COLORS[c.status] || "bg-gray-100 text-gray-700"}`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        {/* Payment schedule */}
                        <button
                          onClick={() => setScheduleModal(c)}
                          title={locale === "th" ? "ตารางแจ้งเตือนค่าเช่า" : "Payment schedule"}
                          className="p-1.5 text-amber-500 hover:bg-amber-50 rounded"
                        >
                          <BellRing className="w-4 h-4" />
                        </button>
                        {/* Download generated PDF */}
                        <a
                          href={`/api/admin/contracts/${c.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={locale === "th" ? "ดาวน์โหลด PDF" : "Download PDF"}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        {/* E-Sign */}
                        <button
                          onClick={() => setEsignModal(c)}
                          title="E-Sign"
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
                        >
                          <PenLine className="w-4 h-4" />
                        </button>
                        {/* Attach signed PDF */}
                        <button
                          onClick={() => setSignedModal(c)}
                          title={locale === "th" ? "แนบสัญญาที่เซ็นแล้ว" : "Attach signed contract"}
                          className={`p-1.5 rounded transition-colors ${c.signedPdfUrl ? "text-green-600 bg-green-50 hover:bg-green-100" : "text-gray-400 hover:bg-gray-100"}`}
                        >
                          <Paperclip className="w-4 h-4" />
                        </button>
                        {/* Share link (only when signed PDF exists) */}
                        {c.signedPdfUrl && c.shareToken && (
                          <button
                            onClick={() => copyShareLink(c)}
                            title={locale === "th" ? "คัดลอกลิงก์แชร์" : "Copy share link"}
                            className={`p-1.5 rounded transition-colors ${copiedId === c.id ? "text-green-600 bg-green-50" : "text-blue-500 hover:bg-blue-50"}`}
                          >
                            {copiedId === c.id ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <Share2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <Link
                          href={`/${locale}/admin/contracts/${c.id}`}
                          title={locale === "th" ? "ดู" : "View"}
                          className="p-1.5 text-stone-600 hover:bg-stone-50 rounded"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/${locale}/admin/contracts/${c.id}/edit`}
                          title={locale === "th" ? "แก้ไข" : "Edit"}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/${locale}/admin/contracts/new?copyFromId=${c.id}`}
                          title={locale === "th" ? "คัดลอกเป็นสัญญาใหม่" : "Copy to new contract"}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                        >
                          <Copy className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(c)}
                          title={locale === "th" ? "ลบ" : "Delete"}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Signed PDF modal */}
      {signedModal && (
        <SignedPdfModal
          contract={signedModal}
          locale={locale}
          onClose={() => setSignedModal(null)}
          onSaved={handleSignedSaved}
        />
      )}

      {/* Payment schedule modal */}
      {scheduleModal && (
        <PaymentScheduleModal
          contract={scheduleModal}
          locale={locale}
          onClose={() => setScheduleModal(null)}
        />
      )}

      {/* E-Sign modal */}
      {esignModal && (
        <ESignModal
          contract={esignModal}
          locale={locale}
          onClose={() => setEsignModal(null)}
          onSaved={(updated) => {
            setContracts((prev) => prev.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)));
            setEsignModal((prev) => (prev ? { ...prev, ...updated } : null));
          }}
        />
      )}
    </div>
  );
}
