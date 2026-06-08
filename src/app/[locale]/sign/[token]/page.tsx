"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { use } from "react";
import { Loader2, RotateCcw, CheckCircle2, PenLine, AlertCircle } from "lucide-react";

interface ContractInfo {
  contractNumber: string;
  projectName: string;
  unitNumber: string;
  signerName: string;
  role: "lessor" | "lessee";
  alreadySigned: boolean;
  signedAt?: string | null;
}

function formatDate(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SignPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { token } = use(params);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasStroke, setHasStroke] = useState(false);
  const [info, setInfo] = useState<ContractInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    fetch(`/api/sign/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) { setError(d.error || "ลิงก์ไม่ถูกต้องหรือหมดอายุแล้ว"); return; }
        setInfo(d.data);
        if (d.data.alreadySigned) setDone(true);
      })
      .catch(() => setError("เกิดข้อผิดพลาด กรุณาลองใหม่"))
      .finally(() => setLoading(false));
  }, [token]);

  // Scale canvas to device pixel ratio for sharp drawing on retina
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
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  useEffect(() => {
    if (info && !done) { initCanvas(); }
  }, [info, done, initCanvas]);

  const getPos = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setDrawing(true);
    const pos = getPos(e);
    lastPoint.current = pos;
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
    lastPoint.current = pos;
    setHasStroke(true);
  };

  const stopDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setDrawing(false);
    lastPoint.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStroke(false);
  };

  const handleSubmit = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSubmitting(true);
    const signature = canvas.toDataURL("image/png");
    try {
      const res = await fetch(`/api/sign/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error || "เกิดข้อผิดพลาด");
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (error && !info) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h1 className="text-lg font-bold text-gray-900">ลิงก์ไม่ถูกต้อง</h1>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center space-y-4">
          <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto" />
          <h1 className="text-xl font-bold text-gray-900">ลงลายมือชื่อสำเร็จ</h1>
          <p className="text-sm text-gray-600">
            {info?.role === "lessor" ? "ผู้ให้เช่า" : "ผู้เช่า"} · {info?.signerName}
          </p>
          <p className="text-sm text-gray-500">
            {info?.contractNumber} · {info?.projectName} #{info?.unitNumber}
          </p>
          {info?.signedAt && (
            <p className="text-xs text-gray-400">เซ็นเมื่อ {formatDate(info.signedAt)}</p>
          )}
          <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
            ขอบคุณ ลายมือชื่อของท่านได้รับการบันทึกแล้ว
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md">
        {/* Header */}
        <div className="bg-[#112240] text-white rounded-t-2xl px-6 py-5">
          <div className="flex items-center gap-2 mb-1">
            <PenLine className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-lg">ลงลายมือชื่อ E-Sign</span>
          </div>
          <p className="text-sm text-gray-300">{info?.contractNumber} · {info?.projectName} #{info?.unitNumber}</p>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Signer info */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-xs text-amber-700 font-medium mb-0.5">
              {info?.role === "lessor" ? "ผู้ให้เช่า / Lessor" : "ผู้เช่า / Lessee"}
            </p>
            <p className="font-semibold text-gray-900">{info?.signerName}</p>
          </div>

          {/* Canvas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">วาดลายมือชื่อในกรอบด้านล่าง</p>
              <button
                onClick={clearCanvas}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
              >
                <RotateCcw className="w-3 h-3" /> ล้าง
              </button>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 touch-none">
              <canvas
                ref={canvasRef}
                className="w-full"
                style={{ height: 180, cursor: "crosshair", display: "block" }}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={stopDraw}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">ใช้นิ้วหรือเมาส์วาดลายเซ็นของท่าน</p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!hasStroke || submitting}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#C8A951] text-white font-semibold rounded-xl hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> กำลังบันทึก...</>
            ) : (
              <><CheckCircle2 className="w-4 h-4" /> ยืนยันลายมือชื่อ</>
            )}
          </button>

          <p className="text-xs text-center text-gray-400">
            ลายมือชื่อนี้มีผลทางกฎหมายเทียบเท่าลายเซ็นจริง
          </p>
        </div>
      </div>
    </div>
  );
}
