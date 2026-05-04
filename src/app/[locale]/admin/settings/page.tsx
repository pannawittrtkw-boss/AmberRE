"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Trash2, Loader2, Image as ImageIcon, Video, Settings, Mail, Phone, MessageCircle, MapPin, Save } from "lucide-react";

export default function AdminSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const [locale, setLocale] = useState("th");
  const [messages, setMessages] = useState<any>(null);
  const [settings, setSettings] = useState<Record<string, { valueTh: string | null; valueEn: string | null }>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ locale: l }) => {
      setLocale(l);
      import(`@/messages/${l}.json`).then((m) => setMessages(m.default));
    });
  }, [params]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.success) setSettings(data.data);
    } catch {}
    setLoading(false);
  };

  const getValue = (key: string) => settings[key]?.valueTh || null;

  const saveSetting = async (key: string, value: string | null) => {
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, valueTh: value, valueEn: value }),
      });
      const data = await res.json();
      if (data.success) {
        setSettings((prev) => ({
          ...prev,
          [key]: { valueTh: value, valueEn: value },
        }));
        setSaved(key);
        setTimeout(() => setSaved(null), 2000);
      }
    } catch {}
  };

  const handleUpload = async (key: string, accept: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setUploading(key);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (data.success) {
          await saveSetting(key, data.data.url);
        } else {
          alert(data.error || "Upload failed");
        }
      } catch {
        alert("Upload failed");
      }
      setUploading(null);
    };
    input.click();
  };

  const handleRemove = async (key: string) => {
    await saveSetting(key, null);
  };

  if (loading || !messages) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const t = locale === "th"
    ? {
        title: "ตั้งค่าเว็บไซต์",
        subtitle: "จัดการรูปภาพและการตั้งค่าเว็บไซต์",
        assets: "รูปภาพเว็บไซต์",
        assetsDesc: "อัปโหลดโลโก้และรูปภาพของเว็บไซต์",
        logo: "โลโก้บริษัท",
        logoDesc: "อัปโหลดโลโก้บริษัท ขนาดแนะนำ: 160x40 พิกเซล",
        changeLogo: "เปลี่ยนโลโก้",
        heroBgImage: "รูปพื้นหลังหน้าแรก",
        heroBgImageDesc: "รูปสำหรับ Hero Section หน้าแรก อัตราส่วนแนะนำ 16:9 จะใช้เป็น fallback หากไม่มีวีดีโอ",
        changeImage: "เปลี่ยนรูป",
        heroBgVideo: "วีดีโอพื้นหลังหน้าแรก",
        heroBgVideoDesc: "วีดีโอสำหรับ Hero Section หน้าแรก (MP4) จะแสดงแทนรูปพื้นหลังหากมีการตั้งค่า",
        changeVideo: "เปลี่ยนวีดีโอ",
        uploadImage: "อัปโหลดรูป",
        uploadVideo: "อัปโหลดวีดีโอ",
        remove: "ลบ",
        saved: "บันทึกแล้ว",
      }
    : {
        title: "Settings",
        subtitle: "Manage your website and system settings.",
        assets: "Website Assets",
        assetsDesc: "Upload your company logo and other site images.",
        logo: "Company Logo",
        logoDesc: "Upload your company logo. Recommended size: 160x40 pixels.",
        changeLogo: "Change Logo",
        heroBgImage: "Homepage Background Image",
        heroBgImageDesc: "Image for the hero section on the homepage. Recommended aspect ratio: 16:9. This is a fallback if no video is set.",
        changeImage: "Change Image",
        heroBgVideo: "Homepage Background Video",
        heroBgVideoDesc: "Video for the hero section on the homepage. Overrides the background image if set. (MP4 format)",
        changeVideo: "Change Video",
        uploadImage: "Upload Image",
        uploadVideo: "Upload Video",
        remove: "Remove",
        saved: "Saved!",
      };

  const logoUrl = getValue("logo");
  const heroBgImageUrl = getValue("heroBgImage");
  const heroBgVideoUrl = getValue("heroBgVideo");
  const whyUsImageUrl = getValue("whyUsImage");
  const portfolioHeroImageUrl = getValue("portfolioHeroImage");
  const propertiesHeroImageUrl = getValue("propertiesHeroImage");
  const projectsHeroImageUrl = getValue("projectsHeroImage");
  const articlesHeroImageUrl = getValue("articlesHeroImage");
  const coAgentHeroImageUrl = getValue("coAgentHeroImage");
  const contactHeroImageUrl = getValue("contactHeroImage");

  // Reusable hero image upload section component
  const heroSections = [
    {
      key: "propertiesHeroImage",
      url: propertiesHeroImageUrl,
      titleTh: "รูป Hero หน้าอสังหาริมทรัพย์",
      titleEn: "Properties Hero Image",
    },
    {
      key: "projectsHeroImage",
      url: projectsHeroImageUrl,
      titleTh: "รูป Hero หน้าโครงการ",
      titleEn: "Projects Hero Image",
    },
    {
      key: "articlesHeroImage",
      url: articlesHeroImageUrl,
      titleTh: "รูป Hero หน้าบทความ",
      titleEn: "Articles Hero Image",
    },
    {
      key: "coAgentHeroImage",
      url: coAgentHeroImageUrl,
      titleTh: "รูป Hero หน้าตัวแทนร่วม",
      titleEn: "Co-Agent Hero Image",
    },
    {
      key: "contactHeroImage",
      url: contactHeroImageUrl,
      titleTh: "รูป Hero หน้าติดต่อเรา",
      titleEn: "Contact Hero Image",
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6" /> {t.title}
        </h1>
        <p className="text-gray-500 mt-1">{t.subtitle}</p>
      </div>

      {/* Contact Info (top of page for quick access) */}
      <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
        <ContactInfoSection
          locale={locale}
          settings={settings}
          saveSetting={saveSetting}
          saved={saved}
        />
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h2 className="text-xl font-bold mb-1">{t.assets}</h2>
        <p className="text-gray-500 text-sm mb-6">{t.assetsDesc}</p>

        {/* Company Logo */}
        <div className="border-b pb-6 mb-6">
          <h3 className="font-semibold mb-2">{t.logo}</h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-2">
            {logoUrl ? (
              <div className="relative">
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-10 max-w-[160px] object-contain border rounded p-1 bg-gray-50"
                />
                <button
                  onClick={() => handleRemove("logo")}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="h-10 w-[160px] border-2 border-dashed rounded flex items-center justify-center text-gray-400">
                <ImageIcon className="w-5 h-5" />
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleUpload("logo", "image/*")}
                disabled={uploading === "logo"}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                {uploading === "logo" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {logoUrl ? t.changeLogo : t.uploadImage}
              </button>
              {saved === "logo" && <span className="text-green-600 text-sm">{t.saved}</span>}
            </div>
          </div>
          <p className="text-gray-400 text-xs">{t.logoDesc}</p>
        </div>

        {/* Homepage Background Image */}
        <div className="border-b pb-6 mb-6">
          <h3 className="font-semibold mb-2">{t.heroBgImage}</h3>
          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 mb-2">
            {heroBgImageUrl ? (
              <div className="relative shrink-0">
                <img
                  src={heroBgImageUrl}
                  alt="Hero Background"
                  className="w-full sm:w-48 h-28 object-cover rounded border"
                />
                <button
                  onClick={() => handleRemove("heroBgImage")}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="w-full sm:w-48 h-28 border-2 border-dashed rounded flex items-center justify-center text-gray-400 shrink-0">
                <ImageIcon className="w-8 h-8" />
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleUpload("heroBgImage", "image/*")}
                disabled={uploading === "heroBgImage"}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                {uploading === "heroBgImage" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {heroBgImageUrl ? t.changeImage : t.uploadImage}
              </button>
              {saved === "heroBgImage" && <span className="text-green-600 text-sm">{t.saved}</span>}
            </div>
          </div>
          <p className="text-gray-400 text-xs">{t.heroBgImageDesc}</p>
        </div>

        {/* Homepage Background Video */}
        <div className="border-b pb-6 mb-6">
          <h3 className="font-semibold mb-2">{t.heroBgVideo}</h3>
          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 mb-2">
            {heroBgVideoUrl ? (
              <div className="relative shrink-0">
                <video
                  src={heroBgVideoUrl}
                  className="w-full sm:w-48 h-28 object-cover rounded border"
                  muted
                  playsInline
                  controls
                />
                <button
                  onClick={() => handleRemove("heroBgVideo")}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="w-full sm:w-48 h-28 border-2 border-dashed rounded flex items-center justify-center text-gray-400 shrink-0">
                <Video className="w-8 h-8" />
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleUpload("heroBgVideo", "video/mp4,video/webm")}
                disabled={uploading === "heroBgVideo"}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                {uploading === "heroBgVideo" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {heroBgVideoUrl ? t.changeVideo : t.uploadVideo}
              </button>
              {saved === "heroBgVideo" && <span className="text-green-600 text-sm">{t.saved}</span>}
            </div>
          </div>
          <p className="text-gray-400 text-xs">{t.heroBgVideoDesc}</p>
        </div>

        {/* Why Us Image */}
        <div>
          <h3 className="font-semibold mb-2">{locale === "th" ? "รูป Why Choose Us" : "Why Choose Us Image"}</h3>
          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 mb-2">
            {whyUsImageUrl ? (
              <div className="relative shrink-0">
                <img
                  src={whyUsImageUrl}
                  alt="Why Us"
                  className="w-full sm:w-48 h-28 object-cover rounded border"
                />
                <button
                  onClick={() => handleRemove("whyUsImage")}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="w-full sm:w-48 h-28 border-2 border-dashed rounded flex items-center justify-center text-gray-400 shrink-0">
                <ImageIcon className="w-8 h-8" />
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleUpload("whyUsImage", "image/*")}
                disabled={uploading === "whyUsImage"}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                {uploading === "whyUsImage" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {whyUsImageUrl ? (locale === "th" ? "เปลี่ยนรูป" : "Change Image") : (locale === "th" ? "อัปโหลดรูป" : "Upload Image")}
              </button>
              {saved === "whyUsImage" && <span className="text-green-600 text-sm">{locale === "th" ? "บันทึกแล้ว" : "Saved!"}</span>}
            </div>
          </div>
          <p className="text-gray-400 text-xs">
            {locale === "th"
              ? "รูปที่จะแสดงในส่วน Why Choose Us หน้าแรก อัตราส่วนแนะนำ 1:1 หรือแนวตั้ง"
              : "Image for the Why Choose Us section on the homepage. Recommended: 1:1 or portrait ratio."}
          </p>
        </div>

        {/* Portfolio Hero Image */}
        <div>
          <h3 className="font-semibold mb-2">
            {locale === "th" ? "รูป Hero หน้าผลงาน" : "Portfolio Hero Image"}
          </h3>
          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 mb-2">
            {portfolioHeroImageUrl ? (
              <div className="relative shrink-0">
                <img
                  src={portfolioHeroImageUrl}
                  alt="Portfolio Hero"
                  className="w-full sm:w-72 h-32 object-cover rounded border"
                />
                <button
                  onClick={() => handleRemove("portfolioHeroImage")}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="w-full sm:w-72 h-32 border-2 border-dashed rounded flex items-center justify-center text-gray-400 shrink-0">
                <ImageIcon className="w-8 h-8" />
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleUpload("portfolioHeroImage", "image/*")}
                disabled={uploading === "portfolioHeroImage"}
                className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                {uploading === "portfolioHeroImage" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {portfolioHeroImageUrl
                  ? locale === "th" ? "เปลี่ยนรูป" : "Change Image"
                  : locale === "th" ? "อัปโหลดรูป" : "Upload Image"}
              </button>
              {saved === "portfolioHeroImage" && (
                <span className="text-green-600 text-sm">
                  {locale === "th" ? "บันทึกแล้ว" : "Saved!"}
                </span>
              )}
            </div>
          </div>
          <p className="text-gray-400 text-xs">
            {locale === "th"
              ? "รูปสำหรับ Hero Section หน้าผลงาน อัตราส่วนแนะนำ 21:9 หรือ 16:9 (กว้างมาก)"
              : "Image for the Portfolio page hero. Recommended: 21:9 or 16:9 wide ratio."}
          </p>
        </div>

        {/* Other Page Heroes */}
        {heroSections.map((s) => (
          <div key={s.key}>
            <h3 className="font-semibold mb-2">
              {locale === "th" ? s.titleTh : s.titleEn}
            </h3>
            <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 mb-2">
              {s.url ? (
                <div className="relative shrink-0">
                  <img
                    src={s.url}
                    alt={s.titleEn}
                    className="w-full sm:w-72 h-32 object-cover rounded border"
                  />
                  <button
                    onClick={() => handleRemove(s.key)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-full sm:w-72 h-32 border-2 border-dashed rounded flex items-center justify-center text-gray-400 shrink-0">
                  <ImageIcon className="w-8 h-8" />
                </div>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpload(s.key, "image/*")}
                  disabled={uploading === s.key}
                  className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  {uploading === s.key ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {s.url
                    ? locale === "th" ? "เปลี่ยนรูป" : "Change Image"
                    : locale === "th" ? "อัปโหลดรูป" : "Upload Image"}
                </button>
                {saved === s.key && (
                  <span className="text-green-600 text-sm">
                    {locale === "th" ? "บันทึกแล้ว" : "Saved!"}
                  </span>
                )}
              </div>
            </div>
            <p className="text-gray-400 text-xs">
              {locale === "th"
                ? "รูปสำหรับ Hero Section ของหน้านี้ อัตราส่วนแนะนำ 21:9 หรือ 16:9"
                : "Hero image for this page. Recommended: 21:9 or 16:9."}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactInfoSection({
  locale,
  settings,
  saveSetting,
  saved,
}: {
  locale: string;
  settings: Record<string, { valueTh: string | null; valueEn: string | null }>;
  saveSetting: (key: string, value: string | null) => Promise<void>;
  saved: string | null;
}) {
  const fields: { key: string; icon: any; iconColor: string; labelTh: string; labelEn: string; placeholder: string; type?: string }[] = [
    {
      key: "contactEmail",
      icon: Mail,
      iconColor: "text-[#C8A951]",
      labelTh: "อีเมล",
      labelEn: "Email",
      placeholder: "info@npb-property.com",
      type: "email",
    },
    {
      key: "contactPhone",
      icon: Phone,
      iconColor: "text-[#C8A951]",
      labelTh: "เบอร์โทรศัพท์",
      labelEn: "Phone",
      placeholder: "02-xxx-xxxx",
    },
    {
      key: "contactLine",
      icon: MessageCircle,
      iconColor: "text-emerald-600",
      labelTh: "LINE ID",
      labelEn: "LINE ID",
      placeholder: "@cfx5958x",
    },
    {
      key: "contactLocation",
      icon: MapPin,
      iconColor: "text-rose-500",
      labelTh: "ที่ตั้ง",
      labelEn: "Location",
      placeholder: "Bangkok, Thailand",
    },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">
        {locale === "th" ? "ข้อมูลติดต่อ" : "Contact Info"}
      </h2>
      <p className="text-gray-500 text-sm mb-5">
        {locale === "th"
          ? "ข้อมูลที่จะแสดงในหน้าติดต่อเราและหน้าทรัพย์สิน"
          : "Information displayed on the contact page and property pages."}
      </p>

      <div className="space-y-4">
        {fields.map((f) => (
          <ContactField
            key={f.key}
            settingKey={f.key}
            icon={f.icon}
            iconColor={f.iconColor}
            label={locale === "th" ? f.labelTh : f.labelEn}
            placeholder={f.placeholder}
            type={f.type}
            initialValue={settings[f.key]?.valueTh || ""}
            onSave={(v) => saveSetting(f.key, v || null)}
            saved={saved === f.key}
            savedLabel={locale === "th" ? "บันทึกแล้ว" : "Saved!"}
            saveLabel={locale === "th" ? "บันทึก" : "Save"}
          />
        ))}
      </div>
    </div>
  );
}

function ContactField({
  settingKey,
  icon: Icon,
  iconColor,
  label,
  placeholder,
  type = "text",
  initialValue,
  onSave,
  saved,
  savedLabel,
  saveLabel,
}: {
  settingKey: string;
  icon: any;
  iconColor: string;
  label: string;
  placeholder: string;
  type?: string;
  initialValue: string;
  onSave: (value: string) => Promise<void>;
  saved: boolean;
  savedLabel: string;
  saveLabel: string;
}) {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  // Keep input in sync if parent settings reload
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const dirty = value !== initialValue;

  const handleSave = async () => {
    setSaving(true);
    await onSave(value.trim());
    setSaving(false);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <label className="flex items-center gap-2 text-sm font-medium w-40 shrink-0">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A951]/30"
      />
      <button
        onClick={handleSave}
        disabled={!dirty || saving}
        className="flex items-center gap-1 px-4 py-2 bg-[#C8A951] hover:bg-[#B8993F] text-white rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        {saveLabel}
      </button>
      {saved && <span className="text-green-600 text-sm">{savedLabel}</span>}
    </div>
  );
}
