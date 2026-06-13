"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0 cursor-pointer"
      onClick={() => onChange(!value)}
    >
      <span className="text-base font-medium text-gray-800">{label}</span>
      <div
        className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${
          value ? "bg-green-500" : "bg-gray-200"
        }`}
      >
        <span
          className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
            value ? "translate-x-8" : "translate-x-1"
          }`}
        />
      </div>
    </div>
  );
}

function AcceptForm() {
  const searchParams = useSearchParams();
  const propId = searchParams.get("propId") ?? "";
  const urlId = searchParams.get("urlId") ?? "";
  const seq = searchParams.get("seq") ?? "";
  const by = searchParams.get("by") ?? "";

  const [fullyFurnished, setFullyFurnished] = useState(false);
  const [fullyElectric, setFullyElectric] = useState(false);
  const [readyToMoveIn, setReadyToMoveIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/scanlink/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propId, urlId, seq, by, fullyFurnished, fullyElectric, readyToMoveIn }),
      });
      const data = await res.json();
      if (data.success) {
        setDone(true);
      } else {
        setError(data.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-10 text-center max-w-sm w-full shadow-sm">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">บันทึกสำเร็จ</h2>
          <p className="text-sm text-gray-400 mt-1">สามารถปิดหน้านี้ได้เลย</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-[#112240] px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="text-[#C8A951] font-bold text-sm">🔗 #{seq}</span>
          </div>
          {by && (
            <p className="text-white/60 text-xs mt-1">By {by}</p>
          )}
        </div>

        {/* Toggles */}
        <div className="px-5 pt-4 pb-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            ระบุสถานะห้อง
          </p>
          <Toggle label="🛋 Fully Furnished" value={fullyFurnished} onChange={setFullyFurnished} />
          <Toggle label="⚡ Fully Electric" value={fullyElectric} onChange={setFullyElectric} />
          <Toggle label="✅ Ready to move in" value={readyToMoveIn} onChange={setReadyToMoveIn} />
        </div>

        {error && (
          <p className="px-5 pb-2 text-xs text-red-500">{error}</p>
        )}

        {/* Submit */}
        <div className="p-5 pt-3">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#C8A951] hover:bg-[#b8993f] text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ScanLinkAcceptPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#C8A951]" />
        </div>
      }
    >
      <AcceptForm />
    </Suspense>
  );
}
