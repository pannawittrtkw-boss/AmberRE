"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface Props {
  propId: string;
  urlId: string;
  seq: string;
  by: string;
}

type Option = { id: string; label: string; emoji: string };

const OPTIONS: Option[] = [
  { id: "fullyFurnished", label: "Fully Furnished", emoji: "🛋" },
  { id: "fullyElectric",  label: "Fully Electric",  emoji: "⚡" },
  { id: "readyToMoveIn",  label: "Ready to move in", emoji: "✅" },
];

export default function AcceptForm({ propId, urlId, seq, by }: Props) {
  const [values, setValues] = useState<Record<string, boolean>>({
    fullyFurnished: false,
    fullyElectric:  false,
    readyToMoveIn:  false,
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const toggle = (id: string) =>
    setValues((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/scanlink/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propId,
          urlId,
          seq,
          by,
          fullyFurnished: values.fullyFurnished,
          fullyElectric:  values.fullyElectric,
          readyToMoveIn:  values.readyToMoveIn,
        }),
      });
      const data = await res.json();
      if (data.success) setDone(true);
      else setError(data.error || "เกิดข้อผิดพลาด");
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div style={{ minHeight: "100vh", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "white", borderRadius: 20, padding: 40, textAlign: "center", maxWidth: 360, width: "100%", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>บันทึกสำเร็จ</div>
          <div style={{ fontSize: 14, color: "#888", marginTop: 6 }}>สามารถปิดหน้านี้ได้เลย</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 380, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>

        {/* Header */}
        <div style={{ background: "#112240", padding: "16px 20px" }}>
          <div style={{ color: "#C8A951", fontWeight: 700, fontSize: 15 }}>🔗 #{seq}</div>
          {by && <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 4 }}>By {by}</div>}
        </div>

        {/* Options */}
        <div style={{ padding: "16px 20px 8px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
            ระบุสถานะห้อง
          </div>

          {OPTIONS.map(({ id, label, emoji }) => (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                padding: "14px 0",
                background: "none",
                border: "none",
                borderBottom: "1px solid #f3f4f6",
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 500, color: "#1f2937" }}>
                {emoji} {label}
              </span>
              {/* Toggle track */}
              <span
                style={{
                  position: "relative",
                  display: "inline-block",
                  width: 52,
                  height: 28,
                  borderRadius: 999,
                  background: values[id] ? "#22c55e" : "#d1d5db",
                  transition: "background 0.2s",
                  flexShrink: 0,
                }}
              >
                {/* Toggle knob */}
                <span
                  style={{
                    position: "absolute",
                    top: 3,
                    left: values[id] ? 26 : 3,
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "white",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    transition: "left 0.2s",
                  }}
                />
              </span>
            </button>
          ))}
        </div>

        {error && (
          <div style={{ padding: "0 20px 8px", fontSize: 12, color: "#ef4444" }}>{error}</div>
        )}

        {/* Submit */}
        <div style={{ padding: "12px 20px 20px" }}>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%",
              background: loading ? "#d9bb74" : "#C8A951",
              color: "white",
              border: "none",
              borderRadius: 14,
              padding: "14px 0",
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {loading && <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} />}
            {loading ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}
