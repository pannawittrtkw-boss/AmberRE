"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import PropertyCard from "@/components/property/PropertyCard";
import PropertyFilter from "@/components/property/PropertyFilter";
import { Loader2, Home, ChevronLeft, ChevronRight } from "lucide-react";

export default function PropertiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const searchParams = useSearchParams();
  const [locale, setLocale] = useState("th");
  const [messages, setMessages] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [amenities, setAmenities] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [heroImage, setHeroImage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/site-settings?keys=propertiesHeroImage")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setHeroImage(d.data.propertiesHeroImage || null);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    params.then(({ locale: l }) => {
      setLocale(l);
      import(`@/messages/${l}.json`).then((m) => setMessages(m.default));
    });
  }, [params]);

  const fetchProperties = useCallback(
    async (filterParams: any = {}, pageNum = 1) => {
      setLoading(true);
      const query = new URLSearchParams();
      query.set("page", String(pageNum));
      query.set("limit", "12");

      Object.entries(filterParams).forEach(([key, value]) => {
        if (value && value !== "" && value !== false) {
          if (Array.isArray(value) && value.length > 0) {
            query.set(key, value.join(","));
          } else if (!Array.isArray(value)) {
            query.set(key, String(value));
          }
        }
      });

      const urlKeyword = searchParams.get("keyword");
      const urlType = searchParams.get("propertyType");
      const urlListing = searchParams.get("listingType");
      const urlStations = searchParams.get("stations");
      if (urlKeyword && !filterParams.keyword)
        query.set("keyword", urlKeyword);
      if (urlType && !filterParams.propertyType)
        query.set("propertyType", urlType);
      if (urlListing && !filterParams.listingType)
        query.set("listingType", urlListing);
      if (urlStations) query.set("stations", urlStations);

      try {
        const res = await fetch(`/api/properties?${query.toString()}`);
        const data = await res.json();
        if (data.success) {
          setProperties(data.data);
          setTotal(data.total);
          setTotalPages(data.totalPages);
          setPage(pageNum);
        }
      } catch (error) {
        console.error("Failed to fetch properties:", error);
      }
      setLoading(false);
    },
    [searchParams]
  );

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

  const handleFilter = (newFilters: any) => {
    setFilters(newFilters);
    fetchProperties(newFilters, 1);
  };

  if (!messages)
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-[#C8A951]" />
      </div>
    );

  return (
    <div className="bg-stone-50 min-h-screen">
      {/* HERO — Luxe Black with Gold accents */}
      <section className="relative bg-stone-950 text-white py-12 md:py-14 overflow-hidden">
        {/* Background image (if set) */}
        {heroImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
        )}

        {/* Subtle radial gold glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(200,169,81,0.18),transparent_60%)]" />

        {/* Top fade gradient */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C8A951]/60 to-transparent" />

        {/* Corner gold blurs */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#C8A951]/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-[#C8A951]/10 rounded-full blur-3xl" />

        {/* Decorative dotted grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #C8A951 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge with gold lines */}
          <div className="inline-flex items-center gap-3 text-[#E8C97A] text-[11px] uppercase tracking-[0.3em] font-medium mb-3">
            <span className="w-10 h-px bg-gradient-to-r from-transparent to-[#C8A951]" />
            {locale === "th" ? "อสังหาริมทรัพย์" : "Listings"}
            <span className="w-10 h-px bg-gradient-to-l from-transparent to-[#C8A951]" />
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05] mb-3 tracking-tight">
            {locale === "th" ? (
              <>
                คัดสรร
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E8C97A] via-[#C8A951] to-[#8B6F2F]">
                  {" "}
                  ที่อยู่อาศัย{" "}
                </span>
                คุณภาพ
              </>
            ) : (
              <>
                Discover Premium
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E8C97A] via-[#C8A951] to-[#8B6F2F]">
                  {" "}
                  Properties
                </span>
              </>
            )}
          </h1>

          {/* Gold accent line */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="w-12 h-px bg-[#C8A951]/40" />
            <span className="w-1.5 h-1.5 rotate-45 bg-[#C8A951]" />
            <span className="w-12 h-px bg-[#C8A951]/40" />
          </div>

          {/* Subtitle */}
          <p className="text-base md:text-lg text-stone-400 max-w-2xl mx-auto leading-relaxed font-light">
            {locale === "th"
              ? `ค้นพบ ${total.toLocaleString()} ห้องคุณภาพ พร้อมข้อมูลครบถ้วนเพื่อการตัดสินใจที่ดีที่สุด`
              : `Browse ${total.toLocaleString()} curated listings — complete details, sharp insights, smart decisions.`}
          </p>

          {/* Stats strip */}
          <div className="flex items-center justify-center divide-x divide-stone-800 mt-6">
            <div className="px-6">
              <div className="text-xl md:text-2xl font-bold text-[#E8C97A] leading-none">
                {total.toLocaleString()}
              </div>
              <div className="text-[10px] text-stone-500 uppercase tracking-widest mt-1.5">
                {locale === "th" ? "รายการทั้งหมด" : "Total Listings"}
              </div>
            </div>
            <div className="px-6">
              <div className="text-xl md:text-2xl font-bold text-[#E8C97A] leading-none">
                4.9
              </div>
              <div className="text-[10px] text-stone-500 uppercase tracking-widest mt-1.5">
                {locale === "th" ? "คะแนนรีวิว" : "Avg Rating"}
              </div>
            </div>
            <div className="px-6">
              <div className="text-xl md:text-2xl font-bold text-[#E8C97A] leading-none">
                24/7
              </div>
              <div className="text-[10px] text-stone-500 uppercase tracking-widest mt-1.5">
                {locale === "th" ? "บริการ" : "Support"}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade gradient */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#C8A951]/60 to-transparent" />
      </section>

      {/* MAIN */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filter Sidebar */}
          <aside className="w-full lg:w-80 flex-shrink-0 lg:sticky lg:top-24 self-start">
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
              <PropertyFilter
                locale={locale}
                messages={messages}
                onFilter={handleFilter}
                amenities={amenities}
                stations={stations}
                propertyCount={total}
              />
            </div>
          </aside>

          {/* Grid */}
          <div className="flex-1 min-w-0">
            {/* Result header */}
            {!loading && properties.length > 0 && (
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm text-stone-600">
                  <span className="font-bold text-stone-900">
                    {total.toLocaleString()}
                  </span>{" "}
                  {locale === "th" ? "รายการ" : "results"}
                </p>
                <p className="text-xs text-stone-400">
                  {locale === "th" ? "หน้า" : "Page"} {page} / {totalPages}
                </p>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-[#C8A951]" />
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-3xl">
                <Home className="w-12 h-12 mx-auto text-stone-300 mb-3" />
                <p className="text-stone-500 font-medium">
                  {messages.common.noResults}
                </p>
                <p className="text-stone-400 text-sm mt-1">
                  {locale === "th"
                    ? "ลองปรับตัวกรองอื่น"
                    : "Try adjusting your filters"}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {properties.map((property: any) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      locale={locale}
                      messages={messages}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-1 mt-12">
                    <button
                      onClick={() => fetchProperties(filters, Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="w-10 h-10 rounded-full bg-white border border-stone-200 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-stone-600"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {pageRange(page, totalPages).map((p, i) =>
                      p === "…" ? (
                        <span
                          key={`dots-${i}`}
                          className="w-10 h-10 flex items-center justify-center text-stone-400"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => fetchProperties(filters, p as number)}
                          className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                            p === page
                              ? "bg-stone-900 text-white shadow"
                              : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}
                    <button
                      onClick={() =>
                        fetchProperties(filters, Math.min(totalPages, page + 1))
                      }
                      disabled={page === totalPages}
                      className="w-10 h-10 rounded-full bg-white border border-stone-200 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-stone-600"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Compact pagination range, e.g. [1, '…', 4, 5, 6, '…', 10] */
function pageRange(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3)
    return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
}
