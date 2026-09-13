"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Sparkles, Square, Check, AlertTriangle } from "lucide-react";
import { LINES } from "@/lib/stations";

function getStationLabel(code: string): string {
  for (const line of LINES) {
    const station = line.stations.find((s) => s.code === code);
    if (station) return `${station.code} ${station.nameTh}`;
  }
  return code;
}

const PROPERTY_TYPE_LABEL: Record<string, string> = { CONDO: "Condo", HOUSE: "House", TOWNHOUSE: "Townhome", LAND: "Land" };
const LISTING_TYPE_LABEL: Record<string, string> = { RENT: "เช่า", SALE: "ขาย", RENT_AND_SALE: "เช่าและขาย" };

interface FieldValues {
  propertyType: string;
  listingType: string;
  price: number;
  salePrice: number | null;
  nearbyStations: string[];
}

interface EligibleProperty extends FieldValues {
  id: number;
  titleTh: string;
  projectName: string | null;
}

type FieldKey = "propertyType" | "listingType" | "price" | "salePrice" | "nearbyStations";
const FIELD_KEYS: FieldKey[] = ["propertyType", "listingType", "price", "salePrice", "nearbyStations"];

interface RowState {
  property: EligibleProperty;
  suggested?: FieldValues;
  checked: Partial<Record<FieldKey, boolean>>;
  status: "pending" | "loading" | "done" | "error";
  errorMessage?: string;
}

function fieldsDiffer(a: FieldValues, b: FieldValues, key: FieldKey): boolean {
  if (key === "nearbyStations") {
    const sa = [...a.nearbyStations].sort().join(",");
    const sb = [...b.nearbyStations].sort().join(",");
    return sa !== sb;
  }
  return a[key] !== b[key];
}

function formatValue(v: FieldValues, key: FieldKey): string {
  if (key === "propertyType") return PROPERTY_TYPE_LABEL[v.propertyType] || v.propertyType;
  if (key === "listingType") return LISTING_TYPE_LABEL[v.listingType] || v.listingType;
  if (key === "price") return `฿${v.price.toLocaleString()}`;
  if (key === "salePrice") return v.salePrice != null ? `฿${v.salePrice.toLocaleString()}` : "-";
  return v.nearbyStations.length ? v.nearbyStations.map(getStationLabel).join(", ") : "-";
}

const FIELD_LABEL: Record<FieldKey, string> = {
  propertyType: "ประเภททรัพย์สิน",
  listingType: "ประเภทประกาศ",
  price: "ราคาเช่า",
  salePrice: "ราคาขาย",
  nearbyStations: "สถานี",
};

const BATCH_SIZE = 8;

