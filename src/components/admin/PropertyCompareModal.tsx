"use client";

import { useState, useEffect } from "react";
import { X, Loader2, AlertTriangle } from "lucide-react";

export interface CompareSideData {
  titleTh: string;
  projectName?: string | null;
  building?: string | null;
  floor?: number | null;
  price?: number | string | null;
  ownerName?: string | null;
  ownerPhone?: string | null;
  ownerLineId?: string | null;
  status?: string | null;
  imageUrl?: string | null;
}

function fmtPrice(p: number | string | null | undefined) {
  if (p == null || p === "") return "-";
  return `฿${Number(p).toLocaleString("en-US")}`;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-stone-100 last:border-0">
      <span className="text-xs text-stone-500 shrink-0">{label}</span>
      <span className="text-sm text-stone-900 text-right">{value || "-"}</span>
    </div>
  );
}

function CompareColumn({ title, data, highlight }: { title: string; data: CompareSideData | null; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? "border-orange-300 bg-orange-50/40" : "border-stone-200"}`}>
      <h4 className="font-semibold text-sm text-stone-900 mb-3">{title}</h4>
      {!data ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
        </div>
      ) : (
        <div>
          {data.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.imageUrl} alt="" className="w-full h-32 object-cover rounded-lg mb-3" />
          )}
          <Row label="ชื่อทรัพย์" value={data.titleTh} />
          <Row
            label="โครงการ/ตึก/ชั้น"
            value={[data.projectName, data.building ? `ตึก ${data.building}` : null, data.floor != null ? `ชั้น ${data.floor}` : null]
              .filter(Boolean)
              .join(" · ")}
          />
          <Row label="ราคา" value={fmtPrice(data.price)} />
          <Row label="เจ้าของ" value={data.ownerName} />
          <Row label="เบอร์เจ้าของ" value={data.ownerPhone} />
          <Row label="Line เจ้าของ" value={data.ownerLineId} />
          {data.status && <Row label="สถานะ" value={data.status} />}
        </div>
      )}
    </div>
  );
}

// Admin-only side-by-side comparison, opened from the possible-duplicate
// warning banner on the property add/edit form — lets the admin actually
// look at both listings before deciding whether to mark the one they're
// reviewing as a duplicate. onMarkDuplicate is only passed when the
// property being reviewed already has an id to update (edit mode) —
// there's nothing to mark yet for a still-unsaved new submission.
export default function PropertyCompareModal({
  currentData,
  matchPropertyId,
  onClose,
  onMarkDuplicate,
}: {
  currentData: CompareSideData;
  matchPropertyId: number;
  onClose: () => void;
  onMarkDuplicate?: (matchPropertyId: number) => void;
}) {
  const [matchData, setMatchData] = useState<CompareSideData | null>(null);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    fetch(`/api/properties/${matchPropertyId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const p = d.data;
          setMatchData({
            titleTh: p.titleTh,
            projectName: p.projectName || p.project?.nameTh || null,
            building: p.building,
            floor: p.floor,
            price: p.price,
            ownerName: p.ownerName,
            ownerPhone: p.ownerPhone,
            ownerLineId: p.ownerLineId,
            status: p.status,
            imageUrl: p.images?.[0]?.imageUrl || null,
          });
        }
      })
      .catch(() => {});
  }, [matchPropertyId]);

  const handleMarkDuplicate = async () => {
    if (!onMarkDuplicate) return;
    setMarking(true);
    await onMarkDuplicate(matchPropertyId);
    setMarking(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white rounded-t-2xl">
          <h3 className="font-bold text-stone-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            เปรียบเทียบทรัพย์ที่อาจซ้ำกัน
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-stone-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CompareColumn title="ทรัพย์ที่กำลังตรวจสอบ" data={currentData} />
          <CompareColumn title="ทรัพย์ที่คาดว่าซ้ำ" data={matchData} highlight />
        </div>
        <div className="flex justify-end gap-3 px-5 py-4 border-t">
          <button onClick={onClose} className="px-5 py-2 border rounded-lg text-sm hover:bg-stone-50">
            ไม่ซ้ำ — ปิดหน้าต่าง
          </button>
          {onMarkDuplicate && (
            <button
              onClick={handleMarkDuplicate}
              disabled={marking}
              className="inline-flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
            >
              {marking && <Loader2 className="w-4 h-4 animate-spin" />}
              ทำเครื่องหมายว่าซ้ำ
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
