"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import PropertyFilter from "@/components/property/PropertyFilter";
import { Loader2, Map as MapIcon, SlidersHorizontal, X } from "lucide-react";

const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
});

export default function MapSearchPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState("th");
  const [messages, setMessages] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [amenities, setAmenities] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    params.then(({ locale: l }) => {
      setLocale(l);
      import(`@/messages/${l}.json`).then((m) => setMessages(m.default));
    });
  }, [params]);

  // Lock body scroll while the mobile filter sheet is open
  useEffect(() => {
    if (filterOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [filterOpen]);

  const fetchProperties = useCallback(async (filterParams: any = {}) => {
    setLoading(true);
    const query = new URLSearchParams();
    query.set("limit", "200");

    Object.entries(filterParams).forEach(([key, value]) => {
      if (value && value !== "" && value !== false) {
        if (Array.isArray(value) && value.length > 0) {
          query.set(key, value.join(","));
        } else if (!Array.isArray(value)) {
          query.set(key, String(value));
        }
      }
    });

    try {
      const res = await fetch(`/api/properties?${query.toString()}`);
      const data = await res.json();
      if (data.success) {
        setProperties(data.data);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Failed to fetch:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProperties();
    fetch("/api/amenities")
      .then((r) => r.json())
      .then((d) => d.success && setAmenities(d.data))
      .catch(() => {});
    fetch("/api/stations")
      .then((r) => r.json())
      .then((d) => d.success && setStations(d.data))
      .catch(() => {});
  }, [fetchProperties]);

  if (!messages)
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-[#C8A951]" />
      </div>
    );

  const SidebarHeader = (
    <div className="relative p-5 border-b border-white/10">
      <div className="flex items-center gap-2 text-[#E8C97A] text-[10px] uppercase tracking-[0.3em] font-medium mb-2">
        <span className="w-6 h-px bg-gradient-to-r from-transparent to-[#C8A951]" />
        {locale === "th" ? "ค้นหาบนแผนที่" : "Map Search"}
      </div>
      <h1 className="text-2xl font-bold flex items-center gap-2 tracking-tight">
        <MapIcon className="w-6 h-6 text-[#E8C97A]" />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-[#E8C97A]">
          {messages.common.mapSearch}
        </span>
      </h1>
      <p className="text-xs text-stone-400 mt-2">
        <span className="text-[#E8C97A] font-bold">
          {total.toLocaleString()}
        </span>{" "}
        {locale === "th" ? "ทรัพย์บนแผนที่" : "listings on map"}
      </p>
    </div>
  );

  const FilterBody = (
    <PropertyFilter
      locale={locale}
      messages={messages}
      onFilter={(f) => {
        fetchProperties(f);
        setFilterOpen(false); // auto-close drawer on mobile after filter
      }}
      amenities={amenities}
      stations={stations}
      propertyCount={total}
      theme="dark"
    />
  );

  return (
    <div className="bg-stone-50 lg:flex h-[calc(100vh-64px)]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-80 flex-shrink-0 overflow-y-auto bg-stone-950 text-white relative">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#C8A951]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C8A951]/60 to-transparent" />
        {SidebarHeader}
        <div className="relative">{FilterBody}</div>
      </aside>

      {/* Map area — full screen on mobile, fills remaining on desktop */}
      <div className="relative flex-1 h-full w-full">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-[20] flex items-center justify-center">
            <div className="bg-white rounded-2xl px-6 py-4 shadow-lg flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-[#C8A951]" />
              <span className="text-sm font-medium text-stone-700">
                {locale === "th" ? "กำลังโหลด..." : "Loading..."}
              </span>
            </div>
          </div>
        )}

        <MapView
          properties={properties}
          locale={locale}
          className="w-full h-full"
        />

        {/* Mobile floating filter button */}
        <button
          onClick={() => setFilterOpen(true)}
          className="lg:hidden fixed bottom-5 right-5 z-[30] bg-stone-950 text-white rounded-full px-4 py-3 shadow-2xl flex items-center gap-2 border border-[#C8A951]/40 hover:bg-stone-900 transition-colors"
          aria-label={locale === "th" ? "เปิดตัวกรอง" : "Open filters"}
        >
          <SlidersHorizontal className="w-4 h-4 text-[#E8C97A]" />
          <span className="text-sm font-medium">
            {locale === "th" ? "ตัวกรอง" : "Filters"}
          </span>
          <span className="bg-[#C8A951] text-stone-900 text-[11px] font-bold rounded-full px-2 py-0.5 ml-1">
            {total.toLocaleString()}
          </span>
        </button>
      </div>

      {/* Mobile filter drawer */}
      {filterOpen && (
        <div className="lg:hidden fixed inset-0 z-[40] flex flex-col">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setFilterOpen(false)}
          />
          <div className="relative mt-auto bg-stone-950 text-white max-h-[85vh] flex flex-col rounded-t-2xl shadow-2xl">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#C8A951]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C8A951]/60 to-transparent" />

            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            <div className="flex items-center justify-between px-5 pt-1 pb-3 border-b border-white/10 shrink-0">
              <div>
                <div className="text-[#E8C97A] text-[10px] uppercase tracking-[0.3em] font-medium">
                  {locale === "th" ? "ค้นหาบนแผนที่" : "Map Search"}
                </div>
                <div className="text-base font-bold tracking-tight flex items-center gap-2">
                  <MapIcon className="w-4 h-4 text-[#E8C97A]" />
                  {messages.common.mapSearch}
                  <span className="text-xs text-stone-400 font-normal ml-2">
                    <span className="text-[#E8C97A] font-bold">{total.toLocaleString()}</span>{" "}
                    {locale === "th" ? "ทรัพย์" : "listings"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setFilterOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 relative">{FilterBody}</div>
          </div>
        </div>
      )}
    </div>
  );
}
