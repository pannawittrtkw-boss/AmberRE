"use client";

import { useState } from "react";
import { X, Lock, Unlock, Loader2 } from "lucide-react";

interface ExclusiveModalProps {
  property: any;
  onClose: () => void;
  onSaved: () => void;
}

const DURATIONS = [
  { label: "3 เดือน", months: 3 },
  { label: "6 เดือน", months: 6 },
  { label: "1 ปี",    months: 12 },
  { label: "2 ปี",    months: 24 },
  { label: "3 ปี",    months: 36 },
];

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

export default function ExclusiveModal({ property, onClose, onSaved }: ExclusiveModalProps) {
  const toDateInput = (val: string | null | undefined) => {
    if (!val) return "";
    return new Date(val).toISOString().split("T")[0];
  };

  const [isExclusive, setIsExclusive] = useState<boolean>(Boolean(property.isExclusive));
  const [startDate, setStartDate] = useState(toDateInput(property.exclusiveStartDate));
  const [endDate, setEndDate] = useState(toDateInput(property.exclusiveEndDate));
  const [saving, setSaving] = useState(false);

  const handleStartChange = (val: string) => {
    setStartDate(val);
    // if end is before new start, reset it
    if (endDate && val && endDate < val) setEndDate("");
  };

  const applyDuration = (months: number) => {
    if (!startDate) return;
    setEndDate(addMonths(startDate, months));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/properties/${property.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isExclusive,
          exclusiveStartDate: isExclusive && startDate ? startDate : null,
          exclusiveEndDate: isExclusive && endDate ? endDate : null,
        }),
      });
      onSaved();
      onClose();
    } catch {}
    setSaving(false);
  };

  const projectLabel =
    [property.projectName, property.building && `ตึก ${property.building}`, property.floor && `ชั้น ${property.floor}`, property.estCode && `ห้อง ${property.estCode}`]
      .filter(Boolean)
      .join("  ");

  const statusBanner = (() => {
    if (!isExclusive || !startDate || !endDate) return null;
    const daysLeft = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0)
      return <div className="text-xs px-3 py-2 rounded-lg bg-red-50 text-red-700">⚠️ สัญญาหมดอายุแล้ว {Math.abs(daysLeft)} วัน</div>;
    if (daysLeft <= 45)
      return <div className="text-xs px-3 py-2 rounded-lg bg-yellow-50 text-yellow-700">⏰ เหลืออีก {daysLeft} วัน (ใกล้หมดสัญญา)</div>;
    return <div className="text-xs px-3 py-2 rounded-lg bg-green-50 text-green-700">✓ สัญญามีผล เหลืออีก {daysLeft} วัน</div>;
  })();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600" />
            <h3 className="font-semibold text-gray-900">สัญญาปิด / Exclusive Contract</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Property name */}
          <p className="text-sm text-gray-500">{projectLabel || property.titleTh || `#${property.id}`}</p>

          {/* Toggle */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
            <div>
              <p className="font-medium text-sm text-gray-800">ทำสัญญาปิดกับเจ้าของ</p>
              <p className="text-xs text-gray-500 mt-0.5">Amber Real Estate มีสิทธิ์เป็นผู้หาผู้เช่า/ผู้ซื้อแต่เพียงผู้เดียว</p>
            </div>
            <button
              onClick={() => setIsExclusive(!isExclusive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isExclusive ? "bg-amber-500" : "bg-gray-300"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isExclusive ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          {isExclusive && (
            <>
              {/* Start date */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">วันที่เริ่มสัญญา</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartChange(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>

              {/* Quick duration picker */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">ระยะเวลาสัญญา (คำนวณจากวันเริ่ม)</label>
                <div className="flex gap-2 flex-wrap">
                  {DURATIONS.map(({ label, months }) => {
                    const isActive = startDate && endDate === addMonths(startDate, months);
                    return (
                      <button
                        key={months}
                        type="button"
                        disabled={!startDate}
                        onClick={() => applyDuration(months)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                          isActive
                            ? "bg-amber-500 border-amber-500 text-white"
                            : "bg-white border-gray-300 text-gray-700 hover:border-amber-400 hover:text-amber-700"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                {!startDate && (
                  <p className="text-xs text-gray-400 mt-1">กรุณาระบุวันที่เริ่มสัญญาก่อน</p>
                )}
              </div>

              {/* End date (editable manually too) */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">วันที่สิ้นสุดสัญญา</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>

              {statusBanner}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (isExclusive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />)}
            บันทึก
          </button>
        </div>
      </div>
    </div>
  );
}
