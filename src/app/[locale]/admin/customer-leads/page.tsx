"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2, Plus, Pencil, Trash2, X, Search, Phone, MessageSquare,
  Facebook, MapPin, Train, Wallet, BedDouble, ChevronDown, ChevronUp,
  Building2, CheckCircle2, User, Maximize, Calendar,
} from "lucide-react";
import ThaiAddressFields from "@/components/admin/ThaiAddressFields";
import StationMapSelector, { LINES } from "@/components/admin/StationMapSelector";

type CustomerLead = {
  id: number;
  name: string | null;
  phone: string | null;
  lineId: string | null;
  facebook: string | null;
  projectName: string | null;
  province: string | null;
  district: string | null;
  subdistrict: string | null;
  btsStation: string | null;
  dealType: string;
  budgetMin: string | null;
  budgetMax: string | null;
  bedrooms: number | null;
  minSizeSqm: string | null;
  wantPetFriendly: boolean | null;
  wantSmokingAllowed: boolean | null;
  wantReadyToMoveIn: boolean | null;
  note: string | null;
  status: string;
  createdAt: string;
  createdBy: { id: number; firstName: string; lastName: string } | null;
};

type MatchedProperty = {
  id: number;
  titleTh: string;
  titleEn: string | null;
  propertyType: string;
  listingType: string;
  status: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  sizeSqm: string | null;
  petFriendly: string | null;
  smokingAllowed: string | null;
  projectName: string | null;
  address: string | null;
  primaryImage: string | null;
  createdAt: string;
  listedAt: string | null;
  availableDate: string | null;
  stations: { code: string; nameTh: string; nameEn: string }[];
  project: { id: number; nameTh: string; province: string | null; district: string | null } | null;
  score: number;
  reasons: string[];
};

const EMPTY_FORM = {
  name: "", phone: "", lineId: "", facebook: "",
  projectName: "", province: "", district: "", subdistrict: "",
  btsStation: "", dealType: "RENT", budgetMin: "", budgetMax: "", bedrooms: "",
  minSizeSqm: "", wantPetFriendly: false, wantSmokingAllowed: false, wantReadyToMoveIn: false,
  note: "", status: "ACTIVE",
};

// Map station IDs (comma-sep) → display names
function stationIdsToNames(ids: string): string {
  if (!ids) return "";
  const idArr = ids.split(",").map((s) => s.trim()).filter(Boolean);
  const names: string[] = [];
  LINES.forEach((line) => {
    line.stations.forEach((st) => {
      if (idArr.includes(st.id)) names.push(st.nameTh);
    });
  });
  return names.join(", ");
}

// Map station names/ids stored in DB → array of IDs for selector
function stationValueToIds(val: string): string[] {
  if (!val) return [];
  // Already stored as ids (legacy) or names?
  const parts = val.split(",").map((s) => s.trim()).filter(Boolean);
  const allStations = LINES.flatMap((l) => l.stations);
  return parts.flatMap((part) => {
    // Check if it matches an ID directly
    const byId = allStations.find((s) => s.id === part);
    if (byId) return [byId.id];
    // Check by nameTh
    const byName = allStations.find((s) => s.nameTh === part);
    if (byName) return [byName.id];
    return [];
  });
}

function formatPrice(p: string | number) {
  const n = Number(p);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 60 ? "bg-green-100 text-green-700 border-green-200" :
    score >= 30 ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
    "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${color}`}>
      {score}%
    </span>
  );
}

