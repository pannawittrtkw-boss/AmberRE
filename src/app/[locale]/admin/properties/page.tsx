"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Loader2,
  ExternalLink,
  X,
  Sofa,
  Download,
  Upload,
  Search,
  SlidersHorizontal,
  Zap,
  CheckCircle2,
  XCircle,
  FileText,
  Edit3,
  Trash2,
  ChevronDown,
  Train,
} from "lucide-react";
import { LINES } from "@/components/admin/StationMapSelector";

const FURNITURE_ITEMS: Record<string, { en: string; th: string }> = {
  bed: { en: "Bed", th: "เตียง" },
  mattress: { en: "Mattress", th: "ฟูก / ที่นอน" },
  wardrobe: { en: "Wardrobe", th: "ตู้เสื้อผ้า" },
  dressingTable: { en: "Dressing Table", th: "โต๊ะเครื่องแป้ง" },
  sofa: { en: "Sofa", th: "โซฟา" },
  coffeeTable: { en: "Coffee Table", th: "โต๊ะกลาง" },
  tvCabinet: { en: "TV Cabinet", th: "ชั้นวางทีวี" },
  curtains: { en: "Curtains / Blinds", th: "ผ้าม่าน / มู่ลี่" },
  kitchenCounter: { en: "Kitchen Counter", th: "เคาน์เตอร์ครัว" },
  sink: { en: "Sink", th: "ซิงก์ล้างจาน" },
  diningTable: { en: "Dining Table", th: "โต๊ะอาหาร" },
  chairs: { en: "Chairs", th: "เก้าอี้" },
  showerScreen: { en: "Shower Screen", th: "ฉากกั้นอาบน้ำ" },
};

const APPLIANCE_ITEMS: Record<string, { en: string; th: string }> = {
  airConditioner: { en: "Air Conditioner", th: "แอร์" },
  tv: { en: "TV", th: "ทีวี" },
  refrigerator: { en: "Refrigerator", th: "ตู้เย็น" },
  microwave: { en: "Microwave", th: "ไมโครเวฟ" },
  stove: { en: "Stove", th: "เตาไฟฟ้า / เตาแก๊ส" },
  cookerHood: { en: "Cooker Hood", th: "เครื่องดูดควัน" },
  washingMachine: { en: "Washing Machine", th: "เครื่องซักผ้า" },
  digitalDoorLock: { en: "Digital Door Lock", th: "" },
  waterHeater: { en: "Water Heater", th: "เครื่องทำน้ำอุ่น" },
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  WAITING: { label: "Waiting", color: "bg-blue-100 text-blue-800" },
  VERIFIED: { label: "Verified", color: "bg-green-100 text-green-800" },
  VERIFIED_OVER_10_DAYS: { label: "Verified 10d+", color: "bg-orange-100 text-orange-800" },
  ADDED_PROPERTIES: { label: "Added", color: "bg-purple-100 text-purple-800" },
  NOT_ACCEPT: { label: "Not Accept", color: "bg-red-100 text-red-800" },
  NOT_AVAILABLE: { label: "Not Available", color: "bg-gray-100 text-gray-800" },
  RENTED: { label: "Rented", color: "bg-teal-100 text-teal-800" },
  SOLD: { label: "Sold", color: "bg-rose-100 text-rose-800" },
};

function parseJson(val: string | null | undefined): string[] {
  if (!val) return [];
  try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; }
}

function getStationName(code: string): string {
  for (const line of LINES) {
    const station = line.stations.find((s) => s.id === code || s.code === code);
    if (station) return `${station.code} ${station.nameTh}`;
  }
  return code;
}

