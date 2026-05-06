"use client";

import { useState } from "react";
import {
  Upload,
  X,
  Loader2,
  Image as ImageIcon,
  ScanLine,
  Camera,
} from "lucide-react";
interface Props {
  label: string;
  value: string;
  onChange: (url: string) => void;
  // Receives raw OCR text — caller is responsible for parsing it. Letting
  // the caller pick the parser keeps this component reusable for ID cards,
  // bank books, and anything else.
  onOcrText?: (rawText: string) => void;
  locale: string;
  ocrHint?: string;
  // Optional: build a list of detected key/value pairs to preview to the
  // user (so they can see what OCR pulled out). Returning [] signals
  // nothing was detected.
  buildOcrPreview?: (rawText: string) => Array<{ label: string; value: string }>;
}

type Stage = "idle" | "uploading" | "ocr" | "done";

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
  const [ocrPreview, setOcrPreview] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [ocrRawText, setOcrRawText] = useState("");
  const [showRaw, setShowRaw] = useState(false);

  const runOcr = async (file: File) => {
    if (!onOcrText) return;
    setStage("ocr");
    setOcrProgress(0);
    setOcrPreview([]);
    setOcrRawText("");
    try {
      const Tesseract = (await import("tesseract.js")).default;
      const result = await Tesseract.recognize(file, "tha+eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setOcrProgress(Math.round((m.progress || 0) * 100));
          }
        },
      });
      const text = result.data.text;
      onOcrText(text);
      setOcrRawText(text);
      if (buildOcrPreview) {
        setOcrPreview(buildOcrPreview(text));
      }
    } catch (err) {
      console.error("OCR failed:", err);
      // Don't block — image still uploaded fine, just no auto-fill
    } finally {
      setStage("done");
      // Don't clear preview/raw — let the user inspect after the spinner
      // disappears. Cleared next time they upload.
      setTimeout(() => setStage("idle"), 1500);
    }
  };

  const clearAll = () => {
    onChange("");
    setOcrPreview([]);
    setOcrRawText("");
    setShowRaw(false);
  };

  const handleFile = async (file: File) => {
    setError("");
    if (!file.type.startsWith("image/")) {
      setError(locale === "th" ? "อัพโหลดได้เฉพาะรูปภาพ" : "Image files only");
      return;
    }

    setStage("uploading");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!data.success || !data.data?.url) {
        setError(data.error || (locale === "th" ? "อัพโหลดไม่สำเร็จ" : "Upload failed"));
        setStage("idle");
        return;
      }
      onChange(data.data.url);
      // Now run OCR if a callback is wired up
      if (onOcrText) {
        await runOcr(file);
      } else {
        setStage("idle");
      }
    } catch {
      setError(locale === "th" ? "อัพโหลดไม่สำเร็จ" : "Upload failed");
      setStage("idle");
    }
  };

  const isBusy = stage === "uploading" || stage === "ocr";

  return (
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
              {locale === "th"
                ? `กำลังอ่านข้อมูล... ${ocrProgress}%`
                : `Reading image... ${ocrProgress}%`}
            </div>
          )}
          {stage !== "ocr" && ocrPreview.length > 0 && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs space-y-1.5 max-w-md">
              <div className="font-semibold text-emerald-800">
                {locale === "th"
                  ? "ระบบอ่านได้:"
                  : "Detected from image:"}
              </div>
              {ocrPreview.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-stone-500 shrink-0 w-20">
                    {p.label}:
                  </span>
                  <span className="font-medium text-stone-800 break-all">
                    {p.value}
                  </span>
                </div>
              ))}
            </div>
          )}
          {stage !== "ocr" &&
            onOcrText &&
            ocrPreview.length === 0 &&
            ocrRawText && (
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
                ? locale === "th"
                  ? "ซ่อนข้อความที่ OCR อ่านได้"
                  : "Hide raw OCR text"
                : locale === "th"
                ? "ดูข้อความที่ OCR อ่านได้"
                : "Show raw OCR text"}
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
            {stage === "uploading" ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <ImageIcon className="w-6 h-6 text-stone-400" />
            )}
            <span className="text-center">
              {stage === "uploading"
                ? locale === "th"
                  ? "กำลังอัพโหลด..."
                  : "Uploading..."
                : locale === "th"
                ? "อัพโหลดรูปบัตรหรือถ่ายรูปได้เลย"
                : "Upload an image or take a photo"}
            </span>
            {onOcrText && stage !== "uploading" && (
              <span className="text-[11px] text-stone-400 text-center">
                {ocrHint ||
                  (locale === "th"
                    ? "ระบบจะอ่านข้อมูลจากรูปอัตโนมัติ (โปรดตรวจทาน)"
                    : "Auto-fill from image (please review)")}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                isBusy
                  ? "border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed"
                  : "border-stone-300 bg-white hover:border-[#C8A951] hover:bg-amber-50 text-stone-700"
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              {locale === "th" ? "เลือกไฟล์" : "Choose file"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isBusy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = "";
                }}
              />
            </label>
            <label
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                isBusy
                  ? "border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed"
                  : "border-[#C8A951] bg-amber-50 hover:bg-amber-100 text-amber-900"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              {locale === "th" ? "ถ่ายรูป" : "Take photo"}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                disabled={isBusy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </div>
      )}
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
