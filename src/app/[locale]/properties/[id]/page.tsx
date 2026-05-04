import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Bed,
  Bath,
  Maximize,
  MapPin,
  Layers,
  Phone,
  Mail,
  ChevronLeft,
  Train,
  Sofa,
  Zap,
  Building2,
  Calendar,
  Edit3,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import prisma from "@/lib/prisma";
import { getIntlLocale } from "@/lib/utils";
import { getStationFullName } from "@/lib/stations";
import ImageGallery from "@/components/property/ImageGallery";
import FeaturedPropertyCard from "@/components/property/FeaturedPropertyCard";
import AdminEditButton from "@/components/property/AdminEditButton";
import SectionTitle from "@/components/ui/SectionTitle";
import StatTile from "@/components/ui/StatTile";

const FURNITURE_MAP: Record<string, { en: string; th: string }> = {
  bed: { en: "Bed", th: "เตียง" }, mattress: { en: "Mattress", th: "ฟูก/ที่นอน" },
  wardrobe: { en: "Wardrobe", th: "ตู้เสื้อผ้า" }, dressingTable: { en: "Dressing Table", th: "โต๊ะเครื่องแป้ง" },
  sofa: { en: "Sofa", th: "โซฟา" }, coffeeTable: { en: "Coffee Table", th: "โต๊ะกลาง" },
  tvCabinet: { en: "TV Cabinet", th: "ชั้นวางทีวี" }, curtains: { en: "Curtains / Blinds", th: "ผ้าม่าน/มู่ลี่" },
  kitchenCounter: { en: "Kitchen Counter", th: "เคาน์เตอร์ครัว" }, sink: { en: "Sink", th: "ซิงก์ล้างจาน" },
  diningTable: { en: "Dining Table", th: "โต๊ะอาหาร" }, chairs: { en: "Chairs", th: "เก้าอี้" },
  showerScreen: { en: "Shower Screen", th: "ฉากกั้นอาบน้ำ" },
};

const APPLIANCE_MAP: Record<string, { en: string; th: string }> = {
  airConditioner: { en: "Air Conditioner", th: "แอร์" }, tv: { en: "TV", th: "ทีวี" },
  refrigerator: { en: "Refrigerator", th: "ตู้เย็น" }, microwave: { en: "Microwave", th: "ไมโครเวฟ" },
  stove: { en: "Stove", th: "เตาไฟฟ้า/เตาแก๊ส" }, cookerHood: { en: "Cooker Hood", th: "เครื่องดูดควัน" },
  washingMachine: { en: "Washing Machine", th: "เครื่องซักผ้า" },
  digitalDoorLock: { en: "Digital Door Lock", th: "" }, waterHeater: { en: "Water Heater", th: "เครื่องทำน้ำอุ่น" },
};

const FACILITY_MAP: Record<string, { en: string; th: string }> = {
  petFriendly: { en: "Pet-Friendly", th: "เลี้ยงสัตว์ได้" }, convenienceStore: { en: "Convenience Store", th: "ร้านสะดวกซื้อ" },
  coWorkingSpace: { en: "Co-working Space", th: "" }, evCharger: { en: "EV Charger", th: "" },
  garden: { en: "Garden", th: "สวนหย่อม" }, swimmingPool: { en: "Swimming Pool", th: "สระว่ายน้ำ" },
  parking: { en: "Parking", th: "ที่จอดรถ" }, sauna: { en: "Sauna", th: "ซาวน่า" },
  playground: { en: "Playground", th: "สนามเด็กเล่น" }, library: { en: "Library", th: "ห้องหนังสือ" },
  security24h: { en: "24/7 Security", th: "รักษาความปลอดภัย" }, karaokeRoom: { en: "Karaoke Room", th: "คาราโอเกะ" },
  meetingRoom: { en: "Meeting Room", th: "ห้องประชุม" }, fitnessGym: { en: "Fitness/Gym", th: "ฟิตเนส" },
  clubhouse: { en: "Clubhouse", th: "คลับเฮ้าส์" }, snookerTable: { en: "Snooker Table", th: "โต๊ะสนุ๊ก" },
  basketballCourt: { en: "Basketball Court", th: "สนามบาส" }, badmintonCourt: { en: "Badminton Court", th: "สนามแบดมินตัน" },
  lowRise: { en: "Low-Rise", th: "" }, highRise: { en: "High-Rise", th: "" },
  bedroomPartition: { en: "Bedroom Partition", th: "ฉากกั้นห้องนอน" }, kitchenPartition: { en: "Kitchen Partition", th: "ฉากกั้นห้องครัว" },
};

