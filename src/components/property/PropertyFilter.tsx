"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Search, SlidersHorizontal, X, ChevronDown, Train } from "lucide-react";

const StationMapSelector = dynamic(
  () => import("@/components/admin/StationMapSelector"),
  { ssr: false }
);

interface PropertyFilterProps {
  locale: string;
  messages: any;
  onFilter: (params: any) => void;
  amenities: { id: number; nameTh: string; nameEn: string }[];
  stations: { id: number; nameTh: string; nameEn: string; line: string }[];
  propertyCount?: number;
  theme?: "light" | "dark";
}

export default function PropertyFilter({
  locale,
  messages,
  onFilter,
  amenities,
  stations,
  propertyCount,
  theme = "light",
}: PropertyFilterProps) {
  const isDark = theme === "dark";

  // Theme classes
  const labelCls = isDark
    ? "text-[10px] uppercase tracking-widest text-stone-400 mb-2"
    : "text-[10px] uppercase tracking-widest text-stone-400 mb-2";
  const inputBgCls = isDark
    ? "bg-white/5 border-white/10 text-white placeholder:text-stone-500 focus:bg-white/10 focus:ring-[#C8A951]/40 focus:border-[#C8A951]/40"
    : "bg-stone-50 border-transparent focus:bg-white focus:ring-[#C8A951]/30 focus:border-[#C8A951]";
  const segGroupCls = isDark
    ? "bg-white/5 border border-white/10"
    : "bg-stone-50";
  const segItemActiveCls = isDark
    ? "bg-[#C8A951] text-stone-950 shadow-sm"
    : "bg-stone-900 text-white shadow-sm";
  const segItemInactiveCls = isDark
    ? "text-stone-400 hover:text-white"
    : "text-stone-600 hover:text-stone-900";
  const pillActiveCls = "bg-[#C8A951] text-white shadow-sm";
  const pillInactiveCls = isDark
    ? "bg-white/5 border border-white/10 text-stone-300 hover:bg-white/10"
    : "bg-stone-50 text-stone-600 hover:bg-stone-100";
  const toggleLabelCls = isDark ? "text-sm text-stone-200" : "text-sm text-stone-700";
  const toggleBgCls = isDark ? "bg-white/10" : "bg-stone-200";
  const advancedBtnCls = isDark
    ? "text-stone-200 hover:text-[#E8C97A]"
    : "text-stone-700 hover:text-[#C8A951]";
  const dividerCls = isDark ? "border-white/10" : "border-stone-100";
  const countCls = isDark
    ? "text-stone-400"
    : "text-stone-500";
  const countNumCls = isDark ? "text-[#E8C97A]" : "text-stone-900";
  const t = messages.property;
  const tc = messages.common;
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState({
    keyword: "",
    listingType: "",
    propertyType: "",
    condition: "",
    buildingType: "",
    hideSold: false,
    stationId: "",
    stations: [] as string[],
    amenityIds: [] as number[],
    kitchenPartition: false,
    bedroomPartition: false,
  });
  const [showStationModal, setShowStationModal] = useState(false);

  const updateFilter = (key: string, value: any) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    onFilter(updated);
  };

  const toggleAmenity = (id: number) => {
    const ids = filters.amenityIds.includes(id)
      ? filters.amenityIds.filter((a) => a !== id)
      : [...filters.amenityIds, id];
    updateFilter("amenityIds", ids);
  };

  const resetFilters = () => {
    const reset = {
      keyword: "",
      listingType: "",
      propertyType: "",
      condition: "",
      buildingType: "",
      hideSold: false,
      stationId: "",
      stations: [],
      amenityIds: [],
      kitchenPartition: false,
      bedroomPartition: false,
    };
    setFilters(reset);
    onFilter(reset);
  };

  const hasFilters =
    filters.keyword ||
    filters.listingType ||
    filters.propertyType ||
    filters.condition ||
    filters.buildingType ||
    filters.hideSold ||
    filters.stationId ||
    filters.stations.length > 0 ||
    filters.amenityIds.length > 0 ||
    filters.kitchenPartition ||
    filters.bedroomPartition;

  return (
    <>
    <div className="p-6 space-y-6">
      {/* Search */}
      <div>
        <label className={`block ${labelCls}`}>
          {locale === "th" ? "ค้นหา" : "Search"}
        </label>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder={messages.home.searchPlaceholder}
            value={filters.keyword}
            onChange={(e) => updateFilter("keyword", e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${inputBgCls}`}
          />
        </div>
      </div>

      {/* Listing Type — segmented control */}
      <div>
        <label className={`block ${labelCls}`}>
          {locale === "th" ? "เช่า / ขาย" : "Type"}
        </label>
        <div className={`grid grid-cols-3 gap-1 p-1 rounded-xl ${segGroupCls}`}>
          {["", "RENT", "SALE"].map((type) => (
            <button
              key={type}
              onClick={() => updateFilter("listingType", type)}
              className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                filters.listingType === type
                  ? segItemActiveCls
                  : segItemInactiveCls
              }`}
            >
              {type === "" ? tc.all : type === "RENT" ? tc.rent : tc.sale}
            </button>
          ))}
        </div>
      </div>

      {/* Property Type */}
      <div>
        <label className={`block ${labelCls}`}>
          {locale === "th" ? "ประเภท" : "Property Type"}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {["CONDO", "HOUSE", "TOWNHOUSE", "LAND"].map((type) => (
            <button
              key={type}
              onClick={() =>
                updateFilter(
                  "propertyType",
                  filters.propertyType === type ? "" : type
                )
              }
              className={`py-2.5 rounded-xl text-xs font-medium transition-all ${
                filters.propertyType === type ? pillActiveCls : pillInactiveCls
              }`}
            >
              {type === "CONDO"
                ? t.condo
                : type === "HOUSE"
                ? t.house
                : type === "TOWNHOUSE"
                ? t.townhouse
                : t.land || "Land"}
            </button>
          ))}
        </div>
      </div>

      {/* Condition (1st/2nd hand) — hide when LAND is selected */}
      {filters.propertyType !== "LAND" && (
        <div>
          <label className={`block ${labelCls}`}>
            {t.condition || (locale === "th" ? "สภาพ" : "Condition")}
          </label>
          <div className={`grid grid-cols-3 gap-1 p-1 rounded-xl ${segGroupCls}`}>
            {[
              { value: "", label: tc.all },
              { value: "FIRST_HAND", label: t.firstHand || "Brand New" },
              { value: "SECOND_HAND", label: t.secondHand || "Pre-owned" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateFilter("condition", opt.value)}
                className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                  filters.condition === opt.value
                    ? segItemActiveCls
                    : segItemInactiveCls
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hide Sold */}
      <label className="flex items-center justify-between cursor-pointer group">
        <span className={toggleLabelCls}>{t.hideSold}</span>
        <div className="relative">
          <input
            type="checkbox"
            checked={filters.hideSold}
            onChange={(e) => updateFilter("hideSold", e.target.checked)}
            className="sr-only peer"
          />
          <div
            className={`w-10 h-5 ${toggleBgCls} rounded-full peer peer-checked:bg-[#C8A951] transition-colors`}
          />
          <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
        </div>
      </label>

      {/* Advanced Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className={`flex items-center justify-between w-full text-sm font-medium transition-colors ${advancedBtnCls}`}
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          {locale === "th" ? "ตัวกรองเพิ่มเติม" : "Advanced Filters"}
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${
            showAdvanced ? "rotate-180" : ""
          }`}
        />
      </button>

      {showAdvanced && (
        <div className="space-y-5 pt-1">
          {/* Building Type */}
          <div>
            <label className={`block ${labelCls}`}>
              {locale === "th" ? "ประเภทอาคาร" : "Building Type"}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["LOW_RISE", "HIGH_RISE"].map((type) => (
                <button
                  key={type}
                  onClick={() =>
                    updateFilter(
                      "buildingType",
                      filters.buildingType === type ? "" : type
                    )
                  }
                  className={`py-2.5 rounded-xl text-xs font-medium transition-all ${
                    filters.buildingType === type
                      ? pillActiveCls
                      : pillInactiveCls
                  }`}
                >
                  {type === "LOW_RISE" ? t.lowRise : t.highRise}
                </button>
              ))}
            </div>
          </div>

          {/* Room Layout — toggles */}
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className={toggleLabelCls}>{t.kitchenPartition}</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={filters.kitchenPartition}
                  onChange={(e) =>
                    updateFilter("kitchenPartition", e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div
                  className={`w-10 h-5 ${toggleBgCls} rounded-full peer peer-checked:bg-[#C8A951] transition-colors`}
                />
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
              </div>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className={toggleLabelCls}>{t.bedroomPartition}</span>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={filters.bedroomPartition}
                  onChange={(e) =>
                    updateFilter("bedroomPartition", e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div
                  className={`w-10 h-5 ${toggleBgCls} rounded-full peer peer-checked:bg-[#C8A951] transition-colors`}
                />
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
              </div>
            </label>
          </div>

          {/* Stations — Modal Picker */}
          <div>
            <label className={`block ${labelCls}`}>{t.nearStation}</label>
            <button
              type="button"
              onClick={() => setShowStationModal(true)}
              className={`w-full inline-flex items-center justify-between gap-2 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all ${inputBgCls}`}
            >
              <span className="inline-flex items-center gap-2">
                <Train className="w-4 h-4 text-[#C8A951]" />
                {filters.stations.length > 0 ? (
                  <span className="font-semibold text-[#C8A951]">
                    {filters.stations.length}{" "}
                    {locale === "th" ? "สถานี" : "stations"}
                  </span>
                ) : (
                  <span className={isDark ? "text-stone-300" : "text-stone-700"}>
                    {locale === "th"
                      ? "เลือกสถานี"
                      : "Select stations"}
                  </span>
                )}
              </span>
              <ChevronDown className="w-4 h-4 text-stone-400" />
            </button>

            {/* Selected chips */}
            {filters.stations.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {filters.stations.map((code) => (
                  <span
                    key={code}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#C8A951]/10 border border-[#C8A951]/30 text-[#8B6F2F] text-[11px] font-medium rounded-full"
                  >
                    {code}
                    <button
                      onClick={() =>
                        updateFilter(
                          "stations",
                          filters.stations.filter((c) => c !== code)
                        )
                      }
                      className="hover:text-rose-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Amenities — pill buttons */}
          {amenities.length > 0 && (
            <div>
              <label className={`block ${labelCls}`}>{t.amenities}</label>
              <div className="flex flex-wrap gap-1.5">
                {amenities.map((amenity) => {
                  const active = filters.amenityIds.includes(amenity.id);
                  return (
                    <button
                      key={amenity.id}
                      onClick={() => toggleAmenity(amenity.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        active ? pillActiveCls : pillInactiveCls
                      }`}
                    >
                      {locale !== "th" ? amenity.nameEn : amenity.nameTh}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Result Count + Reset */}
      <div className={`flex items-center justify-between pt-5 border-t ${dividerCls}`}>
        {propertyCount !== undefined && (
          <span className={`text-xs ${countCls}`}>
            <span className={`font-bold ${countNumCls}`}>
              {propertyCount.toLocaleString()}
            </span>{" "}
            {locale === "th" ? "รายการ" : "found"}
          </span>
        )}
        {hasFilters && (
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-1 text-xs font-medium text-rose-400 hover:text-rose-500 transition-colors"
          >
            <X className="w-3 h-3" />
            {locale === "th" ? "ล้างตัวกรอง" : "Reset"}
          </button>
        )}
      </div>
    </div>

    {/* Station Picker Modal */}
    {showStationModal && (
      <StationMapSelector
        selectedStations={filters.stations}
        onChange={(codes) => updateFilter("stations", codes)}
        onClose={() => setShowStationModal(false)}
      />
    )}
    </>
  );
}
