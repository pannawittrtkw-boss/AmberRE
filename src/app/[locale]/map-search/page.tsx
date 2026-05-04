"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import PropertyFilter from "@/components/property/PropertyFilter";
import { Loader2, Map as MapIcon } from "lucide-react";

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

  useEffect(() => {
    params.then(({ locale: l }) => {
      setLocale(l);
      import(`@/messages/${l}.json`).then((m) => setMessages(m.default));
    });
  }, [params]);

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

  return (
    <div className="bg-stone-50 flex flex-col lg:flex-row h-[calc(100vh-64px)]">
      {/* Sidebar Filter — Luxe Black & Gold */}
      <aside className="w-full lg:w-80 flex-shrink-0 overflow-y-auto bg-stone-950 text-white relative">
        {/* Decorative gold blur */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#C8A951]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top fade */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C8A951]/60 to-transparent" />

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
        <div className="relative">
          <PropertyFilter
            locale={locale}
            messages={messages}
            onFilter={(f) => fetchProperties(f)}
            amenities={amenities}
            stations={stations}
            propertyCount={total}
            theme="dark"
          />
        </div>
      </aside>

      {/* Map */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
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
      </div>
    </div>
  );
}
