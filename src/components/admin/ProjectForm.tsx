"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const DraggableMapPreview = dynamic(
  () => import("@/components/admin/DraggableMapPreview"),
  { ssr: false }
);
import {
  Loader2,
  Save,
  Upload,
  Trash2,
  Plus,
  ArrowLeft,
  X,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export const PROJECT_FACILITY_ITEMS = [
  { key: "petFriendly", labelEn: "Pet-Friendly", labelTh: "เลี้ยงสัตว์ได้" },
  { key: "convenienceStore", labelEn: "Convenience Store", labelTh: "ร้านสะดวกซื้อ" },
  { key: "coWorkingSpace", labelEn: "Co-working Space", labelTh: "Co-working" },
  { key: "evCharger", labelEn: "EV Charger", labelTh: "" },
  { key: "garden", labelEn: "Garden", labelTh: "สวนหย่อม" },
  { key: "swimmingPool", labelEn: "Swimming Pool", labelTh: "สระว่ายน้ำ" },
  { key: "parking", labelEn: "Parking", labelTh: "ที่จอดรถ" },
  { key: "sauna", labelEn: "Sauna", labelTh: "ซาวน่า" },
  { key: "playground", labelEn: "Playground", labelTh: "สนามเด็กเล่น" },
  { key: "library", labelEn: "Library", labelTh: "ห้องหนังสือ" },
  { key: "security24h", labelEn: "24/7 Security", labelTh: "รักษาความปลอดภัย" },
  { key: "karaokeRoom", labelEn: "Karaoke Room", labelTh: "คาราโอเกะ" },
  { key: "meetingRoom", labelEn: "Meeting Room", labelTh: "ห้องประชุม" },
  { key: "fitnessGym", labelEn: "Fitness/Gym", labelTh: "ฟิตเนส" },
  { key: "clubhouse", labelEn: "Clubhouse", labelTh: "คลับเฮ้าส์" },
  { key: "snookerTable", labelEn: "Snooker Table", labelTh: "โต๊ะสนุ๊ก" },
  { key: "basketballCourt", labelEn: "Basketball Court", labelTh: "สนามบาส" },
  { key: "badmintonCourt", labelEn: "Badminton Court", labelTh: "สนามแบดมินตัน" },
  { key: "lowRise", labelEn: "Low-Rise", labelTh: "" },
  { key: "highRise", labelEn: "High-Rise", labelTh: "" },
  { key: "kitchenPartition", labelEn: "Kitchen Partition", labelTh: "ฉากกั้นห้องครัว" },
  { key: "bedroomPartition", labelEn: "Bedroom Partition", labelTh: "ฉากกั้นห้องนอน" },
];

interface UnitType {
  type: string;
  size: string;
  planImageUrl: string;
}

interface ProjectFormProps {
  locale: string;
  projectId?: number;
  initialData?: any;
}

export default function ProjectForm({ locale, projectId, initialData }: ProjectFormProps) {
  const router = useRouter();
  const isEdit = !!projectId;

  const [form, setForm] = useState({
    nameTh: "",
    nameEn: "",
    descriptionTh: "",
    descriptionEn: "",
    developer: "",
    location: "",
    fullAddress: "",
    province: "",
    district: "",
    projectArea: "",
    googleMapsUrl: "",
    latitude: "",
    longitude: "",
    ceilingHeight: "",
    utilityFee: "",
    buildings: "",
    parking: "",
    floors: "",
    totalUnits: "",
    yearCompleted: "",
    isPopular: false,
  });

  const [imageUrl, setImageUrl] = useState<string>("");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [photoAlbum, setPhotoAlbum] = useState<string[]>([]);
  const [facilities, setFacilities] = useState<string[]>([]);
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState("");

  // AI Auto-fill state
  const [aiSearchName, setAiSearchName] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiSuccess, setAiSuccess] = useState(false);

  const mainImgRef = useRef<HTMLInputElement>(null);
  const logoImgRef = useRef<HTMLInputElement>(null);
  const albumRef = useRef<HTMLInputElement>(null);
  const unitPlanRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Load initial data
  useEffect(() => {
    if (!initialData) return;
    setForm({
      nameTh: initialData.nameTh || "",
      nameEn: initialData.nameEn || "",
      descriptionTh: initialData.descriptionTh || "",
      descriptionEn: initialData.descriptionEn || "",
      developer: initialData.developer || "",
      location: initialData.location || "",
      fullAddress: initialData.fullAddress || "",
      province: initialData.province || "",
      district: initialData.district || "",
      projectArea: initialData.projectArea || "",
      googleMapsUrl: initialData.googleMapsUrl || "",
      latitude: initialData.latitude ? String(initialData.latitude) : "",
      longitude: initialData.longitude ? String(initialData.longitude) : "",
      ceilingHeight: initialData.ceilingHeight ? String(initialData.ceilingHeight) : "",
      utilityFee: initialData.utilityFee || "",
      buildings: initialData.buildings ? String(initialData.buildings) : "",
      parking: initialData.parking ? String(initialData.parking) : "",
      floors: initialData.floors ? String(initialData.floors) : "",
      totalUnits: initialData.totalUnits ? String(initialData.totalUnits) : "",
      yearCompleted: initialData.yearCompleted ? String(initialData.yearCompleted) : "",
      isPopular: !!initialData.isPopular,
    });
    setImageUrl(initialData.imageUrl || "");
    setLogoUrl(initialData.logoUrl || "");
    try {
      setPhotoAlbum(initialData.photoAlbum ? JSON.parse(initialData.photoAlbum) : []);
    } catch {
      setPhotoAlbum([]);
    }
    try {
      setFacilities(initialData.facilities ? JSON.parse(initialData.facilities) : []);
    } catch {
      setFacilities([]);
    }
    try {
      setUnitTypes(initialData.unitTypes ? JSON.parse(initialData.unitTypes) : []);
    } catch {
      setUnitTypes([]);
    }
  }, [initialData]);

  const updateForm = (key: string, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    return data.success ? data.data.url : null;
  };

  const handleSingleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void,
    key: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(key);
    const url = await uploadFile(file);
    if (url) setter(url);
    setUploading(null);
    e.target.value = "";
  };

  const handleAlbumUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading("album");
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const url = await uploadFile(files[i]);
      if (url) urls.push(url);
    }
    setPhotoAlbum((prev) => [...prev, ...urls]);
    setUploading(null);
    e.target.value = "";
  };

  const handleUnitPlanUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(`unit-${index}`);
    const url = await uploadFile(file);
    if (url) {
      setUnitTypes((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], planImageUrl: url };
        return next;
      });
    }
    setUploading(null);
    e.target.value = "";
  };

  const toggleFacility = (key: string) => {
    setFacilities((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const addUnitType = () => {
    setUnitTypes((prev) => [...prev, { type: "", size: "", planImageUrl: "" }]);
  };

  const updateUnitType = (i: number, key: keyof UnitType, value: string) => {
    setUnitTypes((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [key]: value };
      return next;
    });
  };

  const removeUnitType = (i: number) => {
    setUnitTypes((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleAiAutofill = async () => {
    const name = (aiSearchName || form.nameTh).trim();
    if (!name) {
      setAiError("Please enter a project name first");
      return;
    }
    setAiLoading(true);
    setAiError("");
    setAiSuccess(false);
    try {
      const res = await fetch("/api/ai/lookup-project-full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName: name }),
      });
      const data = await res.json();
      if (!data.success) {
        setAiError(data.error || "AI lookup failed");
        setAiLoading(false);
        return;
      }
      const d = data.data;

      // Merge AI data into form (only fill empty fields by default)
      setForm((prev) => ({
        ...prev,
        nameTh: prev.nameTh || d.nameTh || name,
        nameEn: prev.nameEn || d.nameEn || "",
        developer: prev.developer || d.developer || "",
        location: prev.location || d.location || "",
        province: prev.province || d.province || "",
        district: prev.district || d.district || "",
        fullAddress: prev.fullAddress || d.fullAddress || "",
        projectArea: prev.projectArea || d.projectArea || "",
        googleMapsUrl: prev.googleMapsUrl || d.googleMapsUrl || "",
        latitude: prev.latitude || (d.latitude != null ? String(d.latitude) : ""),
        longitude: prev.longitude || (d.longitude != null ? String(d.longitude) : ""),
        ceilingHeight:
          prev.ceilingHeight || (d.ceilingHeight != null ? String(d.ceilingHeight) : ""),
        utilityFee: prev.utilityFee || d.utilityFee || "",
        buildings: prev.buildings || (d.buildings != null ? String(d.buildings) : ""),
        parking: prev.parking || (d.parking != null ? String(d.parking) : ""),
        floors: prev.floors || (d.floors != null ? String(d.floors) : ""),
        totalUnits: prev.totalUnits || (d.totalUnits != null ? String(d.totalUnits) : ""),
        yearCompleted:
          prev.yearCompleted || (d.yearCompleted != null ? String(d.yearCompleted) : ""),
        descriptionTh: prev.descriptionTh || d.descriptionTh || "",
      }));

      // Merge facilities (union)
      if (Array.isArray(d.facilities) && d.facilities.length) {
        setFacilities((prev) => Array.from(new Set([...prev, ...d.facilities])));
      }

      // Replace unitTypes only if empty
      if (Array.isArray(d.unitTypes) && d.unitTypes.length) {
        setUnitTypes((prev) =>
          prev.length === 0
            ? d.unitTypes.map((u: any) => ({
                type: u.type || "",
                size: u.size || "",
                planImageUrl: "",
              }))
            : prev
        );
      }

      setAiSuccess(true);
      setTimeout(() => setAiSuccess(false), 3000);
    } catch (err) {
      setAiError("AI request failed");
    }
    setAiLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.nameTh.trim()) {
      setError("Project name (Thai) is required");
      return;
    }
    setSaving(true);
    try {
      const url = isEdit
        ? `/api/admin/projects/${projectId}`
        : "/api/admin/projects";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          imageUrl,
          logoUrl,
          photoAlbum,
          facilities,
          unitTypes: unitTypes.filter((u) => u.type || u.size),
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/${locale}/admin/projects`);
      } else {
        setError(data.error || "Save failed");
      }
    } catch (err) {
      setError("Save failed");
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/admin/projects`}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">
            {isEdit ? "Edit Project" : "Add Project"}
          </h1>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-[#C8A951] hover:bg-[#B8993F] text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : "Save Project"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* AI Auto-fill */}
      <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-amber-50 border border-purple-200 rounded-xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h2 className="font-bold text-base">
            AI Auto-fill / กรอกข้อมูลโครงการอัตโนมัติ
          </h2>
        </div>
        <p className="text-xs text-gray-600 mb-3">
          พิมพ์ชื่อโครงการ AI จะช่วยค้นหาและกรอกข้อมูล (developer, location, facilities, unit types ฯลฯ) ให้อัตโนมัติ
          ระบบจะกรอกเฉพาะช่องที่ยังว่างเท่านั้น
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={aiSearchName}
            onChange={(e) => {
              setAiSearchName(e.target.value);
              setAiError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAiAutofill();
              }
            }}
            placeholder="e.g., Ideo Mobi Sukhumvit, The Base Park East..."
            className="flex-1 px-4 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
          <button
            type="button"
            onClick={handleAiAutofill}
            disabled={aiLoading}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 whitespace-nowrap"
          >
            {aiLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลังค้นหา...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                AI Auto-fill
              </>
            )}
          </button>
        </div>
        {aiError && (
          <p className="mt-2 text-sm text-red-600">{aiError}</p>
        )}
        {aiSuccess && (
          <p className="mt-2 text-sm text-green-700">
            ✓ AI กรอกข้อมูลให้แล้ว กรุณาตรวจสอบและแก้ไขก่อนบันทึก
          </p>
        )}
      </div>

      {/* Section: Project Information */}
      <Section title="Project Information / ข้อมูลโครงการ" subtitle="Enter the main details for this project.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Project Name / ชื่อโครงการ *">
            <input
              type="text"
              value={form.nameTh}
              onChange={(e) => updateForm("nameTh", e.target.value)}
              required
              className={inputCls}
              placeholder="e.g., Ideo Mobi Sukhumvit"
            />
          </Field>
          <Field label="Project Name (English)">
            <input
              type="text"
              value={form.nameEn}
              onChange={(e) => updateForm("nameEn", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Location / ทำเล">
            <input
              type="text"
              value={form.location}
              onChange={(e) => updateForm("location", e.target.value)}
              className={inputCls}
              placeholder="e.g., On Nut, Bangkok"
            />
          </Field>
          <Field label="Developer / บริษัทผู้พัฒนา">
            <input
              type="text"
              value={form.developer}
              onChange={(e) => updateForm("developer", e.target.value)}
              className={inputCls}
              placeholder="e.g., Ananda Development"
            />
          </Field>
          <Field label="Province / จังหวัด">
            <input
              type="text"
              value={form.province}
              onChange={(e) => updateForm("province", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="District / อำเภอ">
            <input
              type="text"
              value={form.district}
              onChange={(e) => updateForm("district", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Full Address / ที่อยู่เต็ม" full>
            <textarea
              value={form.fullAddress}
              onChange={(e) => updateForm("fullAddress", e.target.value)}
              rows={2}
              className={inputCls + " resize-none"}
            />
          </Field>
          <Field label="Project Area / ขนาดพื้นที่">
            <input
              type="text"
              value={form.projectArea}
              onChange={(e) => updateForm("projectArea", e.target.value)}
              className={inputCls}
              placeholder="e.g., 5 ไร่ 2 งาน 13 ตร.ว."
            />
          </Field>
          <Field label="Google Maps URL">
            <input
              type="url"
              value={form.googleMapsUrl}
              onChange={(e) => updateForm("googleMapsUrl", e.target.value)}
              className={inputCls}
              placeholder="https://maps.app.goo.gl/..."
            />
          </Field>
          <Field label="Latitude / ละติจูด">
            <input
              type="text"
              value={form.latitude}
              onChange={(e) => updateForm("latitude", e.target.value)}
              className={inputCls}
              placeholder="e.g., 13.7563"
            />
          </Field>
          <Field label="Longitude / ลองจิจูด">
            <input
              type="text"
              value={form.longitude}
              onChange={(e) => updateForm("longitude", e.target.value)}
              className={inputCls}
              placeholder="e.g., 100.5018"
            />
          </Field>

          {/* Map Preview */}
          {form.latitude && form.longitude && !isNaN(Number(form.latitude)) && !isNaN(Number(form.longitude)) && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Preview Map{" "}
                <span className="font-normal text-gray-400 text-xs">
                  (คลิกหรือลาก marker เพื่อเปลี่ยนตำแหน่ง)
                </span>
              </label>
              <div className="rounded-lg overflow-hidden border">
                <DraggableMapPreview
                  latitude={Number(form.latitude)}
                  longitude={Number(form.longitude)}
                  onPositionChange={(lat, lng) => {
                    updateForm("latitude", lat.toFixed(7));
                    updateForm("longitude", lng.toFixed(7));
                  }}
                />
              </div>
              <a
                href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline mt-1 inline-block"
              >
                เปิดใน Google Maps
              </a>
            </div>
          )}

          <Field label="Description / คำอธิบาย" full>
            <textarea
              value={form.descriptionTh}
              onChange={(e) => updateForm("descriptionTh", e.target.value)}
              rows={4}
              className={inputCls + " resize-none"}
              placeholder="Describe the project..."
            />
          </Field>
        </div>
      </Section>

      {/* Section: Building Details */}
      <Section title="Building Details / รายละเอียดอาคาร">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Ceiling Height (m) / ความสูง">
            <input
              type="number"
              step="0.01"
              value={form.ceilingHeight}
              onChange={(e) => updateForm("ceilingHeight", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Utility Fee / ค่าส่วนกลาง">
            <input
              type="text"
              value={form.utilityFee}
              onChange={(e) => updateForm("utilityFee", e.target.value)}
              className={inputCls}
              placeholder="e.g., 50 บาท/ตร.ม."
            />
          </Field>
          <Field label="Buildings / จำนวนอาคาร">
            <input
              type="number"
              value={form.buildings}
              onChange={(e) => updateForm("buildings", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Parking / ที่จอดรถ">
            <input
              type="number"
              value={form.parking}
              onChange={(e) => updateForm("parking", e.target.value)}
              className={inputCls}
              placeholder="e.g., 300"
            />
          </Field>
          <Field label="Floors / จำนวนชั้น">
            <input
              type="number"
              value={form.floors}
              onChange={(e) => updateForm("floors", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Total Units / ยูนิตทั้งหมด">
            <input
              type="number"
              value={form.totalUnits}
              onChange={(e) => updateForm("totalUnits", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Year Completed / ปีที่แล้วเสร็จ">
            <input
              type="number"
              value={form.yearCompleted}
              onChange={(e) => updateForm("yearCompleted", e.target.value)}
              className={inputCls}
              placeholder="e.g., 2024"
            />
          </Field>
        </div>
      </Section>

      {/* Section: Unit Types */}
      <Section
        title="Unit Types / ประเภทของยูนิต"
        subtitle="Define the types of units available in this project."
      >
        <div className="space-y-3">
          {unitTypes.map((u, i) => (
            <div
              key={i}
              className="grid grid-cols-12 gap-3 items-end p-3 bg-gray-50 rounded-lg"
            >
              <div className="col-span-12 md:col-span-4">
                <label className="block text-xs text-gray-600 mb-1">
                  Type / ประเภท {i + 1}
                </label>
                <input
                  type="text"
                  value={u.type}
                  onChange={(e) => updateUnitType(i, "type", e.target.value)}
                  className={inputCls}
                  placeholder="e.g., 1 Bedroom"
                />
              </div>
              <div className="col-span-12 md:col-span-3">
                <label className="block text-xs text-gray-600 mb-1">
                  Size (sqm) / ขนาด (ตร.ม.)
                </label>
                <input
                  type="text"
                  value={u.size}
                  onChange={(e) => updateUnitType(i, "size", e.target.value)}
                  className={inputCls}
                  placeholder="e.g., 35-42"
                />
              </div>
              <div className="col-span-10 md:col-span-4">
                <label className="block text-xs text-gray-600 mb-1">
                  Unit Plan Image
                </label>
                <input
                  ref={(el) => {
                    unitPlanRefs.current[i] = el;
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleUnitPlanUpload(e, i)}
                />
                {u.planImageUrl ? (
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={u.planImageUrl}
                      alt="Plan"
                      className="w-10 h-10 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => updateUnitType(i, "planImageUrl", "")}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => unitPlanRefs.current[i]?.click()}
                    disabled={uploading === `unit-${i}`}
                    className="px-3 py-2 text-xs border-2 border-dashed rounded hover:bg-white"
                  >
                    {uploading === `unit-${i}` ? (
                      <Loader2 className="w-3 h-3 animate-spin inline" />
                    ) : (
                      "Upload"
                    )}
                  </button>
                )}
              </div>
              <div className="col-span-2 md:col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeUnitType(i)}
                  className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addUnitType}
            className="flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg text-sm text-gray-500 hover:bg-gray-50"
          >
            <Plus className="w-4 h-4" />
            Add Unit Type / เพิ่มประเภทยูนิต
          </button>
        </div>
      </Section>

      {/* Section: Project Media */}
      <Section title="Project Media / สื่อของโครงการ">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Main Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Main Image / รูปภาพหลัก
            </label>
            <input
              ref={mainImgRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleSingleUpload(e, setImageUrl, "main")}
            />
            <ImageUploadButton
              imageUrl={imageUrl}
              onUpload={() => mainImgRef.current?.click()}
              onRemove={() => setImageUrl("")}
              uploading={uploading === "main"}
            />
          </div>

          {/* Logo Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo Image / รูปภาพโลโก้
            </label>
            <input
              ref={logoImgRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleSingleUpload(e, setLogoUrl, "logo")}
            />
            <ImageUploadButton
              imageUrl={logoUrl}
              onUpload={() => logoImgRef.current?.click()}
              onRemove={() => setLogoUrl("")}
              uploading={uploading === "logo"}
            />
          </div>
        </div>

        {/* Photo Album */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photo Album / อัลบั้มรูปภาพ
          </label>
          <input
            ref={albumRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleAlbumUpload}
          />
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {photoAlbum.map((url, i) => (
              <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() =>
                    setPhotoAlbum((prev) => prev.filter((_, idx) => idx !== i))
                  }
                  className="absolute top-1 right-1 bg-white rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-red-600" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => albumRef.current?.click()}
              disabled={uploading === "album"}
              className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50"
            >
              {uploading === "album" ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Plus className="w-6 h-6" />
                  <span className="text-xs mt-1">Add Images</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Section>

      {/* Section: Facilities */}
      <Section title="Facilities / สิ่งอำนวยความสะดวกส่วนกลาง">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {PROJECT_FACILITY_ITEMS.map((item) => (
            <label
              key={item.key}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
            >
              <input
                type="checkbox"
                checked={facilities.includes(item.key)}
                onChange={() => toggleFacility(item.key)}
                className="w-4 h-4 rounded text-[#C8A951] focus:ring-amber-300"
              />
              <span className="text-sm">
                {item.labelEn}
                {item.labelTh && (
                  <span className="text-gray-400 ml-1 text-xs">/ {item.labelTh}</span>
                )}
              </span>
            </label>
          ))}
        </div>
      </Section>

      {/* Section: Settings */}
      <Section title="Settings">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isPopular}
            onChange={(e) => updateForm("isPopular", e.target.checked)}
            className="w-4 h-4 rounded text-[#C8A951] focus:ring-amber-300"
          />
          <span className="text-sm">Mark as Popular Project</span>
        </label>
      </Section>

      {/* Submit */}
      <div className="flex justify-end gap-3 mt-6">
        <Link
          href={`/${locale}/admin/projects`}
          className="px-5 py-2 border rounded-lg text-sm hover:bg-gray-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-[#C8A951] hover:bg-[#B8993F] text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : "Save Project"}
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-[#C8A951]";

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border p-6 mb-4">
      <div className="mb-4">
        <h2 className="font-bold text-lg">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function ImageUploadButton({
  imageUrl,
  onUpload,
  onRemove,
  uploading,
}: {
  imageUrl: string;
  onUpload: () => void;
  onRemove: () => void;
  uploading: boolean;
}) {
  if (imageUrl) {
    return (
      <div className="relative aspect-video w-full bg-gray-50 rounded-lg overflow-hidden border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 bg-white p-1.5 rounded-full shadow hover:bg-gray-100"
        >
          <X className="w-4 h-4 text-red-600" />
        </button>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onUpload}
      disabled={uploading}
      className="aspect-video w-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 hover:bg-gray-50"
    >
      {uploading ? (
        <Loader2 className="w-6 h-6 animate-spin" />
      ) : (
        <>
          <ImageIcon className="w-6 h-6" />
          <span className="text-xs">Click to upload / คลิกเพื่ออัปโหลด</span>
        </>
      )}
    </button>
  );
}
