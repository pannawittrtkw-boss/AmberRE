"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User, Building2, Plus, Phone, MessageSquare, Loader2,
  CheckCircle, Clock, XCircle, Edit3, Image as ImageIcon,
  ArrowRight, AlertCircle,
} from "lucide-react";

type Profile = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  lineId: string | null;
  profileImage: string | null;
  coAgentApplication: { id: number; companyName: string | null; status: string } | null;
};

type Property = {
  id: number;
  titleTh: string;
  projectName: string | null;
  listingType: string;
  propertyType: string;
  price: number;
  status: string | null;
  images: { imageUrl: string }[];
  createdAt: string;
};

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  PENDING:           { label: "รออนุมัติ",      cls: "bg-yellow-100 text-yellow-700" },
  ADDED_PROPERTIES:  { label: "เผยแพร่แล้ว",    cls: "bg-green-100 text-green-700" },
  SOLD:              { label: "ขายแล้ว",         cls: "bg-red-100 text-red-700" },
  RENTED:            { label: "ให้เช่าแล้ว",     cls: "bg-blue-100 text-blue-700" },
  REMOVED:           { label: "ถูกลบออก",        cls: "bg-gray-100 text-gray-500" },
};

function statusBadge(status: string | null) {
  const s = STATUS_LABEL[status || ""] || { label: status || "-", cls: "bg-gray-100 text-gray-500" };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>;
}

