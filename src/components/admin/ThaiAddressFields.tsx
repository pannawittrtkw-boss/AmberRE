"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronDown, X, Search, Loader2 } from "lucide-react";

type AddressItem = { id: number; nameTh: string };

interface SearchableDropdownProps {
  label: string;
  value: string;
  placeholder?: string;
  items: AddressItem[];
  loading?: boolean;
  disabled?: boolean;
  onChange: (value: string, id: number | null) => void;
  onClear: () => void;
}

function SearchableDropdown({
  label, value, placeholder, items, loading, disabled, onChange, onClear,
}: SearchableDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = items.filter((i) =>
    i.nameTh.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const handleSelect = (item: AddressItem) => {
    onChange(item.nameTh, item.id);
    setOpen(false);
    setSearch("");
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => setOpen((p) => !p)}
        className={`w-full flex items-center justify-between border rounded-lg px-3 py-2 text-sm text-left transition-colors
          ${disabled || loading ? "bg-gray-50 text-gray-400 cursor-not-allowed" : "bg-white hover:border-blue-400 focus:outline-none"}
          ${open ? "border-blue-500 ring-2 ring-blue-500/20" : "border-gray-300"}`}
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {loading ? (
            <span className="flex items-center gap-1.5 text-gray-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> กำลังโหลด...
            </span>
          ) : (
            value || placeholder || "เลือก..."
          )}
        </span>
        <span className="flex items-center gap-1">
          {value && !disabled && (
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {/* Search box */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหา..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">ไม่พบข้อมูล</p>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 transition-colors
                    ${value === item.nameTh ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"}`}
                >
                  {item.nameTh}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface ThaiAddressFieldsProps {
  province: string;
  district: string;
  subdistrict: string;
  onProvinceChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
  onSubdistrictChange: (value: string) => void;
}

export default function ThaiAddressFields({
  province, district, subdistrict,
  onProvinceChange, onDistrictChange, onSubdistrictChange,
}: ThaiAddressFieldsProps) {
  const [provinces, setProvinces] = useState<AddressItem[]>([]);
  const [districts, setDistricts] = useState<AddressItem[]>([]);
  const [tambons, setTambons] = useState<AddressItem[]>([]);
  const [provinceId, setProvinceId] = useState<number | null>(null);
  const [amphureId, setAmphureId] = useState<number | null>(null);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingTambons, setLoadingTambons] = useState(false);

  // Load provinces once
  useEffect(() => {
    fetch("/api/admin/thai-address?type=provinces")
      .then((r) => r.json())
      .then((d) => { if (d.success) setProvinces(d.data); })
      .catch(() => {})
      .finally(() => setLoadingProvinces(false));
  }, []);

  // When province value is set (e.g., on edit), find its id
  useEffect(() => {
    if (province && provinces.length > 0) {
      const found = provinces.find((p) => p.nameTh === province);
      if (found) setProvinceId(found.id);
    }
  }, [province, provinces]);

  // Load districts when province changes
  useEffect(() => {
    if (!provinceId) { setDistricts([]); return; }
    setLoadingDistricts(true);
    fetch(`/api/admin/thai-address?type=districts&province_id=${provinceId}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setDistricts(d.data); })
      .catch(() => {})
      .finally(() => setLoadingDistricts(false));
  }, [provinceId]);

  // When district value is set (e.g., on edit), find its id
  useEffect(() => {
    if (district && districts.length > 0) {
      const found = districts.find((d) => d.nameTh === district);
      if (found) setAmphureId(found.id);
    }
  }, [district, districts]);

  // Load tambons when district changes
  useEffect(() => {
    if (!amphureId) { setTambons([]); return; }
    setLoadingTambons(true);
    fetch(`/api/admin/thai-address?type=tambons&amphure_id=${amphureId}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setTambons(d.data); })
      .catch(() => {})
      .finally(() => setLoadingTambons(false));
  }, [amphureId]);

  const handleProvinceChange = (value: string, id: number | null) => {
    onProvinceChange(value);
    onDistrictChange("");
    onSubdistrictChange("");
    setProvinceId(id);
    setAmphureId(null);
    setDistricts([]);
    setTambons([]);
  };

  const handleDistrictChange = (value: string, id: number | null) => {
    onDistrictChange(value);
    onSubdistrictChange("");
    setAmphureId(id);
    setTambons([]);
  };

  const handleSubdistrictChange = (value: string, _id: number | null) => {
    onSubdistrictChange(value);
  };

  return (
    <>
      <SearchableDropdown
        label="จังหวัด"
        value={province}
        placeholder="เลือกจังหวัด"
        items={provinces}
        loading={loadingProvinces}
        onChange={handleProvinceChange}
        onClear={() => handleProvinceChange("", null)}
      />
      <SearchableDropdown
        label="อำเภอ/เขต"
        value={district}
        placeholder={province ? "เลือกอำเภอ/เขต" : "เลือกจังหวัดก่อน"}
        items={districts}
        loading={loadingDistricts}
        disabled={!province}
        onChange={handleDistrictChange}
        onClear={() => handleDistrictChange("", null)}
      />
      <SearchableDropdown
        label="ตำบล/แขวง"
        value={subdistrict}
        placeholder={district ? "เลือกตำบล/แขวง" : "เลือกอำเภอก่อน"}
        items={tambons}
        loading={loadingTambons}
        disabled={!district}
        onChange={handleSubdistrictChange}
        onClear={() => handleSubdistrictChange("", null)}
      />
    </>
  );
}
