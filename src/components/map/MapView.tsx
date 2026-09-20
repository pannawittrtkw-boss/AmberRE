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
  // Prisma Decimal columns — serialize to JSON as strings, not numbers.
  latitude: number | string | null;
  longitude: number | string | null;
  building?: string | null;
  floor?: number | null;
  bedrooms?: number | null;
  sizeSqm?: number | string | null;
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

// Same building/project often has many units geocoded to the exact same
// lat/lng — stacking that many individual price pins on the same pixel
// makes all but the topmost one unclickable. Shown instead as one
// "N รายการ" badge; clicking it opens a popup listing every unit there.
function buildClusterMarker(count: number): L.DivIcon {
  const html = `
    <div class="npb-cluster-marker">
      <span>${count} รายการ</span>
    </div>`;
  return L.divIcon({
    html,
    className: "npb-price-marker-wrapper",
    iconSize: [0, 0],
    iconAnchor: [0, 36],
  });
}

// Prisma Decimal fields (latitude/longitude) serialize to JSON as strings,
// not numbers, even though the API's declared response shape says number —
// coerce defensively before doing any arithmetic on them.
function roundCoord(n: number | string): string {
  return Number(n).toFixed(6);
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
  const [messages, setMessages] = useState<any>(null);

  useEffect(() => {
    import(`@/messages/${locale}.json`).then((m) => setMessages(m.default));
  }, [locale]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`${className} bg-gray-200 rounded-xl flex items-center justify-center`}
      >
        {messages?.map?.loading || "Loading map..."}
      </div>
    );
  }

  const tc = messages?.common ?? {};
  const tp = messages?.property ?? {};

  const listingLabel = (type: string) => {
    if (type === "RENT") return tc.rent || "Rent";
    if (type === "SALE") return tc.sale || "Sale";
    return tc.rentAndSale || "Rent & Sale";
  };

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
        .npb-cluster-marker {
          position: relative;
          display: inline-flex;
          align-items: center;
          background: #1e293b;
          color: white;
          font-size: 12px;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 9999px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 0 3px rgba(30, 41, 59, 0.18);
          white-space: nowrap;
          transform: translate(-50%, -100%);
          border: 2px solid white;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .npb-cluster-marker:hover {
          transform: translate(-50%, -100%) scale(1.08);
          z-index: 1000;
        }
        .npb-cluster-marker::after {
          content: "";
          position: absolute;
          left: 50%;
          bottom: -7px;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 7px solid #1e293b;
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
        {Object.entries(
          validProperties.reduce<Record<string, MapProperty[]>>((groups, property) => {
            const key = `${roundCoord(property.latitude!)},${roundCoord(property.longitude!)}`;
            (groups[key] ??= []).push(property);
            return groups;
          }, {})
        ).map(([key, group]) => {
          const getPriceInfo = (property: MapProperty) => {
            const isRent =
              property.listingType === "RENT" ||
              property.listingType === "RENT_AND_SALE";
            // For RENT_AND_SALE, prefer rent monthly figure (smaller — fits the pill better)
            const displayPrice = isRent
              ? property.price
              : property.salePrice && property.salePrice > 0
              ? property.salePrice
              : property.price;
            return { isRent, displayPrice };
          };
          const getTitle = (property: MapProperty) =>
            property.projectName ||
            (locale !== "th" && property.titleEn ? property.titleEn : property.titleTh);

          const [lat, lng] = key.split(",").map(Number);

          // Multiple units geocoded to the same spot (same building/project)
          // — show one "N รายการ" badge instead of stacking pins on top of
          // each other, with a popup listing every unit to pick from.
          if (group.length > 1) {
            const groupTitle = getTitle(group[0]);
            return (
              <Marker
                key={key}
                position={[lat, lng]}
                icon={buildClusterMarker(group.length)}
              >
                <Tooltip
                  direction="top"
                  offset={[0, -36]}
                  opacity={1}
                  className="!bg-stone-900 !text-white !border-0 !rounded-lg !shadow-lg !text-xs !px-2 !py-1"
                >
                  <div className="font-medium">{groupTitle}</div>
                  <div className="text-[10px] opacity-80">{group.length} รายการ</div>
                </Tooltip>

                <Popup maxWidth={300}>
                  <div className="text-sm w-[260px]">
                    <p className="font-semibold mb-2">
                      {groupTitle} · {group.length} รายการ
                    </p>
                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 -mx-1">
                      {group.map((property) => {
                        const { isRent, displayPrice } = getPriceInfo(property);
                        const unitLabel = [
                          property.building ? `ตึก ${property.building}` : null,
                          property.floor ? `ชั้น ${property.floor}` : null,
                          property.bedrooms ? `${property.bedrooms} นอน` : null,
                          property.sizeSqm ? `${property.sizeSqm} ตร.ม.` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ");
                        return (
                          <a
                            key={property.id}
                            href={`/${locale}/properties/${property.id}`}
                            className="flex items-center justify-between gap-2 py-2 px-1 hover:bg-gray-50 transition-colors"
                          >
                            <div className="min-w-0">
                              <div className="text-xs text-gray-700 truncate">
                                {unitLabel || (locale !== "th" && property.titleEn ? property.titleEn : property.titleTh)}
                              </div>
                              <div className="text-[10px] text-gray-400">{listingLabel(property.listingType)}</div>
                            </div>
                            <span className="text-[#C8A951] font-bold text-xs shrink-0 whitespace-nowrap">
                              ฿{formatPrice(displayPrice)}
                              {isRent && (
                                <span className="text-[10px] font-normal text-gray-400">{tp.perMonth || "/month"}</span>
                              )}
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          }

          const property = group[0];
          const { isRent, displayPrice } = getPriceInfo(property);
          const compact = formatPriceCompact(displayPrice);
          const title = getTitle(property);
          const icon = buildPriceMarker(compact, isRent);

          return (
            <Marker key={key} position={[lat, lng]} icon={icon}>
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
                  {isRent && (tp.perMonth || "/month")}
                </div>
              </Tooltip>

              <Popup>
                <div className="text-sm min-w-[180px]">
                  <p className="font-semibold mb-1">{title}</p>
                  <p className="text-[#C8A951] font-bold text-base">
                    ฿{formatPrice(displayPrice)}
                    {isRent && (
                      <span className="text-xs font-normal text-gray-500">
                        {tp.perMonth || "/month"}
                      </span>
                    )}
                  </p>
                  {property.salePrice &&
                    property.salePrice > 0 &&
                    isRent &&
                    property.listingType === "RENT_AND_SALE" && (
                      <p className="text-xs text-gray-600 mt-0.5">
                        {tc.sale || "Sale"}: ฿
                        {formatPrice(Number(property.salePrice))}
                      </p>
                    )}
                  <p className="text-gray-500 text-xs mt-1">
                    {listingLabel(property.listingType)}
                  </p>
                  <a
                    href={`/${locale}/properties/${property.id}`}
                    className="inline-block mt-2 text-[#C8A951] hover:underline text-xs font-medium"
                  >
                    {tp.viewDetails || "View Details"} →
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
