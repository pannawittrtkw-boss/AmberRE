"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, Polyline, CircleMarker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { X, Phone, TrainFront } from "lucide-react";
import { getIntlLocale } from "@/lib/utils";
import { haversineDistanceKm, estimateTravel, type TravelMode } from "@/lib/geo";
import MapSearchBox from "./MapSearchBox";
import { TRANSIT_LINES } from "@/data/transit-lines";

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
  isRented?: boolean;
  isSold?: boolean;
  status?: string;
}

// Listings in these two pipeline stages aren't "live" yet — the map shows
// them, but the popup swaps "View Details" for a contact prompt instead of
// linking to the (not-yet-public) detail page.
const CONTACT_ONLY_STATUSES = new Set(["VERIFIED", "VERIFIED_OVER_30_DAYS"]);

interface MapViewProps {
  properties: MapProperty[];
  locale: string;
  center?: [number, number];
  zoom?: number;
  className?: string;
  companyPhone?: string | null;
  companyLineId?: string | null;
}

// Admin can store either a bare LINE id ("@cfx5958x") or a full/short URL
// (lin.ee short link or a full line.me link) — use URLs as-is, otherwise
// wrap with the LINE OA deep-link pattern.
function lineContactUrl(lineId: string): string {
  const trimmed = lineId.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://line.me/R/ti/p/${encodeURIComponent(
    trimmed.startsWith("@") ? trimmed : `@${trimmed}`
  )}`;
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

function buildPriceMarker(
  label: string,
  isRent: boolean,
  isActive: boolean,
  isContactOnly: boolean
): L.DivIcon {
  // Verified / Verified 30+ days listings aren't public detail pages yet —
  // marked violet so they read as visually distinct from the teal/gold
  // "fully Added" pins regardless of rent vs sale.
  const bg = isContactOnly ? "#6D28D9" : isRent ? "#0f766e" : "#C8A951"; // teal for rent, gold for sale
  const html = `
    <div class="npb-price-marker${isActive ? " npb-marker--active" : ""}" style="--bg:${bg}">
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
// "N รายการ" badge; clicking it opens the info panel listing every unit.
function buildClusterMarker(count: number, isActive: boolean): L.DivIcon {
  const html = `
    <div class="npb-cluster-marker${isActive ? " npb-marker--active" : ""}">
      <span>${count} รายการ</span>
    </div>`;
  return L.divIcon({
    html,
    className: "npb-price-marker-wrapper",
    iconSize: [0, 0],
    iconAnchor: [0, 36],
  });
}

// The draggable "start point" pin — visually distinct (blue teardrop) from
// the gold/teal price pills used for properties.
function buildSearchPinIcon(): L.DivIcon {
  const html = `
    <div class="npb-search-pin">
      <svg width="30" height="40" viewBox="0 0 30 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 0C6.72 0 0 6.72 0 15c0 11.25 15 25 15 25s15-13.75 15-25c0-8.28-6.72-15-15-15z" fill="#2563eb" stroke="white" stroke-width="2"/>
        <circle cx="15" cy="15" r="5.5" fill="white"/>
      </svg>
    </div>`;
  return L.divIcon({
    html,
    className: "npb-search-pin-wrapper",
    iconSize: [30, 40],
    iconAnchor: [15, 40],
  });
}

// Prisma Decimal fields (latitude/longitude) serialize to JSON as strings,
// not numbers, even though the API's declared response shape says number —
// coerce defensively before doing any arithmetic on them.
function roundCoord(n: number | string): string {
  return Number(n).toFixed(6);
}

// Lets clicking anywhere on the map (not on a marker — Leaflet markers don't
// bubble their clicks to the map by default) drop the start pin there
// directly, without requiring a text search first.
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Station name labels only start appearing once zoomed in far enough that
// they wouldn't just be 190+ overlapping tags across all of Bangkok.
const STATION_LABEL_MIN_ZOOM = 15;

