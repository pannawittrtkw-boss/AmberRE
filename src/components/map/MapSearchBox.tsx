"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Loader2, X, MapPin } from "lucide-react";
import type { Map as LeafletMap } from "leaflet";

interface GeoResult {
  lat: number;
  lng: number;
  displayName: string;
  bbox?: number[];
  type?: string;
}

interface MapSearchBoxProps {
  map: LeafletMap | null;
  locale: string;
}

export default function MapSearchBox({ map, locale }: MapSearchBoxProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside the box
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!data.success) {
        setError(
          data.error === "No results"
            ? locale === "th"
              ? "ไม่พบพื้นที่นี้"
              : "No results found"
            : locale === "th"
            ? "ค้นหาไม่สำเร็จ"
            : "Search failed"
        );
        setResults([]);
        setOpen(true);
        return;
      }
      setResults(data.data || []);
      // Auto-fly to first result
      if (data.data?.[0] && map) {
        flyTo(data.data[0]);
      }
      setOpen(true);
    } catch {
      setError(locale === "th" ? "ค้นหาไม่สำเร็จ" : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const flyTo = (r: GeoResult) => {
    if (!map) return;
    if (r.bbox && r.bbox.length === 4) {
      // bbox is [south, north, west, east] from Nominatim
      const [s, n, w, e] = r.bbox;
      map.flyToBounds(
        [
          [s, w],
          [n, e],
        ],
        { padding: [40, 40], duration: 1.0 }
      );
    } else {
      map.flyTo([r.lat, r.lng], 15, { duration: 1.0 });
    }
    setOpen(false);
  };

  const clear = () => {
    setQuery("");
    setResults([]);
    setError(null);
    setOpen(false);
  };

  return (
    <div
      ref={wrapRef}
      className="absolute top-3 left-1/2 -translate-x-1/2 z-[400] w-[92%] max-w-[420px]"
    >
      <form
        onSubmit={handleSubmit}
        className="flex items-center bg-white rounded-full shadow-lg border border-stone-200 overflow-hidden"
      >
        <Search className="w-4 h-4 ml-3 text-stone-400 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={
            locale === "th"
              ? "ค้นหาพื้นที่ เช่น บางนา, สุขุมวิท, อโศก..."
              : "Search area, e.g. Bangna, Sukhumvit..."
          }
          className="flex-1 px-3 py-2.5 text-sm bg-transparent outline-none"
        />
        {query && !loading && (
          <button
            type="button"
            onClick={clear}
            className="p-2 text-stone-400 hover:text-stone-600"
            aria-label="Clear"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-4 py-2.5 bg-[#C8A951] text-white text-sm font-medium hover:bg-[#B8993F] disabled:opacity-60 transition-colors"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : locale === "th" ? (
            "ค้นหา"
          ) : (
            "Go"
          )}
        </button>
      </form>

      {open && (results.length > 0 || error) && (
        <div className="mt-1 bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden max-h-72 overflow-y-auto">
          {error && (
            <div className="px-4 py-3 text-sm text-rose-600">{error}</div>
          )}
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => flyTo(r)}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-amber-50 flex items-start gap-2 border-b border-stone-100 last:border-b-0"
            >
              <MapPin className="w-4 h-4 text-[#C8A951] shrink-0 mt-0.5" />
              <span className="line-clamp-2">{r.displayName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
