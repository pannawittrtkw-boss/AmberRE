"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Loader2,
  MapPin,
  Building2,
  Layers,
  Calendar,
  Car,
  Ruler,
  ChevronLeft,
  Home,
  ArrowRight,
  Bed,
  Bath,
  ExternalLink,
  Sparkles,
  Maximize2,
  X,
} from "lucide-react";
import { PROJECT_FACILITY_ITEMS } from "@/components/admin/ProjectForm";

const DraggableMapPreview = dynamic(
  () => import("@/components/admin/DraggableMapPreview"),
  { ssr: false }
);

interface UnitType {
  type: string;
  size: string;
  planImageUrl: string;
}

interface Property {
  id: number;
  titleTh: string;
  titleEn: string | null;
  propertyType: string;
  listingType: string;
  price: number | null;
  salePrice: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sizeSqm: number | null;
  floor: number | null;
  building: string | null;
  status: string;
  isSold: boolean;
  estCode: string | null;
  images: { imageUrl: string; isPrimary: boolean }[];
}

interface Project {
  id: number;
  nameTh: string;
  nameEn: string | null;
  descriptionTh: string | null;
  descriptionEn: string | null;
  developer: string | null;
  imageUrl: string | null;
  logoUrl: string | null;
  location: string | null;
  fullAddress: string | null;
  province: string | null;
  district: string | null;
  projectArea: string | null;
  googleMapsUrl: string | null;
  ceilingHeight: number | null;
  utilityFee: string | null;
  buildings: number | null;
  parking: number | null;
  floors: number | null;
  totalUnits: number | null;
  yearCompleted: number | null;
  latitude: number | null;
  longitude: number | null;
  facilities: string | null;
  unitTypes: string | null;
  photoAlbum: string | null;
  properties: Property[];
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const [locale, setLocale] = useState("th");
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [filterType, setFilterType] = useState<"all" | "rent" | "sale">("all");
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    params.then(async ({ locale: l, id }) => {
      setLocale(l);
      try {
        const res = await fetch(`/api/projects/${id}`);
        const data = await res.json();
        if (data.success) setProject(data.data);
      } catch {}
      setLoading(false);
    });
  }, [params]);

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-[#C8A951]" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-32">
        <p className="text-gray-500">
          {locale === "th" ? "ไม่พบโครงการ" : "Project not found"}
        </p>
        <Link
          href={`/${locale}/projects`}
          className="text-[#C8A951] hover:underline mt-2 inline-block"
        >
          {locale === "th" ? "← กลับไปรายการโครงการ" : "← Back to projects"}
        </Link>
      </div>
    );
  }

  const facilities: string[] = parseJSON(project.facilities, []);
  const unitTypes: UnitType[] = parseJSON(project.unitTypes, []);
  const photoAlbum: string[] = parseJSON(project.photoAlbum, []);

  const allImages = [
    ...(project.imageUrl ? [project.imageUrl] : []),
    ...photoAlbum,
  ];
  const heroImage = allImages[activeImageIdx] || allImages[0];

  const filteredProperties = project.properties.filter((p) => {
    if (filterType === "rent")
      return p.listingType === "RENT" || p.listingType === "RENT_AND_SALE";
    if (filterType === "sale")
      return p.listingType === "SALE" || p.listingType === "RENT_AND_SALE";
    return true;
  });

  const formatMoney = (n: number) =>
    `฿${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  return (
    <div className="bg-stone-50 min-h-screen">
      {/* HERO SECTION - Full width with overlay */}
      <section className="relative">
        {/* Background image */}
        <div className="relative h-[60vh] min-h-[400px] max-h-[600px] overflow-hidden bg-stone-900">
          {heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroImage}
              alt={project.nameTh}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-stone-700">
              <Building2 className="w-24 h-24" />
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/50 to-stone-900/10" />

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
              <Link
                href={`/${locale}/projects`}
                className="inline-flex items-center gap-1.5 text-sm text-white/90 hover:text-white bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                {locale === "th" ? "โครงการทั้งหมด" : "All Projects"}
              </Link>
              {allImages.length > 1 && (
                <button
                  onClick={() => setLightboxOpen(true)}
                  className="inline-flex items-center gap-1.5 text-sm text-white/90 hover:text-white bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full transition-colors"
                >
                  <Maximize2 className="w-4 h-4" />
                  {locale === "th"
                    ? `${allImages.length} รูปภาพ`
                    : `${allImages.length} Photos`}
                </button>
              )}
            </div>
          </div>

          {/* Bottom info */}
          <div className="absolute bottom-0 left-0 right-0 z-10 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
              <div className="flex items-end gap-5 flex-wrap">
                {project.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={project.logoUrl}
                    alt=""
                    className="w-20 h-20 object-contain rounded-xl bg-white/95 p-2 shadow-2xl shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  {project.developer && (
                    <p className="text-sm uppercase tracking-widest text-[#E8C97A] mb-2">
                      {project.developer}
                    </p>
                  )}
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-2">
                    {project.nameTh}
                  </h1>
                  {project.nameEn && (
                    <p className="text-lg md:text-xl text-white/70 font-light">
                      {project.nameEn}
                    </p>
                  )}
                  {(project.location || project.district || project.province) && (
                    <p className="flex items-center gap-2 text-sm md:text-base text-white/80 mt-3">
                      <MapPin className="w-4 h-4 text-[#E8C97A]" />
                      {[project.location, project.district, project.province]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Thumbnail strip - overlapping the hero */}
        {allImages.length > 1 && (
          <div className="absolute bottom-0 right-0 z-20 hidden lg:block">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
              <div className="flex gap-2 justify-end">
                {allImages.slice(0, 5).map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIdx(i)}
                    className={`w-20 h-14 rounded-lg overflow-hidden ring-2 transition-all ${
                      activeImageIdx === i
                        ? "ring-[#C8A951] scale-105"
                        : "ring-white/50 hover:ring-white"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
                {allImages.length > 5 && (
                  <button
                    onClick={() => setLightboxOpen(true)}
                    className="w-20 h-14 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur text-white text-xs font-medium ring-2 ring-white/50"
                  >
                    +{allImages.length - 5}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* QUICK STATS BAR */}
      <section className="border-b border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 md:grid-cols-6 divide-x divide-stone-100">
            <Stat
              icon={<Layers className="w-5 h-5" />}
              label={locale === "th" ? "ยูนิตทั้งหมด" : "Total Units"}
              value={project.totalUnits}
            />
            <Stat
              icon={<Building2 className="w-5 h-5" />}
              label={locale === "th" ? "อาคาร" : "Buildings"}
              value={project.buildings}
            />
            <Stat
              icon={<Building2 className="w-5 h-5" />}
              label={locale === "th" ? "จำนวนชั้น" : "Floors"}
              value={project.floors}
            />
            <Stat
              icon={<Car className="w-5 h-5" />}
              label={locale === "th" ? "ที่จอดรถ" : "Parking"}
              value={project.parking}
            />
            <Stat
              icon={<Calendar className="w-5 h-5" />}
              label={locale === "th" ? "ปีที่เสร็จ" : "Year"}
              value={project.yearCompleted}
            />
            <Stat
              icon={<Ruler className="w-5 h-5" />}
              label={locale === "th" ? "ความสูง (m)" : "Ceiling (m)"}
              value={project.ceilingHeight}
            />
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-8 space-y-12">
            {/* About */}
            {project.descriptionTh && (
              <section>
                <SectionTitle
                  badge={locale === "th" ? "เกี่ยวกับโครงการ" : "Overview"}
                  title={
                    locale === "th"
                      ? `รู้จัก ${project.nameTh}`
                      : `About ${project.nameEn || project.nameTh}`
                  }
                />
                <p className="text-stone-700 leading-relaxed text-base whitespace-pre-line">
                  {locale === "en" && project.descriptionEn
                    ? project.descriptionEn
                    : project.descriptionTh}
                </p>

                {/* Inline detail badges */}
                {(project.fullAddress ||
                  project.projectArea ||
                  project.utilityFee) && (
                  <div className="mt-6 flex flex-wrap gap-x-8 gap-y-4 pt-6 border-t border-stone-200">
                    {project.fullAddress && (
                      <InlineDetail
                        label={locale === "th" ? "ที่อยู่" : "Address"}
                        value={project.fullAddress}
                      />
                    )}
                    {project.projectArea && (
                      <InlineDetail
                        label={locale === "th" ? "ขนาดพื้นที่" : "Project Area"}
                        value={project.projectArea}
                      />
                    )}
                    {project.utilityFee && (
                      <InlineDetail
                        label={locale === "th" ? "ค่าส่วนกลาง" : "Utility Fee"}
                        value={project.utilityFee}
                      />
                    )}
                  </div>
                )}
              </section>
            )}

            {/* Unit Types */}
            {unitTypes.length > 0 && (
              <section>
                <SectionTitle
                  badge={locale === "th" ? "ประเภทยูนิต" : "Unit Plans"}
                  title={
                    locale === "th"
                      ? "ประเภทห้องในโครงการ"
                      : "Available Unit Types"
                  }
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {unitTypes.map((u, i) => (
                    <div
                      key={i}
                      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                    >
                      <div className="relative aspect-video overflow-hidden bg-stone-100">
                        {u.planImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={u.planImageUrl}
                            alt={u.type}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-stone-300">
                            <Home className="w-12 h-12" />
                          </div>
                        )}
                      </div>
                      <div className="px-5 py-4 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-lg">{u.type}</div>
                          {u.size && (
                            <div className="text-sm text-stone-500">
                              {u.size} sqm
                            </div>
                          )}
                        </div>
                        <Sparkles className="w-5 h-5 text-[#C8A951]" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Facilities */}
            {facilities.length > 0 && (
              <section>
                <SectionTitle
                  badge={locale === "th" ? "สิ่งอำนวยความสะดวก" : "Facilities"}
                  title={
                    locale === "th" ? "สิ่งอำนวยความสะดวกในโครงการ" : "Project Amenities"
                  }
                />
                <div className="flex flex-wrap gap-2">
                  {PROJECT_FACILITY_ITEMS.filter((f) =>
                    facilities.includes(f.key)
                  ).map((f) => (
                    <div
                      key={f.key}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow text-sm"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C8A951]" />
                      {locale === "th" && f.labelTh ? f.labelTh : f.labelEn}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Available Properties */}
            <section>
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <SectionTitle
                  badge={locale === "th" ? "ห้องที่มี" : "Listings"}
                  title={
                    locale === "th"
                      ? `ห้องว่างในโครงการ (${filteredProperties.length})`
                      : `Available Units (${filteredProperties.length})`
                  }
                  noMargin
                />
                <div className="inline-flex bg-stone-100 rounded-full p-1">
                  {(["all", "rent", "sale"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilterType(f)}
                      className={`px-4 py-1.5 text-xs font-medium rounded-full capitalize transition-all ${
                        filterType === f
                          ? "bg-stone-900 text-white shadow"
                          : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      {f === "all"
                        ? locale === "th"
                          ? "ทั้งหมด"
                          : "All"
                        : f === "rent"
                        ? locale === "th"
                          ? "เช่า"
                          : "Rent"
                        : locale === "th"
                        ? "ขาย"
                        : "Sale"}
                    </button>
                  ))}
                </div>
              </div>

              {filteredProperties.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl">
                  <Home className="w-12 h-12 mx-auto text-stone-300 mb-2" />
                  <p className="text-stone-500 text-sm">
                    {locale === "th"
                      ? "ยังไม่มีห้องว่างในตอนนี้"
                      : "No available units"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {filteredProperties.map((p) => (
                    <PropertyMiniCard
                      key={p.id}
                      property={p}
                      locale={locale}
                      formatMoney={formatMoney}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 self-start">
            {/* CTA Card */}
            <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-[#5a4621] text-white rounded-3xl p-7 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#C8A951]/20 rounded-full blur-3xl -translate-y-12 translate-x-12" />
              <div className="relative">
                <Sparkles className="w-6 h-6 text-[#E8C97A] mb-3" />
                <h3 className="font-bold text-xl mb-1.5">
                  {locale === "th" ? "สนใจโครงการนี้?" : "Interested in this project?"}
                </h3>
                <p className="text-sm text-white/70 mb-5 leading-relaxed">
                  {locale === "th"
                    ? "ทีมงานของเราพร้อมให้คำแนะนำและพาคุณชมโครงการ"
                    : "Our team is ready to assist and arrange a viewing"}
                </p>
                <Link
                  href={`/${locale}/contact`}
                  className="inline-flex items-center justify-center gap-2 w-full bg-[#C8A951] hover:bg-[#D4B968] text-stone-900 font-semibold py-3 rounded-full text-sm transition-colors"
                >
                  {locale === "th" ? "ติดต่อทีมงาน" : "Contact Our Team"}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Map Card */}
            {project.latitude && project.longitude && (
              <div className="bg-white rounded-3xl overflow-hidden shadow-sm">
                <div className="px-5 pt-5 pb-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#C8A951]" />
                      {locale === "th" ? "ตำแหน่งที่ตั้ง" : "Location"}
                    </h3>
                    <a
                      href={
                        project.googleMapsUrl ||
                        `https://www.google.com/maps?q=${project.latitude},${project.longitude}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#C8A951] hover:underline inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {locale === "th" ? "เปิดแผนที่" : "Open Map"}
                    </a>
                  </div>
                </div>
                <div className="overflow-hidden">
                  <DraggableMapPreview
                    latitude={project.latitude}
                    longitude={project.longitude}
                    onPositionChange={() => {}}
                  />
                </div>
                {project.fullAddress && (
                  <div className="px-5 py-4 border-t border-stone-100 text-xs text-stone-600 leading-relaxed">
                    {project.fullAddress}
                  </div>
                )}
              </div>
            )}

            {/* Quick Facts */}
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-base mb-4">
                {locale === "th" ? "ข้อมูลด่วน" : "Quick Facts"}
              </h3>
              <dl className="space-y-3 text-sm">
                {project.developer && (
                  <Fact
                    label={locale === "th" ? "ผู้พัฒนา" : "Developer"}
                    value={project.developer}
                  />
                )}
                {project.yearCompleted && (
                  <Fact
                    label={locale === "th" ? "ปีที่เสร็จ" : "Year Completed"}
                    value={String(project.yearCompleted)}
                  />
                )}
                {project.totalUnits && (
                  <Fact
                    label={locale === "th" ? "ยูนิตทั้งหมด" : "Total Units"}
                    value={`${project.totalUnits.toLocaleString()} ${locale === "th" ? "ห้อง" : "units"}`}
                  />
                )}
                {project.utilityFee && (
                  <Fact
                    label={locale === "th" ? "ค่าส่วนกลาง" : "CAM Fee"}
                    value={project.utilityFee}
                  />
                )}
                {project.projectArea && (
                  <Fact
                    label={locale === "th" ? "พื้นที่โครงการ" : "Area"}
                    value={project.projectArea}
                  />
                )}
              </dl>
            </div>
          </aside>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
          >
            <X className="w-6 h-6" />
          </button>
          <div
            className="max-w-6xl w-full max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImage}
              alt=""
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
            {allImages.length > 1 && (
              <div className="flex gap-2 justify-center mt-4 overflow-x-auto pb-2">
                {allImages.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIdx(i)}
                    className={`w-20 h-14 rounded-lg overflow-hidden shrink-0 ring-2 transition-all ${
                      activeImageIdx === i
                        ? "ring-[#C8A951]"
                        : "ring-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function parseJSON<T>(s: string | null, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | null;
}) {
  return (
    <div className="px-4 py-5 text-center">
      <div className="text-[#C8A951] mx-auto mb-2 flex justify-center">
        {icon}
      </div>
      <div className="text-2xl font-bold text-stone-900 leading-none">
        {value ?? "—"}
      </div>
      <div className="text-[10px] text-stone-500 uppercase tracking-widest mt-2">
        {label}
      </div>
    </div>
  );
}

function SectionTitle({
  badge,
  title,
  noMargin,
}: {
  badge: string;
  title: string;
  noMargin?: boolean;
}) {
  return (
    <div className={noMargin ? "" : "mb-6"}>
      <div className="flex items-center gap-2 text-[#C8A951] text-xs uppercase tracking-widest font-medium mb-1.5">
        <span className="w-6 h-px bg-[#C8A951]" />
        {badge}
      </div>
      <h2 className="text-2xl md:text-3xl font-bold text-stone-900">{title}</h2>
    </div>
  );
}

function InlineDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">
        {label}
      </div>
      <div className="font-medium text-stone-800">{value}</div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 border-b border-stone-100 last:border-b-0">
      <dt className="text-stone-500 text-sm">{label}</dt>
      <dd className="text-stone-900 font-medium text-sm text-right">{value}</dd>
    </div>
  );
}

function PropertyMiniCard({
  property,
  locale,
  formatMoney,
}: {
  property: Property;
  locale: string;
  formatMoney: (n: number) => string;
}) {
  const cover =
    property.images.find((i) => i.isPrimary)?.imageUrl ||
    property.images[0]?.imageUrl;
  const isForRent =
    property.listingType === "RENT" || property.listingType === "RENT_AND_SALE";
  const isForSale =
    property.listingType === "SALE" || property.listingType === "RENT_AND_SALE";

  return (
    <Link
      href={`/${locale}/properties/${property.id}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
    >
      <div className="aspect-[4/3] bg-stone-100 relative overflow-hidden">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={property.titleTh}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-stone-300">
            <Home className="w-10 h-10" />
          </div>
        )}
        {/* Listing type badge */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {isForRent && (
            <span className="bg-emerald-500 text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded">
              {locale === "th" ? "เช่า" : "Rent"}
            </span>
          )}
          {isForSale && (
            <span className="bg-[#C8A951] text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded">
              {locale === "th" ? "ขาย" : "Sale"}
            </span>
          )}
        </div>
        {property.isSold && (
          <span className="absolute top-3 right-3 bg-rose-500 text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded">
            {locale === "th" ? "ขายแล้ว" : "Sold"}
          </span>
        )}
        {property.estCode && (
          <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur text-white text-[10px] px-2 py-1 rounded">
            {property.estCode}
          </span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        {(property.building || property.floor) && (
          <p className="text-xs text-stone-400 mb-2">
            {property.building &&
              `${locale === "th" ? "ตึก" : "Bldg"} ${property.building}`}
            {property.building && property.floor && " • "}
            {property.floor &&
              `${locale === "th" ? "ชั้น" : "Floor"} ${property.floor}`}
          </p>
        )}
        <div className="flex items-center gap-4 text-xs text-stone-600">
          {(property.bedrooms ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <Bed className="w-3.5 h-3.5 text-[#C8A951]" />
              {property.bedrooms}
            </span>
          )}
          {(property.bathrooms ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5 text-[#C8A951]" />
              {property.bathrooms}
            </span>
          )}
          {property.sizeSqm && (
            <span className="flex items-center gap-1">
              <Ruler className="w-3.5 h-3.5 text-[#C8A951]" />
              {property.sizeSqm} m²
            </span>
          )}
        </div>
        <div className="mt-auto pt-4 flex items-end justify-between">
          <div>
            {isForRent && property.price && (
              <div className="text-xl font-bold text-stone-900">
                {formatMoney(property.price)}
                <span className="text-xs text-stone-500 font-normal">
                  /{locale === "th" ? "เดือน" : "mo"}
                </span>
              </div>
            )}
            {isForSale && property.salePrice && (
              <div
                className={
                  isForRent
                    ? "text-xs text-stone-500"
                    : "text-xl font-bold text-stone-900"
                }
              >
                {locale === "th" ? "ขาย" : "Sale"}:{" "}
                {formatMoney(property.salePrice)}
              </div>
            )}
          </div>
          <span className="w-9 h-9 rounded-full bg-stone-100 group-hover:bg-[#C8A951] group-hover:text-white transition-colors flex items-center justify-center text-stone-400">
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
