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
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [stats, setStats] = useState<{ draft: number; active: number; expiringSoon: number; expired: number } | null>(null);

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
                <th className="text-center py-3 px-4">{locale === "th" ? "สถานะ" : "Status"}</th>
                <th className="text-right py-3 px-4">{locale === "th" ? "จัดการ" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {contracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    {locale === "th" ? "ยังไม่มีสัญญา" : "No contracts yet"}
                  </td>
                </tr>
              ) : (
                contracts.map((c) => (
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
    </div>
  );
}
