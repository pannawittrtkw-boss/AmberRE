"use client";

import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2, LayoutGrid, Map as MapIcon, X } from "lucide-react";
import FeaturedPropertyCard from "./FeaturedPropertyCard";

const PropertyMapView = lazy(() => import("./PropertyMapView"));

interface FeaturedPropertiesGridProps {
  locale: string;
  messages: any;
}

const FILTER_KEYS = [
  "keyword",
  "listingType",
  "propertyType",
  "condition",
  "buildingType",
  "hideSold",
  "stations",
  "amenities",
  "bedrooms",
  "minPrice",
  "maxPrice",
];

export default function FeaturedPropertiesGrid({ locale, messages }: FeaturedPropertiesGridProps) {
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const limit = 16;

  // Detect if any URL filter is set → home is in "search results" mode
  const activeFilterEntries = FILTER_KEYS.flatMap((k) => {
    const v = searchParams.get(k);
    return v ? [[k, v] as [string, string]] : [];
  });
  const isFiltering = activeFilterEntries.length > 0;
  const filterSignature = activeFilterEntries.map(([k, v]) => `${k}=${v}`).join("&");

  const fetchProperties = useCallback(
    async (pageNum: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", pageNum.toString());
        params.set("limit", limit.toString());

        // If filtering, drop the default "ADDED_PROPERTIES" status to widen results
        if (!isFiltering) {
          params.set("status", "ADDED_PROPERTIES");
        }

        for (const [k, v] of activeFilterEntries) {
          params.set(k, v);
        }

        const res = await fetch(`/api/properties?${params}`);
        const data = await res.json();
        if (data.success) {
          setProperties(data.data);
          setTotalPages(data.totalPages);
          setTotal(data.total);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filterSignature, isFiltering]
  );

  useEffect(() => {
    fetchProperties(page);
  }, [page, fetchProperties]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterSignature]);

  const goToPage = (p: number) => {
    if (p >= 1 && p <= totalPages) {
      setPage(p);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const pageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  if (loading && properties.length === 0) {
    return (
      <div id="featured-results" className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (properties.length === 0) {
    if (isFiltering) {
      return (
        <div id="featured-results" className="text-center py-16 bg-white rounded-2xl">
          <p className="text-stone-500 text-sm">
            {locale === "th"
              ? "ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา"
              : "No properties match your search"}
          </p>
          <a
            href={`/${locale}`}
            className="inline-flex items-center gap-1 mt-3 text-sm text-[#C8A951] hover:underline"
          >
            <X className="w-3.5 h-3.5" />
            {locale === "th" ? "ล้างตัวกรอง" : "Clear filters"}
          </a>
        </div>
      );
    }
    return null;
  }

  return (
    <div id="featured-results">
      {/* Filter results header */}
      {isFiltering && (
        <div className="flex items-center justify-between flex-wrap gap-3 bg-stone-100 rounded-2xl px-5 py-3 mb-5">
          <div className="text-sm text-stone-700">
            <span className="font-bold text-stone-900">
              {total.toLocaleString()}
            </span>{" "}
            {locale === "th" ? "ผลลัพธ์การค้นหา" : "results found"}
          </div>
          <a
            href={`/${locale}`}
            className="inline-flex items-center gap-1 text-sm text-rose-500 hover:text-rose-600 font-medium"
          >
            <X className="w-3.5 h-3.5" />
            {locale === "th" ? "ล้างตัวกรอง" : "Clear filters"}
          </a>
        </div>
      )}

      {/* View Toggle */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === "list"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            {locale === "th" ? "รายการ" : "List"}
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === "map"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <MapIcon className="w-4 h-4" />
            {locale === "th" ? "แผนที่" : "Map"}
          </button>
        </div>
      </div>

      {viewMode === "list" ? (
        <>
          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {properties.map((property: any) => (
              <FeaturedPropertyCard
                key={property.id}
                property={property}
                locale={locale}
                messages={messages}
              />
            ))}
          </div>

          {/* Loading overlay */}
          {loading && properties.length > 0 && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-1 mt-10">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {pageNumbers().map((p) => (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium flex items-center justify-center transition-colors ${
                    p === page
                      ? "bg-[#C8A951] text-white"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page === totalPages}
                className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      ) : (
        /* Map View */
        <Suspense
          fallback={
            <div className="h-[500px] bg-gray-100 rounded-xl flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          }
        >
          <PropertyMapView properties={properties} locale={locale} />
        </Suspense>
      )}
    </div>
  );
}