export default function AdminPropertiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const [locale, setLocale] = useState("th");
  const [messages, setMessages] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailModal, setDetailModal] = useState<any>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  // Month & Status tabs
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>("all");

  // Search & Filter
  const [searchText, setSearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterListing, setFilterListing] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterMinPrice, setFilterMinPrice] = useState("");
  const [filterMaxPrice, setFilterMaxPrice] = useState("");
  const [filterStation, setFilterStation] = useState("");

  useEffect(() => {
    params.then(({ locale: l }) => {
      setLocale(l);
      import(`@/messages/${l}.json`).then((m) => setMessages(m.default));
    });
  }, [params]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/properties?limit=100");
      const data = await res.json();
      if (data.success) setProperties(data.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchProperties(); }, []);

  const deleteProperty = async (id: number) => {
    if (!confirm(locale === "th" ? "ยืนยันการลบ?" : "Confirm delete?")) return;
    await fetch(`/api/properties/${id}`, { method: "DELETE" });
    fetchProperties();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/properties/import", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setImportResult(data.data);
        fetchProperties();
      } else {
        setImportResult({ error: data.error });
      }
    } catch {
      setImportResult({ error: "Upload failed" });
    }

    setImporting(false);
    e.target.value = "";
  };

  // Client-side filtering
  const filtered = properties.filter((p: any) => {
    // Text search
    if (searchText) {
      const q = searchText.toLowerCase();
      // Convert station codes to names for searching
      const stationNames = parseJson(p.nearbyStations).map((c: string) => getStationName(c)).join(" ");
      const fields = [
        p.projectName, p.titleTh, p.titleEn, p.ownerName, p.ownerPhone,
        p.ownerLineId, p.building, p.note, p.address, stationNames,
      ].filter(Boolean).join(" ").toLowerCase();
      if (!fields.includes(q)) return false;
    }
    // Status
    if (filterStatus && p.status !== filterStatus) return false;
    // Listing type
    if (filterListing && p.listingType !== filterListing) return false;
    // Priority
    if (filterPriority && p.priority !== filterPriority) return false;
    // Category
    if (filterCategory && p.category !== filterCategory) return false;
    // Price range
    const price = Number(p.price) || 0;
    if (filterMinPrice && price < Number(filterMinPrice)) return false;
    if (filterMaxPrice && price > Number(filterMaxPrice)) return false;
    // Station - search by code or Thai name
    if (filterStation) {
      const q = filterStation.toLowerCase();
      const codes = parseJson(p.nearbyStations);
      const matched = codes.some((code: string) => {
        if (code.toLowerCase().includes(q)) return true;
        const name = getStationName(code).toLowerCase();
        return name.includes(q);
      });
      if (!matched) return false;
    }
    return true;
  });

  const hasActiveFilters = filterStatus || filterListing || filterPriority || filterCategory || filterMinPrice || filterMaxPrice || filterStation;

  const clearFilters = () => {
    setSearchText(""); setFilterStatus(""); setFilterListing("");
    setFilterPriority(""); setFilterCategory("");
    setFilterMinPrice(""); setFilterMaxPrice(""); setFilterStation("");
  };

  // Generate month tabs from properties
  const monthsSet = new Map<string, { label: string; count: number }>();
  properties.forEach((p: any) => {
    const d = new Date(p.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("th-TH", { month: "long", year: "numeric" });
    if (!monthsSet.has(key)) monthsSet.set(key, { label, count: 0 });
    monthsSet.get(key)!.count++;
  });
  const months = Array.from(monthsSet.entries()).sort((a, b) => b[0].localeCompare(a[0]));

  // Filter by selected month
  const monthFiltered = selectedMonth === "all"
    ? filtered
    : filtered.filter((p: any) => {
        const d = new Date(p.createdAt);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === selectedMonth;
      });

  // Count statuses within month-filtered results
  const statusCounts: Record<string, number> = {};
  monthFiltered.forEach((p: any) => {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
  });

  // Filter by selected status tab
  const finalFiltered = selectedStatusTab === "all"
    ? monthFiltered
    : monthFiltered.filter((p: any) => p.status === selectedStatusTab);

  if (!messages || loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-600" /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">{messages.admin.propertyManagement}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Export Template */}
          <a
            href="/api/properties/export"
            download
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            {locale === "th" ? "Template Excel" : "Template Excel"}
          </a>

          {/* Import Excel */}
          <label className={`inline-flex items-center gap-2 px-3 py-2 border border-green-500 text-green-700 rounded-lg hover:bg-green-50 transition-colors text-sm cursor-pointer ${importing ? "opacity-50 pointer-events-none" : ""}`}>
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {importing ? (locale === "th" ? "กำลังนำเข้า..." : "Importing...") : (locale === "th" ? "นำเข้า Excel" : "Import Excel")}
            <input type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" disabled={importing} />
          </label>

          {/* Add Property */}
          <Link
            href={`/${locale}/admin/properties/add`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            {locale === "th" ? "เพิ่มข้อมูลห้อง" : "Add Property"}
          </Link>
        </div>
      </div>

      {/* Import Result */}
      {importResult && (
        <div className={`mb-4 p-4 rounded-lg border ${importResult.error ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
          <div className="flex items-center justify-between">
            <div>
              {importResult.error ? (
                <p className="text-red-700 text-sm font-medium">{importResult.error}</p>
              ) : (
                <div className="text-sm">
                  <p className="font-medium text-green-800">
                    นำเข้าสำเร็จ {importResult.success} จาก {importResult.total} รายการ
                    {importResult.failed > 0 && (
                      <span className="text-red-600 ml-2">(ล้มเหลว {importResult.failed})</span>
                    )}
                  </p>
                  {importResult.results?.filter((r: any) => !r.success).map((r: any) => (
                    <p key={r.row} className="text-red-600 text-xs mt-1">
                      แถว {r.row}: {r.error}
                    </p>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setImportResult(null)} className="p-1 hover:bg-gray-200 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Smart Search */}
      <div className="mb-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={locale === "th" ? "ค้นหา ชื่อโครงการ, เจ้าของ, เบอร์โทร, สถานี, หมายเหตุ..." : "Search project, owner, phone, station, note..."}
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2.5 border rounded-lg flex items-center gap-1.5 text-sm transition-colors ${
              showFilters || hasActiveFilters ? "bg-amber-50 border-amber-400 text-amber-700" : "hover:bg-gray-50"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {locale === "th" ? "ตัวกรอง" : "Filters"}
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-amber-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">สถานะ</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="">ทั้งหมด</option>
                  {Object.entries(STATUS_MAP).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">ประเภท</label>
                <select value={filterListing} onChange={(e) => setFilterListing(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="">ทั้งหมด</option>
                  <option value="RENT">เช่า</option>
                  <option value="SALE">ขาย</option>
                  <option value="RENT_AND_SALE">เช่า&ขาย</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
                <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="">ทั้งหมด</option>
                  <option value="NORMAL">Normal</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="">ทั้งหมด</option>
                  <option value="NORMAL">Normal</option>
                  <option value="LUXURY">Luxury</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">ราคาขั้นต่ำ</label>
                <input type="number" value={filterMinPrice} onChange={(e) => setFilterMinPrice(e.target.value)} placeholder="0" className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">ราคาสูงสุด</label>
                <input type="number" value={filterMaxPrice} onChange={(e) => setFilterMaxPrice(e.target.value)} placeholder="999,999" className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">สถานี BTS/MRT</label>
                <input type="text" value={filterStation} onChange={(e) => setFilterStation(e.target.value)} placeholder="E16, ปู่เจ้า" className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex items-end">
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-700 underline">
                    ล้างตัวกรอง
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Result count */}
        {(searchText || hasActiveFilters) && (
          <p className="text-sm text-gray-500">
            พบ <span className="font-bold text-gray-800">{filtered.length}</span> รายการ
            {properties.length !== filtered.length && ` จากทั้งหมด ${properties.length}`}
          </p>
        )}
      </div>

      {/* Month Tabs */}
      <div className="mb-4 overflow-x-auto">
        <div className="flex gap-1 border-b">
          <button
            onClick={() => { setSelectedMonth("all"); setSelectedStatusTab("all"); }}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              selectedMonth === "all"
                ? "border-amber-500 text-amber-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            ทั้งหมด ({properties.length})
          </button>
          {months.map(([key, { label, count }]) => (
            <button
              key={key}
              onClick={() => { setSelectedMonth(key); setSelectedStatusTab("all"); }}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                selectedMonth === key
                  ? "border-amber-500 text-amber-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Status Sub-Tabs */}
      <div className="mb-4 overflow-x-auto">
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedStatusTab("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedStatusTab === "all"
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            ทั้งหมด ({monthFiltered.length})
          </button>
          {Object.entries(STATUS_MAP).map(([key, info]) => {
            const count = statusCounts[key] || 0;
            if (count === 0) return null;
            return (
              <button
                key={key}
                onClick={() => setSelectedStatusTab(key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedStatusTab === key
                    ? "bg-gray-800 text-white"
                    : `${info.color} hover:opacity-80`
                }`}
              >
                {info.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Property Cards */}
      <div className="space-y-3">
        {finalFiltered.map((p: any, idx: number) => {
          const furniture = parseJson(p.furnitureDetails);
          const appliances = parseJson(p.electricalAppliances);
          const isExpanded = expandedRow === p.id;
          const statusInfo = STATUS_MAP[p.status] || STATUS_MAP.PENDING;
          const price = Number(p.price);
          const salePrice = Number(p.salePrice);

          return (
            <div key={p.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
              {/* Main Row - Desktop */}
              <div className="hidden sm:flex items-center gap-3 px-4 py-3">
                <div className="w-8 text-center text-sm font-bold text-gray-400">{idx + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {p.projectName || p.titleTh || "-"}
                    </h3>
                    <select
                      value={p.status || "PENDING"}
                      onChange={async (e) => {
                        const newStatus = e.target.value;
                        if (newStatus === "ADDED_PROPERTIES") {
                          const missing: string[] = [];
                          if (!p.images || p.images.length === 0) missing.push("รูปภาพ");
                          if (!p.bedrooms || p.bedrooms === 0) missing.push("จำนวนห้องนอน");
                          if (!p.bathrooms || p.bathrooms === 0) missing.push("จำนวนห้องน้ำ");
                          if (missing.length > 0) {
                            alert(`กรุณาเพิ่มข้อมูลก่อนเปลี่ยนสถานะเป็น Added:\n- ${missing.join("\n- ")}\n\nกด Edit เพื่อเพิ่มข้อมูล`);
                            e.target.value = p.status || "PENDING";
                            return;
                          }
                        }
                        await fetch(`/api/properties/${p.id}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ status: newStatus }),
                        });
                        fetchProperties();
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium border-0 cursor-pointer outline-none appearance-none pr-5 ${statusInfo.color}`}
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 4px center" }}
                    >
                      {Object.entries(STATUS_MAP).map(([val, info]) => (
                        <option key={val} value={val}>{info.label}</option>
                      ))}
                    </select>
                    {p.category === "LUXURY" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">Luxury</span>
                    )}
                    {p.priority === "URGENT" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Urgent</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                    {p.sizeSqm && <span>{Number(p.sizeSqm)} sqm</span>}
                    {(p.floor || p.building) && (
                      <span>ชั้น {p.floor || "-"} / ตึก {p.building || "-"}</span>
                    )}
                    {p.listingType && (
                      <span className="text-amber-700 font-medium">
                        {p.listingType === "RENT" ? "เช่า" : p.listingType === "SALE" ? "ขาย" : "เช่า&ขาย"}
                      </span>
                    )}
                    {p.availableDate && (
                      <span className="text-blue-600">
                        พร้อมเข้าอยู่ {new Date(p.availableDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    )}
                  </div>
                  {(() => {
                    const stations = parseJson(p.nearbyStations);
                    return stations.length > 0 ? (
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <Train className="w-3 h-3 text-green-600 flex-shrink-0" />
                        {stations.map((code: string) => (
                          <span key={code} className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded text-[10px] font-medium">
                            {getStationName(code)}
                          </span>
                        ))}
                      </div>
                    ) : null;
                  })()}
                </div>
                <div className="text-right min-w-[100px]">
                  {price > 0 && (
                    <div className="text-sm font-bold text-gray-800">฿{price.toLocaleString()}<span className="text-[10px] text-gray-400 font-normal">/เดือน</span></div>
                  )}
                  {salePrice > 0 && (
                    <div className="text-xs text-green-700 font-medium">ขาย ฿{salePrice.toLocaleString()}</div>
                  )}
                  {price === 0 && salePrice === 0 && <span className="text-gray-400 text-xs">-</span>}
                </div>
                <div className="min-w-[70px] text-center">
                  {(furniture.length > 0 || appliances.length > 0) ? (
                    <button
                      onClick={() => setDetailModal(p)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-300 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-100 transition-colors"
                    >
                      <FileText className="w-3 h-3" />
                      Details
                    </button>
                  ) : (
                    <span className="text-gray-300 text-xs">-</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Link href={`/${locale}/admin/properties/add?edit=${p.id}`} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors" title="Edit">
                    <Edit3 className="w-4 h-4" />
                  </Link>
                  <button onClick={() => deleteProperty(p.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setExpandedRow(isExpanded ? null : p.id)} className={`p-2 hover:bg-gray-100 rounded-lg transition-all ${isExpanded ? "rotate-180" : ""}`} title="More info">
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Main Row - Mobile */}
              <div className="sm:hidden px-4 py-3 space-y-2">
                {/* Title + Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                      {p.projectName || p.titleTh || "-"}
                    </h3>
                  </div>
                  <select
                    value={p.status || "PENDING"}
                    onChange={async (e) => {
                      const newStatus = e.target.value;
                      if (newStatus === "ADDED_PROPERTIES") {
                        const missing: string[] = [];
                        if (!p.images || p.images.length === 0) missing.push("รูปภาพ");
                        if (!p.bedrooms || p.bedrooms === 0) missing.push("จำนวนห้องนอน");
                        if (!p.bathrooms || p.bathrooms === 0) missing.push("จำนวนห้องน้ำ");
                        if (missing.length > 0) {
                          alert(`กรุณาเพิ่มข้อมูลก่อนเปลี่ยนสถานะเป็น Added:\n- ${missing.join("\n- ")}\n\nกด Edit เพื่อเพิ่มข้อมูล`);
                          e.target.value = p.status || "PENDING";
                          return;
                        }
                      }
                      await fetch(`/api/properties/${p.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: newStatus }),
                      });
                      fetchProperties();
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium border-0 cursor-pointer outline-none appearance-none pr-5 shrink-0 ${statusInfo.color}`}
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 4px center" }}
                  >
                    {Object.entries(STATUS_MAP).map(([val, info]) => (
                      <option key={val} value={val}>{info.label}</option>
                    ))}
                  </select>
                </div>

                {/* Details grid */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                  {p.sizeSqm && <span>{Number(p.sizeSqm)} sqm</span>}
                  {(p.floor || p.building) && <span>ชั้น {p.floor || "-"} / ตึก {p.building || "-"}</span>}
                  {p.listingType && (
                    <span className="text-amber-700 font-medium">
                      {p.listingType === "RENT" ? "เช่า" : p.listingType === "SALE" ? "ขาย" : "เช่า&ขาย"}
                    </span>
                  )}
                  {p.availableDate && (
                    <span className="text-blue-600">
                      พร้อมเข้าอยู่ {new Date(p.availableDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  )}
                  {p.category === "LUXURY" && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">Luxury</span>}
                  {p.priority === "URGENT" && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Urgent</span>}
                </div>

                {/* Stations */}
                {(() => {
                  const stations = parseJson(p.nearbyStations);
                  return stations.length > 0 ? (
                    <div className="flex items-center gap-1 flex-wrap">
                      <Train className="w-3 h-3 text-green-600 flex-shrink-0" />
                      {stations.map((code: string) => (
                        <span key={code} className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded text-[10px] font-medium">
                          {getStationName(code)}
                        </span>
                      ))}
                    </div>
                  ) : null;
                })()}

                {/* Price + Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                  <div>
                    {price > 0 && (
                      <div className="text-sm font-bold text-gray-800">฿{price.toLocaleString()}<span className="text-[10px] text-gray-400 font-normal">/เดือน</span></div>
                    )}
                    {salePrice > 0 && (
                      <div className="text-xs text-green-700 font-medium">ขาย ฿{salePrice.toLocaleString()}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5">
                    {(furniture.length > 0 || appliances.length > 0) && (
                      <button onClick={() => setDetailModal(p)} className="p-2 hover:bg-amber-50 rounded-lg text-amber-600 transition-colors" title="Details">
                        <FileText className="w-4 h-4" />
                      </button>
                    )}
                    <Link href={`/${locale}/admin/properties/add?edit=${p.id}`} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors" title="Edit">
                      <Edit3 className="w-4 h-4" />
                    </Link>
                    <button onClick={() => deleteProperty(p.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setExpandedRow(isExpanded ? null : p.id)} className={`p-2 hover:bg-gray-100 rounded-lg transition-all ${isExpanded ? "rotate-180" : ""}`} title="More info">
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t bg-gray-50 px-4 py-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    {/* Location / Stations */}
                    <div>
                      <div className="text-gray-400 mb-1 flex items-center gap-1">
                        <Train className="w-3 h-3" /> สถานีใกล้เคียง
                      </div>
                      {(() => {
                        const stations = parseJson(p.nearbyStations);
                        return stations.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {stations.map((code: string) => (
                              <span key={code} className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                {getStationName(code)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">ไม่ระบุ</span>
                        );
                      })()}
                    </div>

                    {/* Contact */}
                    <div>
                      <div className="text-gray-400 mb-1">ข้อมูลติดต่อ</div>
                      {p.ownerName && <div className="text-gray-700 font-medium">{p.ownerName}</div>}
                      {p.ownerPhone && <div className="text-gray-600">{p.ownerPhone}</div>}
                      {p.ownerLineId && <div className="text-gray-600">Line: {p.ownerLineId}</div>}
                      {!p.ownerName && !p.ownerPhone && <span className="text-gray-400">-</span>}
                    </div>

                    {/* Links */}
                    <div>
                      <div className="text-gray-400 mb-1">ลิงก์</div>
                      <div className="space-y-1">
                        {p.sourceLink ? (
                          <a href={p.sourceLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-amber-600 hover:underline">
                            <ExternalLink className="w-3 h-3" /> Source
                          </a>
                        ) : <span className="text-gray-400">-</span>}
                        {p.linkPage && (
                          <a href={p.linkPage} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-amber-600 hover:underline">
                            <ExternalLink className="w-3 h-3" /> Page
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Note */}
                    <div>
                      <div className="text-gray-400 mb-1">หมายเหตุ</div>
                      <div className="text-gray-700">{p.note || "-"}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {finalFiltered.length === 0 && (
          <div className="bg-white rounded-xl border shadow-sm py-16 text-center text-gray-400">
            ไม่มีข้อมูล
          </div>
        )}
      </div>

      {/* Room Items Detail Modal */}
      {detailModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDetailModal(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold">Room Items Details</h3>
              <button onClick={() => setDetailModal(null)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-5">{detailModal.projectName || detailModal.titleTh}</p>

            {/* Furniture */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3 text-amber-600">
                <Sofa className="w-4 h-4" />
                <h4 className="font-semibold text-sm">Furniture / เฟอร์นิเจอร์</h4>
              </div>
              <hr className="mb-3 border-amber-200" />
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(FURNITURE_ITEMS).map(([key, item]) => {
                  const has = parseJson(detailModal.furnitureDetails).includes(key);
                  return (
                    <div key={key} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm ${has ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50 text-gray-400"}`}>
                      {has ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                      <span>{item.en}{item.th ? ` / ${item.th}` : ""}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Appliances */}
            <div>
              <div className="flex items-center gap-2 mb-3 text-amber-600">
                <Zap className="w-4 h-4" />
                <h4 className="font-semibold text-sm">Electrical Appliances / เครื่องใช้ไฟฟ้า</h4>
              </div>
              <hr className="mb-3 border-amber-200" />
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(APPLIANCE_ITEMS).map(([key, item]) => {
                  const has = parseJson(detailModal.electricalAppliances).includes(key);
                  return (
                    <div key={key} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm ${has ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50 text-gray-400"}`}>
                      {has ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                      <span>{item.en}{item.th ? ` / ${item.th}` : ""}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
