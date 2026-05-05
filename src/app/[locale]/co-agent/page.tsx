"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Users,
  Handshake,
  TrendingUp,
  Shield,
  Loader2,
  CheckCircle,
  Clock,
  Train,
  Image as ImageIcon,
  ArrowRight,
  XCircle,
  Search,
  SlidersHorizontal,
} from "lucide-react";

function parseJson(val: string | null | undefined): string[] {
  if (!val) return [];
  try {
    const p = JSON.parse(val);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

export default function CoAgentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { data: session } = useSession();
  const [locale, setLocale] = useState("th");
  const [messages, setMessages] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [application, setApplication] = useState<any>(null);
  const [form, setForm] = useState({
    companyName: "",
    licenseNumber: "",
    experienceYears: "",
  });
  const [properties, setProperties] = useState<any[]>([]);
  const [loadingProps, setLoadingProps] = useState(true);
  const [heroImage, setHeroImage] = useState<string | null>(null);

  // Filter state for the listings table
  const [filterKeyword, setFilterKeyword] = useState("");
  const [filterListing, setFilterListing] = useState(""); // "" | RENT | SALE
  const [filterPropertyType, setFilterPropertyType] = useState(""); // "" | CONDO | HOUSE | TOWNHOUSE | LAND
  const [filterBedrooms, setFilterBedrooms] = useState<string>(""); // "" | 0 | 1 | 2 | 3
  const [filterPriceMin, setFilterPriceMin] = useState("");
  const [filterPriceMax, setFilterPriceMax] = useState("");
  const [filterSort, setFilterSort] = useState("newest"); // newest | price_asc | price_desc | size_desc

  useEffect(() => {
    fetch("/api/site-settings?keys=coAgentHeroImage")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setHeroImage(d.data.coAgentHeroImage || null);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    params.then(({ locale: l }) => {
      setLocale(l);
      import(`@/messages/${l}.json`).then((m) => setMessages(m.default));
    });
  }, [params]);

  useEffect(() => {
    if (session) {
      fetch("/api/co-agent")
        .then((r) => r.json())
        .then((d) => d.data && setApplication(d.data))
        .catch(() => {});
    }
  }, [session]);

  useEffect(() => {
    setLoadingProps(true);
    fetch("/api/properties?status=ADDED_PROPERTIES&limit=100")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setProperties(
            d.data.filter(
              (p: any) => p.postFrom === "OWNER" || !p.postFrom
            )
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProps(false));
  }, []);

  const filteredProperties = useMemo(() => {
    const kw = filterKeyword.trim().toLowerCase();
    const min = filterPriceMin ? Number(filterPriceMin) : null;
    const max = filterPriceMax ? Number(filterPriceMax) : null;
    const beds = filterBedrooms === "" ? null : Number(filterBedrooms);

    let list = properties.filter((p: any) => {
      if (kw) {
        const hay = [p.projectName, p.titleTh, p.titleEn, p.address]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      if (filterListing) {
        if (
          filterListing === "RENT" &&
          p.listingType !== "RENT" &&
          p.listingType !== "RENT_AND_SALE"
        )
          return false;
        if (
          filterListing === "SALE" &&
          p.listingType !== "SALE" &&
          p.listingType !== "RENT_AND_SALE"
        )
          return false;
      }
      if (filterPropertyType && p.propertyType !== filterPropertyType)
        return false;
      if (beds != null) {
        const b = Number(p.bedrooms) || 0;
        if (beds === 3 ? b < 3 : b !== beds) return false;
      }
      const price = Number(p.price) || 0;
      if (min != null && price < min) return false;
      if (max != null && price > max) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      if (filterSort === "price_asc")
        return (Number(a.price) || 0) - (Number(b.price) || 0);
      if (filterSort === "price_desc")
        return (Number(b.price) || 0) - (Number(a.price) || 0);
      if (filterSort === "size_desc")
        return (Number(b.sizeSqm) || 0) - (Number(a.sizeSqm) || 0);
      // newest: createdAt desc
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });

    return list;
  }, [
    properties,
    filterKeyword,
    filterListing,
    filterPropertyType,
    filterBedrooms,
    filterPriceMin,
    filterPriceMax,
    filterSort,
  ]);

  const resetFilters = () => {
    setFilterKeyword("");
    setFilterListing("");
    setFilterPropertyType("");
    setFilterBedrooms("");
    setFilterPriceMin("");
    setFilterPriceMax("");
    setFilterSort("newest");
  };

  const hasActiveFilters =
    filterKeyword ||
    filterListing ||
    filterPropertyType ||
    filterBedrooms ||
    filterPriceMin ||
    filterPriceMax ||
    filterSort !== "newest";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/co-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          experienceYears: form.experienceYears
            ? parseInt(form.experienceYears)
            : null,
        }),
      });
      const data = await res.json();
      if (data.success) setApplication(data.data);
    } catch {}
    setLoading(false);
  };

  if (!messages)
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-[#C8A951]" />
      </div>
    );

  const benefits = [
    {
      icon: TrendingUp,
      title: locale === "th" ? "เพิ่มรายได้" : "Increase Income",
      desc:
        locale === "th"
          ? "รับค่าคอมมิชชั่นจากการขายทรัพย์สินในระบบ"
          : "Earn commission from properties in our system",
    },
    {
      icon: Users,
      title: locale === "th" ? "เข้าถึงลูกค้า" : "Access Clients",
      desc:
        locale === "th"
          ? "เข้าถึงฐานลูกค้าและทรัพย์สินจำนวนมาก"
          : "Access a large client and property database",
    },
    {
      icon: Shield,
      title: locale === "th" ? "ระบบรองรับ" : "Full Support",
      desc:
        locale === "th"
          ? "ระบบรองรับการทำงานร่วมกันอย่างเต็มรูปแบบ"
          : "Full system support for collaboration",
    },
  ];

  return (
    <div className="bg-stone-50 min-h-screen">
      {/* HERO */}
      <section className="relative bg-gradient-to-br from-stone-900 via-stone-800 to-[#5a4621] text-white py-20 md:py-28 overflow-hidden">
        {heroImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
        )}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C8A951]/20 rounded-full blur-3xl -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#C8A951]/10 rounded-full blur-3xl translate-y-20 -translate-x-20" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Handshake className="w-14 h-14 mx-auto text-[#E8C97A] mb-5" />
          <div className="flex items-center gap-2 text-[#E8C97A] text-xs uppercase tracking-widest font-medium mb-3 justify-center">
            <span className="w-6 h-px bg-[#E8C97A]" />
            {locale === "th" ? "ตัวแทนร่วม" : "Join the Team"}
            <span className="w-6 h-px bg-[#E8C97A]" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
            {messages.common.coAgent}
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            {locale === "th"
              ? "ร่วมเป็นตัวแทนกับ NPB Property เพื่อขยายโอกาสทางธุรกิจของคุณ"
              : "Join NPB Property as a Co-Agent to expand your business opportunities"}
          </p>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {benefits.map((item, i) => (
            <div
              key={i}
              className="group relative bg-white rounded-3xl p-8 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#C8A951]/10 rounded-full blur-2xl group-hover:bg-[#C8A951]/20 transition-colors" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-5 group-hover:bg-[#C8A951] transition-colors">
                  <item.icon className="w-6 h-6 text-[#C8A951] group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-stone-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-stone-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CO-AGENT LISTINGS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-center gap-2 text-[#C8A951] text-xs uppercase tracking-widest font-medium mb-2">
          <span className="w-6 h-px bg-[#C8A951]" />
          {locale === "th" ? "รายการทรัพย์" : "Listings"}
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-stone-900 mb-2">
          {locale === "th"
            ? "รายการทรัพย์สำหรับ Co-Agent"
            : "Properties for Co-Agents"}
        </h2>
        <p className="text-stone-500 text-sm mb-8">
          {locale === "th"
            ? "ทรัพย์ที่เปิดให้ Co-Agent ร่วมขาย/ให้เช่า"
            : "Properties available for co-agent collaboration"}
        </p>

        {/* Filter bar */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 mb-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <SlidersHorizontal className="w-4 h-4 text-[#C8A951]" />
            <span className="text-sm font-semibold text-stone-700">
              {locale === "th" ? "ตัวกรอง" : "Filters"}
            </span>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="ml-auto text-xs text-[#C8A951] hover:underline flex items-center gap-1"
              >
                <XCircle className="w-3.5 h-3.5" />
                {locale === "th" ? "ล้างทั้งหมด" : "Reset"}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Keyword */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={filterKeyword}
                onChange={(e) => setFilterKeyword(e.target.value)}
                placeholder={
                  locale === "th"
                    ? "ค้นหาชื่อโครงการ ทำเล ที่อยู่..."
                    : "Search by project, address, area..."
                }
                className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A951]/30 focus:border-[#C8A951]"
              />
            </div>

            {/* Listing type */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-stone-100 rounded-lg">
              {(
                [
                  ["", locale === "th" ? "ทั้งหมด" : "All"],
                  ["RENT", locale === "th" ? "เช่า" : "Rent"],
                  ["SALE", locale === "th" ? "ขาย" : "Sale"],
                ] as [string, string][]
              ).map(([v, lbl]) => (
                <button
                  key={v}
                  onClick={() => setFilterListing(v)}
                  className={`py-1.5 rounded text-xs font-medium transition-colors ${
                    filterListing === v
                      ? "bg-white text-[#C8A951] shadow-sm"
                      : "text-stone-600 hover:bg-white/50"
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              value={filterSort}
              onChange={(e) => setFilterSort(e.target.value)}
              className="border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A951]/30"
            >
              <option value="newest">
                {locale === "th" ? "ล่าสุด" : "Newest"}
              </option>
              <option value="price_asc">
                {locale === "th" ? "ราคาต่ำ → สูง" : "Price: Low → High"}
              </option>
              <option value="price_desc">
                {locale === "th" ? "ราคาสูง → ต่ำ" : "Price: High → Low"}
              </option>
              <option value="size_desc">
                {locale === "th" ? "พื้นที่ใหญ่สุด" : "Largest area"}
              </option>
            </select>

            {/* Property type */}
            <select
              value={filterPropertyType}
              onChange={(e) => setFilterPropertyType(e.target.value)}
              className="border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A951]/30"
            >
              <option value="">
                {locale === "th" ? "ประเภททรัพย์ — ทั้งหมด" : "Property type — All"}
              </option>
              <option value="CONDO">{locale === "th" ? "คอนโด" : "Condo"}</option>
              <option value="HOUSE">{locale === "th" ? "บ้านเดี่ยว" : "House"}</option>
              <option value="TOWNHOUSE">
                {locale === "th" ? "ทาวน์เฮ้าส์" : "Townhouse"}
              </option>
              <option value="LAND">{locale === "th" ? "ที่ดิน" : "Land"}</option>
            </select>

            {/* Bedrooms */}
            <select
              value={filterBedrooms}
              onChange={(e) => setFilterBedrooms(e.target.value)}
              className="border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A951]/30"
            >
              <option value="">
                {locale === "th" ? "ห้องนอน — ทั้งหมด" : "Bedrooms — All"}
              </option>
              <option value="0">
                {locale === "th" ? "สตูดิโอ" : "Studio"}
              </option>
              <option value="1">
                1 {locale === "th" ? "ห้องนอน" : "Bed"}
              </option>
              <option value="2">
                2 {locale === "th" ? "ห้องนอน" : "Beds"}
              </option>
              <option value="3">
                3+ {locale === "th" ? "ห้องนอน" : "Beds"}
              </option>
            </select>

            {/* Price range */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={filterPriceMin}
                onChange={(e) => setFilterPriceMin(e.target.value)}
                placeholder={locale === "th" ? "ราคาต่ำสุด" : "Min price"}
                className="w-1/2 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A951]/30"
              />
              <span className="text-stone-400 text-xs">—</span>
              <input
                type="number"
                value={filterPriceMax}
                onChange={(e) => setFilterPriceMax(e.target.value)}
                placeholder={locale === "th" ? "ราคาสูงสุด" : "Max price"}
                className="w-1/2 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A951]/30"
              />
            </div>
          </div>

          {/* Result count */}
          <p className="text-xs text-stone-500 mt-3">
            {locale === "th" ? "พบ" : "Showing"}{" "}
            <span className="text-[#C8A951] font-semibold">
              {filteredProperties.length}
            </span>{" "}
            {locale === "th" ? "รายการ" : "of"}{" "}
            {locale !== "th" && (
              <span className="text-stone-700">{properties.length}</span>
            )}
            {locale === "th" && (
              <>
                {" "}จาก{" "}
                <span className="text-stone-700">{properties.length}</span> รายการ
              </>
            )}
          </p>
        </div>

        {loadingProps ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#C8A951]" />
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="bg-white rounded-3xl py-16 text-center">
            <ImageIcon className="w-12 h-12 mx-auto text-stone-300 mb-2" />
            <p className="text-stone-500 mb-3">
              {properties.length === 0
                ? locale === "th"
                  ? "ยังไม่มีรายการทรัพย์"
                  : "No properties available"
                : locale === "th"
                ? "ไม่พบทรัพย์ที่ตรงกับตัวกรอง"
                : "No properties match the filters"}
            </p>
            {hasActiveFilters && properties.length > 0 && (
              <button
                onClick={resetFilters}
                className="text-sm text-[#C8A951] hover:underline"
              >
                {locale === "th" ? "ล้างตัวกรอง" : "Reset filters"}
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-stone-50 text-xs text-stone-500 uppercase tracking-wider border-b border-stone-100">
                  <tr>
                    <th className="py-4 px-4 text-left font-medium">
                      {locale === "th" ? "รูป" : "Image"}
                    </th>
                    <th className="py-4 px-4 text-left font-medium">
                      {locale === "th" ? "ชื่อโครงการ" : "Project Name"}
                    </th>
                    <th className="py-4 px-4 text-left font-medium">
                      {locale === "th" ? "สถานีใกล้เคียง" : "Near BTS/MRT"}
                    </th>
                    <th className="py-4 px-4 text-center font-medium">
                      {locale === "th" ? "ขนาด" : "Area (m²)"}
                    </th>
                    <th className="py-4 px-4 text-center font-medium">
                      {locale === "th" ? "ชั้น" : "Floor"}
                    </th>
                    <th className="py-4 px-4 text-center font-medium">
                      {locale === "th" ? "ห้องนอน" : "Bed"}
                    </th>
                    <th className="py-4 px-4 text-right font-medium">
                      {locale === "th" ? "ราคา (บาท)" : "Price"}
                    </th>
                    <th className="py-4 px-4 text-left font-medium">
                      {locale === "th" ? "พร้อมเข้า" : "Ready"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProperties.map((p: any) => {
                    const primaryImage =
                      p.images?.find((img: any) => img.isPrimary) ||
                      p.images?.[0];
                    const imageUrl = primaryImage?.imageUrl;
                    const title = p.projectName || p.titleTh;
                    const stations = parseJson(p.nearbyStations);
                    const price = Number(p.price) || 0;
                    const sizeSqm = p.sizeSqm ? Number(p.sizeSqm) : null;
                    const availDate = p.availableDate
                      ? new Date(p.availableDate)
                      : null;

                    return (
                      <tr
                        key={p.id}
                        className="border-b border-stone-100 last:border-b-0 hover:bg-stone-50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          {imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={imageUrl}
                              alt={title}
                              className="w-20 h-14 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-20 h-14 bg-stone-100 rounded-lg flex items-center justify-center">
                              <ImageIcon className="w-5 h-5 text-stone-300" />
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Link
                            href={`/${locale}/properties/${p.id}`}
                            className="font-semibold text-stone-900 hover:text-[#C8A951] transition-colors"
                          >
                            {title}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-stone-600 text-xs">
                          {stations.length > 0 ? (
                            <div className="flex items-start gap-1">
                              <Train className="w-3 h-3 mt-0.5 text-[#C8A951] flex-shrink-0" />
                              <span>
                                {stations
                                  .map((code: string) => {
                                    const names: Record<string, string> = {};
                                    try {
                                      const {
                                        LINES,
                                      } = require("@/components/admin/StationMapSelector");
                                      for (const line of LINES) {
                                        for (const s of line.stations) {
                                          if (
                                            s.id === code ||
                                            s.code === code
                                          ) {
                                            const prefix =
                                              line.key === "sukhumvit" ||
                                              line.key === "silom" ||
                                              line.key === "gold"
                                                ? "BTS"
                                                : line.key === "arl"
                                                ? "ARL"
                                                : "MRT";
                                            return `${prefix} ${s.nameTh}`;
                                          }
                                        }
                                      }
                                    } catch {}
                                    return code;
                                  })
                                  .join(", ")}
                              </span>
                            </div>
                          ) : (
                            <span className="text-stone-300">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center text-stone-700">
                          {sizeSqm || "—"}
                        </td>
                        <td className="py-3 px-4 text-center text-stone-700">
                          {p.floor || "—"}
                        </td>
                        <td className="py-3 px-4 text-center text-stone-700">
                          {p.bedrooms || "—"}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-stone-900">
                          {price > 0 ? `฿${price.toLocaleString()}` : "—"}
                        </td>
                        <td className="py-3 px-4 text-stone-600 text-xs">
                          {availDate
                            ? availDate.toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* APPLICATION FORM */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Promo */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-[#5a4621] text-white rounded-3xl p-8 overflow-hidden relative h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#C8A951]/20 rounded-full blur-3xl -translate-y-12 translate-x-12" />
              <div className="relative">
                <Handshake className="w-8 h-8 text-[#E8C97A] mb-4" />
                <h3 className="font-bold text-2xl mb-3">
                  {locale === "th" ? "ร่วมงานกับเรา" : "Partner with us"}
                </h3>
                <p className="text-sm text-white/70 mb-6 leading-relaxed">
                  {locale === "th"
                    ? "เป็นส่วนหนึ่งของทีม NPB Property ในการให้บริการลูกค้าทั่วประเทศ"
                    : "Be part of the NPB Property team and serve clients across Thailand"}
                </p>
                <ul className="space-y-2 text-sm text-white/80">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[#E8C97A] mt-0.5 flex-shrink-0" />
                    {locale === "th"
                      ? "ค่าคอมมิชชั่นแข่งขันได้"
                      : "Competitive commission"}
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[#E8C97A] mt-0.5 flex-shrink-0" />
                    {locale === "th"
                      ? "เครื่องมือและระบบครบครัน"
                      : "Full set of tools & systems"}
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[#E8C97A] mt-0.5 flex-shrink-0" />
                    {locale === "th"
                      ? "ทีมสนับสนุนตลอด 7 วัน"
                      : "Support team available 7 days"}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="lg:col-span-3">
            {!session ? (
              <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
                <Users className="w-12 h-12 mx-auto text-stone-300 mb-3" />
                <p className="text-stone-600 mb-5">
                  {locale === "th"
                    ? "กรุณาเข้าสู่ระบบเพื่อสมัครเป็น Co-Agent"
                    : "Please login to apply as Co-Agent"}
                </p>
                <Link
                  href={`/${locale}/auth/login`}
                  className="inline-flex items-center gap-2 bg-[#C8A951] hover:bg-[#B8993F] text-white px-6 py-3 rounded-full font-medium text-sm transition-colors"
                >
                  {messages.common.login}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : application ? (
              <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
                {application.status === "APPROVED" ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-emerald-700 mb-2">
                      {locale === "th" ? "ได้รับอนุมัติแล้ว!" : "Approved!"}
                    </h2>
                    <p className="text-sm text-stone-500">
                      {locale === "th"
                        ? "ยินดีต้อนรับสู่ทีมงาน NPB Property"
                        : "Welcome to the NPB Property team"}
                    </p>
                  </>
                ) : application.status === "PENDING" ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-amber-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-amber-700 mb-2">
                      {locale === "th" ? "รอการอนุมัติ" : "Pending Approval"}
                    </h2>
                    <p className="text-sm text-stone-500">
                      {locale === "th"
                        ? "ทีมงานของเรากำลังพิจารณาใบสมัครของคุณ"
                        : "Our team is reviewing your application"}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
                      <XCircle className="w-8 h-8 text-rose-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-rose-700 mb-2">
                      {locale === "th" ? "ไม่ได้รับอนุมัติ" : "Rejected"}
                    </h2>
                  </>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-2 text-[#C8A951] text-xs uppercase tracking-widest font-medium mb-2">
                  <span className="w-6 h-px bg-[#C8A951]" />
                  {locale === "th" ? "สมัครงาน" : "Application"}
                </div>
                <h2 className="text-2xl font-bold text-stone-900 mb-6">
                  {locale === "th"
                    ? "สมัครเป็น Co-Agent"
                    : "Apply as Co-Agent"}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">
                      {locale === "th" ? "ชื่อบริษัท" : "Company Name"}
                    </label>
                    <input
                      type="text"
                      value={form.companyName}
                      onChange={(e) =>
                        setForm({ ...form, companyName: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8A951]/30 focus:border-[#C8A951]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">
                      {locale === "th"
                        ? "หมายเลขใบอนุญาต"
                        : "License Number"}
                    </label>
                    <input
                      type="text"
                      value={form.licenseNumber}
                      onChange={(e) =>
                        setForm({ ...form, licenseNumber: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8A951]/30 focus:border-[#C8A951]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">
                      {locale === "th"
                        ? "ประสบการณ์ (ปี)"
                        : "Experience (years)"}
                    </label>
                    <input
                      type="number"
                      value={form.experienceYears}
                      onChange={(e) =>
                        setForm({ ...form, experienceYears: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C8A951]/30 focus:border-[#C8A951]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#C8A951] hover:bg-[#B8993F] text-white py-3.5 rounded-full font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {messages.common.submit}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
