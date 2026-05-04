"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Trash2,
  Layers,
  Loader2,
  Check,
  X as XIcon,
  Bed,
  Bath,
  Maximize,
  MapPin,
  Building2,
  ChevronLeft,
  ChevronRight,
  Train,
  Tag,
  Crown,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useCompare } from "@/lib/compare";
import { getStationThaiName } from "@/lib/stations";
import { formatNumber } from "@/lib/utils";

function parseJson(val: string | null | undefined): string[] {
  if (!val) return [];
  try {
    const p = JSON.parse(val);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

export default function ComparePage() {
  const params = useParams();
  const locale = (params.locale as string) || "th";
  const { compareIds, removeFromCompare, clearAll } = useCompare();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (compareIds.length === 0) {
      setProperties([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/properties?ids=${compareIds.join(",")}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const serialized = (data.data || []).map((p: any) => ({
            ...p,
            price: Number(p.price),
            salePrice: p.salePrice ? Number(p.salePrice) : null,
            sizeSqm: p.sizeSqm ? Number(p.sizeSqm) : null,
          }));
          const ordered = compareIds
            .map((id) => serialized.find((p: any) => p.id === id))
            .filter(Boolean);
          setProperties(ordered);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [compareIds]);

  const labels = {
    th: {
      title: "เปรียบเทียบอสังหาริมทรัพย์",
      clearAll: "ล้างทั้งหมด",
      empty: "ยังไม่มีรายการเปรียบเทียบ",
      emptyDesc: "กดไอคอนเปรียบเทียบบนการ์ดเพื่อเพิ่มอสังหาริมทรัพย์",
      basicInfo: "ข้อมูลทั่วไป",
      sizeAndLayout: "ขนาดและพื้นที่",
      locationInfo: "ที่ตั้ง",
      featuresSection: "คุณสมบัติพิเศษ",
      amenitiesSection: "สิ่งอำนวยความสะดวก",
      propertyName: "ชื่อโครงการ",
      price: "ราคาเช่า / เดือน",
      salePrice: "ราคาขาย",
      propertyType: "ประเภท",
      bedrooms: "ห้องนอน",
      bathrooms: "ห้องน้ำ",
      area: "พื้นที่ (ตร.ม.)",
      floor: "ชั้น",
      location: "ที่ตั้ง",
      nearStation: "ใกล้ BTS/MRT",
      kitchenPartition: "Kitchen Partition",
      bedroomPartition: "Bedroom Partition",
      buildingType: "ประเภทอาคาร",
      bestPrice: "ราคาดีที่สุด",
      biggest: "พื้นที่ใหญ่สุด",
      viewDetails: "ดูรายละเอียด",
    },
    en: {
      title: "Compare Properties",
      clearAll: "Clear All",
      empty: "No properties to compare",
      emptyDesc: "Click the compare icon on property cards to add them",
      basicInfo: "Basic Information",
      sizeAndLayout: "Size & Layout",
      locationInfo: "Location",
      featuresSection: "Features",
      amenitiesSection: "Amenities",
      propertyName: "Property Name",
      price: "Rent / month",
      salePrice: "Sale Price",
      propertyType: "Type",
      bedrooms: "Bedrooms",
      bathrooms: "Bathrooms",
      area: "Area (sqm)",
      floor: "Floor",
      location: "Address",
      nearStation: "Near BTS/MRT",
      kitchenPartition: "Kitchen Partition",
      bedroomPartition: "Bedroom Partition",
      buildingType: "Building Type",
      bestPrice: "Best Price",
      biggest: "Largest",
      viewDetails: "View Details",
    },
    zh: {
      title: "比较房产",
      clearAll: "清除全部",
      empty: "暂无比较项目",
      emptyDesc: "点击房产卡片上的比较图标添加",
      basicInfo: "基本信息",
      sizeAndLayout: "面积布局",
      locationInfo: "位置",
      featuresSection: "特色",
      amenitiesSection: "配套设施",
      propertyName: "房产名称",
      price: "租金/月",
      salePrice: "售价",
      propertyType: "类型",
      bedrooms: "卧室",
      bathrooms: "浴室",
      area: "面积 (平方米)",
      floor: "楼层",
      location: "地址",
      nearStation: "近 BTS/MRT",
      kitchenPartition: "厨房隔断",
      bedroomPartition: "卧室隔断",
      buildingType: "建筑类型",
      bestPrice: "最优价格",
      biggest: "最大面积",
      viewDetails: "查看详情",
    },
    my: {
      title: "အိမ်ခြံမြေ နှိုင်းယှဉ်ရန်",
      clearAll: "အားလုံးရှင်းလင်းရန်",
      empty: "နှိုင်းယှဉ်ရန် မရှိသေးပါ",
      emptyDesc: "ကတ်ပေါ်ရှိ နှိုင်းယှဉ် အိုင်ကွန်ကို နှိပ်ပါ",
      basicInfo: "အခြေခံအချက်အလက်",
      sizeAndLayout: "အရွယ်အစား",
      locationInfo: "တည်နေရာ",
      featuresSection: "အင်္ဂါရပ်",
      amenitiesSection: "အဆောင်အပြင်",
      propertyName: "အိမ်ခြံမြေ အမည်",
      price: "ငှားခ / လ",
      salePrice: "ရောင်းဈေး",
      propertyType: "အမျိုးအစား",
      bedrooms: "အိပ်ခန်း",
      bathrooms: "ရေချိုးခန်း",
      area: "အကျယ်အဝန်း (စတုရန်းမီတာ)",
      floor: "ထပ်",
      location: "တည်နေရာ",
      nearStation: "BTS/MRT နီး",
      kitchenPartition: "မီးဖိုခန်း အခန်းခွဲ",
      bedroomPartition: "အိပ်ခန်း အခန်းခွဲ",
      buildingType: "အဆောက်အဦ အမျိုးအစား",
      bestPrice: "ဈေးနှုန်း အသင့်တော်ဆုံး",
      biggest: "အကြီးဆုံး",
      viewDetails: "အသေးစိတ်",
    },
  };
  const l = labels[locale as keyof typeof labels] || labels.en;

  const typeLabels: Record<string, string> = {
    CONDO: locale === "th" ? "คอนโด" : "Condo",
    HOUSE: locale === "th" ? "บ้านเดี่ยว" : "House",
    TOWNHOUSE: locale === "th" ? "ทาวน์เฮาส์" : "Townhouse",
    LAND: locale === "th" ? "ที่ดิน" : "Land",
  };

  const buildingLabels: Record<string, string> = {
    HIGH_RISE: "High-Rise",
    LOW_RISE: "Low-Rise",
  };

  // Find best values for highlight
  const minPrice = properties.length
    ? Math.min(
        ...properties.filter((p) => p.price > 0).map((p) => p.price)
      )
    : 0;
  const maxSize = properties.length
    ? Math.max(
        ...properties.filter((p) => p.sizeSqm).map((p) => Number(p.sizeSqm))
      )
    : 0;

  // Collect all unique amenities
  const allAmenities: { id: number; name: string }[] = [];
  const seenAmenityIds = new Set<number>();
  for (const p of properties) {
    for (const pa of p.propertyAmenities || []) {
      if (!seenAmenityIds.has(pa.amenity.id)) {
        seenAmenityIds.add(pa.amenity.id);
        allAmenities.push({
          id: pa.amenity.id,
          name: locale === "th" ? pa.amenity.nameTh : pa.amenity.nameEn,
        });
      }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-[#C8A951]" />
      </div>
    );
  }

  // Compute grid template columns based on count
  // Cap each property column to keep cards a reasonable size
  const gridCols = `180px repeat(${properties.length}, minmax(220px, 280px))`;

  return (
    <div className="bg-stone-50 min-h-screen">
      {/* HERO */}
      <section className="relative bg-stone-950 text-white py-12 md:py-14 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(200,169,81,0.18),transparent_60%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C8A951]/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#C8A951]/60 to-transparent" />
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#C8A951]/15 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#E8C97A] text-[10px] uppercase tracking-[0.3em] font-medium mb-3">
              <span className="w-8 h-px bg-gradient-to-r from-transparent to-[#C8A951]" />
              {locale === "th" ? "เปรียบเทียบ" : "Compare"}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight">
              {l.title}
            </h1>
            {properties.length > 0 && (
              <p className="text-sm text-stone-400 mt-2">
                <span className="text-[#E8C97A] font-bold">
                  {properties.length}
                </span>{" "}
                {locale === "th"
                  ? "รายการที่เลือก"
                  : "items selected"}
              </p>
            )}
          </div>
          {properties.length > 0 && (
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20 rounded-full text-sm transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {l.clearAll}
            </button>
          )}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {properties.length === 0 ? (
          <div className="bg-white rounded-3xl text-center py-24 shadow-sm">
            <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3">
              <Layers className="w-10 h-10 text-stone-400" />
            </div>
            <h2 className="text-lg font-semibold text-stone-700">{l.empty}</h2>
            <p className="text-stone-400 text-sm mt-2 max-w-md mx-auto">
              {l.emptyDesc}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-2 -mx-4 sm:-mx-6 lg:-mx-8">
            <div className="px-4 sm:px-6 lg:px-8 inline-block min-w-full">
              {/* PROPERTY HEADER CARDS — Sticky */}
              <div
                className="grid gap-4 sticky top-0 z-20 bg-stone-50 pt-2 pb-4"
                style={{ gridTemplateColumns: gridCols }}
              >
                {/* Spacer — empty cell */}
                <div className="hidden md:block" />

                {/* Property Cards */}
                {properties.map((p) => {
                  const isBestPrice = p.price === minPrice && p.price > 0;
                  const isBiggest =
                    Number(p.sizeSqm) === maxSize && p.sizeSqm > 0;
                  return (
                    <div
                      key={p.id}
                      className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <CompareImageCarousel
                        images={p.images || []}
                        title={p.projectName || p.titleTh}
                        propertyId={p.id}
                        locale={locale}
                        onRemove={() => removeFromCompare(p.id)}
                      />
                      <div className="p-4">
                        {/* Highlight badges */}
                        <div className="flex flex-wrap gap-1.5 mb-2 min-h-[24px]">
                          {isBestPrice && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-semibold uppercase tracking-wider rounded">
                              <Crown className="w-3 h-3" />
                              {l.bestPrice}
                            </span>
                          )}
                          {isBiggest && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-[#8B6F2F] text-[10px] font-semibold uppercase tracking-wider rounded">
                              <Maximize className="w-3 h-3" />
                              {l.biggest}
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-stone-900 text-sm line-clamp-1">
                          {p.projectName ||
                            (locale !== "th" && p.titleEn
                              ? p.titleEn
                              : p.titleTh)}
                        </h3>

                        <div className="mt-2">
                          <div className="text-2xl font-bold text-[#C8A951] leading-none">
                            ฿{formatNumber(p.price, locale)}
                          </div>
                          <div className="text-[10px] text-stone-400 uppercase tracking-widest mt-1">
                            {l.price}
                          </div>
                        </div>

                        <Link
                          href={`/${locale}/properties/${p.id}`}
                          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-stone-700 hover:text-[#C8A951] transition-colors"
                        >
                          {l.viewDetails}
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* SECTIONS */}
              <div className="space-y-8 mt-2">
                {/* BASIC INFO */}
                <CompareSection
                  title={l.basicInfo}
                  icon={<Tag className="w-4 h-4 text-[#C8A951]" />}
                  count={properties.length}
                  gridCols={gridCols}
                >
                  <CompareRow label={l.salePrice} gridCols={gridCols}>
                    {properties.map((p) => (
                      <CompareCell key={p.id}>
                        {p.salePrice ? (
                          <span className="font-semibold text-stone-700">
                            ฿{formatNumber(p.salePrice, locale)}
                          </span>
                        ) : (
                          <span className="text-stone-300">—</span>
                        )}
                      </CompareCell>
                    ))}
                  </CompareRow>
                  <CompareRow label={l.propertyType} gridCols={gridCols}>
                    {properties.map((p) => (
                      <CompareCell key={p.id}>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-[#8B6F2F] text-xs font-semibold rounded-full">
                          <Building2 className="w-3 h-3" />
                          {typeLabels[p.propertyType] || p.propertyType}
                        </span>
                      </CompareCell>
                    ))}
                  </CompareRow>
                  <CompareRow
                    label={l.buildingType}
                    gridCols={gridCols}
                    last
                  >
                    {properties.map((p) => (
                      <CompareCell key={p.id}>
                        {p.buildingType ? (
                          <span className="text-stone-700">
                            {buildingLabels[p.buildingType] || p.buildingType}
                          </span>
                        ) : (
                          <span className="text-stone-300">—</span>
                        )}
                      </CompareCell>
                    ))}
                  </CompareRow>
                </CompareSection>

                {/* SIZE & LAYOUT */}
                <CompareSection
                  title={l.sizeAndLayout}
                  icon={<Maximize className="w-4 h-4 text-[#C8A951]" />}
                  count={properties.length}
                  gridCols={gridCols}
                >
                  <CompareRow label={l.bedrooms} gridCols={gridCols}>
                    {properties.map((p) => (
                      <CompareCell key={p.id}>
                        <span className="inline-flex items-center gap-1.5 text-stone-700">
                          <Bed className="w-4 h-4 text-[#C8A951]" />
                          <span className="font-semibold">{p.bedrooms}</span>
                        </span>
                      </CompareCell>
                    ))}
                  </CompareRow>
                  <CompareRow label={l.bathrooms} gridCols={gridCols}>
                    {properties.map((p) => (
                      <CompareCell key={p.id}>
                        <span className="inline-flex items-center gap-1.5 text-stone-700">
                          <Bath className="w-4 h-4 text-[#C8A951]" />
                          <span className="font-semibold">{p.bathrooms}</span>
                        </span>
                      </CompareCell>
                    ))}
                  </CompareRow>
                  <CompareRow label={l.area} gridCols={gridCols}>
                    {properties.map((p) => {
                      const isBiggest =
                        Number(p.sizeSqm) === maxSize && p.sizeSqm > 0;
                      return (
                        <CompareCell key={p.id}>
                          <span
                            className={`inline-flex items-center gap-1.5 ${
                              isBiggest
                                ? "text-[#C8A951] font-bold"
                                : "text-stone-700"
                            }`}
                          >
                            <Maximize
                              className={`w-4 h-4 ${
                                isBiggest ? "text-[#C8A951]" : "text-stone-400"
                              }`}
                            />
                            {p.sizeSqm ? (
                              <span>
                                <span className="font-semibold">
                                  {p.sizeSqm}
                                </span>
                                <span className="text-xs text-stone-500 ml-1">
                                  m²
                                </span>
                              </span>
                            ) : (
                              <span className="text-stone-300">—</span>
                            )}
                          </span>
                        </CompareCell>
                      );
                    })}
                  </CompareRow>
                  <CompareRow label={l.floor} gridCols={gridCols} last>
                    {properties.map((p) => (
                      <CompareCell key={p.id}>
                        {p.floor ? (
                          <span className="text-stone-700 font-semibold">
                            {p.floor}
                          </span>
                        ) : (
                          <span className="text-stone-300">—</span>
                        )}
                      </CompareCell>
                    ))}
                  </CompareRow>
                </CompareSection>

                {/* LOCATION */}
                <CompareSection
                  title={l.locationInfo}
                  icon={<MapPin className="w-4 h-4 text-[#C8A951]" />}
                  count={properties.length}
                  gridCols={gridCols}
                >
                  <CompareRow label={l.location} gridCols={gridCols}>
                    {properties.map((p) => (
                      <CompareCell key={p.id}>
                        {p.address ? (
                          <span className="text-stone-700 text-sm leading-relaxed">
                            {p.address}
                          </span>
                        ) : (
                          <span className="text-stone-300">—</span>
                        )}
                      </CompareCell>
                    ))}
                  </CompareRow>
                  <CompareRow label={l.nearStation} gridCols={gridCols} last>
                    {properties.map((p) => {
                      const codes = parseJson(p.nearbyStations);
                      const names = codes.map(getStationThaiName);
                      return (
                        <CompareCell key={p.id}>
                          {names.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {names.slice(0, 3).map((name, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-stone-100 text-stone-700 text-[11px] rounded"
                                >
                                  <Train className="w-2.5 h-2.5 text-[#C8A951]" />
                                  {name}
                                </span>
                              ))}
                              {names.length > 3 && (
                                <span className="text-[11px] text-stone-400 self-center">
                                  +{names.length - 3}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-stone-300">—</span>
                          )}
                        </CompareCell>
                      );
                    })}
                  </CompareRow>
                </CompareSection>

                {/* FEATURES */}
                <CompareSection
                  title={l.featuresSection}
                  icon={<Check className="w-4 h-4 text-[#C8A951]" />}
                  count={properties.length}
                  gridCols={gridCols}
                >
                  <CompareRow label={l.kitchenPartition} gridCols={gridCols}>
                    {properties.map((p) => (
                      <CompareCell key={p.id}>
                        <BoolMark value={p.kitchenPartition} />
                      </CompareCell>
                    ))}
                  </CompareRow>
                  <CompareRow
                    label={l.bedroomPartition}
                    gridCols={gridCols}
                    last
                  >
                    {properties.map((p) => (
                      <CompareCell key={p.id}>
                        <BoolMark value={p.bedroomPartition} />
                      </CompareCell>
                    ))}
                  </CompareRow>
                </CompareSection>

                {/* AMENITIES */}
                {allAmenities.length > 0 && (
                  <CompareSection
                    title={l.amenitiesSection}
                    icon={<Check className="w-4 h-4 text-[#C8A951]" />}
                    count={properties.length}
                    gridCols={gridCols}
                  >
                    {allAmenities.map((amenity, idx) => (
                      <CompareRow
                        key={amenity.id}
                        label={amenity.name}
                        gridCols={gridCols}
                        last={idx === allAmenities.length - 1}
                      >
                        {properties.map((p) => {
                          const has = (p.propertyAmenities || []).some(
                            (pa: any) => pa.amenity.id === amenity.id
                          );
                          return (
                            <CompareCell key={p.id}>
                              <BoolMark value={has} />
                            </CompareCell>
                          );
                        })}
                      </CompareRow>
                    ))}
                  </CompareSection>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ====== Sub-components ======

function CompareSection({
  title,
  icon,
  count,
  gridCols,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  gridCols: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Section Header */}
      <div
        className="grid items-center px-5 py-3 bg-gradient-to-r from-stone-50 to-transparent"
        style={{ gridTemplateColumns: gridCols }}
      >
        <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
          {icon}
          <span className="uppercase tracking-wider text-xs">{title}</span>
        </div>
        {/* placeholder cells matching count to maintain grid alignment */}
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} />
        ))}
      </div>
      {children}
    </div>
  );
}

function CompareRow({
  label,
  gridCols,
  last,
  children,
}: {
  label: string;
  gridCols: string;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`grid items-center px-5 py-3.5 hover:bg-stone-50/50 transition-colors ${
        !last ? "border-b border-stone-100" : ""
      }`}
      style={{ gridTemplateColumns: gridCols }}
    >
      <div className="text-xs font-medium text-stone-500 uppercase tracking-wider pr-3">
        {label}
      </div>
      {children}
    </div>
  );
}

function CompareCell({ children }: { children: React.ReactNode }) {
  return <div className="text-sm">{children}</div>;
}

function BoolMark({ value }: { value: boolean }) {
  return value ? (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-50 text-emerald-600">
      <Check className="w-4 h-4" />
    </span>
  ) : (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-stone-100 text-stone-300">
      <XIcon className="w-4 h-4" />
    </span>
  );
}

function CompareImageCarousel({
  images,
  title,
  propertyId,
  locale,
  onRemove,
}: {
  images: any[];
  title: string;
  propertyId: number;
  locale: string;
  onRemove: () => void;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const sorted =
    images.length > 0 ? images : [{ imageUrl: "/placeholder-property.jpg" }];

  const prev = () =>
    setCurrentIdx((i) => (i === 0 ? sorted.length - 1 : i - 1));
  const next = () =>
    setCurrentIdx((i) => (i === sorted.length - 1 ? 0 : i + 1));

  return (
    <div className="relative">
      <Link href={`/${locale}/properties/${propertyId}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sorted[currentIdx].imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      </Link>

      {/* Navigation arrows */}
      {sorted.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault();
              prev();
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow text-stone-700 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              next();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow text-stone-700 flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Image counter */}
      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
        {currentIdx + 1} / {sorted.length}
      </div>

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 hover:bg-rose-500 hover:text-white text-rose-500 flex items-center justify-center transition-colors shadow"
        title="Remove"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
