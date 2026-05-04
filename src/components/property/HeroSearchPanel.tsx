"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Search, ChevronLeft, ChevronRight, Train } from "lucide-react";
import { localeText } from "@/lib/utils";

const StationMapSelector = dynamic(
  () => import("@/components/admin/StationMapSelector"),
  { ssr: false }
);

interface HeroSearchPanelProps {
  locale: string;
  messages: any;
}

interface Amenity {
  id: number;
  nameTh: string;
  nameEn: string;
  icon: string | null;
}

interface Station {
  id: number;
  nameTh: string;
  nameEn: string;
  line: string;
}

const amenityIcons: Record<string, string> = {
  "Pet-Friendly": "🐾",
  "Convenience Store": "🏪",
  "Co-working Space": "💻",
  "EV Charger": "⚡",
  "Garden": "🌿",
  "Swimming Pool": "🏊",
  "Parking": "🅿️",
  "Sauna": "🧖",
  "Playground": "🎠",
  "Gym": "🏋️",
  "Security": "🔒",
  "CCTV": "📹",
  "Laundry": "👕",
  "Elevator": "🛗",
  "WiFi": "📶",
};

export default function HeroSearchPanel({ locale, messages }: HeroSearchPanelProps) {
  const router = useRouter();
  const t = messages.home;
  const tp = messages.property;
  const tc = messages.common;

  const [listingType, setListingType] = useState<"all" | "rent" | "sale">("all");
  const [hideSold, setHideSold] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [duration, setDuration] = useState("");
  const [stationId, setStationId] = useState("");
  const [selectedStationCodes, setSelectedStationCodes] = useState<string[]>([]);
  const [showStationModal, setShowStationModal] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<number[]>([]);

  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const amenitiesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/amenities")
      .then((r) => r.json())
      .then((d) => { if (d.success) setAmenities(d.data); })
      .catch(() => {});
    fetch("/api/stations")
      .then((r) => r.json())
      .then((d) => { if (d.success) setStations(d.data); })
      .catch(() => {});
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (listingType !== "all") params.set("listingType", listingType === "rent" ? "RENT" : "SALE");
    if (hideSold) params.set("hideSold", "true");
    if (propertyType) params.set("propertyType", propertyType);
    if (bedrooms) params.set("bedrooms", bedrooms);
    if (stationId) params.set("station", stationId);
    if (selectedStationCodes.length > 0)
      params.set("stations", selectedStationCodes.join(","));
    if (selectedAmenities.length > 0) params.set("amenities", selectedAmenities.join(","));
    if (priceRange) {
      const [min, max] = priceRange.split("-");
      if (min) params.set("minPrice", min);
      if (max) params.set("maxPrice", max);
    }
    // Stay on home page — update URL params; FeaturedPropertiesGrid will react to them
    const qs = params.toString();
    router.push(qs ? `/${locale}?${qs}` : `/${locale}`, { scroll: false });

    // Smooth scroll to results
    setTimeout(() => {
      const target = document.getElementById("featured-results");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const scrollAmenities = (dir: "left" | "right") => {
    if (amenitiesRef.current) {
      amenitiesRef.current.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
    }
  };

  const toggleAmenity = (id: number) => {
    setSelectedAmenities((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const tabs = [
    { key: "all" as const, label: t.rentAndSale },
    { key: "rent" as const, label: t.forRent },
    { key: "sale" as const, label: t.forSale },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-0">
      <div className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden">
        {/* Tabs + Hide Sold */}
        <div className="flex items-center justify-between border-b border-gray-200 px-3 sm:px-4">
          <div className="flex overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setListingType(tab.key)}
                className={`shrink-0 px-3 sm:px-5 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                  listingType === tab.key
                    ? "border-[#C8A951] text-[#C8A951]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <label className="hidden sm:flex items-center gap-2 text-sm text-gray-600 cursor-pointer shrink-0">
            <span>{t.hideSoldOut}</span>
            <div
              onClick={() => setHideSold(!hideSold)}
              className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
                hideSold ? "bg-[#C8A951]" : "bg-gray-300"
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  hideSold ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </div>
          </label>
        </div>

        {/* Mobile Hide Sold toggle */}
        <div className="flex sm:hidden items-center justify-between px-3 pt-3">
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
            <span>{t.hideSoldOut}</span>
            <div
              onClick={() => setHideSold(!hideSold)}
              className={`relative w-9 h-[18px] rounded-full transition-colors cursor-pointer ${
                hideSold ? "bg-[#C8A951]" : "bg-gray-300"
              }`}
            >
              <div
                className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-transform ${
                  hideSold ? "translate-x-[18px]" : "translate-x-0.5"
                }`}
              />
            </div>
          </label>
        </div>

        {/* Search Bar */}
        <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-gray-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder={t.searchPlaceholder}
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C8A951]/50 focus:border-[#C8A951]"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 sm:px-8 py-2.5 sm:py-3 bg-gray-900 text-white text-sm sm:text-base font-medium rounded-lg sm:rounded-xl hover:bg-gray-800 transition-colors shrink-0"
            >
              {tc.search}
            </button>
          </div>
        </div>

        {/* Filter Row */}
        <div className="px-3 sm:px-4 pb-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <div className="flex gap-2 min-w-max sm:min-w-0 sm:flex-wrap">
            {/* Property Type */}
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="px-2 sm:px-3 py-2 rounded-lg border border-gray-200 text-xs sm:text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#C8A951]"
            >
              <option value="">{tp.condo} / {tp.house} / {tp.townhouse} / {tp.land || "Land"}</option>
              <option value="CONDO">{tp.condo}</option>
              <option value="HOUSE">{tp.house}</option>
              <option value="TOWNHOUSE">{tp.townhouse}</option>
              <option value="LAND">{tp.land || "Land"}</option>
            </select>

            {/* Price Range */}
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="px-2 sm:px-3 py-2 rounded-lg border border-gray-200 text-xs sm:text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#C8A951]"
            >
              <option value="">{t.anyPrice}</option>
              <option value="0-1000000">0 - 1M</option>
              <option value="1000000-3000000">1M - 3M</option>
              <option value="3000000-5000000">3M - 5M</option>
              <option value="5000000-10000000">5M - 10M</option>
              <option value="10000000-">10M+</option>
            </select>

            {/* Bedrooms */}
            <select
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              className="px-2 sm:px-3 py-2 rounded-lg border border-gray-200 text-xs sm:text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#C8A951]"
            >
              <option value="">{t.anyBedrooms}</option>
              <option value="1">1 {tp.bedrooms}</option>
              <option value="2">2 {tp.bedrooms}</option>
              <option value="3">3 {tp.bedrooms}</option>
              <option value="4">4+ {tp.bedrooms}</option>
            </select>

            {/* Duration */}
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="px-2 sm:px-3 py-2 rounded-lg border border-gray-200 text-xs sm:text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#C8A951]"
            >
              <option value="">{t.anyDuration}</option>
              <option value="monthly">{locale === "th" ? "รายเดือน" : "Monthly"}</option>
              <option value="yearly">{locale === "th" ? "รายปี" : "Yearly"}</option>
            </select>

            {/* Stations Picker (modal trigger) */}
            <button
              type="button"
              onClick={() => setShowStationModal(true)}
              className="px-2 sm:px-3 py-2 rounded-lg border border-gray-200 text-xs sm:text-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#C8A951] inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Train className="w-3.5 h-3.5 text-[#C8A951]" />
              {selectedStationCodes.length > 0 ? (
                <span className="text-[#C8A951] font-semibold">
                  {selectedStationCodes.length}{" "}
                  {locale === "th" ? "สถานี" : "stations"}
                </span>
              ) : (
                <span className="text-gray-700">{t.selectStations}</span>
              )}
            </button>
          </div>
        </div>

        {/* Selected Stations chips */}
        {selectedStationCodes.length > 0 && (
          <div className="px-3 sm:px-4 pb-2 flex flex-wrap gap-1.5">
            {selectedStationCodes.map((code) => (
              <span
                key={code}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#C8A951]/10 border border-[#C8A951]/30 text-[#8B6F2F] text-[10px] sm:text-xs font-medium rounded-full"
              >
                {code}
                <button
                  onClick={() =>
                    setSelectedStationCodes((prev) =>
                      prev.filter((c) => c !== code)
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

        {/* Amenities Row */}
        {amenities.length > 0 && (
          <div className="px-3 sm:px-4 pb-3 sm:pb-4 relative">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => scrollAmenities("left")}
                className="hidden sm:flex shrink-0 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 items-center justify-center"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <div
                ref={amenitiesRef}
                className="flex gap-1.5 sm:gap-2 overflow-x-auto"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {amenities.map((amenity) => {
                  const isSelected = selectedAmenities.includes(amenity.id);
                  const icon = amenityIcons[amenity.nameEn] || "✨";
                  return (
                    <button
                      key={amenity.id}
                      onClick={() => toggleAmenity(amenity.id)}
                      className={`shrink-0 flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium border transition-colors ${
                        isSelected
                          ? "bg-[#C8A951]/10 border-[#C8A951] text-[#C8A951]"
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <span>{icon}</span>
                      <span>{localeText(locale, amenity.nameTh, amenity.nameEn)}</span>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => scrollAmenities("right")}
                className="hidden sm:flex shrink-0 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 items-center justify-center"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Station Modal */}
      {showStationModal && (
        <StationMapSelector
          selectedStations={selectedStationCodes}
          onChange={(codes) => setSelectedStationCodes(codes)}
          onClose={() => setShowStationModal(false)}
        />
      )}
    </div>
  );
}
