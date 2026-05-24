"use client";

import { useState, useRef } from "react";
import { X, Loader2, Receipt, Upload, ImagePlus, Trash2 } from "lucide-react";

type Props = {
  property: any;
  onClose: () => void;
};

function genDocNumber() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const seq = String(Math.floor(Math.random() * 900) + 100);
  return `BR-${y}${m}${day}-${seq}`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Image upload box ─────────────────────────────────────────────
function IdUploadBox({
  label,
  sublabel,
  value,
  onChange,
}: {
  label: string;
  sublabel: string;
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await fileToBase64(file);
      onChange(b64);
    } catch {
      // ignore
    }
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-700">{label}</p>
          <p className="text-[10px] text-gray-400">{sublabel}</p>
        </div>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600 transition-colors"
            title="ลบรูป"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {value ? (
        // Preview
        <div
          className="relative rounded-lg overflow-hidden border border-gray-200 cursor-pointer group"
          onClick={() => ref.current?.click()}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="ID card"
            className="w-full h-32 object-contain bg-gray-50"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 px-2 py-1 rounded">
              คลิกเพื่อเปลี่ยนรูป
            </span>
          </div>
        </div>
      ) : (
        // Upload area
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="w-full h-32 rounded-lg border-2 border-dashed border-gray-200 hover:border-amber-400 hover:bg-amber-50/50 transition-colors flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-amber-600"
        >
          <ImagePlus className="w-6 h-6" />
          <span className="text-xs">คลิกเพื่ออัปโหลดรูป</span>
          <span className="text-[10px] text-gray-300">JPG, PNG, HEIC</span>
        </button>
      )}

      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

// ── Field label ───────────────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-gray-700 mb-1.5">
      {children}
    </label>
  );
}

// ── Input ─────────────────────────────────────────────────────────
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent placeholder:text-gray-300 " +
        (props.className || "")
      }
    />
  );
}