export default function AgentPortalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [locale, setLocale] = useState("th");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", lineId: "", companyName: "" });

  useEffect(() => {
    params.then(({ locale: l }) => setLocale(l));
  }, [params]);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push(`/${locale}/auth/login`);
  }, [authStatus, locale, router]);

  useEffect(() => {
    if (!session) return;
    const role = (session.user as any)?.role;
    if (role !== "CO_AGENT" && role !== "ADMIN") {
      router.push(`/${locale}/co-agent`);
      return;
    }
    Promise.all([
      fetch("/api/agent/profile").then(r => r.json()),
      fetch("/api/agent/properties").then(r => r.json()),
    ]).then(([pd, pp]) => {
      if (pd.success) {
        setProfile(pd.data);
        setForm({
          firstName: pd.data.firstName || "",
          lastName: pd.data.lastName || "",
          phone: pd.data.phone || "",
          lineId: pd.data.lineId || "",
          companyName: pd.data.coAgentApplication?.companyName || "",
        });
      }
      if (pp.success) setProperties(pp.data);
    }).finally(() => setLoading(false));
  }, [session, locale, router]);

  const saveProfile = async () => {
    setSaving(true);
    const res = await fetch("/api/agent/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await res.json();
    if (d.success) {
      setProfile(prev => prev ? { ...prev, ...form, coAgentApplication: prev.coAgentApplication ? { ...prev.coAgentApplication, companyName: form.companyName } : null } : prev);
      setEditMode(false);
    }
    setSaving(false);
  };

  if (authStatus === "loading" || loading) {
    return <div className="flex justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;
  }

  const appStatus = profile?.coAgentApplication?.status;

  return (
    <div className="bg-stone-50 min-h-screen py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Agent Portal</h1>
            <p className="text-sm text-stone-500">จัดการโปรไฟล์และทรัพย์สินของคุณ</p>
          </div>
          <Link
            href={`/${locale}/admin/properties/add`}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            เพิ่มทรัพย์ใหม่
          </Link>
        </div>

        {/* Status banner */}
        {appStatus === "PENDING" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <p className="text-sm text-yellow-700">ใบสมัครของคุณอยู่ระหว่างการพิจารณา ทรัพย์ที่เพิ่มจะถูก publish หลังจากได้รับอนุมัติ</p>
          </div>
        )}
        {appStatus === "APPROVED" && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-700">บัญชี Co-Agent ของคุณได้รับการอนุมัติแล้ว</p>
          </div>
        )}
        {appStatus === "REJECTED" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">ใบสมัครของคุณไม่ได้รับการอนุมัติ กรุณาติดต่อทีมงาน</p>
          </div>
        )}

        {/* Profile card */}
        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-amber-500" />
              <h2 className="font-semibold text-stone-900">โปรไฟล์ Agent</h2>
            </div>
            <button
              onClick={() => setEditMode(!editMode)}
              className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700"
            >
              <Edit3 className="w-4 h-4" />
              {editMode ? "ยกเลิก" : "แก้ไข"}
            </button>
          </div>

          {editMode ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "ชื่อ", key: "firstName" },
                { label: "นามสกุล", key: "lastName" },
                { label: "บริษัท / ทีม", key: "companyName" },
                { label: "เบอร์โทร", key: "phone" },
                { label: "Line ID", key: "lineId" },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-stone-500 mb-1">{label}</label>
                  <input
                    value={(form as any)[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                  />
                </div>
              ))}
              <div className="sm:col-span-2 flex justify-end">
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  บันทึก
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label="ชื่อ-นามสกุล" value={`${profile?.firstName || ""} ${profile?.lastName || ""}`} />
              <InfoRow label="บริษัท / ทีม" value={profile?.coAgentApplication?.companyName} />
              <InfoRow label="อีเมล" value={profile?.email} />
              <InfoRow label="เบอร์โทร" value={profile?.phone} icon={<Phone className="w-3.5 h-3.5" />} />
              <InfoRow label="Line ID" value={profile?.lineId} icon={<MessageSquare className="w-3.5 h-3.5" />} />
            </div>
          )}
        </div>

        {/* Properties */}
        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-500" />
              <h2 className="font-semibold text-stone-900">ทรัพย์สินของฉัน ({properties.length})</h2>
            </div>
            <Link href={`/${locale}/admin/properties/add`} className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1">
              <Plus className="w-4 h-4" /> เพิ่มใหม่
            </Link>
          </div>

          {properties.length === 0 ? (
            <div className="text-center py-12 text-stone-400">
              <Building2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">ยังไม่มีทรัพย์ที่เพิ่มไว้</p>
              <Link href={`/${locale}/admin/properties/add`} className="mt-3 inline-flex items-center gap-1 text-sm text-amber-600 hover:underline">
                เพิ่มทรัพย์แรกของคุณ <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {properties.map(p => {
                const img = p.images[0]?.imageUrl;
                const name = p.projectName || p.titleTh;
                return (
                  <div key={p.id} className="flex items-center gap-4 p-3 rounded-xl border border-stone-100 hover:bg-stone-50 transition-colors">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt={name} className="w-16 h-12 object-cover rounded-lg flex-shrink-0" />
                    ) : (
                      <div className="w-16 h-12 bg-stone-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="w-5 h-5 text-stone-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-900 truncate">{name}</p>
                      <p className="text-xs text-stone-500">
                        {p.propertyType} · {p.listingType === "RENT" ? "เช่า" : p.listingType === "SALE" ? "ขาย" : "เช่า&ขาย"}
                        {" · "}฿{p.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {statusBadge(p.status)}
                      {p.status === "ADDED_PROPERTIES" && (
                        <Link href={`/${locale}/properties/${p.id}`} className="text-xs text-amber-600 hover:underline">ดู</Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info box */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-700 space-y-1">
            <p className="font-medium">ข้อมูลสำหรับ Co-Agent</p>
            <p>ทรัพย์ที่คุณเพิ่มจะมีสถานะ "รออนุมัติ" และทีม NPB Property จะพิจารณาเผยแพร่ในระบบ</p>
            <p>โปรไฟล์ของคุณ (ชื่อ, บริษัท, เบอร์, Line ID) จะแสดงในหน้ารายละเอียดทรัพย์แทนข้อมูล NPB Property</p>
          </div>
        </div>

      </div>
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-stone-400 mb-0.5">{label}</p>
      <p className={`text-sm text-stone-800 flex items-center gap-1 ${!value ? "text-stone-300" : ""}`}>
        {icon && value && <span className="text-stone-400">{icon}</span>}
        {value || "—"}
      </p>
    </div>
  );
}
