"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, CloudUpload, CheckCircle2, AlertTriangle, Play, Square, FolderOpen } from "lucide-react";

interface RemainingBreakdown {
  propertyImages: number;
  projects: number;
  successStories: number;
  transactions: number;
  total: number;
}

interface LocalItem {
  key: string;
  model: "SuccessStory" | "PropertyImage";
  id: number;
  field: string;
  filename: string;
}

export default function StorageMigrationPage() {
  const [loading, setLoading] = useState(true);
  const [r2Configured, setR2Configured] = useState(true);
  const [remaining, setRemaining] = useState<RemainingBreakdown | null>(null);
  const [totalMigrated, setTotalMigrated] = useState(0);
  const [running, setRunning] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const stopRef = useRef(false);

  const fetchStatus = useCallback(async () => {
    const res = await fetch("/api/admin/migrate-storage");
    const d = await res.json();
    if (d.success) {
      setRemaining(d.data.remaining);
      setR2Configured(d.data.r2Configured);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const runOneBatch = async () => {
    const res = await fetch("/api/admin/migrate-storage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ limit: 30 }),
    });
    const d = await res.json();
    if (!d.success) throw new Error(d.error || "Migration batch failed");
    return d.data as { migrated: number; errors: string[]; remaining: RemainingBreakdown };
  };

  const start = async () => {
    setRunning(true);
    stopRef.current = false;
    setErrors([]);
    setTotalMigrated(0);
    try {
      while (!stopRef.current) {
        const result = await runOneBatch();
        setTotalMigrated((n) => n + result.migrated);
        setRemaining(result.remaining);
        if (result.errors.length) setErrors((e) => [...e, ...result.errors]);
        if (result.remaining.total === 0 || result.migrated === 0) break;
      }
    } catch (e: any) {
      setErrors((prev) => [...prev, e?.message || "Unexpected error"]);
    } finally {
      setRunning(false);
    }
  };

  const stop = () => {
    stopRef.current = true;
  };

  // ── Local-only uploads (files that only ever existed on someone's dev machine) ──
  const [localItems, setLocalItems] = useState<LocalItem[]>([]);
  const [localLoading, setLocalLoading] = useState(true);
  const [localRunning, setLocalRunning] = useState(false);
  const [localDone, setLocalDone] = useState(0);
  const [localMissing, setLocalMissing] = useState<string[]>([]);
  const [localErrors, setLocalErrors] = useState<string[]>([]);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const fetchLocalItems = useCallback(async () => {
    const res = await fetch("/api/admin/fix-local-uploads");
    const d = await res.json();
    if (d.success) setLocalItems(d.data.items);
    setLocalLoading(false);
  }, []);

  useEffect(() => {
    fetchLocalItems();
  }, [fetchLocalItems]);

  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const byName = new Map<string, File>();
    for (const f of files) byName.set(f.name, f);

    setLocalRunning(true);
    setLocalDone(0);
    setLocalMissing([]);
    setLocalErrors([]);

    const missing: string[] = [];
    const errors: string[] = [];
    let done = 0;

    for (const item of localItems) {
      const file = byName.get(item.filename);
      if (!file) {
        missing.push(item.filename);
        continue;
      }
      try {
        const fd = new FormData();
        fd.append("file", file);
        const upRes = await fetch("/api/upload", { method: "POST", body: fd });
        const upData = await upRes.json();
        if (!upData.success || !upData.data?.url) throw new Error(upData.error || "อัปโหลดไม่สำเร็จ");
        const fixRes = await fetch("/api/admin/fix-local-uploads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: item.model, id: item.id, field: item.field, url: upData.data.url }),
        });
        const fixData = await fixRes.json();
        if (!fixData.success) throw new Error(fixData.error || "อัปเดตฐานข้อมูลไม่สำเร็จ");
        done++;
        setLocalDone(done);
      } catch (err: any) {
        errors.push(`${item.key}: ${err?.message || err}`);
      }
    }

    setLocalMissing(missing);
    setLocalErrors(errors);
    setLocalRunning(false);
    fetchLocalItems();
    if (folderInputRef.current) folderInputRef.current.value = "";
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#C8A951]" />
      </div>
    );
  }

  const done = remaining?.total === 0;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
          <CloudUpload className="w-5 h-5 text-[#C8A951]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">ย้ายไฟล์จาก Vercel ไป Cloudflare</h1>
          <p className="text-sm text-gray-500">คัดลอกไฟล์เก่าที่ยังอยู่บน Vercel Blob ไปเก็บที่ Cloudflare R2</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-6">
        {!r2Configured && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>ยังไม่ได้ตั้งค่า Cloudflare R2 บน deployment นี้ (ต้องรันบน production ที่มี R2_WORKER_URL / R2_UPLOAD_SECRET)</span>
          </div>
        )}

        {done ? (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-green-50 text-green-700">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">ย้ายไฟล์ครบทั้งหมดแล้ว ไม่มีไฟล์เหลือบน Vercel Blob</span>
          </div>
        ) : (
          remaining && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">ไฟล์ที่ยังอยู่บน Vercel Blob</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between px-3 py-2 rounded-lg bg-gray-50">
                  <span className="text-gray-500">รูปทรัพย์สิน</span>
                  <span className="font-semibold">{remaining.propertyImages}</span>
                </div>
                <div className="flex justify-between px-3 py-2 rounded-lg bg-gray-50">
                  <span className="text-gray-500">โครงการ</span>
                  <span className="font-semibold">{remaining.projects}</span>
                </div>
                <div className="flex justify-between px-3 py-2 rounded-lg bg-gray-50">
                  <span className="text-gray-500">Success Story</span>
                  <span className="font-semibold">{remaining.successStories}</span>
                </div>
                <div className="flex justify-between px-3 py-2 rounded-lg bg-gray-50">
                  <span className="text-gray-500">สลิปโอนเงิน</span>
                  <span className="font-semibold">{remaining.transactions}</span>
                </div>
              </div>
              <div className="flex justify-between px-3 py-2 mt-2 rounded-lg bg-amber-50 text-sm">
                <span className="text-gray-600">รวมทั้งหมด</span>
                <span className="font-bold text-[#C8A951]">{remaining.total} ไฟล์</span>
              </div>
            </div>
          )
        )}

        {running && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>กำลังย้ายไฟล์... ย้ายไปแล้ว {totalMigrated} ไฟล์</span>
          </div>
        )}

        {errors.length > 0 && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs space-y-1 max-h-40 overflow-y-auto">
            <p className="font-medium flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> ข้อผิดพลาด ({errors.length} รายการ)
            </p>
            {errors.map((err, i) => (
              <p key={i} className="font-mono">{err}</p>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400">
          ไฟล์เดิมบน Vercel จะไม่ถูกลบ ระบบแค่คัดลอกไปไว้ที่ Cloudflare R2 แล้วอัปเดตลิงก์ในฐานข้อมูล
          จึงสามารถกดหยุดหรือรันซ้ำได้อย่างปลอดภัย
        </p>

        <div className="flex justify-end gap-2 pt-2">
          {running ? (
            <button
              onClick={stop}
              className="inline-flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2.5 rounded-lg font-medium text-sm transition-colors"
            >
              <Square className="w-4 h-4" />
              หยุด
            </button>
          ) : (
            !done && (
              <button
                onClick={start}
                disabled={!r2Configured}
                className="inline-flex items-center gap-2 bg-[#C8A951] hover:bg-[#B8993F] disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors"
              >
                <Play className="w-4 h-4" />
                เริ่มย้ายไฟล์
              </button>
            )
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6 mt-10">
        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
          <FolderOpen className="w-5 h-5 text-[#C8A951]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">กู้คืนไฟล์ที่ยังอยู่ในเครื่อง local</h1>
          <p className="text-sm text-gray-500">ไฟล์เก่าบางไฟล์ถูกบันทึกเป็นลิงก์ในเครื่อง dev เท่านั้น ไม่เคยขึ้น server จริง</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-6">
        {localLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-[#C8A951]" />
          </div>
        ) : localItems.length === 0 ? (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-green-50 text-green-700">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">ไม่มีไฟล์ที่ต้องกู้คืนแล้ว</span>
          </div>
        ) : (
          <>
            <div className="flex justify-between px-3 py-2 rounded-lg bg-amber-50 text-sm">
              <span className="text-gray-600">ไฟล์ที่ยังเป็นลิงก์ในเครื่อง local</span>
              <span className="font-bold text-[#C8A951]">{localItems.length} ไฟล์</span>
            </div>

            <p className="text-xs text-gray-400">
              กดเลือกโฟลเดอร์ <code className="bg-gray-100 px-1 rounded">public/uploads</code> ในโปรเจกต์นี้
              (เครื่องที่มีไฟล์ต้นฉบับอยู่) ระบบจะจับคู่ไฟล์ตามชื่อ อัปโหลดขึ้น Cloudflare
              แล้วอัปเดตลิงก์ในฐานข้อมูลให้อัตโนมัติ
            </p>

            {localRunning && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>กำลังอัปโหลด... {localDone}/{localItems.length} ไฟล์</span>
              </div>
            )}

            {localMissing.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-50 text-amber-700 text-xs space-y-1 max-h-32 overflow-y-auto">
                <p className="font-medium">หาไฟล์ไม่พบในโฟลเดอร์ที่เลือก ({localMissing.length} ไฟล์)</p>
                {localMissing.map((f, i) => (
                  <p key={i} className="font-mono">{f}</p>
                ))}
              </div>
            )}

            {localErrors.length > 0 && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs space-y-1 max-h-32 overflow-y-auto">
                <p className="font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> ข้อผิดพลาด ({localErrors.length} รายการ)
                </p>
                {localErrors.map((err, i) => (
                  <p key={i} className="font-mono">{err}</p>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <input
                ref={folderInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFolderSelect}
                {...({ webkitdirectory: "true", directory: "true" } as any)}
              />
              <button
                onClick={() => folderInputRef.current?.click()}
                disabled={localRunning}
                className="inline-flex items-center gap-2 bg-[#C8A951] hover:bg-[#B8993F] disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors"
              >
                <FolderOpen className="w-4 h-4" />
                เลือกโฟลเดอร์ public/uploads
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
