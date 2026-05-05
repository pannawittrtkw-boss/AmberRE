"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getIntlLocale } from "@/lib/utils";
import MapSearchBox from "./MapSearchBox";

interface MapProperty {
  id: number;
  titleTh: string;
  titleEn: string | null;
  projectName?: string | null;
  price: number;
  salePrice?: number | null;
  listingType: string;
  propertyType: string;
  latitude: number | null;
  longitude: number | null;
}

interface MapViewProps {
  properties: MapProperty[];
  locale: string;
  center?: [number, number];
  zoom?: number;
  className?: string;
}

function formatPriceCompact(value: number): string {
  if (!value) return "";
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `฿${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (value >= 1_000) {
    const k = value / 1_000;
    return `฿${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
  }
  return `฿${value}`;
}

function buildPriceMarker(label: string, isRent: boolean): L.DivIcon {
  const bg = isRent ? "#0f766e" : "#C8A951"; // teal for rent, gold for sale
  const html = `
    <div class="npb-price-marker" style="--bg:${bg}">
      <span>${label}</span>
    </div>`;
  return L.divIcon({
    html,
    className: "npb-price-marker-wrapper",
    iconSize: [0, 0], // let CSS size it
    iconAnchor: [0, 36],
  });
}

export default function MapView({
  properties,
  locale,
  center = [13.7563, 100.5018], // Bangkok
  zoom = 12,
  className = "w-full h-[600px]",
}: MapViewProps) {
  const [mounted, setMounted] = useState(false);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`${className} bg-gray-200 rounded-xl flex items-center justify-center`}
      >
        Loading map...
      </div>
    );
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat(getIntlLocale(locale)).format(price);

  const validProperties = properties.filter((p) => p.latitude && p.longitude);

  return (
    <div className={`${className} relative`}>
      <MapSearchBox map={mapInstance} locale={locale} />
      <style jsx global>{`
        .npb-price-marker-wrapper {
          background: transparent !important;
          border: none !important;
        }
        .npb-price-marker {
          position: relative;
          display: inline-flex;
          align-items: center;
          background: var(--bg);
          color: white;
          font-size: 12px;
          font-weight: 700;
          padding: 5px 10px;
          border-radius: 9999px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
          white-space: nowrap;
          transform: translate(-50%, -100%);
          border: 2px solid white;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .npb-price-marker:hover {
          transform: translate(-50%, -100%) scale(1.08);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
          z-index: 1000;
        }
        .npb-price-marker::after {
          content: "";
          position: absolute;
          left: 50%;
          bottom: -7px;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 7px solid var(--bg);
        }
      `}</style>

      <MapContainer
        center={center}
        zoom={zoom}
        ref={(m) => {
          if (m) setMapInstance(m);
        }}
        className="w-full h-full rounded-xl z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validProperties.map((property) => {
          const isRent =
            property.listingType === "RENT" ||
            property.listingType === "RENT_AND_SALE";
          // For RENT_AND_SALE, prefer rent monthly figure (smaller — fits the pill better)
          const displayPrice = isRent
            ? property.price
            : property.salePrice && property.salePrice > 0
            ? property.salePrice
            : property.price;
          const compact = formatPriceCompact(displayPrice);
          const title =
            property.projectName ||
            (locale !== "th" && property.titleEn
              ? property.titleEn
              : property.titleTh);
          const icon = buildPriceMarker(compact, isRent);

          return (
            <Marker
              key={property.id}
              position={[property.latitude!, property.longitude!]}
              icon={icon}
            >
              {/* Hover label: project name */}
              <Tooltip
                direction="top"
                offset={[0, -36]}
                opacity={1}
                className="!bg-stone-900 !text-white !border-0 !rounded-lg !shadow-lg !text-xs !px-2 !py-1"
              >
                <div className="font-medium">{title}</div>
                <div className="text-[10px] opacity-80">
                  ฿{formatPrice(displayPrice)}
                  {isRent && (locale === "th" ? "/เดือน" : "/mo")}
                </div>
              </Tooltip>

              <Popup>
                <div className="text-sm min-w-[180px]">
                  <p className="font-semibold mb-1">{title}</p>
                  <p className="text-[#C8A951] font-bold text-base">
                    ฿{formatPrice(displayPrice)}
                    {isRent && (
                      <span className="text-xs font-normal text-gray-500">
                        {locale === "th" ? "/เดือน" : "/month"}
                      </span>
                    )}
                  </p>
                  {property.salePrice &&
                    property.salePrice > 0 &&
                    isRent &&
                    property.listingType === "RENT_AND_SALE" && (
                      <p className="text-xs text-gray-600 mt-0.5">
                        {locale === "th" ? "ขาย" : "Sale"}: ฿
                        {formatPrice(Number(property.salePrice))}
                      </p>
                    )}
                  <p className="text-gray-500 text-xs mt-1">
                    {property.listingType === "RENT"
                      ? locale === "th"
                        ? "เช่า"
                        : "Rent"
                      : property.listingType === "SALE"
                      ? locale === "th"
                        ? "ขาย"
                        : "Sale"
                      : locale === "th"
                      ? "เช่า/ขาย"
                      : "Rent / Sale"}
                  </p>
                  <a
                    href={`/${locale}/properties/${property.id}`}
                    className="inline-block mt-2 text-[#C8A951] hover:underline text-xs font-medium"
                  >
                    {locale === "th" ? "ดูรายละเอียด →" : "View Details →"}
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
