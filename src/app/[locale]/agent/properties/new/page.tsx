"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2, CheckCircle } from "lucide-react";

type Form = {
  titleTh: string;
  projectName: string;
  address: string;
  propertyType: string;
  listingType: string;
  price: string;
  salePrice: string;
  bedrooms: string;
  bathrooms: string;
  sizeSqm: string;
  floor: string;
  building: string;
  availableDate: string;
  descriptionTh: string;
  ownerName: string;
  ownerPhone: string;
  ownerLineId: string;
  note: string;
};

const initForm: Form = {
  titleTh: "", projectName: "", address: "", propertyType: "CONDO",
  listingType: "RENT", price: "", salePrice: "", bedrooms: "0",
  bathrooms: "0", sizeSqm: "", floor: "", building: "",
  availableDate: "", descriptionTh: "", ownerName: "", ownerPhone: "",
  ownerLineId: "", note: "",
};

export default function AgentPropertyNewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [locale, setLocale] = useState("th");
  const [form, setForm] = useState<Form>(initForm);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then(({ locale: l }) => setLocale(l));
  }, [params]);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push(`/${locale}/auth/login`);
    if (authStatus === "authenticated") {
      const role = (session?.user as any)?.role;
      if (role !== "CO_AGENT" && role !== "ADMIN") router.push(`/${locale}/co-agent`);
    }
  }, [authStatus, session, locale, router]);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/agent/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          salePrice: form.salePrice ? Number(form.salePrice) : undefined,
          bedrooms: Number(form.bedrooms),
          bathrooms: Number(form.bathrooms),
          sizeSqm: form.sizeSqm ? Number(form.sizeSqm) : undefined,
          floor: form.floor ? Number(form.floor) : undefined,
        }),
      });
      const d = await res.json();
      if (d.success) {
        setDone(true);
      } else {
        setError(d.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    }
    setSaving(false);
  };

  if (done) {
    return (
      <div className="max-w-lg mx-auto py-20 px-4 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-stone-900 mb-2">ส่งทรัพย์เรียบร้อยแล้ว!</h2>
        <p className="text-sm text-stone-500 mb-6">ทรัพย์ของคุณอยู่ระหว่างการพิจารณาจากทีม Amber Real Estate</p>
        <div className="flex justify-center gap-3">
          <Link href={`/${locale}/agent`} className="px-5 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600">
            กลับหน้า Portal
          </Link>
          <button onClick={() => { setForm(initForm); setDone(false); }} className="px-5 py-2 border border-stone-300 text-stone-600 rounded-lg text-sm hover:bg-stone-50">
            เพิ่มทรัพย์อีก
          </button>
        </div>
      </div>
    );
  }

  const fieldCls = "w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400";

  return (
    <div className="bg-stone-50 min-h-screen py-10 px-4">
      <div className="max-w-3xl mx-auto">

        <div className="mb-6">
          <Link href={`/${locale}/agent`} className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 mb-3">
            <ChevronLeft className="w-4 h-4" /> กลับ Agent Portal
          </Link>
          <h1 className="text-xl font-bold text-stone-900">เพิ่มทรัพย์ใหม่</h1>
          <p className="text-sm text-stone-500 mt-1">ทรัพย์จะถูกส่งให้ทีม Amber Real Estate พิจารณาเผยแพร่</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Basic info */}
          <Section title="ข้อมูลทรัพย์">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">ชื่อทรัพย์ (ภาษาไทย) *</label>
                <input required value={form.titleTh} onChange={set("titleTh")} className={fieldCls} placeholder="เช่น คอนโดใกล้ BTS อ่อนนุช ชั้น 5" />
              </div>
              <div>
                <label className="label">ชื่อโครงการ</label>
                <input value={form.projectName} onChange={set("projectName")} className={fieldCls} placeholder="เช่น Lumpini Ville" />
              </div>
              <div>
                <label className="label">ตึก/อาคาร</label>
                <input value={form.building} onChange={set("building")} className={fieldCls} placeholder="A, B, C..." />
              </div>
              <div>
                <label className="label">ชั้น</label>
                <input type="number" value={form.floor} onChange={set("floor")} className={fieldCls} placeholder="5" />
              </div>
              <div>
                <label className="label">ที่อยู่ / ทำเล</label>
                <input value={form.address} onChange={set("address")} className={fieldCls} placeholder="ย่าน, ซอย, ถนน..." />
              </div>
            </div>
          </Section>

          {/* Type & Listing */}
          <Section title="ประเภทและการขาย/เช่า">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">ประเภทอสังหาฯ *</label>
                <select required value={form.propertyType} onChange={set("propertyType")} className={fieldCls}>
                  <option value="CONDO">คอนโด</option>
                  <option value="HOUSE">บ้านเดี่ยว</option>
                  <option value="TOWNHOUSE">ทาวน์เฮ้าส์</option>
                  <option value="LAND">ที่ดิน</option>
                  <option value="COMMERCIAL">เชิงพาณิชย์</option>
                </select>
              </div>
              <div>
                <label className="label">ประเภทประกาศ *</label>
                <select required value={form.listingType} onChange={set("listingType")} className={fieldCls}>
                  <option value="RENT">ให้เช่า</option>
                  <option value="SALE">ขาย</option>
                  <option value="RENT_AND_SALE">เช่าและขาย</option>
                </select>
              </div>
              <div>
                <label className="label">ราคาเช่า/ขาย (บาท) *</label>
                <input required type="number" min={0} value={form.price} onChange={set("price")} className={fieldCls} placeholder="7000" />
              </div>
              {(form.listingType === "RENT_AND_SALE" || form.listingType === "SALE") && (
                <div>
                  <label className="label">ราคาขาย (บาท)</label>
                  <input type="number" min={0} value={form.salePrice} onChange={set("salePrice")} className={fieldCls} />
                </div>
              )}
            </div>
          </Section>

          {/* Specs */}
          <Section title="รายละเอียดห้อง">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="label">ขนาด (ตร.ม.)</label>
                <input type="number" step="0.01" value={form.sizeSqm} onChange={set("sizeSqm")} className={fieldCls} placeholder="34" />
              </div>
              <div>
                <label className="label">ห้องนอน</label>
                <select value={form.bedrooms} onChange={set("bedrooms")} className={fieldCls}>
                  <option value="0">Studio</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4+</option>
                </select>
              </div>
              <div>
                <label className="label">ห้องน้ำ</label>
                <select value={form.bathrooms} onChange={set("bathrooms")} className={fieldCls}>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                </select>
              </div>
              <div>
                <label className="label">พร้อมเข้าอยู่</label>
                <input type="date" value={form.availableDate} onChange={set("availableDate")} className={fieldCls} />
              </div>
            </div>
          </Section>

          {/* Owner info */}
          <Section title="ข้อมูลเจ้าของ (สำหรับทีมงาน)">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">ชื่อเจ้าของ</label>
                <input value={form.ownerName} onChange={set("ownerName")} className={fieldCls} />
              </div>
              <div>
                <label className="label">เบอร์เจ้าของ</label>
                <input value={form.ownerPhone} onChange={set("ownerPhone")} className={fieldCls} />
              </div>
              <div>
                <label className="label">Line ID เจ้าของ</label>
                <input value={form.ownerLineId} onChange={set("ownerLineId")} className={fieldCls} />
              </div>
            </div>
          </Section>

          {/* Description */}
          <Section title="รายละเอียดเพิ่มเติม">
            <div className="space-y-3">
              <div>
                <label className="label">รายละเอียด (ภาษาไทย)</label>
                <textarea value={form.descriptionTh} onChange={set("descriptionTh")} rows={4} className={fieldCls} placeholder="อธิบายเพิ่มเติมเกี่ยวกับทรัพย์..." />
              </div>
              <div>
                <label className="label">หมายเหตุ (สำหรับทีมงาน)</label>
                <textarea value={form.note} onChange={set("note")} rows={2} className={fieldCls} placeholder="ข้อมูลเพิ่มเติมสำหรับทีม Amber Real Estate..." />
              </div>
            </div>
          </Section>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          <div className="flex gap-3">
            <Link href={`/${locale}/agent`} className="flex-1 sm:flex-none px-6 py-3 border border-stone-300 text-stone-600 rounded-xl text-sm font-medium text-center hover:bg-stone-50">
              ยกเลิก
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-8 py-3 rounded-xl text-sm font-medium disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              ส่งทรัพย์
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .label { display: block; font-size: 0.75rem; font-weight: 500; color: #78716c; margin-bottom: 0.25rem; }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-stone-700 mb-4">{title}</h3>
      {children}
    </div>
  );
}