function parseJson(val: string | null): string[] {
  if (!val) return [];
  try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; }
}

import { getStationThaiName } from "@/lib/stations";

async function getMessages(locale: string) {
  return (await import(`@/messages/${locale}.json`)).default;
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const messages = await getMessages(locale);
  const t = messages.property;

  const property = await prisma.property.findUnique({
    where: { id: parseInt(id) },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      owner: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
      agent: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
      propertyAmenities: { include: { amenity: true } },
      project: true,
      reviews: {
        where: { isApproved: true },
        include: { user: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!property) notFound();

  await prisma.property.update({
    where: { id: parseInt(id) },
    data: { views: { increment: 1 } },
  });

  const title =
    property.projectName ||
    (locale !== "th" && property.titleEn ? property.titleEn : property.titleTh);
  const description =
    locale !== "th" && property.descriptionEn
      ? property.descriptionEn
      : property.descriptionTh;
  const formatPrice = (price: number) =>
    new Intl.NumberFormat(getIntlLocale(locale)).format(price);

  const furniture = parseJson(property.furnitureDetails);
  const appliances = parseJson(property.electricalAppliances);
  const facilities = parseJson(property.facilities);
  const stations = parseJson(property.nearbyStations);
  const price = Number(property.price);
  const salePrice = Number(property.salePrice);
  const lat = property.latitude ? Number(property.latitude) : null;
  const lng = property.longitude ? Number(property.longitude) : null;

  const heroImage =
    property.images.find((i) => i.isPrimary)?.imageUrl ||
    property.images[0]?.imageUrl ||
    null;

  const isRent =
    property.listingType === "RENT" || property.listingType === "RENT_AND_SALE";
  const isSale =
    property.listingType === "SALE" || property.listingType === "RENT_AND_SALE";
  const isSold = property.isSold || property.status === "SOLD";
  const isRented = property.status === "RENTED";

  // Get site settings for logo + contact info
  const contactSettings = await prisma.siteSetting.findMany({
    where: { key: { in: ["logo", "contactPhone", "contactLine"] } },
  });
  const settingMap = Object.fromEntries(contactSettings.map((s) => [s.key, s.valueTh]));
  const siteSettings = { logo: settingMap.logo || null };
  const contactPhone = settingMap.contactPhone || "0617896000";
  const contactLine = (settingMap.contactLine || "@cfx5958x").replace(/^@/, "");

  // Fetch similar properties
  const similarRaw = await prisma.property.findMany({
    where: { status: "ADDED_PROPERTIES", id: { not: property.id } },
    include: { images: { orderBy: { sortOrder: "asc" } } },
    take: 3,
    orderBy: { createdAt: "desc" },
  });
  const similar = similarRaw.map((p) => ({
    ...p,
    price: Number(p.price),
    salePrice: p.salePrice ? Number(p.salePrice) : null,
    sizeSqm: p.sizeSqm ? Number(p.sizeSqm) : null,
    latitude: p.latitude ? Number(p.latitude) : null,
    longitude: p.longitude ? Number(p.longitude) : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    availableDate: p.availableDate ? p.availableDate.toISOString() : null,
  }));

  return (
    <div className="bg-stone-50 min-h-screen">
      {/* HERO SECTION */}
      <section className="relative">
        <div className="relative h-[55vh] min-h-[380px] max-h-[560px] overflow-hidden bg-stone-900">
          {heroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroImage}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-stone-700">
              <Building2 className="w-24 h-24" />
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/50 to-stone-900/10" />

          {/* SOLD OUT / RENTED watermark */}
          {(isSold || isRented) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span
                className="text-white/30 text-5xl sm:text-7xl font-black tracking-widest uppercase"
                style={{
                  transform: "rotate(-15deg)",
                  textShadow: "2px 2px 12px rgba(0,0,0,0.4)",
                }}
              >
                {isRented ? "RENTED" : "SOLD OUT"}
              </span>
            </div>
          )}

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
              <Link
                href={`/${locale}/properties`}
                className="inline-flex items-center gap-1.5 text-sm text-white/90 hover:text-white bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                {messages.common.back}
              </Link>
              <AdminEditButton propertyId={property.id} locale={locale} variant="top" />
            </div>
          </div>

          {/* Bottom info */}
          <div className="absolute bottom-0 left-0 right-0 z-10 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
              {/* Listing badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {isRent && (
                  <span className="bg-emerald-500 text-white text-[11px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full">
                    {locale === "th" ? "เช่า" : "For Rent"}
                  </span>
                )}
                {isSale && (
                  <span className="bg-[#C8A951] text-white text-[11px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full">
                    {locale === "th" ? "ขาย" : "For Sale"}
                  </span>
                )}
                {isSold && (
                  <span className="bg-rose-500 text-white text-[11px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full">
                    Sold Out
                  </span>
                )}
                {isRented && (
                  <span className="bg-teal-500 text-white text-[11px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full">
                    Rented
                  </span>
                )}
                {property.condition === "FIRST_HAND" && (
                  <span className="bg-blue-500 text-white text-[11px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full">
                    {locale === "th" ? "มือ 1" : "Brand New"}
                  </span>
                )}
                {property.condition === "SECOND_HAND" && (
                  <span className="bg-stone-700 text-white text-[11px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full">
                    {locale === "th" ? "มือ 2" : "Pre-owned"}
                  </span>
                )}
                {property.propertyType === "LAND" && (
                  <span className="bg-amber-700 text-white text-[11px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full">
                    {locale === "th" ? "ที่ดิน" : "Land"}
                  </span>
                )}
              </div>

              {/* Project link badge */}
              {property.project && (
                <Link
                  href={`/${locale}/projects/${property.project.id}`}
                  className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-[#E8C97A] mb-3 hover:underline"
                >
                  {property.project.nameTh}
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-3">
                {title}
              </h1>
              {property.address && (
                <p className="flex items-center gap-2 text-sm md:text-base text-white/80">
                  <MapPin className="w-4 h-4 text-[#E8C97A]" />
                  {property.address}
                </p>
              )}
              {stations.length > 0 && (
                <p className="flex items-center gap-2 text-sm text-white/70 mt-1.5">
                  <Train className="w-4 h-4 text-[#E8C97A]" />
                  {stations.map(getStationThaiName).join(" • ")}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* QUICK STATS BAR */}
      <section className="border-b border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {property.propertyType === "LAND" ? (
            <div className="grid grid-cols-3 divide-x divide-stone-100">
              <StatTile
                icon={<Maximize className="w-5 h-5" />}
                label={locale === "th" ? "ไร่" : "Rai"}
                value={
                  property.landSizeRai
                    ? Number(property.landSizeRai).toString()
                    : "—"
                }
              />
              <StatTile
                icon={<Maximize className="w-5 h-5" />}
                label={locale === "th" ? "งาน" : "Ngan"}
                value={
                  property.landSizeNgan
                    ? Number(property.landSizeNgan).toString()
                    : "—"
                }
              />
              <StatTile
                icon={<Maximize className="w-5 h-5" />}
                label={locale === "th" ? "ตร.ว." : "Sqw"}
                value={
                  property.landSizeWa
                    ? Number(property.landSizeWa).toString()
                    : "—"
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-stone-100">
              <StatTile
                icon={<Bed className="w-5 h-5" />}
                label={t.bedrooms}
                value={property.bedrooms || "—"}
              />
              <StatTile
                icon={<Bath className="w-5 h-5" />}
                label={t.bathrooms}
                value={property.bathrooms || "—"}
              />
              <StatTile
                icon={<Maximize className="w-5 h-5" />}
                label={t.size}
                value={
                  property.sizeSqm
                    ? `${Number(property.sizeSqm)} ${t.sqm}`
                    : "—"
                }
              />
              <StatTile
                icon={<Layers className="w-5 h-5" />}
                label={t.floor}
                value={
                  property.floor
                    ? `${property.floor}${
                        property.building ? ` / ${property.building}` : ""
                      }`
                    : "—"
                }
              />
            </div>
          )}
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-8 space-y-12">
            {/* Image Gallery */}
            {property.images.length > 0 && (
              <section>
                <SectionTitle
                  badge={locale === "th" ? "รูปภาพ" : "Gallery"}
                  title={
                    locale === "th"
                      ? `รูปภาพทั้งหมด (${property.images.length})`
                      : `All Photos (${property.images.length})`
                  }
                  className="mb-6"
                />
                <ImageGallery images={property.images} title={title} />
              </section>
            )}

            {/* Description */}
            {description && (
              <section>
                <SectionTitle
                  badge={locale === "th" ? "เกี่ยวกับห้อง" : "About"}
                  title={
                    locale === "th"
                      ? "รายละเอียด"
                      : "Property Description"
                  }
                  className="mb-5"
                />
                <p className="text-stone-700 leading-relaxed text-base whitespace-pre-line">
                  {description}
                </p>
              </section>
            )}

            {/* Nearby BTS / MRT */}
            {stations.length > 0 && (
              <section>
                <SectionTitle
                  badge={locale === "th" ? "การเดินทาง" : "Transit"}
                  title={
                    locale === "th"
                      ? "BTS / MRT ใกล้เคียง"
                      : "Nearby BTS / MRT"
                  }
                  className="mb-5"
                />
                <div className="flex flex-wrap gap-2">
                  {stations.map((code: string) => {
                    const fullName = getStationFullName(code);
                    const lineColor =
                      code.startsWith("BL")
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : code.startsWith("PP")
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : code.startsWith("YL")
                        ? "bg-yellow-50 text-yellow-800 border-yellow-300"
                        : code.startsWith("PK")
                        ? "bg-pink-50 text-pink-700 border-pink-200"
                        : code.startsWith("A")
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : code.startsWith("G")
                        ? "bg-amber-50 text-amber-800 border-amber-300"
                        : code.startsWith("S") || code === "W1"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"; // BTS Sukhumvit (N/E/CEN)
                    return (
                      <div
                        key={code}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm shadow-sm ${lineColor}`}
                      >
                        <Train className="w-4 h-4" />
                        {fullName}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Facilities */}
            {facilities.length > 0 && (
              <section>
                <SectionTitle
                  badge={locale === "th" ? "ส่วนกลาง" : "Facilities"}
                  title={
                    locale === "th"
                      ? "สิ่งอำนวยความสะดวก"
                      : "Facilities & Amenities"
                  }
                  className="mb-5"
                />
                <div className="flex flex-wrap gap-2">
                  {facilities.map((key) => {
                    const item = FACILITY_MAP[key];
                    return (
                      <div
                        key={key}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow text-sm"
                      >
                        <Building2 className="w-4 h-4 text-[#C8A951]" />
                        {item ? item[locale === "th" ? "th" : "en"] || item.en : key}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Furniture */}
            {furniture.length > 0 && (
              <section>
                <SectionTitle
                  badge={locale === "th" ? "เฟอร์นิเจอร์" : "Furniture"}
                  title={
                    locale === "th"
                      ? "เฟอร์นิเจอร์ในห้อง"
                      : "Furniture Included"
                  }
                  className="mb-5"
                />
                <div className="flex flex-wrap gap-2">
                  {furniture.map((key) => {
                    const item = FURNITURE_MAP[key];
                    return (
                      <div
                        key={key}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow text-sm"
                      >
                        <Sofa className="w-4 h-4 text-[#C8A951]" />
                        {item ? item[locale === "th" ? "th" : "en"] || item.en : key}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Electrical Appliances */}
            {appliances.length > 0 && (
              <section>
                <SectionTitle
                  badge={locale === "th" ? "เครื่องใช้ไฟฟ้า" : "Appliances"}
                  title={
                    locale === "th"
                      ? "เครื่องใช้ไฟฟ้า"
                      : "Electrical Appliances"
                  }
                  className="mb-5"
                />
                <div className="flex flex-wrap gap-2">
                  {appliances.map((key) => {
                    const item = APPLIANCE_MAP[key];
                    return (
                      <div
                        key={key}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow text-sm"
                      >
                        <Zap className="w-4 h-4 text-[#C8A951]" />
                        {item ? item[locale === "th" ? "th" : "en"] || item.en : key}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Location */}
            {lat && lng && (
              <section>
                <SectionTitle
                  badge={locale === "th" ? "ที่ตั้ง" : "Location"}
                  title={locale === "th" ? "ตำแหน่งและสภาพแวดล้อม" : "Location"}
                  className="mb-5"
                />
                <div className="rounded-2xl overflow-hidden shadow-sm" style={{ height: 380 }}>
                  <iframe
                    src={`https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </section>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-stone-400 pt-6 border-t border-stone-200">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {locale === "th" ? "สร้างเมื่อ" : "Created"}:{" "}
                {new Date(property.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5" />
                {locale === "th" ? "แก้ไขล่าสุด" : "Updated"}:{" "}
                {new Date(property.updatedAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <span className="font-mono">
                EST-{String(property.id).padStart(6, "0")}
              </span>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 self-start">
            {/* Price Card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <div className="space-y-1">
                {price > 0 && (
                  <div>
                    <div className="text-xs uppercase tracking-widest text-stone-400 mb-1">
                      {locale === "th" ? "ค่าเช่า" : "Rental"}
                    </div>
                    <p className="text-3xl font-bold text-[#C8A951]">
                      ฿{formatPrice(price)}
                      <span className="text-sm font-normal text-stone-500">
                        /{locale === "th" ? "เดือน" : "mo"}
                      </span>
                    </p>
                  </div>
                )}
                {salePrice > 0 && (
                  <div className={price > 0 ? "pt-3 mt-3 border-t border-stone-100" : ""}>
                    <div className="text-xs uppercase tracking-widest text-stone-400 mb-1">
                      {locale === "th" ? "ราคาขาย" : "Sale Price"}
                    </div>
                    <p className={`font-bold ${price > 0 ? "text-xl text-stone-700" : "text-3xl text-[#C8A951]"}`}>
                      ฿{formatPrice(salePrice)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={siteSettings.logo || "/placeholder.png"}
                    alt="NPB Property"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <p className="font-bold text-stone-900">
                    NPB Property
                  </p>
                  <p className="text-xs text-stone-500">
                    {locale === "th"
                      ? "ตัวแทนอสังหาฯ มืออาชีพ"
                      : "Professional Real Estate Agent"}
                  </p>
                </div>
              </div>

              <div className="space-y-2 mb-5">
                <a
                  href={`tel:${contactPhone.replace(/[^0-9+]/g, "")}`}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-full font-medium text-sm transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  {locale === "th" ? "โทรหาเจ้าหน้าที่" : "Call Agent"}
                </a>
                <a
                  href={`https://line.me/R/ti/p/${contactLine}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 border border-stone-200 hover:bg-stone-50 text-stone-900 rounded-full font-medium text-sm transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  {locale === "th" ? "แชท LINE" : "Message Agent"}
                </a>
              </div>

              <form
                action={`/api/contact`}
                method="POST"
                className="space-y-3 pt-5 border-t border-stone-100"
              >
                <input type="hidden" name="propertyId" value={property.id} />
                <input type="hidden" name="propertyName" value={title} />
                <p className="text-xs uppercase tracking-widest text-stone-400">
                  {locale === "th" ? "ส่งข้อมูลติดต่อ" : "Inquiry Form"}
                </p>
                <input
                  type="text"
                  name="name"
                  placeholder={locale === "th" ? "ชื่อของคุณ" : "Your Name"}
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#C8A951]/30 focus:border-[#C8A951]"
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder={locale === "th" ? "เบอร์โทร" : "Phone"}
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#C8A951]/30 focus:border-[#C8A951]"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#C8A951]/30 focus:border-[#C8A951]"
                />
                <textarea
                  name="message"
                  rows={3}
                  placeholder={
                    locale === "th"
                      ? "สนใจห้องนี้..."
                      : "I'm interested in this property..."
                  }
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#C8A951]/30 focus:border-[#C8A951] resize-none"
                />
                <button
                  type="submit"
                  className="w-full py-3 bg-[#C8A951] hover:bg-[#B8993F] text-white rounded-full font-semibold text-sm transition-colors"
                >
                  {locale === "th" ? "ส่งข้อความ" : "Send Inquiry"}
                </button>
              </form>
            </div>

            {/* Project Link Card */}
            {property.project && (
              <Link
                href={`/${locale}/projects/${property.project.id}`}
                className="block bg-gradient-to-br from-stone-900 via-stone-800 to-[#5a4621] text-white rounded-3xl p-6 overflow-hidden relative group"
              >
                <div className="absolute top-0 right-0 w-28 h-28 bg-[#C8A951]/20 rounded-full blur-3xl -translate-y-10 translate-x-10" />
                <div className="relative">
                  <Sparkles className="w-5 h-5 text-[#E8C97A] mb-2" />
                  <div className="text-xs uppercase tracking-widest text-[#E8C97A] mb-1">
                    {locale === "th" ? "อยู่ในโครงการ" : "Part of"}
                  </div>
                  <h3 className="font-bold text-lg mb-3">{property.project.nameTh}</h3>
                  <p className="text-xs text-white/70 mb-4">
                    {locale === "th"
                      ? "ดูข้อมูลโครงการ สิ่งอำนวยความสะดวก และห้องอื่นในโครงการนี้"
                      : "Explore project details, facilities, and other units"}
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-[#E8C97A] group-hover:gap-2 transition-all">
                    {locale === "th" ? "ดูโครงการ" : "View Project"}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            )}

            <AdminEditButton propertyId={property.id} locale={locale} />
          </aside>
        </div>
      </div>

      {/* You Might Also Like */}
      {similar.length > 0 && (
        <section className="bg-white border-t border-stone-200 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionTitle
              badge={locale === "th" ? "แนะนำ" : "More Listings"}
              title={
                locale === "th"
                  ? "อสังหาริมทรัพย์ที่คุณอาจสนใจ"
                  : "You Might Also Like"
              }
              align="center"
              className="mb-10"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {similar.map((p: any) => (
                <FeaturedPropertyCard
                  key={p.id}
                  property={p}
                  locale={locale}
                  messages={messages}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
