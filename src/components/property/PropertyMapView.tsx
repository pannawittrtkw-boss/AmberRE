"use client";

import { useEffect, useRef } from "react";

interface PropertyMapViewProps {
  properties: any[];
  locale: string;
}

const clusterCSS = `
.marker-cluster-small, .marker-cluster-medium, .marker-cluster-large {
  background: rgba(200, 169, 81, 0.3) !important;
  border-radius: 50% !important;
}
.marker-cluster-small div, .marker-cluster-medium div, .marker-cluster-large div {
  background: #C8A951 !important;
  color: white !important;
  font-weight: 700 !important;
  font-size: 14px !important;
  border-radius: 50% !important;
  width: 32px !important;
  height: 32px !important;
  line-height: 32px !important;
  text-align: center !important;
  margin-left: 4px !important;
  margin-top: 4px !important;
}
.marker-cluster-medium div {
  width: 38px !important; height: 38px !important; line-height: 38px !important;
  margin-left: 5px !important; margin-top: 5px !important;
}
.marker-cluster-large div {
  width: 44px !important; height: 44px !important; line-height: 44px !important;
  margin-left: 6px !important; margin-top: 6px !important; font-size: 16px !important;
}
.property-card-marker { background: none !important; border: none !important; }
`;

export default function PropertyMapView({ properties, locale }: PropertyMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const clusterRef = useRef<any>(null);

  const mappableProperties = properties.filter(
    (p: any) => p.latitude && p.longitude && Number(p.latitude) !== 0 && Number(p.longitude) !== 0
  );

  const leafletRef = useRef<any>(null);

  // Initialize map + build markers whenever properties change
  useEffect(() => {
    if (!mapRef.current) return;

    // Inject cluster CSS
    if (!document.getElementById("mc-styles")) {
      const s = document.createElement("style");
      s.id = "mc-styles";
      s.textContent = clusterCSS;
      document.head.appendChild(s);
    }

    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      // @ts-ignore
      await import("leaflet/dist/leaflet.css");
      await import("leaflet.markercluster");
      // @ts-ignore
      await import("leaflet.markercluster/dist/MarkerCluster.css");
      // @ts-ignore
      await import("leaflet.markercluster/dist/MarkerCluster.Default.css");

      if (cancelled || !mapRef.current) return;
      leafletRef.current = L;

      // Create map if not exists
      if (!mapInstanceRef.current) {
        const map = L.map(mapRef.current, {
          center: [13.7563, 100.5018],
          zoom: 12,
          scrollWheelZoom: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        mapInstanceRef.current = map;
      }

      // Build markers with current properties
      buildMarkers(L, mapInstanceRef.current);
    })();

    return () => {
      cancelled = true;
    };
  }, [mappableProperties.length]);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  function buildMarkers(L: any, map: any) {
    // Remove old cluster
    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
    }

    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount();
        let size = "small";
        let px = 40;
        if (count >= 10) { size = "medium"; px = 48; }
        if (count >= 50) { size = "large"; px = 56; }
        return L.divIcon({
          html: `<div><span>${count}</span></div>`,
          className: `marker-cluster marker-cluster-${size}`,
          iconSize: L.point(px, px),
        });
      },
    });

    const bounds: [number, number][] = [];

    mappableProperties.forEach((p: any) => {
      const lat = Number(p.latitude);
      const lng = Number(p.longitude);
      bounds.push([lat, lng]);

      const primaryImage = p.images?.find((img: any) => img.isPrimary) || p.images?.[0];
      const imageUrl = primaryImage?.imageUrl || "/placeholder-property.jpg";
      const title = p.projectName || p.titleTh || "Property";
      const price = Number(p.price) || 0;
      const salePrice = Number(p.salePrice) || 0;
      const displayPrice = price > 0 ? price : salePrice;
      const sizeSqm = p.sizeSqm ? Number(p.sizeSqm) : null;
      const isSold = p.isSold || p.status === "SOLD";
      const isRented = p.status === "RENTED";
      const overlayText = isSold ? "Sold Out" : isRented ? "Rented" : "";

      const markerIcon = L.divIcon({
        className: "property-card-marker",
        html: `
          <div style="
            background:white; border-radius:12px; box-shadow:0 2px 12px rgba(0,0,0,0.18);
            overflow:hidden; width:220px; cursor:pointer; border:1px solid #e5e7eb;
          ">
            <div style="display:flex; align-items:center; gap:8px; padding:6px 8px;">
              <div style="position:relative; width:50px; height:50px; border-radius:8px; overflow:hidden; flex-shrink:0;">
                <img src="${imageUrl}" style="width:100%;height:100%;object-fit:cover;" onerror="this.src='/placeholder-property.jpg'" />
                ${overlayText ? `<div style="position:absolute;inset:0;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;"><span style="color:white;font-size:7px;font-weight:800;">${overlayText}</span></div>` : ""}
              </div>
              <div style="flex:1;min-width:0;line-height:1.3;">
                <div style="font-weight:700;font-size:11px;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${title}</div>
                <div style="font-weight:800;font-size:13px;color:#C8A951;margin-top:2px;">฿${displayPrice.toLocaleString()}<span style="font-size:9px;color:#9ca3af;font-weight:400;">/month</span></div>
                <div style="font-size:10px;color:#6b7280;margin-top:1px;">${p.bedrooms ? `${p.bedrooms} BD` : ""}${p.bathrooms ? ` • ${p.bathrooms} BA` : ""}${sizeSqm ? ` • ${sizeSqm} m²` : ""}</div>
              </div>
            </div>
          </div>
        `,
        iconSize: [220, 64],
        iconAnchor: [110, 64],
      });

      const marker = L.marker([lat, lng], { icon: markerIcon });
      marker.on("click", () => window.open(`/${locale}/properties/${p.id}`, "_blank"));
      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);
    clusterRef.current = clusterGroup;

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 14);
    }
  }

  return (
    <div className="relative">
      {mappableProperties.length === 0 ? (
        <div className="h-[500px] bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
          <div className="text-center">
            <p className="text-lg font-medium">ไม่มีทรัพย์ที่มีพิกัดบนแผนที่</p>
            <p className="text-sm mt-1">กรุณาเพิ่ม Latitude / Longitude ในข้อมูลทรัพย์</p>
          </div>
        </div>
      ) : (
        <div
          ref={mapRef}
          className="h-[500px] rounded-xl overflow-hidden border border-gray-200 shadow-sm"
          style={{ zIndex: 1 }}
        />
      )}
    </div>
  );
}
