"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Save,
  Loader2,
  Upload,
  X,
  Sofa,
  Zap,
  Phone,
  FileText,
  Train,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import StationMapSelector, { LINES } from "@/components/admin/StationMapSelector";
import ThaiAddressFields from "@/components/admin/ThaiAddressFields";

const DraggableMapPreview = dynamic(() => import("@/components/admin/DraggableMapPreview"), { ssr: false });

const FURNITURE_ITEMS = [
  { key: "bed", labelEn: "Bed", labelTh: "เตียง" },
  { key: "mattress", labelEn: "Mattress", labelTh: "ฟูก / ที่นอน" },
  { key: "wardrobe", labelEn: "Wardrobe", labelTh: "ตู้เสื้อผ้า" },
  { key: "dressingTable", labelEn: "Dressing Table", labelTh: "โต๊ะเครื่องแป้ง" },
  { key: "sofa", labelEn: "Sofa", labelTh: "โซฟา" },
  { key: "coffeeTable", labelEn: "Coffee Table", labelTh: "โต๊ะกลาง" },
  { key: "tvCabinet", labelEn: "TV Cabinet", labelTh: "ชั้นวางทีวี" },
  { key: "curtains", labelEn: "Curtains / Blinds", labelTh: "ผ้าม่าน / มู่ลี่" },
  { key: "kitchenCounter", labelEn: "Kitchen Counter", labelTh: "เคาน์เตอร์ครัว" },
  { key: "sink", labelEn: "Sink", labelTh: "ซิงก์ล้างจาน" },
  { key: "diningTable", labelEn: "Dining Table", labelTh: "โต๊ะอาหาร" },
  { key: "chairs", labelEn: "Chairs", labelTh: "เก้าอี้" },
  { key: "showerScreen", labelEn: "Shower Screen", labelTh: "ฉากกั้นอาบน้ำ" },
];

const APPLIANCE_ITEMS = [
  { key: "airConditioner", labelEn: "Air Conditioner", labelTh: "แอร์" },
  { key: "tv", labelEn: "TV", labelTh: "ทีวี" },
  { key: "refrigerator", labelEn: "Refrigerator", labelTh: "ตู้เย็น" },
  { key: "microwave", labelEn: "Microwave", labelTh: "ไมโครเวฟ" },
  { key: "stove", labelEn: "Stove", labelTh: "เตาไฟฟ้า / เตาแก๊ส" },
  { key: "cookerHood", labelEn: "Cooker Hood", labelTh: "เครื่องดูดควัน" },
  { key: "washingMachine", labelEn: "Washing Machine", labelTh: "เครื่องซักผ้า" },
  { key: "digitalDoorLock", labelEn: "Digital Door Lock", labelTh: "" },
  { key: "waterHeater", labelEn: "Water Heater", labelTh: "เครื่องทำน้ำอุ่น" },
];

const FACILITY_ITEMS = [
  { key: "petFriendly", labelEn: "Pet-Friendly", labelTh: "เลี้ยงสัตว์ได้" },
  { key: "convenienceStore", labelEn: "Convenience Store", labelTh: "ร้านสะดวกซื้อ" },
  { key: "coWorkingSpace", labelEn: "Co-working Space", labelTh: "" },
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
];

const STATUS_OPTIONS = [
  { value: "PENDING", label: "1. Pending" },
  { value: "WAITING", label: "2. Waiting" },
  { value: "VERIFIED", label: "3. Verified" },
  { value: "VERIFIED_OVER_10_DAYS", label: "4. Verified Over 10 days" },
  { value: "ADDED_PROPERTIES", label: "5. Added Properties" },
  { value: "NOT_ACCEPT", label: "6. Not Accept" },
  { value: "NOT_AVAILABLE", label: "7. Not Available" },
  { value: "RENTED", label: "8. Rented" },
  { value: "SOLD", label: "9. Sold" },
];

const LISTING_TYPE_OPTIONS = [
  { value: "RENT", label: "Rent" },
  { value: "SALE", label: "Sale" },
  { value: "RENT_AND_SALE", label: "Rent & Sale" },
];