export default function CustomerLeadsPage({ params }: { params: Promise<{ locale: string }> }) {
  const [locale, setLocale] = useState("th");
  const [leads, setLeads] = useState<CustomerLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState<CustomerLead | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [expandedLead, setExpandedLead] = useState<number | null>(null);
  const [matchMap, setMatchMap] = useState<Record<number, MatchedProperty[]>>({});
  const [matchLoading, setMatchLoading] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Station selector state (form)
  const [showStationSelector, setShowStationSelector] = useState(false);
  const [selectedStationIds, setSelectedStationIds] = useState<string[]>([]);

  useEffect(() => {
    params.then(({ locale: l }) => setLocale(l));
  }, [params]);

  const isTh = locale === "th";
  const T = {
    title: isTh ? "Matching ลูกค้า" : "Customer Matching",
    subtitle: isTh ? "บันทึกความต้องการลูกค้าและค้นหาทรัพย์ที่ตรงกัน" : "Record customer requirements and find matching properties",
    addCustomer: isTh ? "เพิ่มลูกค้า" : "Add Customer",
    searchPlaceholder: isTh ? "ค้นหาชื่อ, เบอร์โทร, โครงการ, จังหวัด..." : "Search name, phone, project, province...",
    noSearchResults: isTh ? "ไม่พบลูกค้าที่ค้นหา" : "No matching customers found",
    noCustomersYet: isTh ? "ยังไม่มีข้อมูลลูกค้า กด \"เพิ่มลูกค้า\" เพื่อเริ่มต้น" : "No customers yet — click \"Add Customer\" to get started",
    active: isTh ? "ใช้งาน" : "Active",
    closed: isTh ? "ปิด" : "Closed",
    rent: isTh ? "เช่า" : "Rent",
    buy: isTh ? "ซื้อ" : "Buy",
    bedroomsSuffix: isTh ? "ห้องนอน" : "bed",
    sqmSuffix: isTh ? "ตร.ม." : "sqm",
    petFriendlyBadge: isTh ? "เลี้ยงสัตว์ได้" : "Pet friendly",
    smokingBadge: isTh ? "สูบบุหรี่ได้" : "Smoking allowed",
    readyBadge: isTh ? "พร้อมเข้าอยู่ทันที" : "Ready to move in",
    hide: isTh ? "ซ่อน" : "Hide",
    viewMatches: isTh ? "ดูทรัพย์ที่ตรงกัน" : "View matches",
    noNameSpecified: isTh ? "(ไม่ระบุชื่อ)" : "(No name)",
    noMatchesFound: isTh ? "ไม่พบทรัพย์ที่ตรงกับความต้องการ" : "No properties match this customer's requirements",
    foundMatchesLabel: (n: number) => isTh ? `พบ ${n} ทรัพย์ที่ตรงกัน` : `${n} matching ${n === 1 ? "property" : "properties"} found`,
    legendFresh: isTh ? "โพสต์ไม่เกิน 7 วัน" : "Posted within 7 days",
    legendGray: isTh ? "โพสต์เกิน 8-30 วัน" : "Posted 8-30 days ago",
    legendAmber: isTh ? "โพสต์เกิน 31-90 วัน" : "Posted 31-90 days ago",
    legendRed: isTh ? "โพสต์เกิน 90 วัน" : "Posted over 90 days ago",
    editCustomer: isTh ? "แก้ไขข้อมูลลูกค้า" : "Edit Customer",
    addNewCustomer: isTh ? "เพิ่มลูกค้าใหม่" : "Add New Customer",
    contactInfo: isTh ? "ข้อมูลติดต่อ" : "Contact Information",
    customerName: isTh ? "ชื่อลูกค้า" : "Customer Name",
    namePlaceholder: isTh ? "ชื่อ-สกุล" : "Full name",
    phoneLabel: isTh ? "เบอร์โทร" : "Phone",
    facebookPlaceholder: isTh ? "ลิงก์หรือชื่อ Facebook" : "Facebook link or name",
    interestedLocation: isTh ? "ทำเลที่สนใจ" : "Location of Interest",
    projectNameLabel: isTh ? "ชื่อโครงการ" : "Project Name",
    projectNamePlaceholder: isTh ? "ชื่อโครงการที่สนใจ" : "Project of interest",
    stationLabel: isTh ? "สถานี BTS/MRT" : "BTS/MRT Station",
    stationPlaceholder: isTh ? "คลิกเพื่อเลือกสถานี BTS/MRT..." : "Click to select BTS/MRT station...",
    requirements: isTh ? "ความต้องการ" : "Requirements",
    dealTypeLabel: isTh ? "ประเภท" : "Type",
    budgetMinSale: isTh ? "งบประมาณต่ำสุด (บาท)" : "Min Budget (THB)",
    budgetMaxSale: isTh ? "งบประมาณสูงสุด (บาท)" : "Max Budget (THB)",
    budgetMinRent: isTh ? "งบประมาณต่ำสุด (บาท/เดือน)" : "Min Budget (THB/month)",
    budgetMaxRent: isTh ? "งบประมาณสูงสุด (บาท/เดือน)" : "Max Budget (THB/month)",
    bedroomsLabel: isTh ? "จำนวนห้องนอน" : "Bedrooms",
    notSpecified: isTh ? "ไม่ระบุ" : "Not specified",
    minSizeLabel: isTh ? "ขนาดห้องขั้นต่ำ (ตร.ม.)" : "Min. Room Size (sqm)",
    readyToMoveInToggle: isTh ? "พร้อมเข้าอยู่ทันที" : "Ready to move in",
    petFriendlyToggle: isTh ? "ต้องเลี้ยงสัตว์ได้" : "Must allow pets",
    smokingToggle: isTh ? "ต้องสูบบุหรี่ได้" : "Must allow smoking",
    statusLabel: isTh ? "สถานะ" : "Status",
    noteLabel: isTh ? "หมายเหตุ" : "Note",
    notePlaceholder: isTh ? "บันทึกเพิ่มเติม..." : "Additional notes...",
    cancel: isTh ? "ยกเลิก" : "Cancel",
    saving: isTh ? "กำลังบันทึก..." : "Saving...",
    save: isTh ? "บันทึก" : "Save",
    deleteConfirm: isTh ? "ลบข้อมูลลูกค้ารายนี้?" : "Delete this customer?",
    genericError: isTh ? "เกิดข้อผิดพลาด" : "An error occurred",
  };

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/customer-leads");
    const data = await res.json();
    if (data.success) setLeads(data.data);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const openAdd = () => {
    setEditingLead(null);
    setForm({ ...EMPTY_FORM });
    setSelectedStationIds([]);
    setError("");
    setShowForm(true);
  };

  const openEdit = (lead: CustomerLead) => {
    setEditingLead(lead);
    const ids = stationValueToIds(lead.btsStation || "");
    setSelectedStationIds(ids);
    setForm({
      name: lead.name || "",
      phone: lead.phone || "",
      lineId: lead.lineId || "",
      facebook: lead.facebook || "",
      projectName: lead.projectName || "",
      province: lead.province || "",
      district: lead.district || "",
      subdistrict: lead.subdistrict || "",
      btsStation: lead.btsStation || "",
      budgetMin: lead.budgetMin || "",
      budgetMax: lead.budgetMax || "",
      dealType: lead.dealType === "SALE" ? "SALE" : "RENT",
      bedrooms: lead.bedrooms !== null ? String(lead.bedrooms) : "",
      minSizeSqm: lead.minSizeSqm || "",
      wantPetFriendly: lead.wantPetFriendly === true,
      wantSmokingAllowed: lead.wantSmokingAllowed === true,
      wantReadyToMoveIn: lead.wantReadyToMoveIn === true,
      note: lead.note || "",
      status: lead.status,
    });
    setError("");
    setShowForm(true);
  };

  const handleStationDone = (ids: string[]) => {
    setSelectedStationIds(ids);
    // Store as station nameTh comma-separated for readability and matching
    const names = ids.map((id) => {
      for (const line of LINES) {
        const st = line.stations.find((s) => s.id === id);
        if (st) return st.nameTh;
      }
      return id;
    }).join(", ");
    setForm((prev) => ({ ...prev, btsStation: names }));
    setShowStationSelector(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const url = editingLead
        ? `/api/admin/customer-leads/${editingLead.id}`
        : "/api/admin/customer-leads";
      const method = editingLead ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || T.genericError);
      await refresh();
      setShowForm(false);
    } catch (e: any) {
      setError(e.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(T.deleteConfirm)) return;
    setDeletingId(id);
    await fetch(`/api/admin/customer-leads/${id}`, { method: "DELETE" });
    setLeads((prev) => prev.filter((l) => l.id !== id));
    if (expandedLead === id) setExpandedLead(null);
    setDeletingId(null);
  };

  const toggleExpand = async (leadId: number) => {
    if (expandedLead === leadId) { setExpandedLead(null); return; }
    setExpandedLead(leadId);
    if (!matchMap[leadId]) {
      setMatchLoading(leadId);
      const res = await fetch(`/api/admin/customer-leads/${leadId}/matches`);
      const data = await res.json();
      if (data.success) setMatchMap((prev) => ({ ...prev, [leadId]: data.data }));
      setMatchLoading(null);
    }
  };

  const filteredLeads = leads.filter((l) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      l.name?.toLowerCase().includes(q) ||
      l.phone?.includes(q) ||
      l.projectName?.toLowerCase().includes(q) ||
      l.province?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{T.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{T.subtitle}</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> {T.addCustomer}
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={T.searchPlaceholder}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Leads list */}
      {filteredLeads.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{searchTerm ? T.noSearchResults : T.noCustomersYet}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLeads.map((lead) => (
            <div key={lead.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 text-sm">{lead.name || T.noNameSpecified}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        lead.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {lead.status === "ACTIVE" ? T.active : T.closed}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-500">
                      {lead.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>}
                      {lead.lineId && <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{lead.lineId}</span>}
                      {lead.facebook && <span className="flex items-center gap-1"><Facebook className="w-3 h-3" />{lead.facebook}</span>}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {lead.projectName && (
                        <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                          <Building2 className="w-3 h-3" />{lead.projectName}
                        </span>
                      )}
                      {(lead.province || lead.district) && (
                        <span className="flex items-center gap-1 text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
                          <MapPin className="w-3 h-3" />
                          {[lead.province, lead.district, lead.subdistrict].filter(Boolean).join(" / ")}
                        </span>
                      )}
                      {lead.btsStation && (
                        <span className="flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                          <Train className="w-3 h-3" />{lead.btsStation}
                        </span>
                      )}
                      <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                        lead.dealType === "SALE" ? "bg-indigo-50 text-indigo-700" : "bg-teal-50 text-teal-700"
                      }`}>
                        {lead.dealType === "SALE" ? T.buy : T.rent}
                      </span>
                      {(lead.budgetMin || lead.budgetMax) && (
                        <span className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                          <Wallet className="w-3 h-3" />
                          {lead.budgetMin && lead.budgetMax
                            ? `${formatPrice(lead.budgetMin)} – ${formatPrice(lead.budgetMax)} บ.`
                            : lead.budgetMax
                            ? `≤ ${formatPrice(lead.budgetMax)} บ.`
                            : `≥ ${formatPrice(lead.budgetMin!)} บ.`}
                        </span>
                      )}
                      {lead.bedrooms !== null && (
                        <span className="flex items-center gap-1 text-xs bg-pink-50 text-pink-700 px-2 py-0.5 rounded-full">
                          <BedDouble className="w-3 h-3" />{lead.bedrooms}{lead.bedrooms >= 4 ? "+" : ""} {T.bedroomsSuffix}
                        </span>
                      )}
                      {lead.minSizeSqm !== null && (
                        <span className="flex items-center gap-1 text-xs bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-full">
                          <Maximize className="w-3 h-3" />≥ {lead.minSizeSqm} {T.sqmSuffix}
                        </span>
                      )}
                      {lead.wantPetFriendly && (
                        <span className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                          🐾 {T.petFriendlyBadge}
                        </span>
                      )}
                      {lead.wantSmokingAllowed && (
                        <span className="flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                          🚬 {T.smokingBadge}
                        </span>
                      )}
                      {lead.wantReadyToMoveIn && (
                        <span className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                          ✅ {T.readyBadge}
                        </span>
                      )}
                    </div>
                    {lead.note && <p className="mt-2 text-xs text-gray-500 italic line-clamp-2">{lead.note}</p>}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleExpand(lead.id)}
                      className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Search className="w-3 h-3" />
                      {expandedLead === lead.id ? T.hide : T.viewMatches}
                      {expandedLead === lead.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    <button onClick={() => openEdit(lead)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(lead.id)} disabled={deletingId === lead.id} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      {deletingId === lead.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Matched properties panel */}
              {expandedLead === lead.id && (
                <div className="border-t border-gray-100 bg-gray-50 p-4">
                  {matchLoading === lead.id ? (
                    <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
                  ) : !matchMap[lead.id] || matchMap[lead.id].length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">{T.noMatchesFound}</div>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                        {T.foundMatchesLabel(matchMap[lead.id].length)}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3 text-[11px] text-gray-500">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />{T.legendFresh}</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400" />{T.legendGray}</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />{T.legendAmber}</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />{T.legendRed}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {matchMap[lead.id].map((prop) => (
                          <MatchCard key={prop.id} prop={prop} locale={locale} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editingLead ? T.editCustomer : T.addNewCustomer}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Contact section */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{T.contactInfo}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label={T.customerName} value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder={T.namePlaceholder} />
                  <FormField label={T.phoneLabel} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="0812345678" type="tel" />
                  <FormField label="Line ID" value={form.lineId} onChange={(v) => setForm({ ...form, lineId: v })} placeholder="@lineid" />
                  <FormField label="Facebook" value={form.facebook} onChange={(v) => setForm({ ...form, facebook: v })} placeholder={T.facebookPlaceholder} />
                </div>
              </div>

              {/* Location section */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{T.interestedLocation}</h3>
                <div className="space-y-3">
                  <FormField
                    label={T.projectNameLabel}
                    value={form.projectName}
                    onChange={(v) => setForm({ ...form, projectName: v })}
                    placeholder={T.projectNamePlaceholder}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <ThaiAddressFields
                      province={form.province}
                      district={form.district}
                      subdistrict={form.subdistrict}
                      onProvinceChange={(v) => setForm((prev) => ({ ...prev, province: v, district: "", subdistrict: "" }))}
                      onDistrictChange={(v) => setForm((prev) => ({ ...prev, district: v, subdistrict: "" }))}
                      onSubdistrictChange={(v) => setForm((prev) => ({ ...prev, subdistrict: v }))}
                    />
                  </div>

                  {/* BTS Station picker */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{T.stationLabel}</label>
                    <button
                      type="button"
                      onClick={() => setShowStationSelector(true)}
                      className="w-full flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm text-left hover:border-blue-400 transition-colors"
                    >
                      <Train className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      <span className={form.btsStation ? "text-gray-900 flex-1 truncate" : "text-gray-400 flex-1"}>
                        {form.btsStation || T.stationPlaceholder}
                      </span>
                      {form.btsStation && (
                        <span
                          role="button"
                          onClick={(e) => { e.stopPropagation(); setSelectedStationIds([]); setForm((prev) => ({ ...prev, btsStation: "" })); }}
                          className="p-0.5 rounded hover:bg-gray-100 text-gray-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </button>
                    {selectedStationIds.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {LINES.flatMap((line) =>
                          line.stations
                            .filter((s) => selectedStationIds.includes(s.id))
                            .map((s) => (
                              <span
                                key={s.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                                style={{ backgroundColor: line.color }}
                              >
                                {s.code} {s.nameTh}
                              </span>
                            ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Requirements section */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{T.requirements}</h3>

                {/* Deal type — drives which budget scale to show */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">{T.dealTypeLabel}</label>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-lg max-w-xs">
                    {([
                      { value: "RENT", label: T.rent },
                      { value: "SALE", label: T.buy },
                    ] as const).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm({ ...form, dealType: opt.value })}
                        className={`py-1.5 rounded text-sm font-medium transition-colors ${
                          form.dealType === opt.value ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:bg-white/50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {form.dealType === "SALE" ? (
                    <>
                      <FormField label={T.budgetMinSale} value={form.budgetMin} onChange={(v) => setForm({ ...form, budgetMin: v })} placeholder="1000000" type="number" />
                      <FormField label={T.budgetMaxSale} value={form.budgetMax} onChange={(v) => setForm({ ...form, budgetMax: v })} placeholder="5000000" type="number" />
                    </>
                  ) : (
                    <>
                      <FormField label={T.budgetMinRent} value={form.budgetMin} onChange={(v) => setForm({ ...form, budgetMin: v })} placeholder="15000" type="number" />
                      <FormField label={T.budgetMaxRent} value={form.budgetMax} onChange={(v) => setForm({ ...form, budgetMax: v })} placeholder="30000" type="number" />
                    </>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{T.bedroomsLabel}</label>
                    <select
                      value={form.bedrooms}
                      onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">{T.notSpecified}</option>
                      <option value="1">1 {T.bedroomsSuffix}</option>
                      <option value="2">2 {T.bedroomsSuffix}</option>
                      <option value="3">3 {T.bedroomsSuffix}</option>
                      <option value="4">4+ {T.bedroomsSuffix}</option>
                    </select>
                  </div>
                  <FormField label={T.minSizeLabel} value={form.minSizeSqm} onChange={(v) => setForm({ ...form, minSizeSqm: v })} placeholder="30" type="number" />
                  <label className="flex items-center justify-between gap-2 border border-gray-300 rounded-lg px-3 py-2 cursor-pointer select-none">
                    <span className="text-sm text-gray-700">✅ {T.readyToMoveInToggle}</span>
                    <div
                      onClick={() => setForm({ ...form, wantReadyToMoveIn: !form.wantReadyToMoveIn })}
                      className={`relative w-10 h-5 rounded-full transition-colors ${form.wantReadyToMoveIn ? "bg-emerald-500" : "bg-gray-300"}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.wantReadyToMoveIn ? "translate-x-5" : "translate-x-0.5"}`} />
                    </div>
                  </label>
                  <label className="flex items-center justify-between gap-2 border border-gray-300 rounded-lg px-3 py-2 cursor-pointer select-none">
                    <span className="text-sm text-gray-700">🐾 {T.petFriendlyToggle}</span>
                    <div
                      onClick={() => setForm({ ...form, wantPetFriendly: !form.wantPetFriendly })}
                      className={`relative w-10 h-5 rounded-full transition-colors ${form.wantPetFriendly ? "bg-amber-500" : "bg-gray-300"}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.wantPetFriendly ? "translate-x-5" : "translate-x-0.5"}`} />
                    </div>
                  </label>
                  <label className="flex items-center justify-between gap-2 border border-gray-300 rounded-lg px-3 py-2 cursor-pointer select-none">
                    <span className="text-sm text-gray-700">🚬 {T.smokingToggle}</span>
                    <div
                      onClick={() => setForm({ ...form, wantSmokingAllowed: !form.wantSmokingAllowed })}
                      className={`relative w-10 h-5 rounded-full transition-colors ${form.wantSmokingAllowed ? "bg-slate-600" : "bg-gray-300"}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.wantSmokingAllowed ? "translate-x-5" : "translate-x-0.5"}`} />
                    </div>
                  </label>
                </div>
              </div>

              {/* Status + Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{T.statusLabel}</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ACTIVE">{T.active}</option>
                    <option value="CLOSED">{T.closed}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{T.noteLabel}</label>
                  <textarea
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    placeholder={T.notePlaceholder}
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            </div>

            <div className="flex justify-end gap-3 px-6 pb-6">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                {T.cancel}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-60"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? T.saving : T.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BTS/MRT station selector popup */}
      {showStationSelector && (
        <StationMapSelector
          selectedStations={selectedStationIds}
          onChange={setSelectedStationIds}
          onClose={() => handleStationDone(selectedStationIds)}
        />
      )}
    </div>
  );
}

function FormField({
  label, value, onChange, placeholder, type = "text", className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

const REASON_LABELS: Record<string, { th: string; en: string }> = {
  PROJECT_NAME_MATCH: { th: "ชื่อโครงการตรงกัน", en: "Project name matches" },
  BUDGET_MATCH: { th: "ราคาอยู่ในงบประมาณ", en: "Price within budget" },
  BUDGET_CLOSE: { th: "ราคาใกล้เคียงงบประมาณ", en: "Price close to budget" },
  BEDROOMS_MATCH: { th: "จำนวนห้องนอนตรงกัน", en: "Bedrooms match" },
  PROVINCE_MATCH: { th: "จังหวัดตรงกัน", en: "Province matches" },
  DISTRICT_MATCH: { th: "อำเภอตรงกัน", en: "District matches" },
  SIZE_MATCH: { th: "ขนาดห้องตรงตามที่ต้องการ", en: "Room size meets requirement" },
  PET_FRIENDLY_MATCH: { th: "รับเลี้ยงสัตว์", en: "Pet friendly" },
  SMOKING_MATCH: { th: "สูบบุหรี่ได้", en: "Smoking allowed" },
  READY_MATCH: { th: "พร้อมเข้าอยู่ทันที", en: "Ready to move in" },
  STATION_MATCH: { th: "สถานี BTS/MRT ตรงกัน", en: "BTS/MRT station matches" },
};

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  VERIFIED: { label: "Verified", color: "bg-green-500" },
  VERIFIED_OVER_10_DAYS: { label: "Verified 10+d", color: "bg-orange-500" },
  ADDED_PROPERTIES: { label: "Added", color: "bg-purple-600" },
};

function MatchCard({ prop, locale }: { prop: MatchedProperty; locale: string }) {
  const isTh = locale === "th";
  const listingLabel: Record<string, string> = isTh
    ? { RENT: "เช่า", SALE: "ขาย", RENT_AND_SALE: "เช่า/ขาย" }
    : { RENT: "Rent", SALE: "Sale", RENT_AND_SALE: "Rent/Sale" };
  const statusInfo = STATUS_BADGE[prop.status] || { label: prop.status, color: "bg-gray-500" };
  const sqmLabel = isTh ? "ตร.ม." : "sqm";
  const petTitle = isTh ? "เลี้ยงสัตว์ได้" : "Pet friendly";
  const smokingTitle = isTh ? "สูบบุหรี่ได้" : "Smoking allowed";
  const readyNowLabel = isTh ? "พร้อมเข้าอยู่ทันที" : "Ready to move in now";
  const availableFromLabel = isTh ? "เข้าอยู่ได้" : "Available from";

  // "Days on market" — same rule as the public FeaturedPropertyCard: counts
  // from listedAt if an admin has reset it (unit came back on the market),
  // falling back to the original createdAt otherwise.
  const [now] = useState(() => Date.now());
  const listedDate = new Date(prop.listedAt || prop.createdAt);
  const daysPosted = Math.max(0, Math.floor((now - listedDate.getTime()) / 86400000));
  const daysBadgeCls =
    daysPosted <= 7
      ? "bg-emerald-500 text-white"
      : daysPosted <= 30
      ? "bg-gray-400 text-white"
      : daysPosted <= 90
      ? "bg-amber-500 text-white"
      : "bg-red-500 text-white";

  return (
    <a
      href={`/${locale}/properties/${prop.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="relative h-32 bg-gray-100">
        {prop.primaryImage ? (
          <img src={prop.primaryImage} alt={prop.titleTh} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Building2 className="w-8 h-8 text-gray-300" />
          </div>
        )}
        <div className="absolute top-2 right-2"><ScoreBadge score={prop.score} /></div>
        <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
          <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">
            {listingLabel[prop.listingType] || prop.listingType}
          </span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${daysBadgeCls}`}>
            {daysPosted} {locale === "th" ? "วัน" : "d"}
          </span>
          <span className={`text-[10px] font-semibold text-white px-2 py-0.5 rounded ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>
      </div>
      <div className="p-3">
        <p className="font-semibold text-gray-900 text-sm line-clamp-1">{prop.titleTh}</p>
        {prop.projectName && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{prop.projectName}</p>}
        <p className="text-sm font-bold text-blue-600 mt-1">{formatPrice(prop.price)} บาท</p>
        <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
          <span className="flex items-center gap-0.5"><BedDouble className="w-3 h-3" /> {prop.bedrooms}</span>
          {prop.sizeSqm && <span>{Number(prop.sizeSqm).toFixed(0)} {sqmLabel}</span>}
          {prop.petFriendly === "ACCEPT" && <span title={petTitle}>🐾</span>}
          {prop.smokingAllowed === "ACCEPT" && <span title={smokingTitle}>🚬</span>}
          {prop.stations.length > 0 && (
            <span className="flex items-center gap-0.5"><Train className="w-3 h-3" />{isTh ? prop.stations[0].nameTh : prop.stations[0].nameEn}</span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
          <Calendar className="w-3 h-3" />
          {!prop.availableDate || new Date(prop.availableDate).getTime() <= now
            ? <span className="text-emerald-600 font-medium">{readyNowLabel}</span>
            : <span>{availableFromLabel} {new Date(prop.availableDate).toLocaleDateString(isTh ? "th-TH" : "en-GB", { day: "numeric", month: "short", year: "2-digit" })}</span>}
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {prop.reasons.map((r) => (
            <span key={r} className="flex items-center gap-0.5 text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">
              <CheckCircle2 className="w-2.5 h-2.5" />{isTh ? (REASON_LABELS[r]?.th ?? r) : (REASON_LABELS[r]?.en ?? r)}
            </span>
          ))}
        </div>
      </div>
    </a>
  );
}
