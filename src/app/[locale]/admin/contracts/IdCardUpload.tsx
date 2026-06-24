"use client";

import { useState, useRef } from "react";
import {
  Upload,
  X,
  Loader2,
  Image as ImageIcon,
  ScanLine,
  Camera,
  Monitor,
  Check,
} from "lucide-react";

interface Props {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onOcrText?: (rawText: string) => void;
  locale: string;
  ocrHint?: string;
  buildOcrPreview?: (rawText: string) => Array<{ label: string; value: string }>;
}

type Stage = "idle" | "uploading" | "ocr" | "done" | "capturing";

type CropBox = { x: number; y: number; w: number; h: number };

export default function IdCardUpload({
  label,
  value,
  onChange,
  onOcrText,
  locale,
  ocrHint,
  buildOcrPreview,
}: Props) {
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState("");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrPreview, setOcrPreview] = useState<Array<{ label: string; value: string }>>([]);
  const [ocrRawText, setOcrRawText] = useState("");
  const [showRaw, setShowRaw] = useState(false);

  // Crop modal state
  const [capturedImageData, setCapturedImageData] = useState<{ dataUrl: string; width: number; height: number } | null>(null);
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
  const [cropBox, setCropBox] = useState<CropBox | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const captureImgRef = useRef<HTMLImageElement>(null);

  const applyOcrText = (text: string) => {
    onOcrText?.(text);
    setOcrRawText(text);
    if (buildOcrPreview) setOcrPreview(buildOcrPreview(text));
  };

  const runTesseractFallback = async (file: File) => {
    const Tesseract = (await import("tesseract.js")).default;
    const result = await Tesseract.recognize(file, "tha+eng", {
      logger: (m) => {
        if (m.status === "recognizing text") setOcrProgress(Math.round((m.progress || 0) * 100));
      },
    });
    return result.data.text;
  };

  const runOcr = async (file: File) => {
    if (!onOcrText) return;
    setStage("ocr");
    setOcrProgress(0);
    setOcrPreview([]);
    setOcrRawText("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/ocr", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (data?.success && typeof data.data?.text === "string" && data.data.text.trim()) {
        applyOcrText(data.data.text);
        return;
      }
      console.warn("Falling back to Tesseract OCR:", data?.error || `HTTP ${res.status}`);
      const text = await runTesseractFallback(file);
      applyOcrText(text);
    } catch (err) {
      console.error("OCR failed:", err);
      try {
        const text = await runTesseractFallback(file);
        applyOcrText(text);
      } catch (fallbackErr) {
        console.error("Tesseract fallback also failed:", fallbackErr);
      }
    } finally {
      setStage("done");
      setTimeout(() => setStage("idle"), 1500);
    }
  };

  const clearAll = () => {
    onChange("");
    setOcrPreview([]);
    setOcrRawText("");
    setShowRaw(false);
  };

  // Compress image client-side and return as a base64 data URI.
  // Max 1600px on longest side, JPEG 0.82 quality — keeps ID cards sharp
  // while staying well under 500 KB, no external upload needed.
  const compressToDataUri = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e) => {
        img.onload = () => {
          const MAX = 1600;
          let { width, height } = img;
          if (width > MAX || height > MAX) {
            if (width >= height) { height = Math.round((height * MAX) / width); width = MAX; }
            else { width = Math.round((width * MAX) / height); height = MAX; }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFile = async (file: File) => {
    setError("");
    if (!file.type.startsWith("image/")) {
      setError(locale === "th" ? "อัพโหลดได้เฉพาะรูปภาพ" : "Image files only");
      return;
    }
    setStage("uploading");
    try {
      // Store as base64 directly in DB — no Blob storage required.
      const dataUri = await compressToDataUri(file);
      onChange(dataUri);
      if (onOcrText) await runOcr(file);
      else setStage("idle");
    } catch {
      setError(locale === "th" ? "อ่านไฟล์ไม่สำเร็จ" : "Failed to read file");
      setStage("idle");
    }
  };

  // ── Screen capture → show crop modal ──────────────────────────────────────
  const handleScreenCapture = async () => {
    setError("");
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setError(locale === "th" ? "เบราว์เซอร์นี้ไม่รองรับ Screen Capture" : "Screen capture not supported");
      return;
    }
    setStage("capturing");
    try {
      const stream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: {
          displaySurface: "monitor",
          width:  { ideal: screen.width  },
          height: { ideal: screen.height },
        },
      });
      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      await new Promise<void>((resolve) => { video.onloadedmetadata = () => resolve(); });
      await video.play();
      await new Promise((r) => setTimeout(r, 150));

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")!.drawImage(video, 0, 0);
      stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());

      const dataUrl = canvas.toDataURL("image/png");
      setStage("idle");
      setCapturedImageData({ dataUrl, width: canvas.width, height: canvas.height });
      setCropBox(null);
    } catch (err: any) {
      setStage("idle");
      if (err?.name !== "NotAllowedError") {
        setError(locale === "th" ? "ไม่สามารถจับภาพหน้าจอได้" : "Screen capture failed");
      }
    }
  };

  // ── Crop drag handlers ─────────────────────────────────────────────────────
  const handleCropMouseDown = (e: React.MouseEvent) => {
    if (!captureImgRef.current) return;
    const rect = captureImgRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    setCropStart({ x, y });
    setCropBox({ x, y, w: 0, h: 0 });
    setIsDragging(true);
  };

  const handleCropMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !cropStart || !captureImgRef.current) return;
    const rect = captureImgRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    setCropBox({
      x: Math.min(cropStart.x, x),
      y: Math.min(cropStart.y, y),
      w: Math.abs(x - cropStart.x),
      h: Math.abs(y - cropStart.y),
    });
  };

  const handleCropEnd = () => setIsDragging(false);

  const confirmCrop = async () => {
    if (!capturedImageData || !cropBox || cropBox.w < 5 || cropBox.h < 5 || !captureImgRef.current) return;
    const rect = captureImgRef.current.getBoundingClientRect();
    const scaleX = capturedImageData.width / rect.width;
    const scaleY = capturedImageData.height / rect.height;
    const sx = Math.round(cropBox.x * scaleX);
    const sy = Math.round(cropBox.y * scaleY);
    const sw = Math.round(cropBox.w * scaleX);
    const sh = Math.round(cropBox.h * scaleY);

    const canvas = document.createElement("canvas");
    canvas.width = sw;
    canvas.height = sh;
    const img = new Image();
    img.src = capturedImageData.dataUrl;
    await new Promise((r) => { img.onload = r; });
    canvas.getContext("2d")!.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

    setCapturedImageData(null);
    setCropBox(null);

    await new Promise<void>((resolve) => {
      canvas.toBlob(async (blob) => {
        if (blob) await handleFile(new File([blob], "crop.png", { type: "image/png" }));
        resolve();
      }, "image/png");
    });
  };

  const cancelCrop = () => {
    setCapturedImageData(null);
    setCropBox(null);
    setStage("idle");
  };

  const isBusy = stage === "uploading" || stage === "ocr" || stage === "capturing";

  return (
    <>
      {/* ── Crop Modal ─────────────────────────────────────────────────────── */}
      {capturedImageData && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center select-none">
          <p className="text-white text-sm mb-3 text-center px-4">
            {locale === "th"
              ? "ลากเมาส์เพื่อเลือกพื้นที่ที่ต้องการ แล้วกด ยืนยัน"
              : "Drag to select the area you want, then click Confirm"}
          </p>
          <div
            className="relative cursor-crosshair"
            onMouseDown={handleCropMouseDown}
            onMouseMove={handleCropMouseMove}
            onMouseUp={handleCropEnd}
            onMouseLeave={handleCropEnd}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={captureImgRef}
              src={capturedImageData.dataUrl}
              alt="captured"
              draggable={false}
              style={{ maxWidth: "92vw", maxHeight: "78vh", display: "block", userSelect: "none" }}
            />
            {/* Dark overlay outside selection */}
            {cropBox && cropBox.w > 2 && cropBox.h > 2 && (
              <div className="absolute inset-0 pointer-events-none">
                <svg
                  className="absolute inset-0 w-full h-full"
                  style={{ mixBlendMode: "normal" }}
                >
                  <defs>
                    <mask id="crop-mask">
                      <rect width="100%" height="100%" fill="white" />
                      <rect
                        x={cropBox.x} y={cropBox.y}
                        width={cropBox.w} height={cropBox.h}
                        fill="black"
                      />
                    </mask>
                  </defs>
                  <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)" mask="url(#crop-mask)" />
                  <rect
                    x={cropBox.x} y={cropBox.y}
                    width={cropBox.w} height={cropBox.h}
                    fill="none"
                    stroke="#60a5fa"
                    strokeWidth="2"
                    strokeDasharray="6 3"
                  />
                  {/* Corner handles */}
                  {([
                    [cropBox.x, cropBox.y],
                    [cropBox.x + cropBox.w, cropBox.y],
                    [cropBox.x, cropBox.y + cropBox.h],
                    [cropBox.x + cropBox.w, cropBox.y + cropBox.h],
                  ] as [number, number][]).map(([cx, cy], i) => (
                    <rect key={i} x={cx - 4} y={cy - 4} width={8} height={8} fill="#60a5fa" rx={1} />
                  ))}
                  {/* Dimensions label */}
                  {cropBox.w > 60 && cropBox.h > 20 && (
                    <text
                      x={cropBox.x + cropBox.w / 2}
                      y={cropBox.y + cropBox.h / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize="11"
                      style={{ pointerEvents: "none", userSelect: "none" }}
                    >
                      {Math.round(cropBox.w * (capturedImageData.width / (captureImgRef.current?.getBoundingClientRect().width || 1)))}
                      ×
                      {Math.round(cropBox.h * (capturedImageData.height / (captureImgRef.current?.getBoundingClientRect().height || 1)))} px
                    </text>
                  )}
                </svg>
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={cancelCrop}
              className="px-5 py-2 rounded-lg text-sm bg-white/10 text-white hover:bg-white/20 border border-white/20"
            >
              {locale === "th" ? "ยกเลิก" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={confirmCrop}
              disabled={!cropBox || cropBox.w < 5 || cropBox.h < 5}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              {locale === "th" ? "ยืนยัน" : "Confirm"}
            </button>
          </div>
        </div>
      )}

      {/* ── Main upload widget ─────────────────────────────────────────────── */}
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-stone-700">{label}</label>
        )}
        {value ? (
          <div className="space-y-2">
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt={label || "ID card"}
                className="h-40 w-auto rounded-lg border border-stone-200 object-contain bg-stone-50"
              />
              <button
                type="button"
                onClick={clearAll}
                disabled={isBusy}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 text-white shadow flex items-center justify-center hover:bg-rose-600 disabled:opacity-50"
                aria-label="Remove image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {stage === "ocr" && (
              <div className="inline-flex items-center gap-2 text-xs text-stone-600">
                <ScanLine className="w-3.5 h-3.5 animate-pulse text-[#C8A951]" />
                {locale === "th" ? `กำลังอ่านข้อมูล... ${ocrProgress}%` : `Reading image... ${ocrProgress}%`}
              </div>
            )}
            {stage !== "ocr" && ocrPreview.length > 0 && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs space-y-1.5 max-w-md">
                <div className="font-semibold text-emerald-800">
                  {locale === "th" ? "ระบบอ่านได้:" : "Detected from image:"}
                </div>
                {ocrPreview.map((p, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-stone-500 shrink-0 w-20">{p.label}:</span>
                    <span className="font-medium text-stone-800 break-all">{p.value}</span>
                  </div>
                ))}
              </div>
            )}
            {stage !== "ocr" && onOcrText && ocrPreview.length === 0 && ocrRawText && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 max-w-md">
                {locale === "th"
                  ? "ไม่พบข้อมูลที่ตรงกับฟอร์มอัตโนมัติ — ลองดูข้อความที่อ่านได้ด้านล่าง แล้วกรอกในช่องเอง"
                  : "Couldn't auto-extract fields — see raw text below and fill the form manually."}
              </div>
            )}
            {ocrRawText && (
              <button
                type="button"
                onClick={() => setShowRaw(!showRaw)}
                className="text-xs text-stone-500 hover:text-[#C8A951] underline"
              >
                {showRaw
                  ? (locale === "th" ? "ซ่อนข้อความที่ OCR อ่านได้" : "Hide raw OCR text")
                  : (locale === "th" ? "ดูข้อความที่ OCR อ่านได้" : "Show raw OCR text")}
              </button>
            )}
            {showRaw && ocrRawText && (
              <pre className="rounded-lg border bg-stone-50 p-3 text-[11px] text-stone-700 whitespace-pre-wrap break-words max-h-48 overflow-y-auto max-w-md">
                {ocrRawText}
              </pre>
            )}
          </div>
        ) : (
          <div className="space-y-2 w-full sm:w-80">
            <div className="flex flex-col items-center justify-center gap-1 px-6 py-5 border-2 border-dashed border-stone-300 rounded-lg text-stone-500 text-sm">
              {isBusy ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <ImageIcon className="w-6 h-6 text-stone-400" />
              )}
              <span className="text-center">
                {stage === "uploading"
                  ? (locale === "th" ? "กำลังอัพโหลด..." : "Uploading...")
                  : stage === "capturing"
                  ? (locale === "th" ? "กำลังจับภาพหน้าจอ..." : "Capturing screen...")
                  : (locale === "th" ? "อัพโหลดรูปบัตรหรือถ่ายรูปได้เลย" : "Upload an image or take a photo")}
              </span>
              {onOcrText && !isBusy && (
                <span className="text-[11px] text-stone-400 text-center">
                  {ocrHint || (locale === "th"
                    ? "ระบบจะอ่านข้อมูลจากรูปอัตโนมัติ (โปรดตรวจทาน)"
                    : "Auto-fill from image (please review)")}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <label
                className={`inline-flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  isBusy
                    ? "border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed"
                    : "border-stone-300 bg-white hover:border-[#C8A951] hover:bg-amber-50 text-stone-700"
                }`}
              >
                <Upload className="w-3.5 h-3.5 shrink-0" />
                {locale === "th" ? "เลือกไฟล์" : "Choose file"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isBusy}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
                />
              </label>
              <label
                className={`inline-flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  isBusy
                    ? "border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed"
                    : "border-[#C8A951] bg-amber-50 hover:bg-amber-100 text-amber-900"
                }`}
              >
                <Camera className="w-3.5 h-3.5 shrink-0" />
                {locale === "th" ? "ถ่ายรูป" : "Take photo"}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  disabled={isBusy}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
                />
              </label>
              <button
                type="button"
                disabled={isBusy}
                onClick={handleScreenCapture}
                className={`inline-flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  isBusy
                    ? "border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed"
                    : "border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-800"
                }`}
              >
                <Monitor className="w-3.5 h-3.5 shrink-0" />
                {locale === "th" ? "จับหน้าจอ" : "Capture"}
              </button>
            </div>
          </div>
        )}
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>
    </>
  );
}