export default function PropertiesAiEnrichPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState("th");
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<RowState[]>([]);
  const [running, setRunning] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState("");
  const [onlyDiffs, setOnlyDiffs] = useState(true);
  const [error, setError] = useState("");
  const stopRef = useRef(false);

  useEffect(() => {
    params.then(({ locale: l }) => setLocale(l));
  }, [params]);

  useEffect(() => {
    fetch("/api/admin/properties/ai-enrich")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setRows(
            d.data.map((p: EligibleProperty) => ({ property: p, checked: {}, status: "pending" as const }))
          );
        } else {
          setError(d.error || "โหลดข้อมูลไม่สำเร็จ");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const start = async () => {
    setRunning(true);
    stopRef.current = false;
    setError("");
    setApplyResult("");

    // Retry errored rows too, so a transient failure (or one fixed by
    // re-running) doesn't permanently strand those properties.
    const pendingIds = rows.filter((r) => r.status === "pending" || r.status === "error").map((r) => r.property.id);

    for (let i = 0; i < pendingIds.length; i += BATCH_SIZE) {
      if (stopRef.current) break;
      const batch = pendingIds.slice(i, i + BATCH_SIZE);
      setRows((prev) => prev.map((r) => (batch.includes(r.property.id) ? { ...r, status: "loading" } : r)));
      try {
        const res = await fetch("/api/admin/properties/ai-enrich", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: batch }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "AI request failed");
        setRows((prev) =>
          prev.map((r) => {
            const result = data.data.find((x: { id: number }) => x.id === r.property.id);
            if (!result) return r;
            if (!result.success) return { ...r, status: "error", errorMessage: result.error };
            const suggested: FieldValues = result.suggested;
            const checked: Partial<Record<FieldKey, boolean>> = {};
            for (const key of FIELD_KEYS) {
              // Default unchecked — admin opts in per field after reviewing.
              checked[key] = false;
            }
            return { ...r, status: "done", suggested, checked };
          })
        );
        setProcessedCount((n) => n + batch.length);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "เกิดข้อผิดพลาด";
        setError(message);
        setRows((prev) => prev.map((r) => (batch.includes(r.property.id) ? { ...r, status: "error", errorMessage: message } : r)));
        // A whole-batch failure (network/auth/config) will fail identically
        // for every remaining batch too — stop instead of burning through
        // all of them with the same error.
        break;
      }
    }

    setRunning(false);
  };

  const stop = () => {
    stopRef.current = true;
  };

  const toggleField = (id: number, key: FieldKey) => {
    setRows((prev) =>
      prev.map((r) =>
        r.property.id === id ? { ...r, checked: { ...r.checked, [key]: !r.checked[key] } } : r
      )
    );
  };

  const changedRows = rows.filter(
    (r) => r.suggested && FIELD_KEYS.some((k) => fieldsDiffer(r.property, r.suggested!, k))
  );
  const visibleRows = onlyDiffs ? changedRows : rows.filter((r) => r.status === "done");
  const erroredRows = rows.filter((r) => r.status === "error");
  const selectedCount = rows.reduce(
    (sum, r) => sum + FIELD_KEYS.filter((k) => r.checked[k]).length,
    0
  );

  const applySelected = async () => {
    const updates = rows
      .filter((r) => r.suggested && FIELD_KEYS.some((k) => r.checked[k]))
      .map((r) => {
        const u: Record<string, unknown> = { id: r.property.id };
        for (const key of FIELD_KEYS) {
          if (r.checked[key]) u[key] = r.suggested![key];
        }
        return u;
      });
    if (updates.length === 0) return;

    setApplying(true);
    setApplyResult("");
    try {
      const res = await fetch("/api/admin/properties/ai-enrich/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "บันทึกไม่สำเร็จ");
      setApplyResult(`บันทึกสำเร็จ ${data.data.applied} รายการ`);
      // Reflect applied values as the new "current" and clear checks/suggestions for those rows
      const appliedIds = new Set(updates.map((u) => u.id as number));
      setRows((prev) =>
        prev.map((r) => {
          if (!appliedIds.has(r.property.id) || !r.suggested) return r;
          const newCurrent: EligibleProperty = { ...r.property };
          for (const key of FIELD_KEYS) {
            if (r.checked[key]) (newCurrent as unknown as Record<string, unknown>)[key] = r.suggested[key];
          }
          return { property: newCurrent, suggested: undefined, checked: {}, status: "pending" };
        })
      );
    } catch (e: unknown) {
      setApplyResult(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    }
    setApplying(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#C8A951]" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <Link
          href={`/${locale}/admin/properties`}
          className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-[#C8A951] self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          {locale === "th" ? "กลับ" : "Back"}
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#C8A951]" />
          AI ตรวจสอบข้อมูลทรัพย์สิน (Verified)
        </h1>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 mb-5">
        <p className="text-xs leading-relaxed">
          AI จะอ่านชื่อ/คำอธิบาย/ที่อยู่ที่มีอยู่แล้วในระบบ แล้วเสนอค่าประเภททรัพย์สิน, ประเภทประกาศ,
          ราคาเช่า, ราคาขาย และสถานีใกล้เคียง — ถ้าไม่มีข้อมูลชัดเจนพอจะคงค่าปัจจุบันไว้ ไม่มีการเดา
          ระบบจะ<strong>ไม่บันทึกอะไรเลย</strong>จนกว่าจะติ๊กเลือกทีละช่องแล้วกด &quot;บันทึกที่เลือกไว้&quot;
          ด้านล่าง — ตรวจสอบทั้งหมด {rows.length} รายการ (สถานะ Verified)
        </p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2 rounded-lg text-sm mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {erroredRows.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs mb-4 p-3 max-h-40 overflow-y-auto">
          <p className="font-medium flex items-center gap-1 mb-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> วิเคราะห์ไม่สำเร็จ {erroredRows.length} รายการ
          </p>
          {erroredRows.slice(0, 20).map((r) => (
            <p key={r.property.id} className="font-mono">
              #{r.property.id} {r.property.titleTh}: {r.errorMessage || "unknown error"}
            </p>
          ))}
          {erroredRows.length > 20 && <p>...และอีก {erroredRows.length - 20} รายการ</p>}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-4">
        {running ? (
          <button
            onClick={stop}
            className="inline-flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Square className="w-4 h-4" /> หยุด
          </button>
        ) : (
          <button
            onClick={start}
            disabled={rows.every((r) => r.status !== "pending" && r.status !== "error")}
            className="inline-flex items-center gap-2 bg-[#C8A951] hover:bg-[#B8993F] disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Sparkles className="w-4 h-4" /> เริ่มวิเคราะห์
          </button>
        )}
        {running && (
          <span className="text-sm text-gray-500 flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            กำลังวิเคราะห์... {processedCount}/{rows.length}
          </span>
        )}
        <label className="flex items-center gap-1.5 text-sm text-gray-600 ml-auto">
          <input type="checkbox" checked={onlyDiffs} onChange={(e) => setOnlyDiffs(e.target.checked)} />
          แสดงเฉพาะที่มีข้อเสนอเปลี่ยนแปลง ({changedRows.length})
        </label>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-2.5 px-3">ทรัพย์สิน</th>
                {FIELD_KEYS.map((k) => (
                  <th key={k} className="text-left py-2.5 px-3">{FIELD_LABEL[k]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">
                    {rows.some((r) => r.status === "done")
                      ? "ไม่มีรายการที่ต้องแก้ไข"
                      : rows.some((r) => r.status === "error")
                      ? "วิเคราะห์ไม่สำเร็จเลยสักรายการ — ดูสาเหตุด้านบน"
                      : "ยังไม่ได้เริ่มวิเคราะห์"}
                  </td>
                </tr>
              ) : (
                visibleRows.map((r) => (
                  <tr key={r.property.id} className="border-t align-top">
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-gray-800">{r.property.titleTh}</div>
                      <div className="text-xs text-gray-400">#{r.property.id} · {r.property.projectName || "-"}</div>
                    </td>
                    {FIELD_KEYS.map((key) => {
                      const differs = r.suggested && fieldsDiffer(r.property, r.suggested, key);
                      return (
                        <td key={key} className="py-2.5 px-3">
                          {differs ? (
                            <label className="flex items-start gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                className="mt-0.5"
                                checked={!!r.checked[key]}
                                onChange={() => toggleField(r.property.id, key)}
                              />
                              <span>
                                <span className="block text-gray-400 line-through text-xs">
                                  {formatValue(r.property, key)}
                                </span>
                                <span className="block text-emerald-700 font-medium">
                                  {formatValue(r.suggested!, key)}
                                </span>
                              </span>
                            </label>
                          ) : (
                            <span className="text-gray-600">{formatValue(r.property, key)}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div
        className="fixed sm:static bottom-0 left-0 right-0 z-30 flex flex-wrap items-center justify-end gap-3 px-4 py-3 sm:p-0 sm:mt-5 bg-white sm:bg-transparent border-t sm:border-0"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
      >
        {applyResult && <span className="text-sm text-gray-600">{applyResult}</span>}
        <button
          onClick={applySelected}
          disabled={applying || selectedCount === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold"
        >
          {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          บันทึกที่เลือกไว้ ({selectedCount})
        </button>
      </div>
    </div>
  );
}