function ZoomTracker({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend() {
      onZoomChange(map.getZoom());
    },
  });
  return null;
}

function buildStationLabelIcon(name: string, color: string): L.DivIcon {
  const html = `
    <div class="npb-station-label" style="--line-color:${color}">
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4.5" y="3" width="15" height="12" rx="4" fill="${color}"/>
        <path d="M4.5 10.5h15" stroke="white" stroke-width="1.4"/>
        <path d="M9.5 3.5v7M14.5 3.5v7" stroke="white" stroke-width="1.2"/>
        <circle cx="8.5" cy="18.5" r="1.6" fill="${color}"/>
        <circle cx="15.5" cy="18.5" r="1.6" fill="${color}"/>
        <path d="M7 15.2l-2.3 3M17 15.2l2.3 3" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <span>${name}</span>
    </div>`;
  return L.divIcon({
    html,
    className: "npb-price-marker-wrapper",
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

// Interchange stations appear once per line they serve (same coordinates,
// different ids) so each line can still be drawn as one continuous
// polyline — collapse those down to one dot per physical location here so
// markers don't stack invisibly on top of each other.
const TRANSIT_STATIONS_BY_COORD = (() => {
  const byCoord = new Map<string, { nameTh: string; nameEn: string; lat: number; lng: number; color: string }>();
  for (const line of TRANSIT_LINES) {
    for (const st of line.stations) {
      const key = `${st.lat.toFixed(5)},${st.lng.toFixed(5)}`;
      if (!byCoord.has(key)) {
        byCoord.set(key, { nameTh: st.nameTh, nameEn: st.nameEn, lat: st.lat, lng: st.lng, color: line.color });
      }
    }
  }
  return Array.from(byCoord.values());
})();

export default function MapView({
  properties,
  locale,
  center = [13.7563, 100.5018], // Bangkok
  zoom = 12,
  className = "w-full h-[600px]",
  companyPhone,
  companyLineId,
}: MapViewProps) {
  const [mounted, setMounted] = useState(false);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [messages, setMessages] = useState<any>(null);
  const [searchMarker, setSearchMarker] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [travelMode, setTravelMode] = useState<TravelMode>("walk");
  // Whichever marker's info panel is currently open — drives both the
  // docked panel content and the route destination. Cleared on close.
  const [activeMarker, setActiveMarker] = useState<{ key: string; group: MapProperty[]; lat: number; lng: number } | null>(null);
  // Whether the company phone/LINE have been revealed for the currently
  // open VERIFIED / VERIFIED_OVER_30_DAYS popup — reset whenever a
  // different marker is opened.
  const [contactRevealed, setContactRevealed] = useState(false);
  const [isDraggingPin, setIsDraggingPin] = useState(false);
  const [showTransit, setShowTransit] = useState(true);
  const [mapZoom, setMapZoom] = useState(zoom);
  // Real street-following route from OpenRouteService, when available —
  // null while loading/unavailable, in which case a straight-line estimate
  // is shown instead (see renderDistance / the Polyline fallback below).
  const [routeData, setRouteData] = useState<{
    coordinates: [number, number][];
    distanceMeters: number;
    durationSeconds: number;
  } | null>(null);

  useEffect(() => {
    import(`@/messages/${locale}.json`).then((m) => setMessages(m.default));
  }, [locale]);

  useEffect(() => {
    setContactRevealed(false);
  }, [activeMarker?.key]);

  // Fetch the real route whenever the pin, the viewed property, or the
  // travel mode changes — skipped while actively dragging the pin so we
  // don't spam the routing API on every pointermove.
  useEffect(() => {
    if (!searchMarker || !activeMarker || isDraggingPin) {
      setRouteData(null);
      return;
    }
    let cancelled = false;
    const params = new URLSearchParams({
      startLat: String(searchMarker.lat),
      startLng: String(searchMarker.lng),
      endLat: String(activeMarker.lat),
      endLng: String(activeMarker.lng),
      mode: travelMode,
    });
    fetch(`/api/route?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setRouteData(d.success ? d.data : null);
      })
      .catch(() => {
        if (!cancelled) setRouteData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [searchMarker?.lat, searchMarker?.lng, activeMarker?.lat, activeMarker?.lng, travelMode, isDraggingPin]);

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

  const getPriceInfo = (property: MapProperty) => {
    const isRent =
      property.listingType === "RENT" || property.listingType === "RENT_AND_SALE";
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

  const renderDistance = (propLat: number, propLng: number) => {
    if (!searchMarker) return null;
    const isCurrentRoute =
      !isDraggingPin && activeMarker?.lat === propLat && activeMarker?.lng === propLng && routeData;

    if (isCurrentRoute) {
      const km = routeData!.distanceMeters / 1000;
      const minutes = routeData!.durationSeconds / 60;
      const kmLabel = km < 1 ? `${Math.round(km * 1000)} ม.` : `${km.toFixed(1)} กม.`;
      const minLabel = minutes < 1 ? "<1" : Math.round(minutes);
      return (
        <span className="text-gray-600">
          {kmLabel} · ~{minLabel} {locale === "th" ? "นาที" : "min"}
        </span>
      );
    }

    // Fallback while the real route loads, fails, or routing isn't
    // configured yet — a straight-line estimate, clearly marked as such.
    const straightKm = haversineDistanceKm(searchMarker.lat, searchMarker.lng, propLat, propLng);
    const { routeKm, minutes } = estimateTravel(straightKm, travelMode);
    const kmLabel = routeKm < 1 ? `${Math.round(routeKm * 1000)} ม.` : `${routeKm.toFixed(1)} กม.`;
    const minLabel = minutes < 1 ? "<1" : Math.round(minutes);
    return (
      <span className="text-gray-500">
        ~{kmLabel} · ~{minLabel} {locale === "th" ? "นาที" : "min"}{" "}
        <span className="text-gray-400">({locale === "th" ? "ประมาณ" : "est."})</span>
      </span>
    );
  };

  const TravelModeToggle = () => (
    <div className="inline-flex rounded-full border border-gray-200 overflow-hidden text-[11px] font-medium">
      <button
        type="button"
        onClick={() => setTravelMode("walk")}
        className={`px-2 py-1 transition-colors ${travelMode === "walk" ? "bg-[#C8A951] text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
      >
        🚶 {locale === "th" ? "เดิน" : "Walk"}
      </button>
      <button
        type="button"
        onClick={() => setTravelMode("drive")}
        className={`px-2 py-1 transition-colors border-l border-gray-200 ${travelMode === "drive" ? "bg-[#C8A951] text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
      >
        🚗 {locale === "th" ? "ขับรถ" : "Drive"}
      </button>
    </div>
  );

  const setAsStart = () => {
    if (!activeMarker) return;
    const groupTitle = getTitle(activeMarker.group[0]);
    setSearchMarker({ lat: activeMarker.lat, lng: activeMarker.lng, label: groupTitle });
    setActiveMarker(null);
  };

  const groupedProperties = Object.entries(
    validProperties.reduce<Record<string, MapProperty[]>>((groups, property) => {
      const key = `${roundCoord(property.latitude!)},${roundCoord(property.longitude!)}`;
      (groups[key] ??= []).push(property);
      return groups;
    }, {})
  );

  return (
    <div className={`${className} relative`}>
      <MapSearchBox
        map={mapInstance}
        locale={locale}
        onSelect={(r) => setSearchMarker({ lat: r.lat, lng: r.lng, label: r.displayName })}
      />

      <button
        type="button"
        onClick={() => setShowTransit((v) => !v)}
        className={`absolute bottom-6 left-3 z-[500] inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium shadow-lg border transition-colors ${
          showTransit
            ? "bg-stone-900 text-white border-stone-900"
            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
        }`}
      >
        <TrainFront className="w-3.5 h-3.5" />
        {locale === "th" ? "เส้นทางรถไฟฟ้า" : "Transit lines"}
      </button>
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
        .npb-marker--active {
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.45), 0 2px 8px rgba(0, 0, 0, 0.3) !important;
        }
        .npb-station-label {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #ffffff;
          color: #1c1917;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.2;
          padding: 3px 8px 3px 6px;
          border-radius: 5px;
          border: 1.5px solid var(--line-color, #1c1917);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          white-space: nowrap;
          transform: translate(7px, -50%);
          pointer-events: none;
        }
        .npb-search-pin-wrapper {
          background: transparent !important;
          border: none !important;
        }
        .npb-search-pin {
          cursor: grab;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.35));
        }
        .npb-search-pin:active {
          cursor: grabbing;
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

        <MapClickHandler onMapClick={(lat, lng) => setSearchMarker({ lat, lng, label: "" })} />
        <ZoomTracker onZoomChange={setMapZoom} />

        {showTransit && (
          <>
            {TRANSIT_LINES.map((line) => (
              <Polyline
                key={line.id}
                positions={line.stations.map((s) => [s.lat, s.lng])}
                pathOptions={{ color: line.color, weight: 3.5, opacity: 0.85 }}
              />
            ))}
            {TRANSIT_STATIONS_BY_COORD.map((st) => (
              <CircleMarker
                key={`${st.lat},${st.lng}`}
                center={[st.lat, st.lng]}
                radius={4}
                pathOptions={{ color: "#fff", weight: 1.5, fillColor: st.color, fillOpacity: 1 }}
              >
                <Tooltip
                  direction="top"
                  offset={[0, -6]}
                  opacity={1}
                  className="!bg-white !text-stone-800 !border !border-gray-200 !rounded !shadow !text-[10px] !px-1.5 !py-0.5 !font-medium"
                >
                  {locale === "th" ? st.nameTh : st.nameEn}
                </Tooltip>
              </CircleMarker>
            ))}

            {/* Always-visible name labels only once zoomed in far enough —
                a plain divIcon marker (same pattern as the price pins)
                instead of a Leaflet "permanent" Tooltip, which only reads
                its `permanent` option at layer-creation time and won't
                toggle on a prop update. */}
            {mapZoom >= STATION_LABEL_MIN_ZOOM &&
              TRANSIT_STATIONS_BY_COORD.map((st) => (
                <Marker
                  key={`label-${st.lat},${st.lng}`}
                  position={[st.lat, st.lng]}
                  icon={buildStationLabelIcon(locale === "th" ? st.nameTh : st.nameEn, st.color)}
                  interactive={false}
                />
              ))}
          </>
        )}

        {searchMarker && (
          <Marker
            position={[searchMarker.lat, searchMarker.lng]}
            icon={buildSearchPinIcon()}
            draggable
            eventHandlers={{
              dragstart: () => setIsDraggingPin(true),
              drag: (e) => {
                const pos = e.target.getLatLng();
                setSearchMarker((prev) => (prev ? { ...prev, lat: pos.lat, lng: pos.lng } : null));
              },
              dragend: () => setIsDraggingPin(false),
            }}
          >
            <Tooltip
              direction="top"
              offset={[0, -40]}
              opacity={1}
              className="!bg-blue-600 !text-white !border-0 !rounded-lg !shadow-lg !text-xs !px-2 !py-1"
            >
              {locale === "th" ? "จุดเริ่มต้น · ลากเพื่อย้าย" : "Start point · drag to move"}
            </Tooltip>
          </Marker>
        )}

        {searchMarker && activeMarker && (() => {
          const hasRealRoute = !isDraggingPin && !!routeData?.coordinates?.length;
          return (
            <Polyline
              positions={
                hasRealRoute
                  ? routeData!.coordinates
                  : [
                      [searchMarker.lat, searchMarker.lng],
                      [activeMarker.lat, activeMarker.lng],
                    ]
              }
              pathOptions={
                hasRealRoute
                  ? { color: "#2563eb", weight: 4, opacity: 0.85 }
                  : { color: "#2563eb", weight: 3, opacity: 0.6, dashArray: "8 8" }
              }
            />
          );
        })()}

        {groupedProperties.map(([key, group]) => {
          const [lat, lng] = key.split(",").map(Number);
          const isActive = activeMarker?.key === key;

          // Multiple units geocoded to the same spot (same building/project)
          // — show one "N รายการ" badge instead of stacking pins on top of
          // each other; clicking opens the docked panel listing every unit.
          if (group.length > 1) {
            const groupTitle = getTitle(group[0]);
            return (
              <Marker
                key={key}
                position={[lat, lng]}
                icon={buildClusterMarker(group.length, isActive)}
                eventHandlers={{
                  click: () => setActiveMarker({ key, group, lat, lng }),
                }}
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
              </Marker>
            );
          }

          const property = group[0];
          const { isRent, displayPrice } = getPriceInfo(property);
          const compact = formatPriceCompact(displayPrice);
          const title = getTitle(property);
          const icon = buildPriceMarker(
            compact,
            isRent,
            isActive,
            CONTACT_ONLY_STATUSES.has(property.status || "")
          );

          return (
            <Marker
              key={key}
              position={[lat, lng]}
              icon={icon}
              eventHandlers={{
                click: () => setActiveMarker({ key, group, lat, lng }),
              }}
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
                  {isRent && (tp.perMonth || "/month")}
                </div>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Docked info panel — fixed to the top-right corner instead of a
          Leaflet popup anchored above the marker, so it never covers the
          route line drawn across the middle of the map. */}
      {activeMarker && (
        <div className="absolute top-3 right-3 z-[500] w-[280px] max-h-[calc(100%-24px)] overflow-y-auto bg-white rounded-xl shadow-xl border border-gray-100 p-4 text-sm">
          <button
            type="button"
            onClick={() => setActiveMarker(null)}
            className="absolute top-2.5 right-2.5 text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {activeMarker.group.length > 1 ? (
            <>
              <p className="font-semibold mb-1 pr-5">
                {getTitle(activeMarker.group[0])} · {activeMarker.group.length} รายการ
              </p>
              <button
                type="button"
                onClick={setAsStart}
                className="mb-2 text-[11px] font-medium text-blue-600 hover:underline"
              >
                📍 {locale === "th" ? "ตั้งเป็นจุดเริ่มต้น" : "Set as start point"}
              </button>
              {searchMarker && (
                <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-gray-100">
                  <span className="text-[11px] text-gray-500">
                    {locale === "th" ? "จากจุดเริ่มต้น" : "From start point"}
                  </span>
                  <TravelModeToggle />
                </div>
              )}
              <div className="divide-y divide-gray-100 -mx-1">
                {activeMarker.group.map((property) => {
                  const { isRent, displayPrice } = getPriceInfo(property);
                  const unitLabel = [
                    property.building ? `ตึก ${property.building}` : null,
                    property.floor ? `ชั้น ${property.floor}` : null,
                    property.bedrooms ? `${property.bedrooms} นอน` : null,
                    property.sizeSqm ? `${property.sizeSqm} ตร.ม.` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ");
                  const isUnavailable = property.isRented || property.isSold;
                  return (
                    <a
                      key={property.id}
                      href={`/${locale}/properties/${property.id}`}
                      className={`flex items-center justify-between gap-2 py-2 px-1 transition-colors ${
                        isUnavailable ? "bg-rose-50 hover:bg-rose-100" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs text-gray-700 truncate">
                          {unitLabel || (locale !== "th" && property.titleEn ? property.titleEn : property.titleTh)}
                        </div>
                        <div className="text-[10px] text-gray-400 flex items-center gap-1 flex-wrap">
                          <span>{listingLabel(property.listingType)}</span>
                          {property.isRented && (
                            <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white font-bold">
                              {locale === "th" ? "ให้เช่าแล้ว" : "Rented"}
                            </span>
                          )}
                          {property.isSold && (
                            <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white font-bold">
                              {locale === "th" ? "ขายแล้ว" : "Sold"}
                            </span>
                          )}
                        </div>
                        {searchMarker && (
                          <div className="text-[10px] mt-0.5">{renderDistance(activeMarker.lat, activeMarker.lng)}</div>
                        )}
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
            </>
          ) : (
            (() => {
              const property = activeMarker.group[0];
              const { isRent, displayPrice } = getPriceInfo(property);
              const title = getTitle(property);
              return (
                <div>
                  <p className="font-semibold mb-1 pr-5">{title}</p>
                  <p className="text-[#C8A951] font-bold text-base">
                    ฿{formatPrice(displayPrice)}
                    {isRent && (
                      <span className="text-xs font-normal text-gray-500">{tp.perMonth || "/month"}</span>
                    )}
                  </p>
                  {property.salePrice &&
                    property.salePrice > 0 &&
                    isRent &&
                    property.listingType === "RENT_AND_SALE" && (
                      <p className="text-xs text-gray-600 mt-0.5">
                        {tc.sale || "Sale"}: ฿{formatPrice(Number(property.salePrice))}
                      </p>
                    )}
                  <p className="text-gray-500 text-xs mt-1 flex items-center gap-1 flex-wrap">
                    <span>{listingLabel(property.listingType)}</span>
                    {property.isRented && (
                      <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white font-bold">
                        {locale === "th" ? "ให้เช่าแล้ว" : "Rented"}
                      </span>
                    )}
                    {property.isSold && (
                      <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white font-bold">
                        {locale === "th" ? "ขายแล้ว" : "Sold"}
                      </span>
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={setAsStart}
                    className="mt-2 text-[11px] font-medium text-blue-600 hover:underline block"
                  >
                    📍 {locale === "th" ? "ตั้งเป็นจุดเริ่มต้น" : "Set as start point"}
                  </button>
                  {searchMarker && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[11px] text-gray-500">
                          {locale === "th" ? "จากจุดเริ่มต้น" : "From start point"}
                        </span>
                        <TravelModeToggle />
                      </div>
                      <div className="text-xs">{renderDistance(activeMarker.lat, activeMarker.lng)}</div>
                    </div>
                  )}
                  {CONTACT_ONLY_STATUSES.has(property.status || "") ? (
                    contactRevealed ? (
                      <div className="mt-2 pt-2 border-t border-gray-100 space-y-1.5">
                        {companyPhone && (
                          <a
                            href={`tel:${companyPhone.replace(/[^0-9+]/g, "")}`}
                            className="flex items-center gap-1.5 text-xs font-medium text-stone-700 hover:text-stone-900"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            {companyPhone}
                          </a>
                        )}
                        {companyLineId && (
                          <a
                            href={lineContactUrl(companyLineId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs font-medium text-[#06C755] hover:underline"
                          >
                            LINE: {companyLineId}
                          </a>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setContactRevealed(true)}
                        className="mt-2 text-[#C8A951] hover:underline text-xs font-medium block"
                      >
                        {locale === "th" ? "ติดต่อขอทราบข้อมูล" : "Contact for information"} →
                      </button>
                    )
                  ) : (
                    <a
                      href={`/${locale}/properties/${property.id}`}
                      className="inline-block mt-2 text-[#C8A951] hover:underline text-xs font-medium"
                    >
                      {tp.viewDetails || "View Details"} →
                    </a>
                  )}
                </div>
              );
            })()
          )}
        </div>
      )}
    </div>
  );
}
