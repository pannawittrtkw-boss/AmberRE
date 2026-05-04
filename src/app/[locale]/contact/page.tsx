"use client";

import { useState, useEffect } from "react";
import {
  Send,
  Mail,
  MessageCircle,
  Phone,
  MapPin,
  Loader2,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export default function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState("th");
  const [messages, setMessages] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [contactInfo, setContactInfo] = useState({
    email: "info@npb-property.com",
    phone: "02-xxx-xxxx",
    line: "@cfx5958x",
    location: "Bangkok, Thailand",
  });

  useEffect(() => {
    fetch("/api/site-settings?keys=contactHeroImage,contactEmail,contactPhone,contactLine,contactLocation")
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        setHeroImage(d.data.contactHeroImage || null);
        setContactInfo((prev) => ({
          email: d.data.contactEmail || prev.email,
          phone: d.data.contactPhone || prev.phone,
          line: d.data.contactLine || prev.line,
          location: d.data.contactLocation || prev.location,
        }));
      })
      .catch(() => {});
  }, []);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  useEffect(() => {
    params.then(({ locale: l }) => {
      setLocale(l);
      import(`@/messages/${l}.json`).then((m) => setMessages(m.default));
    });
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setForm({ name: "", email: "", phone: "", subject: "", message: "" });
      }
    } catch {}
    setLoading(false);
  };


  if (!messages)
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-[#C8A951]" />
      </div>
    );

  const t = messages.contact;

  return (
    <div className="bg-stone-50 min-h-screen">
      {/* HERO */}
      <section className="relative bg-gradient-to-br from-stone-900 via-stone-800 to-[#5a4621] text-white overflow-hidden h-[72vh] min-h-[560px] max-h-[720px] flex items-start pt-16 md:pt-20">
        {heroImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover [object-position:center_70%] opacity-40"
          />
        )}
        {/* Dark overlay for text contrast when image present */}
        {heroImage && (
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-stone-950/40 to-transparent" />
        )}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C8A951]/20 rounded-full blur-3xl -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#C8A951]/10 rounded-full blur-3xl translate-y-20 -translate-x-20" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center gap-2 text-[#E8C97A] text-xs uppercase tracking-widest font-medium mb-3">
            <span className="w-6 h-px bg-[#E8C97A]" />
            {locale === "th" ? "ติดต่อเรา" : "Get in Touch"}
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-3">
            {t.title}
          </h1>
          <p className="text-lg text-white/70 max-w-2xl">
            {locale === "th"
              ? "ทีมงานของเรายินดีให้คำปรึกษาและช่วยคุณค้นหาทรัพย์ที่ใช่"
              : "Our team is ready to help you find the perfect property"}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* CONTACT FORM */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-3xl shadow-sm p-8 md:p-10">
              {success ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-stone-900 mb-2">
                    {locale === "th"
                      ? "ส่งข้อความสำเร็จ!"
                      : "Message Sent!"}
                  </h2>
                  <p className="text-stone-500 mb-5">
                    {locale === "th"
                      ? "ทีมงานของเราจะติดต่อกลับโดยเร็วที่สุด"
                      : "Our team will get back to you shortly"}
                  </p>
                  <button
                    onClick={() => setSuccess(false)}
                    className="inline-flex items-center gap-2 text-[#C8A951] hover:text-[#B8993F] font-medium"
                  >
                    {locale === "th"
                      ? "ส่งข้อความอีกครั้ง"
                      : "Send another message"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-[#C8A951] text-xs uppercase tracking-widest font-medium mb-2">
                    <span className="w-6 h-px bg-[#C8A951]" />
                    {locale === "th" ? "ส่งข้อความ" : "Send Message"}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-stone-900 mb-2">
                    {locale === "th"
                      ? "บอกเราว่าคุณสนใจอะไร"
                      : "Tell us what you're looking for"}
                  </h2>
                  <p className="text-sm text-stone-500 mb-8">
                    {locale === "th"
                      ? "กรอกฟอร์มด้านล่าง ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง"
                      : "Fill out the form below and we'll respond within 24 hours"}
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label={`${t.name} *`}>
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) =>
                            setForm({ ...form, name: e.target.value })
                          }
                          required
                          className={inputCls}
                        />
                      </Field>
                      <Field label={`${t.email} *`}>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) =>
                            setForm({ ...form, email: e.target.value })
                          }
                          required
                          className={inputCls}
                        />
                      </Field>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label={t.phone}>
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) =>
                            setForm({ ...form, phone: e.target.value })
                          }
                          className={inputCls}
                        />
                      </Field>
                      <Field label={t.subject}>
                        <input
                          type="text"
                          value={form.subject}
                          onChange={(e) =>
                            setForm({ ...form, subject: e.target.value })
                          }
                          className={inputCls}
                        />
                      </Field>
                    </div>
                    <Field label={`${t.message} *`}>
                      <textarea
                        value={form.message}
                        onChange={(e) =>
                          setForm({ ...form, message: e.target.value })
                        }
                        required
                        rows={5}
                        className={`${inputCls} resize-none`}
                      />
                    </Field>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center gap-2 bg-[#C8A951] hover:bg-[#B8993F] text-white px-8 py-3.5 rounded-full font-semibold text-sm transition-colors disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {t.send}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>

          {/* SIDEBAR */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Contact Info Card */}
            <div className="bg-white rounded-3xl shadow-sm p-7">
              <div className="flex items-center gap-2 text-[#C8A951] text-xs uppercase tracking-widest font-medium mb-2">
                <span className="w-6 h-px bg-[#C8A951]" />
                {locale === "th" ? "ช่องทางติดต่อ" : "Contact Info"}
              </div>
              <h3 className="font-bold text-xl text-stone-900 mb-5">
                {locale === "th" ? "พร้อมให้บริการ" : "Reach Out To Us"}
              </h3>
              <div className="space-y-4 text-sm">
                <ContactRow
                  icon={<Mail className="w-4 h-4 text-[#C8A951]" />}
                  label={locale === "th" ? "อีเมล" : "Email"}
                  value={contactInfo.email}
                  href={`mailto:${contactInfo.email}`}
                />
                <ContactRow
                  icon={<Phone className="w-4 h-4 text-[#C8A951]" />}
                  label={locale === "th" ? "โทรศัพท์" : "Phone"}
                  value={contactInfo.phone}
                  href={`tel:${contactInfo.phone.replace(/[^0-9+]/g, "")}`}
                />
                <ContactRow
                  icon={<MessageCircle className="w-4 h-4 text-emerald-600" />}
                  label="LINE"
                  value={contactInfo.line}
                  href={
                    /^https?:\/\//i.test(contactInfo.line.trim())
                      ? contactInfo.line.trim()
                      : `https://line.me/R/ti/p/${encodeURIComponent(
                          contactInfo.line.startsWith("@")
                            ? contactInfo.line
                            : `@${contactInfo.line}`
                        )}`
                  }
                />
                <ContactRow
                  icon={<MapPin className="w-4 h-4 text-rose-500" />}
                  label={locale === "th" ? "ที่ตั้ง" : "Location"}
                  value={contactInfo.location}
                />
              </div>
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A951]/30 focus:border-[#C8A951] transition-colors";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function ContactRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-widest text-stone-400">
          {label}
        </div>
        <div className="text-stone-900 font-medium">{value}</div>
      </div>
    </div>
  );

  return href ? (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className="block hover:bg-stone-50 -mx-2 px-2 py-2 rounded-lg transition-colors"
    >
      {content}
    </a>
  ) : (
    <div className="-mx-2 px-2 py-2">{content}</div>
  );
}
