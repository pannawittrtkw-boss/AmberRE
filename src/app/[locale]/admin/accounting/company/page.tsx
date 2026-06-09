"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, Save, Building2, Upload, X, RotateCcw, CheckCircle2, PenLine, ImageIcon } from "lucide-react";

interface CompanyForm {
  name: string;
  address: string;
  taxId: string;
  phone: string;
  logoUrl: string;
  signatureUrl: string;
  authorizedName: string;
}

const EMPTY: CompanyForm = {
  name: "", address: "", taxId: "", phone: "",
  logoUrl: "", signatureUrl: "", authorizedName: "",
};

// ── Simple image uploader ─────────────────────────────────────────────────────
function ImageUploader({
  label, value, onChange, hint,
}: { label: string; value: string; onChange: (url: string) => void; hint?: string }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File) => {
    setError("");
    if (!file.type.startsWith("image/")) { setError("เฉพาะไฟล์รูปภาพเท่านั้น"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await res.json();
      if (!d.success || !d.data?.url) { setError(d.error || "อัปโหลดไม่สำเร็จ"); return; }
      onChange(d.data.url);
    } catch { setError("อัปโหลดไม่สำเร็จ"); }
    finally { setUploading(false); }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-2">{hint}</p>}
      {value ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt={label} className="h-20 max-w-[260px] object-contain rounded-lg border bg-gray-50 p-1" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <label className={`flex items-center gap-2 px-4 py-2.5 border-2 border-dashed rounded-xl cursor-pointer transition-colors w-56
          ${uploading ? "border-gray-200 bg-gray-50" : "border-gray-300 hover:border-[#C8A951] hover:bg-amber-50"}`}>
          {uploading
            ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            : <Upload className="w-4 h-4 text-gray-400" />}
          <span className="text-sm text-gray-500">{uploading ? "กำลังอัปโหลด..." : "เลือกรูปภาพ"}</span>
          <input
            type="file" accept="image/*" className="hidden" disabled={uploading}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
          />
        </label>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ── Signature widget: upload OR draw ─────────────────────────────────────────
function SignatureWidget({
  value, onChange,
}: { value: string; onChange: (url: string) => void }) {
  const [tab, setTab] = useState<"upload" | "draw">("upload");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // canvas draw state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasStroke, setHasStroke] = useState(false);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  useEffect(() => {
    if (tab === "draw") setTimeout(initCanvas, 50);
  }, [tab, initCanvas]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setDrawing(true);
    const pos = getPos(e);
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!drawing) return;
    const pos = getPos(e);
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasStroke(true);
  };
  const stopDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setDrawing(false);
  };
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setHasStroke(false);
  };
  const saveDrawn = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onChange(canvas.toDataURL("image/png"));
    setHasStroke(false);
  };

  // upload handler
  const handleFile = async (file: File) => {
    setUploadError("");
    if (!file.type.startsWith("image/")) { setUploadError("เฉพาะไฟล์รูปภาพ"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await res.json();
      if (!d.success || !d.data?.url) { setUploadError(d.error || "อัปโหลดไม่สำเร็จ"); return; }
      onChange(d.data.url);
    } catch { setUploadError("อัปโหลดไม่สำเร็จ"); }
    finally { setUploading(false); }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        ลายเซ็นผู้มีอำนาจลงนาม
      </label>

      {/* Current signature preview */}
      {value && (
        <div className="relative inline-block mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="ลายเซ็น"
            className="h-20 max-w-[280px] object-contain rounded-lg border bg-gray-50 p-1"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> บันทึกลายเซ็นแล้ว
          </p>
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex border rounded-lg overflow-hidden w-fit mb-3">
        <button
          type="button"
          onClick={() => setTab("upload")}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors
            ${tab === "upload" ? "bg-[#112240] text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          อัปโหลดรูป
        </button>
        <button
          type="button"
          onClick={() => setTab("draw")}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors
            ${tab === "draw" ? "bg-[#112240] text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
        >
          <PenLine className="w-3.5 h-3.5" />
          เซ็นด้วยตัวเอง
        </button>
      </div>

      {/* Upload tab */}
      {tab === "upload" && (
        <div>
          <label className={`flex items-center gap-2 px-4 py-2.5 border-2 border-dashed rounded-xl cursor-pointer transition-colors w-56
            ${uploading ? "border-gray-200 bg-gray-50" : "border-gray-300 hover:border-[#C8A951] hover:bg-amber-50"}`}>
            {uploading
              ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              : <Upload className="w-4 h-4 text-gray-400" />}
            <span className="text-sm text-gray-500">{uploading ? "กำลังอัปโหลด..." : "เลือกรูปลายเซ็น"}</span>
            <input
              type="file" accept="image/*" className="hidden" disabled={uploading}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
            />
          </label>
          <p className="text-xs text-gray-400 mt-1">แนะนำให้ใช้พื้นหลังโปร่งใส (PNG)</p>
          {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
        </div>
      )}

      {/* Draw tab */}
      {tab === "draw" && (
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-gray-500">วาดลายเซ็นในช่องด้านล่าง</p>
            <button
              type="button"
              onClick={clearCanvas}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
            >
              <RotateCcw className="w-3 h-3" /> ล้าง
            </button>
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-white touch-none">
            <canvas
              ref={canvasRef}
              className="w-full"
              style={{ height: 140, cursor: "crosshair", display: "block" }}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">ใช้เมาส์หรือนิ้วในการวาด</p>
          <button
            type="button"
            onClick={saveDrawn}
            disabled={!hasStroke}
            className="mt-3 flex items-center gap-2 px-5 py-2 bg-[#C8A951] text-white text-sm font-medium rounded-lg hover:bg-[#B8993F] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            บันทึกลายเซ็น
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AccountingCompanyPage() {
  const [form, setForm] = useState<CompanyForm>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/acc/company")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.id) {
          setForm({
            name: d.data.name ?? "",
            address: d.data.address ?? "",
            taxId: d.data.taxId ?? "",
            phone: d.data.phone ?? "",
            logoUrl: d.data.logoUrl ?? "",
            signatureUrl: d.data.signatureUrl ?? "",
            authorizedName: d.data.authorizedName ?? "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/acc/company", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  };

  const set = (k: keyof CompanyForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#C8A951]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-[#C8A951]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">ตั้งค่าบริษัท</h1>
          <p className="text-sm text-gray-500">ข้อมูลที่จะแสดงในเอกสารบัญชีทุกฉบับ</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-6">
        {/* Company name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            ชื่อบริษัท / ร้านค้า <span className="text-red-500">*</span>
          </label>
          <input
            value={form.name}
            onChange={set("name")}
            className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
            placeholder="เช่น บริษัท แอมเบอร์ รีเอสเตท จำกัด"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">ที่อยู่</label>
          <textarea
            value={form.address}
            onChange={set("address")}
            rows={3}
            className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 resize-none"
            placeholder="ที่อยู่บริษัท"
          />
        </div>

        {/* Tax ID + Phone */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">เลขประจำตัวผู้เสียภาษี</label>
            <input
              value={form.taxId}
              onChange={set("taxId")}
              className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
              placeholder="0-0000-00000-00-0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">เบอร์โทรศัพท์</label>
            <input
              value={form.phone}
              onChange={set("phone")}
              className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
              placeholder="02-xxx-xxxx"
            />
          </div>
        </div>

        {/* Authorized name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อผู้มีอำนาจลงนาม</label>
          <input
            value={form.authorizedName}
            onChange={set("authorizedName")}
            className="w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
            placeholder="ชื่อ-นามสกุล"
          />
        </div>

        <hr className="border-gray-100" />

        {/* Logo upload */}
        <ImageUploader
          label="โลโก้บริษัท"
          value={form.logoUrl}
          onChange={(url) => setForm((p) => ({ ...p, logoUrl: url }))}
          hint="แนะนำ PNG พื้นหลังโปร่งใส ขนาด 200×200 px ขึ้นไป"
        />

        <hr className="border-gray-100" />

        {/* Signature widget */}
        <SignatureWidget
          value={form.signatureUrl}
          onChange={(url) => setForm((p) => ({ ...p, signatureUrl: url }))}
        />

        {/* Save */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saving || !form.name}
            className="inline-flex items-center gap-2 bg-[#C8A951] hover:bg-[#B8993F] disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saved ? "บันทึกแล้ว ✓" : "บันทึกข้อมูล"}
          </button>
        </div>
      </div>
    </div>
  );
}
