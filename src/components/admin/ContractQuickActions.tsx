"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Download, Paperclip, Share2, Eye, Pencil, CheckCircle2,
  X, Upload, FileText, Loader2, ExternalLink,
} from "lucide-react";

export type QuickActionContract = {
  id: number;
  contractNumber: string;
  signedPdfUrl?: string | null;
  shareToken?: string | null;
  subtitle?: string;
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

// The 5-function row of icon buttons an agent can use on each of their own
// contracts: download the generated PDF, attach/manage the signed copy,
// copy its share link, view it, and edit it. Mirrors the toolbar in
// admin/contracts/page.tsx, minus the admin-only accounting/E-Sign/delete
// actions.
export default function ContractQuickActions({
  contract,
  locale,
  onUpdate,
}: {
  contract: QuickActionContract;
  locale: string;
  onUpdate?: (updated: Pick<QuickActionContract, "id" | "signedPdfUrl" | "shareToken">) => void;
}) {
  const [signedModalOpen, setSignedModalOpen] = useState(false);
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
        <Link
          href={`/${locale}/admin/contracts/${local.id}/edit`}
          title={locale === "th" ? "แก้ไข" : "Edit"}
          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
        >
          <Pencil className="w-4 h-4" />
        </Link>
      </div>

      {signedModalOpen && (
        <SignedPdfModal
          contract={local}
          locale={locale}
          onClose={() => setSignedModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
