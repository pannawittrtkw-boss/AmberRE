"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2, Plus, Pencil, Trash2, X, Search, Phone, MessageSquare,
  Facebook, MapPin, Train, Wallet, BedDouble, ChevronDown, ChevronUp,
  Building2, CheckCircle2, User,
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
  budgetMin: string | null;
  budgetMax: string | null;
  bedrooms: number | null;
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
  price: string;
  bedrooms: number;
  bathrooms: number;
  sizeSqm: string | null;
  projectName: string | null;
  address: string | null;
  primaryImage: string | null;
  stations: { nameTh: string; nameEn: string; line: string; distanceKm: string }[];
  project: { id: number; nameTh: string; province: string | null; district: string | null } | null;
  score: number;
  reasons: string[];
};

const EMPTY_FORM = {
  name: "", phone: "", lineId: "", facebook: "",
  projectName: "", province: "", district: "", subdistrict: "",
  btsStation: "", budgetMin: "", budgetMax: "", bedrooms: "", note: "", status: "ACTIVE",
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
      bedrooms: lead.bedrooms !== null ? String(lead.bedrooms) : "",
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
      if (!data.success) throw new Error(data.error || "เกิดข้อผิดพลาด");
      await refresh();
      setShowForm(false);
    } catch (e: any) {
      setError(e.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("ลบข้อมูลลูกค้ารายนี้?")) return;
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
          <h1 className="text-2xl font-bold text-gray-900">Matching ลูกค้า</h1>
          <p className="text-sm text-gray-500 mt-1">บันทึกความต้องการลูกค้าและค้นหาทรัพย์ที่ตรงกัน</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> เพิ่มลูกค้า
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ค้นหาชื่อ, เบอร์โทร, โครงการ, จังหวัด..."
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Leads list */}
      {filteredLeads.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{searchTerm ? "ไม่พบลูกค้าที่ค้นหา" : "ยังไม่มีข้อมูลลูกค้า กด \"เพิ่มลูกค้า\" เพื่อเริ่มต้น"}</p>
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
                      <h3 className="font-semibold text-gray-900 text-sm">{lead.name || "(ไม่ระบุชื่อ)"}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        lead.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {lead.status === "ACTIVE" ? "ใช้งาน" : "ปิด"}
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
                          <BedDouble className="w-3 h-3" />{lead.bedrooms} ห้องนอน
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
                      {expandedLead === lead.id ? "ซ่อน" : "ดูทรัพย์ที่ตรงกัน"}
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
                    <div className="text-center py-8 text-gray-400 text-sm">ไม่พบทรัพย์ที่ตรงกับความต้องการ</div>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                        พบ {matchMap[lead.id].length} ทรัพย์ที่ตรงกัน
                      </p>
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
                {editingLead ? "แก้ไขข้อมูลลูกค้า" : "เพิ่มลูกค้าใหม่"}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Contact section */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">ข้อมูลติดต่อ</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="ชื่อลูกค้า" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="ชื่อ-สกุล" />
                  <FormField label="เบอร์โทร" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="0812345678" type="tel" />
                  <FormField label="Line ID" value={form.lineId} onChange={(v) => setForm({ ...form, lineId: v })} placeholder="@lineid" />
                  <FormField label="Facebook" value={form.facebook} onChange={(v) => setForm({ ...form, facebook: v })} placeholder="ลิงก์หรือชื่อ Facebook" />
                </div>
              </div>

              {/* Location section */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">ทำเลที่สนใจ</h3>
                <div className="space-y-3">
                  <FormField
                    label="ชื่อโครงการ"
                    value={form.projectName}
                    onChange={(v) => setForm({ ...form, projectName: v })}
                    placeholder="ชื่อโครงการที่สนใจ"
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
                    <label className="block text-xs font-medium text-gray-600 mb-1">สถานี BTS/MRT</label>
                    <button
                      type="button"
                      onClick={() => setShowStationSelector(true)}
                      className="w-full flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm text-left hover:border-blue-400 transition-colors"
                    >
                      <Train className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      <span className={form.btsStation ? "text-gray-900 flex-1 truncate" : "text-gray-400 flex-1"}>
                        {form.btsStation || "คลิกเพื่อเลือกสถานี BTS/MRT..."}
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
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">ความต้องการ</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormField label="งบประมาณต่ำสุด (บาท)" value={form.budgetMin} onChange={(v) => setForm({ ...form, budgetMin: v })} placeholder="1000000" type="number" />
                  <FormField label="งบประมาณสูงสุด (บาท)" value={form.budgetMax} onChange={(v) => setForm({ ...form, budgetMax: v })} placeholder="5000000" type="number" />
                  <FormField label="จำนวนห้องนอน" value={form.bedrooms} onChange={(v) => setForm({ ...form, bedrooms: v })} placeholder="2" type="number" />
                </div>
              </div>

              {/* Status + Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">สถานะ</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ACTIVE">ใช้งาน</option>
                    <option value="CLOSED">ปิด</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">หมายเหตุ</label>
                  <textarea
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    placeholder="บันทึกเพิ่มเติม..."
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            </div>

            <div className="flex justify-end gap-3 px-6 pb-6">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-60"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "กำลังบันทึก..." : "บันทึก"}
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

function MatchCard({ prop, locale }: { prop: MatchedProperty; locale: string }) {
  const listingLabel: Record<string, string> = {
    RENT: "เช่า", SALE: "ขาย", RENT_AND_SALE: "เช่า/ขาย",
  };
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
        <div className="absolute top-2 left-2">
          <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">
            {listingLabel[prop.listingType] || prop.listingType}
          </span>
        </div>
      </div>
      <div className="p-3">
        <p className="font-semibold text-gray-900 text-sm line-clamp-1">{prop.titleTh}</p>
        {prop.projectName && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{prop.projectName}</p>}
        <p className="text-sm font-bold text-blue-600 mt-1">{formatPrice(prop.price)} บาท</p>
        <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
          <span className="flex items-center gap-0.5"><BedDouble className="w-3 h-3" /> {prop.bedrooms}</span>
          {prop.sizeSqm && <span>{Number(prop.sizeSqm).toFixed(0)} ตร.ม.</span>}
          {prop.stations.length > 0 && (
            <span className="flex items-center gap-0.5"><Train className="w-3 h-3" />{prop.stations[0].nameTh}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {prop.reasons.map((r) => (
            <span key={r} className="flex items-center gap-0.5 text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">
              <CheckCircle2 className="w-2.5 h-2.5" />{r}
            </span>
          ))}
        </div>
      </div>
    </a>
  );
}