export default function AddPropertyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;
  const isAgentMode = (session?.user as any)?.role === "CO_AGENT";

  const [locale, setLocale] = useState("th");
  const [saving, setSaving] = useState(false);
  const [showStationModal, setShowStationModal] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);

  // Project picker state
  const [projects, setProjects] = useState<{ id: number; nameTh: string; nameEn: string | null; developer: string | null; imageUrl: string | null }[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [projectSearch, setProjectSearch] = useState("");
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

  // Fetch projects on mount
  useEffect(() => {
    fetch("/api/admin/projects")
      .then((r) => r.json())
      .then((d) => { if (d.success) setProjects(d.data); })
      .catch(() => {});
  }, []);

  // Form state
  const [form, setForm] = useState({
    sourceLink: "",
    linkPage: "",
    projectName: "",
    propertyType: "CONDO",
    listingType: "RENT",
    condition: "SECOND_HAND",
    price: "",
    salePrice: "",
    sizeSqm: "",
    floor: "",
    building: "",
    bedrooms: "1",
    bathrooms: "1",
    landSizeRai: "",
    landSizeNgan: "",
    landSizeWa: "",
    latitude: "",
    longitude: "",
    postFrom: "OWNER",
    ownerName: "",
    ownerPhone: "",
    ownerLineId: "",
    ownerFacebookUrl: "",
    coAgentName: "",
    coAgentPhone: "",
    coAgentLineId: "",
    coAgentFacebookUrl: "",
    status: "PENDING",
    category: "NORMAL",
    priority: "NORMAL",
    foreignerAccept: "ACCEPT",
    note: "",
    availableDate: new Date().toISOString().split("T")[0],
    province: "",
    district: "",
    subdistrict: "",
  });

  const [selectedFurniture, setSelectedFurniture] = useState<string[]>([]);
  const [selectedAppliances, setSelectedAppliances] = useState<string[]>([]);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [selectedStations, setSelectedStations] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  // Investment analysis fields
  const [invForm, setInvForm] = useState({
    invPurchasePrice: "",
    invRenovationCost: "",
    invExpectedRentPerMonth: "",
    invCommonFeePerYear: "",
    invMaintenancePerYear: "",
    invLandTaxRate: "0.02",
    invVacancyMonths: "1",
    invBrokerFeeMonths: "1",
    invLoanAmount: "",
    invLoanTermYears: "30",
    invLoanInterestRate: "2.5",
  });
  const updateInv = (key: string, value: string) => setInvForm((prev) => ({ ...prev, [key]: value }));
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // AI project lookup
  const handleAiLookupProject = async () => {
    if (!form.projectName || aiLoading) return;
    setAiLoading(true);
    setAiError("");
    try {
      const res = await fetch("/api/ai/lookup-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName: form.projectName }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const d = data.data;
        if (d.facilities?.length) setSelectedFacilities(d.facilities);
        if (d.latitude) updateForm("latitude", String(d.latitude));
        if (d.longitude) updateForm("longitude", String(d.longitude));
        if (d.address) updateForm("address", d.address);
      } else {
        setAiError(data.error || "ไม่พบข้อมูลโครงการ");
      }
    } catch {
      setAiError("เกิดข้อผิดพลาด");
    }
    setAiLoading(false);
  };

  // Drag reorder state
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // AI extraction state
  const [aiLoading, setAiLoading] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    params.then(({ locale: l }) => setLocale(l));
  }, [params]);

  // Load existing property data for edit mode
  useEffect(() => {
    if (!editId) return;
    setLoadingEdit(true);
    fetch(`/api/properties/${editId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.success || !data.data) return;
        const p = data.data;

        setForm({
          sourceLink: p.sourceLink || "",
          linkPage: p.linkPage || "",
          projectName: p.projectName || p.titleTh || "",
          propertyType: p.propertyType || "CONDO",
          listingType: p.listingType || "RENT",
          condition: p.condition || "SECOND_HAND",
          price: p.price ? String(Number(p.price)) : "",
          salePrice: p.salePrice ? String(Number(p.salePrice)) : "",
          sizeSqm: p.sizeSqm ? String(Number(p.sizeSqm)) : "",
          floor: p.floor ? String(p.floor) : "",
          building: p.building || "",
          bedrooms: p.bedrooms ? String(p.bedrooms) : "1",
          bathrooms: p.bathrooms ? String(p.bathrooms) : "1",
          landSizeRai: p.landSizeRai ? String(Number(p.landSizeRai)) : "",
          landSizeNgan: p.landSizeNgan ? String(Number(p.landSizeNgan)) : "",
          landSizeWa: p.landSizeWa ? String(Number(p.landSizeWa)) : "",
          latitude: p.latitude ? String(Number(p.latitude)) : "",
          longitude: p.longitude ? String(Number(p.longitude)) : "",
          postFrom: p.postFrom || "OWNER",
          ownerName: p.ownerName || "",
          ownerPhone: p.ownerPhone || "",
          ownerLineId: p.ownerLineId || "",
          ownerFacebookUrl: p.ownerFacebookUrl || "",
          coAgentName: p.coAgentName || "",
          coAgentPhone: p.coAgentPhone || "",
          coAgentLineId: p.coAgentLineId || "",
          coAgentFacebookUrl: p.coAgentFacebookUrl || "",
          status: p.status || "PENDING",
          category: p.category || "NORMAL",
          priority: p.priority || "NORMAL",
          foreignerAccept: (p as any).foreignerAccept || "ACCEPT",
          note: p.note || "",
          availableDate: p.availableDate ? new Date(p.availableDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
          province: p.province || "",
          district: p.district || "",
          subdistrict: p.subdistrict || "",
        });

        // Parse furniture & appliances from JSON
        try {
          const f = p.furnitureDetails ? JSON.parse(p.furnitureDetails) : [];
          if (Array.isArray(f)) setSelectedFurniture(f);
        } catch {}
        try {
          const a = p.electricalAppliances ? JSON.parse(p.electricalAppliances) : [];
          if (Array.isArray(a)) setSelectedAppliances(a);
        } catch {}
        try {
          const fc = p.facilities ? JSON.parse(p.facilities) : [];
          if (Array.isArray(fc)) setSelectedFacilities(fc);
        } catch {}

        // Load stations from nearbyStations JSON
        try {
          const st = p.nearbyStations ? JSON.parse(p.nearbyStations) : [];
          if (Array.isArray(st)) setSelectedStations(st);
        } catch {}

        // Load existing images as previews
        if (p.images?.length) {
          setImagePreviews(p.images.map((img: any) => img.imageUrl));
        }

        // Set linked project
        if (p.projectId) setSelectedProjectId(p.projectId);

        // Load investment fields
        setInvForm({
          invPurchasePrice: p.invPurchasePrice ? String(Number(p.invPurchasePrice)) : "",
          invRenovationCost: p.invRenovationCost ? String(Number(p.invRenovationCost)) : "",
          invExpectedRentPerMonth: p.invExpectedRentPerMonth ? String(Number(p.invExpectedRentPerMonth)) : "",
          invCommonFeePerYear: p.invCommonFeePerYear ? String(Number(p.invCommonFeePerYear)) : "",
          invMaintenancePerYear: p.invMaintenancePerYear ? String(Number(p.invMaintenancePerYear)) : "",
          invLandTaxRate: p.invLandTaxRate ? String(Number(p.invLandTaxRate)) : "0.02",
          invVacancyMonths: p.invVacancyMonths ? String(Number(p.invVacancyMonths)) : "1",
          invBrokerFeeMonths: p.invBrokerFeeMonths ? String(Number(p.invBrokerFeeMonths)) : "1",
          invLoanAmount: p.invLoanAmount ? String(Number(p.invLoanAmount)) : "",
          invLoanTermYears: p.invLoanTermYears ? String(Number(p.invLoanTermYears)) : "30",
          invLoanInterestRate: p.invLoanInterestRate ? String(Number(p.invLoanInterestRate)) : "2.5",
        });
      })
      .catch(() => {})
      .finally(() => setLoadingEdit(false));
  }, [editId]);

  // AI auto-fill function
  const handleAiExtract = async (mode: "url" | "text") => {
    setAiLoading(true);
    setAiError("");

    try {
      const payload =
        mode === "url"
          ? { url: form.sourceLink }
          : { text: pasteText };

      const res = await fetch("/api/ai/extract-property", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        setAiError(data.error || "เกิดข้อผิดพลาด");
        setAiLoading(false);
        return;
      }

      const d = data.data;

      // Auto-fill form
      setForm((prev) => ({
        ...prev,
        projectName: d.projectName || prev.projectName,
        listingType: d.listingType || prev.listingType,
        price: d.price ? String(d.price) : prev.price,
        salePrice: d.salePrice ? String(d.salePrice) : prev.salePrice,
        sizeSqm: d.sizeSqm ? String(d.sizeSqm) : prev.sizeSqm,
        floor: d.floor ? String(d.floor) : prev.floor,
        building: d.building || prev.building,
        bedrooms: d.bedrooms ? String(d.bedrooms) : prev.bedrooms || "1",
        bathrooms: d.bathrooms ? String(d.bathrooms) : prev.bathrooms || "1",
        ownerName: d.ownerName || prev.ownerName,
        ownerPhone: d.ownerPhone || prev.ownerPhone,
        ownerLineId: d.ownerLineId || prev.ownerLineId,
        note: d.note || prev.note,
        sourceLink: mode === "url" ? prev.sourceLink : prev.sourceLink,
        province: d.province || prev.province,
        district: d.province ? (d.district || "") : prev.district,
        subdistrict: d.province ? (d.subdistrict || "") : prev.subdistrict,
      }));

      // Auto-fill furniture
      if (d.furniture?.length) {
        setSelectedFurniture(d.furniture);
      }

      // Auto-fill appliances
      if (d.appliances?.length) {
        setSelectedAppliances(d.appliances);
      }

      // Auto-fill stations - extract station code (e.g. "E16-ปู่เจ้า" → "E16")
      if (d.nearbyStations?.length) {
        const allStationIds = LINES.flatMap((l) => l.stations.map((s) => s.id));
        const parsed = d.nearbyStations
          .map((s: string) => {
            // Try exact match first
            if (allStationIds.includes(s)) return s;
            // Extract code before dash/hyphen (e.g. "E16-ปู่เจ้า" → "E16")
            const code = s.split(/[-–]/)[0].trim();
            if (allStationIds.includes(code)) return code;
            // Try matching by partial code
            return allStationIds.find((id) => id === code || s.startsWith(id)) || null;
          })
          .filter(Boolean) as string[];
        setSelectedStations(parsed);
      }

      setPasteText("");
    } catch (err) {
      setAiError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }

    setAiLoading(false);
  };

  // Get selected station names for display
  const selectedStationLabels = selectedStations
    .map((id) => {
      for (const line of LINES) {
        const station = line.stations.find((s) => s.id === id);
        if (station) return `${station.code} ${station.nameTh}`;
      }
      return id;
    })
    .slice(0, 3);

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleFurniture = (key: string) => {
    setSelectedFurniture((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleAppliance = (key: string) => {
    setSelectedAppliances((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleAllFurniture = () => {
    if (selectedFurniture.length === FURNITURE_ITEMS.length) {
      setSelectedFurniture([]);
    } else {
      setSelectedFurniture(FURNITURE_ITEMS.map((f) => f.key));
    }
  };

  const toggleAllAppliances = () => {
    if (selectedAppliances.length === APPLIANCE_ITEMS.length) {
      setSelectedAppliances([]);
    } else {
      setSelectedAppliances(APPLIANCE_ITEMS.map((a) => a.key));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImageFiles((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Build the complete ordered list of image URLs
      // Existing images have server URLs, new images have data: URIs
      const allImageUrls: string[] = [];
      let fileIndex = 0;
      for (const src of imagePreviews) {
        if (src.startsWith("data:")) {
          // New file — upload it
          const file = imageFiles[fileIndex];
          if (file) {
            const formData = new FormData();
            formData.append("file", file);
            const uploadRes = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            });
            const uploadData = await uploadRes.json();
            if (uploadData.success && uploadData.data?.url) {
              allImageUrls.push(uploadData.data.url);
            }
          }
          fileIndex++;
        } else {
          // Existing image URL — keep it in its new position
          allImageUrls.push(src);
        }
      }

      const imageUrls = allImageUrls;

      // Always send the array (even when empty) so removing all stations clears the field on update
      const stationIds = selectedStations;

      const isLand = form.propertyType === "LAND";
      const payload = {
        titleTh: form.projectName || "Property",
        propertyType: form.propertyType,
        listingType: form.listingType,
        condition: isLand ? null : form.condition,
        price: parseFloat(form.price) || 0,
        salePrice: form.salePrice ? parseFloat(form.salePrice) : null,
        sizeSqm: form.sizeSqm ? parseFloat(form.sizeSqm) : null,
        floor: isLand ? null : (form.floor ? parseInt(form.floor) : null),
        bedrooms: isLand ? 0 : (form.bedrooms ? parseInt(form.bedrooms) : 0),
        bathrooms: isLand ? 0 : (form.bathrooms ? parseInt(form.bathrooms) : 0),
        landSizeRai: isLand && form.landSizeRai ? parseFloat(form.landSizeRai) : null,
        landSizeNgan: isLand && form.landSizeNgan ? parseFloat(form.landSizeNgan) : null,
        landSizeWa: isLand && form.landSizeWa ? parseFloat(form.landSizeWa) : null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        projectName: form.projectName || null,
        projectId: selectedProjectId,
        sourceLink: form.sourceLink || null,
        linkPage: form.linkPage || null,
        building: form.building || null,
        postFrom: form.postFrom,
        furnitureDetails: selectedFurniture,
        electricalAppliances: selectedAppliances,
        facilities: selectedFacilities,
        ownerName: form.ownerName || null,
        ownerPhone: form.ownerPhone || null,
        ownerLineId: form.ownerLineId || null,
        ownerFacebookUrl: form.ownerFacebookUrl || null,
        coAgentName: form.coAgentName || null,
        coAgentPhone: form.coAgentPhone || null,
        coAgentLineId: form.coAgentLineId || null,
        coAgentFacebookUrl: form.coAgentFacebookUrl || null,
        status: form.status,
        category: form.category,
        priority: form.priority,
        foreignerAccept: form.foreignerAccept,
        note: form.note || null,
        availableDate: form.availableDate || null,
        province: form.province || null,
        district: form.district || null,
        subdistrict: form.subdistrict || null,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        stationIds,
        // Investment fields (only include if purchasePrice is filled)
        ...(invForm.invPurchasePrice ? {
          invPurchasePrice: parseFloat(invForm.invPurchasePrice) || null,
          invRenovationCost: invForm.invRenovationCost ? parseFloat(invForm.invRenovationCost) : null,
          invExpectedRentPerMonth: invForm.invExpectedRentPerMonth ? parseFloat(invForm.invExpectedRentPerMonth) : null,
          invCommonFeePerYear: invForm.invCommonFeePerYear ? parseFloat(invForm.invCommonFeePerYear) : null,
          invMaintenancePerYear: invForm.invMaintenancePerYear ? parseFloat(invForm.invMaintenancePerYear) : null,
          invLandTaxRate: invForm.invLandTaxRate ? parseFloat(invForm.invLandTaxRate) : null,
          invVacancyMonths: invForm.invVacancyMonths ? parseFloat(invForm.invVacancyMonths) : null,
          invBrokerFeeMonths: invForm.invBrokerFeeMonths ? parseFloat(invForm.invBrokerFeeMonths) : null,
          invLoanAmount: invForm.invLoanAmount ? parseFloat(invForm.invLoanAmount) : null,
          invLoanTermYears: invForm.invLoanTermYears ? parseFloat(invForm.invLoanTermYears) : null,
          invLoanInterestRate: invForm.invLoanInterestRate ? parseFloat(invForm.invLoanInterestRate) : null,
        } : {}),
      };

      const apiUrl = isEditMode
        ? `/api/properties/${editId}`
        : "/api/properties";

      const res = await fetch(apiUrl, {
        method: isEditMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        router.push(isAgentMode ? `/${locale}/agent` : `/${locale}/admin/properties`);
      } else {
        alert(data.error || "Failed to save property");
      }
    } catch (err) {
      alert("An error occurred while saving");
    }

    setSaving(false);
  };

  if (loadingEdit) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-600" /></div>;
  }

  const INV_LABELS: Record<string, Record<string, string>> = {
    sectionTitle:    { th: "ข้อมูลการลงทุน", en: "Investment Data", zh: "投资数据", my: "ရင်းနှီးမြုပ်နှံမှုဒေတာ" },
    forInvestor:     { th: "(สำหรับ Investor)", en: "(For Investors)", zh: "（适合投资者）", my: "(ရင်းနှီးမြှုပ်နှံသူများအတွက်)" },
    costTitle:       { th: "ต้นทุน", en: "Cost", zh: "成本", my: "ကုန်ကျစရိတ်" },
    purchasePrice:   { th: "ราคาซื้อ (รวมส่วนลด)", en: "Purchase Price (incl. discount)", zh: "购买价格（含折扣）", my: "ဝယ်ယူစျေးနှုန်း (လျှော့စျေးအပါ)" },
    renovation:      { th: "ค่าตกแต่ง + ต่อเติม", en: "Renovation / Fit-out", zh: "装修 / 改建", my: "ပြုပြင်မြှင့်တင်ခ" },
    totalCost:       { th: "ต้นทุนรวม:", en: "Total Cost:", zh: "总成本：", my: "စုစုပေါင်းကုန်ကျစရိတ်:" },
    incomeTitle:     { th: "รายได้ค่าเช่า", en: "Rental Income", zh: "租金收入", my: "ငှားရမ်းဝင်ငွေ" },
    monthlyRent:     { th: "ค่าเช่าต่อเดือน (บาท)", en: "Monthly Rent (฿)", zh: "每月租金（泰铢）", my: "လစဉ်ငှားရမ်းခ (฿)" },
    useListingRent:  { th: "(หรือปล่อยว่างเพื่อใช้จากราคาเช่าของห้อง)", en: "(leave blank to use listing rent)", zh: "（留空则使用房源租金）", my: "(ငှားရမ်းစျေးနှုန်းသုံးရန်ဗလာထားပါ)" },
    expenseTitle:    { th: "ค่าใช้จ่าย / ปี", en: "Annual Expenses", zh: "年度费用", my: "နှစ်စဉ်ကုန်ကျစရိတ်" },
    brokerFee:       { th: "ค่านายหน้า (กี่เดือน ต่อสัญญา 1 ปี)", en: "Broker Fee (months / 1-yr lease)", zh: "中介费（每年租约月数）", my: "ပွဲစားကြေး (1နှစ်ချုပ်/လ)" },
    commonFee:       { th: "ค่าส่วนกลาง / ปี (บาท)", en: "Common Fee / Year (฿)", zh: "管理费 / 年（泰铢）", my: "စီမံကြေး / နှစ် (฿)" },
    maintenance:     { th: "ค่าบำรุงรักษา / ปี (บาท)", en: "Maintenance / Year (฿)", zh: "维护费 / 年（泰铢）", my: "ထိန်းသိမ်းမှုကြေး / နှစ် (฿)" },
    maintenanceHint: { th: "(แม่บ้าน, ล้างแอร์ ฯลฯ)", en: "(cleaning, AC service, etc.)", zh: "（保洁、空调清洗等）", my: "(သန့်ရှင်းရေး၊ AC ဆေးကြောမှု)" },
    landTax:         { th: "ภาษีที่ดิน (% ต่อปี)", en: "Land Tax (% per year)", zh: "土地税（% / 年）", my: "မြေခွန် (% / နှစ်)" },
    vacancy:         { th: "ห้องว่างเฉลี่ย (เดือน / ปี)", en: "Avg. Vacancy (months / year)", zh: "平均空置月数（月 / 年）", my: "ပျမ်းမျှအလပ်ကျချိန် (လ/နှစ်)" },
    loanTitle:       { th: "ข้อมูลสินเชื่อ (ไม่บังคับ)", en: "Loan Details (optional)", zh: "贷款信息（可选）", my: "ချေးငွေအချက်အလက် (မဖြစ်မနေမဟုတ်)" },
    loanAmount:      { th: "วงเงินกู้ (บาท)", en: "Loan Amount (฿)", zh: "贷款金额（泰铢）", my: "ချေးငွေပမာဏ (฿)" },
    loanTerm:        { th: "ระยะเวลาผ่อน (ปี)", en: "Loan Term (years)", zh: "还款期限（年）", my: "ချေးငွေကာလ (နှစ်)" },
    interestRate:    { th: "อัตราดอกเบี้ย (% ต่อปี)", en: "Interest Rate (% p.a.)", zh: "利率（% / 年）", my: "အတိုးနှုန်း (% / နှစ်)" },
  };
  const tInv = (key: string) => INV_LABELS[key]?.[locale] ?? INV_LABELS[key]?.["en"] ?? key;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={isAgentMode ? `/${locale}/agent` : `/${locale}/admin/properties`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold">
            {isEditMode
              ? locale === "th" ? "แก้ไขข้อมูลห้อง" : "Edit Property"
              : locale === "th" ? "เพิ่มทรัพย์ใหม่" : "Add Property"}
          </h1>
          {isAgentMode && (
            <p className="text-sm text-amber-600 mt-0.5">
              ทรัพย์จะถูกส่งให้ทีม NPB Property พิจารณาเผยแพร่
            </p>
          )}
        </div>
        {isEditMode && editId && (
          <a
            href={`/${locale}/properties/${editId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View on web
          </a>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* AI Auto-fill Section */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-sm border border-purple-200 p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-purple-800">
              AI Auto-fill / กรอกข้อมูลอัตโนมัติ
            </h2>
          </div>
          <p className="text-sm text-purple-600 mb-3">
            คัดลอกข้อความจากโพสต์ Facebook แล้ววางที่นี่ AI จะช่วยดึงข้อมูลและกรอกฟอร์มให้อัตโนมัติ
          </p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={"วางข้อความจากโพสต์ที่นี่...\n\nเช่น:\n🏠 ให้เช่า คอนโด Unio Sukhumvit 72\nราคา 9,500 บาท/เดือน\nขนาด 26 ตร.ม. ชั้น 2 ตึก A\nเฟอร์นิเจอร์ครบ แอร์ ทีวี ตู้เย็น..."}
            rows={6}
            className="w-full border border-purple-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-y bg-white mb-3"
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleAiExtract("text")}
              disabled={aiLoading || !pasteText.trim()}
              className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:bg-purple-800 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {aiLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {aiLoading ? "กำลังวิเคราะห์..." : "AI วิเคราะห์ข้อมูล"}
            </button>
            {pasteText && (
              <button
                type="button"
                onClick={() => setPasteText("")}
                className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
              >
                ล้างข้อความ
              </button>
            )}
          </div>
          {aiError && (
            <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {aiError}
            </p>
          )}
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Source Link */}
            <div>
              <label className="block text-sm font-semibold mb-2">Source Link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.sourceLink}
                  onChange={(e) => updateForm("sourceLink", e.target.value)}
                  placeholder="https://www.facebook.com/share/..."
                  className="flex-1 border rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
                {form.sourceLink && (
                  <a
                    href={form.sourceLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-3 bg-amber-50 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors text-sm font-medium whitespace-nowrap"
                  >
                    <ExternalLink className="w-4 h-4" />
                    เปิดลิงค์
                  </a>
                )}
              </div>
            </div>

            {/* Image */}
            <div>
              <label className="block text-sm font-semibold mb-2">Image</label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer border rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors inline-flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Choose File
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                <span className="text-sm text-gray-500">
                  {imageFiles.length > 0
                    ? `${imageFiles.length} file(s) selected`
                    : "No file chosen"}
                </span>
              </div>
              {imagePreviews.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {imagePreviews.map((src, i) => (
                    <div
                      key={i}
                      className={`relative w-20 h-20 cursor-grab active:cursor-grabbing ${dragIdx === i ? "opacity-40" : ""} ${i === 0 ? "ring-2 ring-amber-500 rounded-lg" : ""}`}
                      draggable
                      onDragStart={() => setDragIdx(i)}
                      onDragOver={(e) => { e.preventDefault(); setDragOverIdx(i); }}
                      onDrop={() => {
                        if (dragIdx === null || dragIdx === i) return;
                        const newPreviews = [...imagePreviews];
                        const newFiles = [...imageFiles];
                        const [movedP] = newPreviews.splice(dragIdx, 1);
                        newPreviews.splice(i, 0, movedP);
                        if (newFiles.length > 0) {
                          const [movedF] = newFiles.splice(dragIdx, 1);
                          newFiles.splice(i, 0, movedF);
                          setImageFiles(newFiles);
                        }
                        setImagePreviews(newPreviews);
                        setDragIdx(null);
                        setDragOverIdx(null);
                      }}
                      onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                    >
                      {dragOverIdx === i && dragIdx !== i && (
                        <div className="absolute inset-0 border-2 border-amber-500 rounded-lg z-10 pointer-events-none" />
                      )}
                      <img
                        src={src}
                        alt=""
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                      {i === 0 && (
                        <span className="absolute bottom-0 left-0 right-0 bg-amber-500 text-white text-[8px] text-center rounded-b-lg">MAIN</span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {imagePreviews.length > 1 && (
                <p className="text-xs text-gray-400 mt-1">ลากเพื่อเรียงลำดับ รูปแรกจะเป็นรูปหลัก</p>
              )}
            </div>

            {/* Link Page */}
            <div>
              <label className="block text-sm font-semibold mb-2">Link Page</label>
              <input
                type="text"
                value={form.linkPage}
                onChange={(e) => updateForm("linkPage", e.target.value)}
                placeholder="https://web.facebook.com/share/..."
                className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
            </div>

            {/* Province / District / Subdistrict */}
            <div>
              <label className="block text-sm font-semibold mb-2">จังหวัด / อำเภอ / ตำบล</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <ThaiAddressFields
                  province={form.province}
                  district={form.district}
                  subdistrict={form.subdistrict}
                  onProvinceChange={(v) => updateForm("province", v)}
                  onDistrictChange={(v) => updateForm("district", v)}
                  onSubdistrictChange={(v) => updateForm("subdistrict", v)}
                />
              </div>
            </div>

            {/* Near BTS/MRT */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Near BTS/MRT (Location)
              </label>
              <button
                type="button"
                onClick={() => setShowStationModal(true)}
                className="w-full border rounded-lg px-4 py-3 text-left flex items-center gap-2 hover:bg-gray-50 transition-colors"
              >
                <Train className="w-4 h-4 text-gray-400" />
                {selectedStations.length > 0 ? (
                  <span className="flex-1 truncate">
                    {selectedStationLabels.join(", ")}
                    {selectedStations.length > 3
                      ? ` +${selectedStations.length - 3} more`
                      : ""}
                  </span>
                ) : (
                  <span className="text-gray-400">Select Stations</span>
                )}
              </button>
            </div>

            {/* Project Picker (link to existing project) */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Linked Project / โครงการที่เชื่อมโยง
                <span className="ml-2 text-xs text-gray-400 font-normal">
                  (Optional - reuse project info from saved projects)
                </span>
              </label>
              {selectedProjectId ? (
                (() => {
                  const sel = projects.find((p) => p.id === selectedProjectId);
                  return (
                    <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      {sel?.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={sel.imageUrl}
                          alt=""
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{sel?.nameTh}</div>
                        {sel?.developer && (
                          <div className="text-xs text-gray-500">{sel.developer}</div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedProjectId(null)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Unlink
                      </button>
                    </div>
                  );
                })()
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={projectSearch}
                    onChange={(e) => {
                      setProjectSearch(e.target.value);
                      setShowProjectDropdown(true);
                    }}
                    onFocus={() => setShowProjectDropdown(true)}
                    onBlur={() => setTimeout(() => setShowProjectDropdown(false), 200)}
                    placeholder="Search saved projects... or leave empty to create new"
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  />
                  {showProjectDropdown && projects.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {projects
                        .filter((p) => {
                          if (!projectSearch.trim()) return true;
                          const q = projectSearch.toLowerCase();
                          return (
                            p.nameTh.toLowerCase().includes(q) ||
                            p.nameEn?.toLowerCase().includes(q) ||
                            p.developer?.toLowerCase().includes(q)
                          );
                        })
                        .slice(0, 10)
                        .map((p) => (
                          <button
                            type="button"
                            key={p.id}
                            onClick={() => {
                              setSelectedProjectId(p.id);
                              updateForm("projectName", p.nameTh);
                              setProjectSearch("");
                              setShowProjectDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-amber-50 flex items-center gap-3 text-sm"
                          >
                            {p.imageUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.imageUrl}
                                alt=""
                                className="w-8 h-8 object-cover rounded"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{p.nameTh}</div>
                              {p.developer && (
                                <div className="text-xs text-gray-400 truncate">
                                  {p.developer}
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      {projects.filter((p) => {
                        if (!projectSearch.trim()) return true;
                        const q = projectSearch.toLowerCase();
                        return (
                          p.nameTh.toLowerCase().includes(q) ||
                          p.nameEn?.toLowerCase().includes(q) ||
                          p.developer?.toLowerCase().includes(q)
                        );
                      }).length === 0 && (
                        <div className="px-4 py-3 text-sm text-gray-400 text-center">
                          No matching projects.{" "}
                          <a
                            href={`/${locale}/admin/projects/new`}
                            target="_blank"
                            className="text-[#C8A951] hover:underline"
                          >
                            Create new
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Project Name */}
            <div>
              <label className="block text-sm font-semibold mb-2">Project Name</label>
              <textarea
                value={form.projectName}
                onChange={(e) => updateForm("projectName", e.target.value)}
                placeholder="e.g., Unio Sukhumvit 72"
                rows={3}
                className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-y"
              />
            </div>

            {/* Size, Floor, Bedrooms, Bathrooms */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Size (sqm)</label>
                <input
                  type="number"
                  value={form.sizeSqm}
                  onChange={(e) => updateForm("sizeSqm", e.target.value)}
                  placeholder="26"
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Floor</label>
                <input
                  type="number"
                  value={form.floor}
                  onChange={(e) => updateForm("floor", e.target.value)}
                  placeholder="2"
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Bedrooms / ห้องนอน</label>
                <input
                  type="number"
                  min="0"
                  value={form.bedrooms}
                  onChange={(e) => updateForm("bedrooms", e.target.value)}
                  placeholder="1"
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Bathrooms / ห้องน้ำ</label>
                <input
                  type="number"
                  min="0"
                  value={form.bathrooms}
                  onChange={(e) => updateForm("bathrooms", e.target.value)}
                  placeholder="1"
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Property Type */}
            <div>
              <label className="block text-sm font-semibold mb-2">Property Type / ประเภท</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: "CONDO", label: "Condo" },
                  { value: "HOUSE", label: "House" },
                  { value: "TOWNHOUSE", label: "Townhouse" },
                  { value: "LAND", label: "Land" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateForm("propertyType", opt.value)}
                    className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      form.propertyType === opt.value
                        ? "bg-[#C8A951] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Listing Type */}
            <div>
              <label className="block text-sm font-semibold mb-2">Listing Type</label>
              <select
                value={form.listingType}
                onChange={(e) => updateForm("listingType", e.target.value)}
                className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white"
              >
                {LISTING_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Condition (1st/2nd hand) — hidden for LAND */}
            {form.propertyType !== "LAND" && (
              <div>
                <label className="block text-sm font-semibold mb-2">Condition / สภาพ</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "FIRST_HAND", label: "Brand New / มือ 1" },
                    { value: "SECOND_HAND", label: "Pre-owned / มือ 2" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateForm("condition", opt.value)}
                      className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        form.condition === opt.value
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Land Size — only for LAND */}
            {form.propertyType === "LAND" && (
              <div>
                <label className="block text-sm font-semibold mb-2">Land Size / ขนาดที่ดิน</label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <input
                      type="number"
                      step="0.01"
                      value={form.landSizeRai}
                      onChange={(e) => updateForm("landSizeRai", e.target.value)}
                      placeholder="0"
                      className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    />
                    <label className="block text-xs text-gray-500 mt-1 text-center">ไร่ / Rai</label>
                  </div>
                  <div>
                    <input
                      type="number"
                      step="0.01"
                      value={form.landSizeNgan}
                      onChange={(e) => updateForm("landSizeNgan", e.target.value)}
                      placeholder="0"
                      className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    />
                    <label className="block text-xs text-gray-500 mt-1 text-center">งาน / Ngan</label>
                  </div>
                  <div>
                    <input
                      type="number"
                      step="0.01"
                      value={form.landSizeWa}
                      onChange={(e) => updateForm("landSizeWa", e.target.value)}
                      placeholder="0"
                      className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    />
                    <label className="block text-xs text-gray-500 mt-1 text-center">ตร.ว. / Sqw</label>
                  </div>
                </div>
              </div>
            )}

            {/* Building */}
            <div>
              <label className="block text-sm font-semibold mb-2">Building</label>
              <input
                type="text"
                value={form.building}
                onChange={(e) => updateForm("building", e.target.value)}
                placeholder="A"
                className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
            </div>

            {/* Latitude & Longitude + AI Lookup */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <button
                  type="button"
                  onClick={handleAiLookupProject}
                  disabled={aiLoading || !form.projectName}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 border border-purple-300 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors disabled:opacity-50"
                >
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  AI ค้นหาข้อมูลโครงการ (Facilities + พิกัด)
                </button>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Latitude</label>
                <input
                  type="text"
                  value={form.latitude}
                  onChange={(e) => updateForm("latitude", e.target.value)}
                  placeholder="13.6900"
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Longitude</label>
                <input
                  type="text"
                  value={form.longitude}
                  onChange={(e) => updateForm("longitude", e.target.value)}
                  placeholder="100.5700"
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
              {/* Map Preview */}
              {form.latitude && form.longitude && (
                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-2">Preview Map <span className="font-normal text-gray-400">(คลิกหรือลาก marker เพื่อเปลี่ยนตำแหน่ง)</span></label>
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
            </div>

            {/* Rent Price & Sale Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Rent Price</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => updateForm("price", e.target.value)}
                  placeholder="e.g., 9500"
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Sale Price</label>
                <input
                  type="number"
                  value={form.salePrice}
                  onChange={(e) => updateForm("salePrice", e.target.value)}
                  placeholder="e.g., 3000000"
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Post From */}
            <div>
              <label className="block text-sm font-semibold mb-2">Post From</label>
              <select
                value={form.postFrom}
                onChange={(e) => updateForm("postFrom", e.target.value)}
                className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white"
              >
                <option value="OWNER">Owner</option>
                <option value="AGENT">Agent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Furniture Details */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sofa className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-bold">
                Furniture Details / รายละเอียดเฟอร์นิเจอร์
              </h2>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={selectedFurniture.length === FURNITURE_ITEMS.length}
                onChange={toggleAllFurniture}
                className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              Check All
            </label>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Select the furniture included / เลือกเฟอร์นิเจอร์ที่มีในห้อง
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FURNITURE_ITEMS.map((item) => (
              <label
                key={item.key}
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedFurniture.includes(item.key)
                    ? "border-amber-400 bg-amber-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedFurniture.includes(item.key)}
                  onChange={() => toggleFurniture(item.key)}
                  className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm font-medium">
                  {item.labelEn}
                  {item.labelTh ? ` / ${item.labelTh}` : ""}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Electrical Appliances */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-bold">
                Electrical Appliances / เครื่องใช้ไฟฟ้า
              </h2>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={selectedAppliances.length === APPLIANCE_ITEMS.length}
                onChange={toggleAllAppliances}
                className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              Check All
            </label>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Select included appliances / เลือกเครื่องใช้ไฟฟ้าที่มีให้
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {APPLIANCE_ITEMS.map((item) => (
              <label
                key={item.key}
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedAppliances.includes(item.key)
                    ? "border-amber-400 bg-amber-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedAppliances.includes(item.key)}
                  onChange={() => toggleAppliance(item.key)}
                  className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm font-medium">
                  {item.labelEn}
                  {item.labelTh ? ` / ${item.labelTh}` : ""}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Facilities */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏢</span>
              <h2 className="text-lg font-bold">
                Facilities / สิ่งอำนวยความสะดวก
              </h2>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={selectedFacilities.length === FACILITY_ITEMS.length}
                onChange={() =>
                  selectedFacilities.length === FACILITY_ITEMS.length
                    ? setSelectedFacilities([])
                    : setSelectedFacilities(FACILITY_ITEMS.map((f) => f.key))
                }
                className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              Check All
            </label>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            เลือกสิ่งอำนวยความสะดวกที่มี
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FACILITY_ITEMS.map((item) => (
              <label
                key={item.key}
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedFacilities.includes(item.key)
                    ? "border-amber-400 bg-amber-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedFacilities.includes(item.key)}
                  onChange={() =>
                    setSelectedFacilities((prev) =>
                      prev.includes(item.key) ? prev.filter((k) => k !== item.key) : [...prev, item.key]
                    )
                  }
                  className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm font-medium">
                  {item.labelEn}{item.labelTh ? ` / ${item.labelTh}` : ""}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-6">
            <Phone className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold">Contact Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Owner */}
            <div className="border rounded-lg p-5 space-y-4">
              <h3 className="font-bold text-base">Owner</h3>
              <div>
                <label className="block text-sm font-semibold mb-1">Name</label>
                <input
                  type="text"
                  value={form.ownerName}
                  onChange={(e) => updateForm("ownerName", e.target.value)}
                  placeholder="Owner's Name"
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Phone</label>
                <input
                  type="text"
                  value={form.ownerPhone}
                  onChange={(e) => updateForm("ownerPhone", e.target.value)}
                  placeholder="Owner's Phone"
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Line ID</label>
                <input
                  type="text"
                  value={form.ownerLineId}
                  onChange={(e) => updateForm("ownerLineId", e.target.value)}
                  placeholder="Owner's Line ID"
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Facebook URL</label>
                <input
                  type="text"
                  value={form.ownerFacebookUrl}
                  onChange={(e) => updateForm("ownerFacebookUrl", e.target.value)}
                  placeholder="Owner's Facebook URL"
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            {/* Co-Agent */}
            <div className="border rounded-lg p-5 space-y-4">
              <h3 className="font-bold text-base">Co-Agent</h3>
              <div>
                <label className="block text-sm font-semibold mb-1">Name</label>
                <input
                  type="text"
                  value={form.coAgentName}
                  onChange={(e) => updateForm("coAgentName", e.target.value)}
                  placeholder="Co-Agent's Name"
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Phone</label>
                <input
                  type="text"
                  value={form.coAgentPhone}
                  onChange={(e) => updateForm("coAgentPhone", e.target.value)}
                  placeholder="Co-Agent's Phone"
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Line ID</label>
                <input
                  type="text"
                  value={form.coAgentLineId}
                  onChange={(e) => updateForm("coAgentLineId", e.target.value)}
                  placeholder="Co-Agent's Line ID"
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Facebook URL</label>
                <input
                  type="text"
                  value={form.coAgentFacebookUrl}
                  onChange={(e) => updateForm("coAgentFacebookUrl", e.target.value)}
                  placeholder="Co-Agent's Facebook URL"
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Status, Category, Priority, Note */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-6">
            <FileText className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold">
              {locale === "th" ? "สถานะและหมายเหตุ" : "Status & Notes"}
            </h2>
          </div>
          {isAgentMode && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700 mb-4">
              ทรัพย์ที่เพิ่มจะมีสถานะ <strong>รออนุมัติ (PENDING)</strong> และทีม NPB Property จะพิจารณาเผยแพร่ในระบบ
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Available Date */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                {locale === "th" ? "วันที่พร้อมเข้าอยู่" : "Available Date"}
              </label>
              <input
                type="date"
                value={form.availableDate}
                onChange={(e) => updateForm("availableDate", e.target.value)}
                className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
            </div>

            {/* Status — admin only */}
            {!isAgentMode && (
              <div>
                <label className="block text-sm font-semibold mb-2">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => updateForm("status", e.target.value)}
                  className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none bg-white"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Category — admin only */}
            {!isAgentMode && (
              <div>
                <label className="block text-sm font-semibold mb-2">Category</label>
                <div className="flex items-center gap-6 mt-1">
                  {["NORMAL", "LUXURY"].map((val) => (
                    <label key={val} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        value={val}
                        checked={form.category === val}
                        onChange={(e) => updateForm("category", e.target.value)}
                        className="w-5 h-5 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm font-medium">
                        {val === "NORMAL" ? "Normal" : "Luxury"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Foreigner */}
            <div>
              <label className="block text-sm font-semibold mb-2">Foreigner</label>
              <div className="flex items-center gap-6 mt-1">
                {[{ val: "ACCEPT", label: "Accept" }, { val: "NOT_ACCEPT", label: "Not Accept" }].map(({ val, label }) => (
                  <label key={val} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="foreignerAccept"
                      value={val}
                      checked={form.foreignerAccept === val}
                      onChange={(e) => updateForm("foreignerAccept", e.target.value)}
                      className="w-5 h-5 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-sm font-medium">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-semibold mb-2">Note</label>
              <textarea
                value={form.note}
                onChange={(e) => updateForm("note", e.target.value)}
                placeholder="Remark"
                rows={4}
                className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-y"
              />
            </div>

            {/* Priority — admin only */}
            {!isAgentMode && (
              <div>
                <label className="block text-sm font-semibold mb-2">Priority</label>
                <div className="flex items-center gap-6 mt-1">
                  {["NORMAL", "URGENT"].map((val) => (
                    <label key={val} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="priority"
                        value={val}
                        checked={form.priority === val}
                        onChange={(e) => updateForm("priority", e.target.value)}
                        className="w-5 h-5 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm font-medium">
                        {val === "NORMAL" ? "Normal" : "Urgent"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Investment Analysis — SALE / RENT_AND_SALE only */}
        {(form.listingType === "SALE" || form.listingType === "RENT_AND_SALE") && (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-bold">{tInv("sectionTitle")}</span>
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">Investment Analysis</span>
              <span className="text-xs text-stone-400">{tInv("forInvestor")}</span>
            </div>

            {/* Cost */}
            <div>
              <p className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">{tInv("costTitle")}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{tInv("purchasePrice")} <span className="text-red-400">*</span></label>
                  <input type="number" min="0" placeholder="e.g. 3190000" value={invForm.invPurchasePrice} onChange={(e) => updateInv("invPurchasePrice", e.target.value)} className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{tInv("renovation")}</label>
                  <input type="number" min="0" placeholder="e.g. 417000" value={invForm.invRenovationCost} onChange={(e) => updateInv("invRenovationCost", e.target.value)} className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none text-sm" />
                </div>
              </div>
              {invForm.invPurchasePrice && (
                <p className="mt-2 text-sm text-stone-500">
                  {tInv("totalCost")} <span className="font-semibold text-stone-700">฿{((parseFloat(invForm.invPurchasePrice) || 0) + (parseFloat(invForm.invRenovationCost) || 0)).toLocaleString()}</span>
                </p>
              )}
            </div>

            {/* Rental Income */}
            <div>
              <p className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">{tInv("incomeTitle")}</p>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {tInv("monthlyRent")}
                  {form.listingType === "RENT_AND_SALE" && (
                    <span className="text-stone-400 text-xs ml-1">{tInv("useListingRent")}</span>
                  )}
                </label>
                <input type="number" min="0" placeholder="e.g. 32500" value={invForm.invExpectedRentPerMonth} onChange={(e) => updateInv("invExpectedRentPerMonth", e.target.value)} className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none text-sm" />
              </div>
            </div>

            {/* Expenses */}
            <div>
              <p className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">{tInv("expenseTitle")}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{tInv("brokerFee")}</label>
                  <input type="number" min="0" step="0.5" placeholder="1" value={invForm.invBrokerFeeMonths} onChange={(e) => updateInv("invBrokerFeeMonths", e.target.value)} className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{tInv("commonFee")}</label>
                  <input type="number" min="0" placeholder="e.g. 15000" value={invForm.invCommonFeePerYear} onChange={(e) => updateInv("invCommonFeePerYear", e.target.value)} className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {tInv("maintenance")}
                    <span className="text-stone-400 text-xs ml-1">{tInv("maintenanceHint")}</span>
                  </label>
                  <input type="number" min="0" placeholder="e.g. 5310" value={invForm.invMaintenancePerYear} onChange={(e) => updateInv("invMaintenancePerYear", e.target.value)} className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{tInv("landTax")}</label>
                  <input type="number" min="0" step="0.001" placeholder="0.02" value={invForm.invLandTaxRate} onChange={(e) => updateInv("invLandTaxRate", e.target.value)} className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{tInv("vacancy")}</label>
                  <input type="number" min="0" step="0.5" max="12" placeholder="1" value={invForm.invVacancyMonths} onChange={(e) => updateInv("invVacancyMonths", e.target.value)} className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none text-sm" />
                </div>
              </div>
            </div>

            {/* Loan */}
            <div>
              <p className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">{tInv("loanTitle")}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{tInv("loanAmount")}</label>
                  <input type="number" min="0" placeholder="e.g. 2500000" value={invForm.invLoanAmount} onChange={(e) => updateInv("invLoanAmount", e.target.value)} className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{tInv("loanTerm")}</label>
                  <input type="number" min="1" max="40" placeholder="30" value={invForm.invLoanTermYears} onChange={(e) => updateInv("invLoanTermYears", e.target.value)} className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{tInv("interestRate")}</label>
                  <input type="number" min="0" step="0.01" placeholder="2.5" value={invForm.invLoanInterestRate} onChange={(e) => updateInv("invLoanInterestRate", e.target.value)} className="w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-amber-500 outline-none text-sm" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3 pb-8">
          <Link
            href={isAgentMode ? `/${locale}/agent` : `/${locale}/admin/properties`}
            className="px-6 py-3 border rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            {locale === "th" ? "ยกเลิก" : "Cancel"}
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving
              ? locale === "th"
                ? "กำลังบันทึก..."
                : "Saving..."
              : locale === "th"
              ? "บันทึก"
              : "Save"}
          </button>
        </div>
      </form>


      {/* Station Selection Modal */}
      {showStationModal && (
        <StationMapSelector
          selectedStations={selectedStations}
          onChange={setSelectedStations}
          onClose={() => setShowStationModal(false)}
        />
      )}
    </div>
  );
}
