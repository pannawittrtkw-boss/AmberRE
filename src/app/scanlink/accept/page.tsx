"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Train } from "lucide-react";
import StationMapSelector, { LINES } from "@/components/admin/StationMapSelector";

function ScanlinkAcceptForm() {
  const searchParams = useSearchParams();
  const urlId = searchParams.get("urlId") ?? "";
  const seq = searchParams.get("seq") ?? "";
  const by = searchParams.get("by") ?? "";
  const status = searchParams.get("status") ?? "";
  const todayStr = new Date().toISOString().slice(0, 10);

  const statusLabel =
    status === "ACCEPT_ALL" ? "✅ Accept Agent & Foreigner" :
    status === "ACCEPT_AGENT_NOT_FOREIGNER" ? "✅ Accept Agent & Not Foreigner" :
    "✅ Accepted";

  const [condoName, setCondoName] = useState("");
  const [propertyType, setPropertyType] = useState("CONDO");
  const [listingType, setListingType] = useState("RENT");
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [furnished, setFurnished] = useState(false);
  const [electric, setElectric] = useState(false);
  const [ready, setReady] = useState(false);
  const [petFriendly, setPetFriendly] = useState(false);
  const [smokingAllowed, setSmokingAllowed] = useState(false);
  const [availDate, setAvailDate] = useState("");
  const [remark, setRemark] = useState("");
  const [selectedStations, setSelectedStations] = useState<string[]>([]);
  const [showStationModal, setShowStationModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const selectedStationLabels = selectedStations
    .map((id) => {
      for (const line of LINES) {
        const station = line.stations.find((s) => s.id === id);
        if (station) return `${station.code} ${station.nameTh}`;
      }
      return id;
    })
    .slice(0, 3);

  const handleSubmit = async () => {
    setError("");
    if (!condoName.trim()) { setError("กรุณากรอกชื่อโครงการ"); return; }
    if (!price.trim()) { setError("กรุณากรอกราคาเช่า"); return; }
    if (!salePrice.trim()) { setError("กรุณากรอกราคาขาย"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/scanlink/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urlId,
          status,
          seq,
          by,
          fullyFurnished: furnished,
          fullyElectric: electric,
          readyToMoveIn: ready,
          petFriendly,
          smokingAllowed,
          availableDate: ready ? null : (availDate || null),
          remark,
          condoName: condoName.trim(),
          propertyType,
          listingType,
          price: Number(price),
          salePrice: Number(salePrice),
          stationIds: selectedStations,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "เกิดข้อผิดพลาด");
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    }
    setSubmitting(false);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-[20px] w-full max-w-[380px] shadow-md text-center py-10 px-5">
          <div className="text-5xl mb-3">✅</div>
          <div className="text-lg font-bold text-gray-900">บันทึกสำเร็จ</div>
          <div className="text-sm text-gray-400 mt-1.5">สามารถปิดหน้านี้ได้เลย</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-[20px] w-full max-w-[380px] shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-[#112240] px-5 py-4">
          <div className="text-[#C8A951] font-bold text-sm">{statusLabel}</div>
          <div className="text-white font-bold text-[15px] mt-0.5">🔗 #{seq}</div>
          {by && <div className="text-white/55 text-xs mt-1">By {by}</div>}
        </div>

        {/* Project name */}
        <div className="px-5 pt-3 pb-2 border-t border-gray-100">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            🏢 ชื่อโครงการ <span className="font-normal text-red-500">*</span>
          </label>
          <input
            value={condoName}
            onChange={(e) => setCondoName(e.target.value)}
            className="w-full border border-gray-200 rounded-[10px] px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#C8A951]"
            placeholder="เช่น LESTO CONDO 113"
          />
        </div>

        {/* Property type & Listing type */}
        <div className="px-5 pt-3 pb-2 border-t border-gray-100 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">ประเภททรัพย์สิน</label>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full border border-gray-200 rounded-[10px] px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#C8A951] bg-white"
            >
              <option value="CONDO">Condo</option>
              <option value="HOUSE">House</option>
              <option value="TOWNHOUSE">Townhome</option>
              <option value="LAND">Land</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">ประเภทประกาศ</label>
            <select
              value={listingType}
              onChange={(e) => setListingType(e.target.value)}
              className="w-full border border-gray-200 rounded-[10px] px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#C8A951] bg-white"
            >
              <option value="RENT">เช่า</option>
              <option value="SALE">ขาย</option>
              <option value="RENT_AND_SALE">เช่าและขาย</option>
            </select>
          </div>
        </div>

        {/* Rent price & Sale price */}
        <div className="px-5 pt-3 pb-2 border-t border-gray-100 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              💰 ราคาเช่า (บาท) <span className="font-normal text-red-500">*</span>
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full border border-gray-200 rounded-[10px] px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#C8A951]"
              placeholder="เช่น 7000"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              💵 ราคาขาย (บาท) <span className="font-normal text-red-500">*</span>
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              className="w-full border border-gray-200 rounded-[10px] px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#C8A951]"
              placeholder="เช่น 3000000"
            />
          </div>
        </div>

        {/* Nearby stations — reuses the same picker as the search page */}
        <div className="px-5 pt-3 pb-2 border-t border-gray-100">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            🚉 สถานีใกล้เคียง <span className="font-normal text-gray-400">(ไม่บังคับ)</span>
          </label>
          <button
            type="button"
            onClick={() => setShowStationModal(true)}
            className="w-full border border-gray-200 rounded-[10px] px-3 py-2.5 text-sm text-left flex items-center gap-2 hover:bg-gray-50"
          >
            <Train className="w-4 h-4 text-gray-400 shrink-0" />
            {selectedStations.length > 0 ? (
              <span className="flex-1 truncate text-gray-800">
                {selectedStationLabels.join(", ")}
                {selectedStations.length > 3 ? ` +${selectedStations.length - 3} more` : ""}
              </span>
            ) : (
              <span className="text-gray-400">เลือกสถานี</span>
            )}
          </button>
        </div>

        {/* Toggles */}
        <div className="px-5 pt-3 pb-1">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
            ระบุสถานะห้อง
          </div>
          {([
            { key: "furnished", label: "🛋 Fully Furnished", value: furnished, set: setFurnished },
            { key: "electric", label: "⚡ Fully Electric", value: electric, set: setElectric },
            { key: "ready", label: "✅ Ready to move in", value: ready, set: setReady },
            { key: "petFriendly", label: "🐾 Pet Friendly", value: petFriendly, set: setPetFriendly },
            { key: "smokingAllowed", label: "🚬 Smoking Allowed", value: smokingAllowed, set: setSmokingAllowed },
          ] as const).map((opt) => (
            <div
              key={opt.key}
              onClick={() => opt.set(!opt.value)}
              className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0 cursor-pointer select-none"
            >
              <span className="text-base font-medium text-gray-800">{opt.label}</span>
              <div
                className={`w-14 h-[30px] rounded-full relative border-2 transition-colors ${
                  opt.value ? "bg-green-600 border-green-600" : "bg-gray-200 border-gray-300"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-[22px] h-[22px] rounded-full bg-white shadow transition-all ${
                    opt.value ? "left-7" : "left-0.5"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Available date — hidden once "ready to move in" is on */}
        {!ready && (
          <div className="px-5 pt-3 pb-2 border-t border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📅 สามารถเข้าอยู่ได้ <span className="font-normal text-gray-400">(ไม่บังคับ)</span>
            </label>
            <input
              type="date"
              min={todayStr}
              value={availDate}
              onChange={(e) => setAvailDate(e.target.value)}
              className="w-full border border-gray-200 rounded-[10px] px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#C8A951]"
            />
          </div>
        )}

        {/* Remark */}
        <div className="px-5 pt-3 pb-2 border-t border-gray-100">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            📝 Remark <span className="font-normal text-gray-400">(ไม่บังคับ)</span>
          </label>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            className="w-full border border-gray-200 rounded-[10px] px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#C8A951] resize-y min-h-[80px]"
            placeholder="เช่น No TV, No Washing Machine..."
          />
        </div>

        {error && <div className="text-red-500 text-xs px-5 pb-2">{error}</div>}

        {/* Submit */}
        <div className="px-5 pb-5 pt-3">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-[#C8A951] hover:bg-[#b8993f] disabled:bg-[#d9bb74] disabled:cursor-not-allowed text-white rounded-[14px] py-3.5 text-base font-semibold flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              "บันทึก"
            )}
          </button>
        </div>
      </div>

      {showStationModal && (
        <StationMapSelector
          selectedStations={selectedStations}
          onChange={setSelectedStations}
          onClose={() => setShowStationModal(false)}
        />
      )}
    </div>
  );
}

export default function ScanlinkAcceptPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <Loader2 className="w-6 h-6 animate-spin text-[#C8A951]" />
        </div>
      }
    >
      <ScanlinkAcceptForm />
    </Suspense>
  );
}
