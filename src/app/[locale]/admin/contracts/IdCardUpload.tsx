"use client";

import { useState } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";

interface Props {
  label: string;
  value: string;
  onChange: (url: string) => void;
  locale: string;
}

export default function IdCardUpload({ label, value, onChange, locale }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File) => {
    setError("");
    if (!file.type.startsWith("image/")) {
      setError(locale === "th" ? "อัพโหลดได้เฉพาะรูปภาพ" : "Image files only");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success && data.data?.url) {
        onChange(data.data.url);
      } else {
        setError(data.error || (locale === "th" ? "อัพโหลดไม่สำเร็จ" : "Upload failed"));
      }
    } catch {
      setError(locale === "th" ? "อัพโหลดไม่สำเร็จ" : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-stone-700">{label}</label>
      {value ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt={label}
            className="h-40 w-auto rounded-lg border border-stone-200 object-contain bg-stone-50"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 text-white shadow flex items-center justify-center hover:bg-rose-600"
            aria-label="Remove image"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <label className="inline-flex flex-col items-center justify-center gap-2 px-6 py-6 border-2 border-dashed border-stone-300 rounded-lg cursor-pointer hover:border-[#C8A951] hover:bg-amber-50/40 transition-colors text-stone-500 text-sm w-full sm:w-72">
          {uploading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <ImageIcon className="w-6 h-6 text-stone-400" />
          )}
          <span>
            {uploading
              ? locale === "th"
                ? "กำลังอัพโหลด..."
                : "Uploading..."
              : locale === "th"
              ? "คลิกเพื่อเลือกรูป (สูงสุด 10MB)"
              : "Click to upload (max 10MB)"}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
          <Upload className="w-3 h-3 mt-1" />
        </label>
      )}
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
