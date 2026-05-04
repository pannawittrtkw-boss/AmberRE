import Link from "next/link";
import { Bed, Bath, Maximize, MapPin, Star, ArrowRight } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import PropertyImageCarousel from "./PropertyImageCarousel";

interface PropertyCardProps {
  property: {
    id: number;
    titleTh: string;
    titleEn: string | null;
    propertyType: string;
    listingType: string;
    condition?: string | null;
    price: number;
    salePrice?: number | null;
    sizeSqm: number | null;
    bedrooms: number;
    bathrooms: number;
    address: string | null;
    isFeatured: boolean;
    isSold: boolean;
    images: { imageUrl: string; isPrimary: boolean }[];
  };
  locale: string;
  messages: any;
}

export default function PropertyCard({
  property,
  locale,
  messages,
}: PropertyCardProps) {
  const t = messages.property;
  const title =
    locale !== "th" && property.titleEn ? property.titleEn : property.titleTh;
  const formatPrice = (price: number) => formatNumber(price, locale);

  const typeLabels: Record<string, string> = {
    CONDO: t.condo,
    HOUSE: t.house,
    TOWNHOUSE: t.townhouse,
  };

  const isRent =
    property.listingType === "RENT" ||
    property.listingType === "RENT_AND_SALE";
  const isSale =
    property.listingType === "SALE" ||
    property.listingType === "RENT_AND_SALE";

  return (
    <Link href={`/${locale}/properties/${property.id}`} className="block group">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <PropertyImageCarousel
            images={property.images}
            alt={title}
            className="w-full h-full"
            imageClassName="group-hover:scale-105"
          />

          {/* Listing badges */}
          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap max-w-[70%]">
            {isRent && (
              <span className="bg-emerald-500 text-white text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm">
                {locale === "th" ? "เช่า" : "Rent"}
              </span>
            )}
            {isSale && (
              <span className="bg-[#C8A951] text-white text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm">
                {locale === "th" ? "ขาย" : "Sale"}
              </span>
            )}
            {property.condition === "FIRST_HAND" && (
              <span className="bg-blue-500 text-white text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm">
                {t.firstHand || "Brand New"}
              </span>
            )}
            {property.condition === "SECOND_HAND" && (
              <span className="bg-stone-700 text-white text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm">
                {t.secondHand || "Pre-owned"}
              </span>
            )}
          </div>

          {/* Type pill - top right */}
          <span className="absolute top-3 right-3 bg-white/95 backdrop-blur text-stone-800 text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm">
            {typeLabels[property.propertyType] || property.propertyType}
          </span>

          {/* Featured ribbon - bottom left */}
          {property.isFeatured && !property.isSold && (
            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 bg-amber-50 backdrop-blur text-[#8B6F2F] text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm">
              <Star className="w-3 h-3 fill-[#C8A951] text-[#C8A951]" />
              {t.featured}
            </span>
          )}

          {/* Sold watermark */}
          {property.isSold && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-stone-900/30">
              <span
                className="text-white/90 text-3xl font-black tracking-widest uppercase"
                style={{
                  transform: "rotate(-15deg)",
                  textShadow: "2px 2px 8px rgba(0,0,0,0.4)",
                }}
              >
                {t.sold}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="font-bold text-stone-900 text-base line-clamp-1 group-hover:text-[#C8A951] transition-colors">
            {title}
          </h3>
          {property.address && (
            <p className="flex items-center gap-1 text-xs text-stone-500 mt-1.5 line-clamp-1">
              <MapPin className="w-3 h-3 text-[#C8A951] shrink-0" />
              {property.address}
            </p>
          )}

          {/* Specs */}
          <div className="flex items-center gap-4 text-xs text-stone-600 mt-3">
            {property.propertyType !== "LAND" && property.bedrooms > 0 && (
              <span className="flex items-center gap-1">
                <Bed className="w-3.5 h-3.5 text-[#C8A951]" />
                {property.bedrooms}
              </span>
            )}
            {property.propertyType !== "LAND" && property.bathrooms > 0 && (
              <span className="flex items-center gap-1">
                <Bath className="w-3.5 h-3.5 text-[#C8A951]" />
                {property.bathrooms}
              </span>
            )}
            {property.sizeSqm && (
              <span className="flex items-center gap-1">
                <Maximize className="w-3.5 h-3.5 text-[#C8A951]" />
                {property.sizeSqm} {t.sqm}
              </span>
            )}
          </div>

          {/* Price + arrow */}
          <div className="mt-auto pt-4 flex items-end justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-widest text-stone-400">
                {locale === "th" ? "ราคา" : "Price"}
              </div>
              {isRent && isSale ? (
                <div className="space-y-0.5">
                  <div className="text-base sm:text-lg font-bold text-stone-900 leading-tight">
                    ฿{formatPrice(property.price)}
                    <span className="text-xs font-normal text-stone-500">
                      {t.perMonth}
                    </span>
                  </div>
                  {Number(property.salePrice) > 0 && (
                    <div className="text-xs sm:text-sm text-stone-500">
                      <span className="text-[10px] uppercase tracking-widest text-stone-400 mr-1">
                        {locale === "th" ? "ขาย" : "Sale"}
                      </span>
                      ฿{formatPrice(Number(property.salePrice))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-lg font-bold text-stone-900">
                  ฿{formatPrice(property.price)}
                  {isRent && (
                    <span className="text-xs font-normal text-stone-500">
                      {t.perMonth}
                    </span>
                  )}
                </div>
              )}
            </div>
            <span className="w-9 h-9 rounded-full bg-stone-100 group-hover:bg-[#C8A951] group-hover:text-white transition-colors flex items-center justify-center text-stone-400 shrink-0">
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
