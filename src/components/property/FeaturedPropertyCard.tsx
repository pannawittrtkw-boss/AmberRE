"use client";

import Link from "next/link";
import { Heart, Camera, MapPin, Train, Bed, Bath, Maximize, Eye, Calendar, Layers } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { getStationThaiName } from "@/lib/stations";
import { useFavorites } from "@/lib/favorites";
import { useCompare } from "@/lib/compare";
import PropertyImageCarousel from "./PropertyImageCarousel";

function parseJson(val: string | null | undefined): string[] {
  if (!val) return [];
  try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; }
}

interface FeaturedPropertyCardProps {
  property: any;
  locale: string;
  messages: any;
}

export default function FeaturedPropertyCard({ property, locale, messages }: FeaturedPropertyCardProps) {
  const title = property.projectName || (locale !== "th" && property.titleEn ? property.titleEn : property.titleTh);
  const imageCount = property.images?.length || 0;

  const listingType = property.listingType || "RENT";
  const isRent = listingType === "RENT" || listingType === "RENT_AND_SALE";
  const isSale = listingType === "SALE" || listingType === "RENT_AND_SALE";

  const availDate = property.availableDate ? new Date(property.availableDate) : null;
  const isReady = !availDate || availDate <= new Date();

  const isSold = property.isSold || property.status === "SOLD";
  const isRented = property.status === "RENTED";
  const isSoldOrRented = isSold || isRented;

  // Get stations from nearbyStations JSON field
  const stationCodes = parseJson(property.nearbyStations);
  const stationLabels = stationCodes.map(getStationThaiName);

  const { toggleFavorite, isFavorite } = useFavorites();
  const { toggleCompare, isCompared } = useCompare();
  const favorited = isFavorite(property.id);
  const compared = isCompared(property.id);

  const price = Number(property.price) || 0;
  const salePrice = Number(property.salePrice) || 0;
  const sizeSqm = property.sizeSqm ? Number(property.sizeSqm) : null;

  return (
    <Link href={`/${locale}/properties/${property.id}`} className="block group">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <PropertyImageCarousel
            images={property.images || []}
            alt={title}
            className="w-full h-full"
            imageClassName="group-hover:scale-105"
          />

          {/* SOLD OUT / RENTED watermark */}
          {isSoldOrRented && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
              <span
                className="text-white/80 text-3xl sm:text-5xl font-black tracking-widest uppercase"
                style={{ transform: "rotate(-30deg)", textShadow: "2px 2px 8px rgba(0,0,0,0.5)" }}
              >
                {isRented ? "RENTED" : "SOLD OUT"}
              </span>
            </div>
          )}

          {/* Image count badge */}
          {imageCount > 0 && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded">
              <Camera className="w-3 h-3" />
              <span>{imageCount}</span>
            </div>
          )}

          {/* Favorite icon */}
          <button
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-colors shadow-sm"
            onClick={(e) => { e.preventDefault(); toggleFavorite(property.id); }}
          >
            <Heart className={`w-4 h-4 transition-colors ${favorited ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-red-500"}`} />
          </button>

          {/* Compare icon */}
          <button
            className="absolute top-12 right-2 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-colors shadow-sm"
            onClick={(e) => { e.preventDefault(); toggleCompare(property.id); }}
          >
            <Layers className={`w-4 h-4 transition-colors ${compared ? "text-blue-500" : "text-gray-400 hover:text-blue-500"}`} />
          </button>
        </div>

        {/* Tags */}
        <div className="px-3 pt-2.5 pb-1 flex flex-wrap items-center gap-1.5">
          {/* Ready / Available date */}
          {isReady ? (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-600 text-white">
              {locale === "th" ? "พร้อมเข้าอยู่" : "Ready to move in"}
            </span>
          ) : (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500 text-white">
              {locale === "th"
                ? `ว่าง ${availDate!.toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "2-digit" })}`
                : `Available on ${availDate!.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}`}
            </span>
          )}

          {/* Rent tag */}
          {isRent && (
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded bg-[#C8A951] text-white">
              {locale === "th" ? "เช่า" : "Rent"}
            </span>
          )}

          {/* Sale tag */}
          {isSale && (
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded bg-[#C8A951] text-white">
              {locale === "th" ? "ขาย" : "Sale"}
            </span>
          )}

          {/* Condition tag */}
          {property.condition === "FIRST_HAND" && (
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded bg-blue-500 text-white">
              {locale === "th" ? "มือ 1" : "Brand New"}
            </span>
          )}
          {property.condition === "SECOND_HAND" && (
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded bg-stone-700 text-white">
              {locale === "th" ? "มือ 2" : "Pre-owned"}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="px-3 pb-3 flex-1 flex flex-col">
          {/* Title */}
          <h3 className="font-bold text-gray-900 text-sm truncate mt-1">{title}</h3>

          {/* Address */}
          {property.address && (
            <p className="text-xs text-gray-500 flex items-start gap-1 mt-1">
              <MapPin className="w-3 h-3 shrink-0 mt-0.5 text-gray-400" />
              <span className="truncate">{property.address}</span>
            </p>
          )}

          {/* Stations */}
          {stationLabels.length > 0 && (
            <div className="text-xs text-gray-500 flex items-start gap-1 mt-0.5">
              <Train className="w-3 h-3 shrink-0 mt-0.5 text-gray-400" />
              <span className="line-clamp-2">{stationLabels.join(", ")}</span>
            </div>
          )}

          {/* Specs */}
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
            {property.propertyType !== "LAND" && property.bedrooms > 0 && (
              <span className="flex items-center gap-0.5">
                <Bed className="w-3.5 h-3.5" /> {property.bedrooms} Beds
              </span>
            )}
            {property.propertyType !== "LAND" && property.bathrooms > 0 && (
              <span className="flex items-center gap-0.5">
                <Bath className="w-3.5 h-3.5" /> {property.bathrooms} Baths
              </span>
            )}
            {sizeSqm && (
              <span className="flex items-center gap-0.5">
                <Maximize className="w-3.5 h-3.5" /> {sizeSqm} m²
              </span>
            )}
          </div>

          {/* Price */}
          <div className="mt-2.5">
            {price > 0 && (
              <p className="text-lg font-bold text-[#C8A951]">
                ฿ {formatNumber(price, locale)}
                {isRent && (
                  <span className="text-xs font-normal text-gray-500">
                    {" "}{locale === "th" ? "/เดือน" : "/month"}
                  </span>
                )}
              </p>
            )}
            {salePrice > 0 && price > 0 && (
              <p className="text-sm font-semibold text-stone-700 -mt-0.5">
                <span className="text-[10px] uppercase tracking-widest text-gray-400 mr-1">
                  {locale === "th" ? "ขาย" : "Sale"}
                </span>
                ฿ {formatNumber(salePrice, locale)}
              </p>
            )}
            {salePrice > 0 && price === 0 && (
              <p className="text-lg font-bold text-[#C8A951]">
                ฿ {formatNumber(salePrice, locale)}
              </p>
            )}
          </div>

          {/* Footer: EST code, date, views */}
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100 text-[10px] text-gray-400">
            <span>{property.estCode || `EST-${String(property.id).padStart(6, "0")}`}</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-0.5">
                <Calendar className="w-3 h-3" />
                {new Date(property.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
              </span>
              <span className="flex items-center gap-0.5">
                <Eye className="w-3 h-3" />
                {property.views || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