// ── Section heading ───────────────────────────────────────────────
function Section({ title, accent }: { title: string; accent?: boolean }) {
  return (
    <div className={`flex items-center gap-2 py-1 mb-3 ${accent ? "mt-1" : "mt-2"}`}>
      <div className={`h-3.5 w-0.5 rounded-full ${accent ? "bg-amber-500" : "bg-gray-300"}`} />
      <span className={`text-xs font-semibold uppercase tracking-wide ${accent ? "text-amber-700" : "text-gray-500"}`}>
        {title}
      </span>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────
export default function BookingReceiptModal({ property: p, onClose }: Props) {
  const todayIso = new Date().toISOString().split("T")[0];

  const [docNumber, setDocNumber] = useState(genDocNumber);
  const [date, setDate] = useState(todayIso);
  const [ownerName, setOwnerName] = useState(p?.ownerName || "");
  const [ownerPhone, setOwnerPhone] = useState(p?.ownerPhone || "");
  const [tenantName, setTenantName] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");
  const [agentPhone, setAgentPhone] = useState("");
  const [unitNumber, setUnitNumber] = useState(() => {
    const parts: string[] = [];
    if (p?.projectName) parts.push(p.projectName);
    if (p?.building) parts.push(`ตึก ${p.building}`);
    if (p?.floor) parts.push(`ชั้น ${p.floor}`);
    if (p?.estCode) parts.push(`ห้อง ${p.estCode}`);
    return parts.join("  ");
  });
  const [depositAmount, setDepositAmount] = useState(() =>
    p?.price ? String(Math.round(Number(p.price))) : ""
  );
  const [moveInDate, setMoveInDate] = useState(() => {
    if (p?.availableDate) {
      try { return new Date(p.availableDate).toISOString().split("T")[0]; }
      catch { return ""; }
    }
    return "";
  });
  const [ownerIdImage, setOwnerIdImage] = useState<string | null>(null);
  const [tenantIdImage, setTenantIdImage] = useState<string | null>(null);
  const [transferSlipImage, setTransferSlipImage] = useState<string | null>(null);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!tenantName.trim()) {
      setError("กรุณากรอกชื่อผู้เช่า (Tenant name required)");
      return;
    }
    const amount = Number(depositAmount);
    if (!amount || amount <= 0) {
      setError("กรุณากรอกจำนวนเงินมัดจำ (Deposit amount required)");
      return;
    }
    setError("");
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/booking-receipts/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docNumber,
          date,
          ownerName,
          ownerPhone,
          tenantName,
          tenantPhone,
          agentPhone,
          unitNumber,
          depositAmount: amount,
          moveInDate,
          ownerIdImage,
          tenantIdImage,
          transferSlipImage,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Generate failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (e: any) {
      setError(e?.message || "ไม่สามารถสร้าง PDF ได้ กรุณาลองอีกครั้ง");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-amber-50 to-white rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">ใบรับเงินมัดจำ</h2>
              <p className="text-xs text-gray-500">Booking Receipt &amp; Conditions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-0">
          {/* Property chip */}
          {(p?.projectName || p?.titleTh) && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-gray-600 mb-4 flex items-center gap-2">
              <Receipt className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span>
                <span className="font-semibold text-gray-800">{p.projectName || p.titleTh}</span>
                {p.sizeSqm && <span className="ml-2 text-gray-500">{Number(p.sizeSqm)} sqm</span>}
                {p.floor && <span className="ml-2">ชั้น {p.floor}</span>}
                {p.building && <span className="ml-1">/ ตึก {p.building}</span>}
              </span>
            </div>
          )}

          {/* ── 1. Document Info ── */}
          <Section title="ข้อมูลเอกสาร / Document Info" accent />
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <FieldLabel>เลขที่เอกสาร / No.</FieldLabel>
              <Input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} />
            </div>
            <div>
              <FieldLabel>วันที่ / Date</FieldLabel>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="border-t border-gray-100 mb-4" />

          {/* ── 2. Owner ── */}
          <Section title="ผู้รับเงิน (เจ้าของห้อง) / Owner" />
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div>
              <FieldLabel>ชื่อ-นามสกุล / Full Name</FieldLabel>
              <Input
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="ชื่อ-นามสกุล"
              />
            </div>
            <div>
              <FieldLabel>โทร / Tel</FieldLabel>
              <Input
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                placeholder="0XX-XXX-XXXX"
              />
            </div>
          </div>

          {/* ── 3. Tenant ── */}
          <Section title="ผู้จ่ายเงิน (ผู้เช่า) / Tenant" />
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div>
              <FieldLabel>
                ชื่อ-นามสกุล / Full Name <span className="text-red-500">*</span>
              </FieldLabel>
              <Input
                value={tenantName}
                onChange={(e) => { setTenantName(e.target.value); setError(""); }}
                placeholder="ชื่อ-นามสกุล"
              />
            </div>
            <div>
              <FieldLabel>โทร / Tel</FieldLabel>
              <Input
                value={tenantPhone}
                onChange={(e) => setTenantPhone(e.target.value)}
                placeholder="0XX-XXX-XXXX"
              />
            </div>
          </div>

          {/* ── 4. Agent ── */}
          <Section title="ผู้ดูแลการเช่า / Agent — Amber Real Estate" />
          <div className="mb-4">
            <FieldLabel>โทร / Tel (optional)</FieldLabel>
            <Input
              value={agentPhone}
              onChange={(e) => setAgentPhone(e.target.value)}
              placeholder="0XX-XXX-XXXX"
              className="max-w-xs"
            />
          </div>

          <div className="border-t border-gray-100 mb-4" />

          {/* ── 5. Unit + Dates ── */}
          <Section title="ข้อมูลห้องและการเงิน / Unit & Financial Info" />
          <div className="mb-3">
            <FieldLabel>ห้องชุดเลขที่ / Unit No.</FieldLabel>
            <Input
              value={unitNumber}
              onChange={(e) => setUnitNumber(e.target.value)}
              placeholder="โครงการ / ตึก / ชั้น / เลขห้อง"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <FieldLabel>
                จำนวนเงินมัดจำ / Deposit (฿) <span className="text-red-500">*</span>
              </FieldLabel>
              <Input
                type="number"
                min="0"
                value={depositAmount}
                onChange={(e) => { setDepositAmount(e.target.value); setError(""); }}
                placeholder="0"
              />
            </div>
            <div>
              <FieldLabel>วันกำหนดทำสัญญาและเข้าอยู่ / Move-in Date</FieldLabel>
              <Input
                type="date"
                value={moveInDate}
                onChange={(e) => setMoveInDate(e.target.value)}
              />
            </div>
          </div>

          <div className="border-t border-gray-100 mb-4" />

          {/* ── 6. Evidence images ── */}
          <Section title="หลักฐานประกอบ / Supporting Documents (optional)" />
          <p className="text-[10px] text-gray-400 mb-3 -mt-2">
            รูปทั้งหมดจะแสดงท้ายเอกสาร PDF หลังจากการเซ็นชื่อ
          </p>

          {/* ID cards */}
          <p className="text-[11px] font-medium text-gray-600 mb-2">
            สำเนาบัตรประชาชน / Passport
          </p>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <IdUploadBox
              label="เจ้าของห้อง / Owner"
              sublabel="บัตรประชาชน หรือ Passport"
              value={ownerIdImage}
              onChange={setOwnerIdImage}
            />
            <IdUploadBox
              label="ผู้เช่า / Tenant"
              sublabel="บัตรประชาชน หรือ Passport"
              value={tenantIdImage}
              onChange={setTenantIdImage}
            />
          </div>

          {/* Transfer slip */}
          <p className="text-[11px] font-medium text-gray-600 mb-2">
            สลิปการโอนเงินมัดจำ / Transfer Slip
          </p>
          <IdUploadBox
            label="หลักฐานการโอนเงิน / Transfer Slip"
            sublabel="รูปสลิป โอนเงินมัดจำ"
            value={transferSlipImage}
            onChange={setTransferSlipImage}
          />

          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2">
              {error}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t bg-gray-50 rounded-b-2xl flex items-center justify-between gap-2 flex-shrink-0">
          <p className="text-[10px] text-gray-400">
            <span className="text-red-400">*</span> จำเป็นต้องกรอก — ข้อมูลอื่นแสดงเป็นช่องว่างในเอกสาร
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-5 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Receipt className="w-4 h-4" />
              )}
              {generating ? "กำลังสร้าง PDF..." : "สร้าง PDF"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
