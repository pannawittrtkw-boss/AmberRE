"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getIntlLocale } from "@/lib/utils";

// Fix default marker icon
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

interface MapProperty {
  id: number;
  titleTh: string;
  titleEn: string | null;
  price: number;
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

export default function MapView({
  properties,
  locale,
  center = [13.7563, 100.5018], // Bangkok
  zoom = 12,
  className = "w-full h-[600px]",
}: MapViewProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={`${className} bg-gray-200 rounded-xl flex items-center justify-center`}>Loading map...</div>;
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat(getIntlLocale(locale)).format(price);

  const validProperties = properties.filter((p) => p.latitude && p.longitude);

  return (
    <MapContainer center={center} zoom={zoom} className={`${className} rounded-xl z-0`}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {validProperties.map((property) => (
        <Marker key={property.id} position={[property.latitude!, property.longitude!]}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">
                {locale !== "th" && property.titleEn ? property.titleEn : property.titleTh}
              </p>
              <p className="text-blue-600 font-medium">฿{formatPrice(property.price)}</p>
              <p className="text-gray-500">
                {property.listingType === "RENT" ? (locale === "th" ? "เช่า" : "Rent") : (locale === "th" ? "ขาย" : "Sale")}
              </p>
              <a
                href={`/${locale}/properties/${property.id}`}
                className="text-blue-600 hover:underline text-xs"
              >
                {locale === "th" ? "ดูรายละเอียด →" : "View Details →"}
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
