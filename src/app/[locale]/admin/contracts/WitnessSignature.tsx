"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, X, RotateCcw, CheckCircle2, PenLine, ImageIcon } from "lucide-react";

interface Props {
  locale: string;
  value: string;
  onChange: (dataUri: string) => void;
}

// Compress an uploaded image client-side and return it as a base64 data URI —
// matches how lessor/lessee e-sign signatures are stored (Contract.*Signature
// is a plain @db.Text column, no Blob/R2 upload involved).
const compressToDataUri = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        const MAX = 800;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width >= height) { height = Math.round((height * MAX) / width); width = MAX; }
          else { width = Math.round((width * MAX) / height); height = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function WitnessSignature({ locale, value, onChange }: Props) {
  const [tab, setTab] = useState<"upload" | "draw">("upload");
  const [error, setError] = useState("");

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

  const handleFile = async (file: File) => {
    setError("");
    if (!file.type.startsWith("image/")) {
      setError(locale === "th" ? "เฉพาะไฟล์รูปภาพ" : "Image files only");
      return;
    }
    try {
      onChange(await compressToDataUri(file));
    } catch {
      setError(locale === "th" ? "อ่านไฟล์ไม่สำเร็จ" : "Failed to read file");
    }
  };

  return (
    <div>
      {value && (
        <div className="relative inline-block mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt={locale === "th" ? "ลายเซ็นพยาน" : "Witness signature"}
            className="h-20 max-w-[280px] object-contain rounded-lg border border-stone-200 bg-stone-50 p-1"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {locale === "th" ? "บันทึกลายเซ็นแล้ว" : "Signature saved"}
          </p>
        </div>
      )}

      <div className="flex border rounded-lg overflow-hidden w-fit mb-3">
        <button
          type="button"
          onClick={() => setTab("upload")}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
            tab === "upload" ? "bg-[#112240] text-white" : "bg-white text-stone-600 hover:bg-stone-50"
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          {locale === "th" ? "อัปโหลดรูป" : "Upload image"}
        </button>
        <button
          type="button"
          onClick={() => setTab("draw")}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
            tab === "draw" ? "bg-[#112240] text-white" : "bg-white text-stone-600 hover:bg-stone-50"
          }`}
        >
          <PenLine className="w-3.5 h-3.5" />
          {locale === "th" ? "เซ็นด้วยตัวเอง" : "Draw signature"}
        </button>
      </div>

      {tab === "upload" && (
        <div>
          <label className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer transition-colors w-56 hover:border-[#C8A951] hover:bg-amber-50">
            <Upload className="w-4 h-4 text-stone-400" />
            <span className="text-sm text-stone-500">
              {locale === "th" ? "เลือกรูปลายเซ็น" : "Choose signature image"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
            />
          </label>
          <p className="text-xs text-stone-400 mt-1">
            {locale === "th" ? "แนะนำให้ใช้พื้นหลังโปร่งใส (PNG)" : "Transparent PNG background recommended"}
          </p>
          {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
        </div>
      )}

      {tab === "draw" && (
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-stone-500">
              {locale === "th" ? "วาดลายเซ็นในช่องด้านล่าง" : "Draw the signature in the box below"}
            </p>
            <button
              type="button"
              onClick={clearCanvas}
              className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-700 px-2 py-1 rounded hover:bg-stone-100"
            >
              <RotateCcw className="w-3 h-3" /> {locale === "th" ? "ล้าง" : "Clear"}
            </button>
          </div>
          <div className="border-2 border-dashed border-stone-300 rounded-xl overflow-hidden bg-white touch-none">
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
          <p className="text-xs text-stone-400 mt-1">
            {locale === "th" ? "ใช้เมาส์หรือนิ้วในการวาด" : "Use your mouse or finger to draw"}
          </p>
          <button
            type="button"
            onClick={saveDrawn}
            disabled={!hasStroke}
            className="mt-3 flex items-center gap-2 px-5 py-2 bg-[#C8A951] text-white text-sm font-medium rounded-lg hover:bg-[#B8993F] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            {locale === "th" ? "บันทึกลายเซ็น" : "Save signature"}
          </button>
        </div>
      )}
    </div>
  );
}
