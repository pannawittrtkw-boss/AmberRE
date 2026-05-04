"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Loader2,
  Sparkles,
  ArrowRight,
  Building2,
} from "lucide-react";

export default function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const router = useRouter();
  const [locale, setLocale] = useState("th");
  const [messages, setMessages] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    role: "BUYER",
  });

  useEffect(() => {
    params.then(({ locale: l }) => {
      setLocale(l);
      import(`@/messages/${l}.json`).then((m) => setMessages(m.default));
    });
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError(
        locale === "th" ? "รหัสผ่านไม่ตรงกัน" : "Passwords do not match"
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone || undefined,
          role: form.role,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/${locale}/auth/login`);
      } else {
        setError(data.error || "Registration failed");
      }
    } catch {
      setError("Something went wrong");
    }
    setLoading(false);
  };

  if (!messages)
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-[#C8A951]" />
      </div>
    );
  const t = messages.auth;

  return (
    <div className="bg-stone-50 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-64px)]">
        {/* LEFT — Promo */}
        <div className="hidden lg:flex relative bg-gradient-to-br from-stone-900 via-stone-800 to-[#5a4621] text-white p-12 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#C8A951]/20 rounded-full blur-3xl -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#C8A951]/10 rounded-full blur-3xl translate-y-20 -translate-x-20" />

          <div className="relative flex flex-col justify-between w-full max-w-md">
            <div>
              <div className="flex items-center gap-2 text-[#E8C97A] text-xs uppercase tracking-widest font-medium mb-3">
                <span className="w-6 h-px bg-[#E8C97A]" />
                NPB Property
              </div>
              <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-4">
                {locale === "th" ? (
                  <>
                    เริ่มต้นการค้นหา
                    <br />
                    <span className="text-[#E8C97A]">บ้านในฝัน</span>
                  </>
                ) : (
                  <>
                    Start Your
                    <br />
                    <span className="text-[#E8C97A]">Property Journey</span>
                  </>
                )}
              </h1>
              <p className="text-white/70 leading-relaxed">
                {locale === "th"
                  ? "สมัครสมาชิกฟรี เพื่อเริ่มค้นหาทรัพย์ บันทึกรายการโปรด และติดต่อตัวแทนได้ทันที"
                  : "Sign up for free to start exploring listings, save favorites, and connect with agents."}
              </p>
            </div>

            <div className="space-y-3 mt-12">
              {[
                { th: "ใช้งานฟรีไม่มีค่าใช้จ่าย", en: "100% free to use" },
                {
                  th: "ทรัพย์คุณภาพคัดสรรจากทั่วประเทศ",
                  en: "Curated quality listings",
                },
                {
                  th: "ทีมตัวแทนมืออาชีพ",
                  en: "Professional agent team",
                },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-white/80">
                  <div className="w-8 h-8 rounded-full bg-[#C8A951]/20 border border-[#C8A951]/30 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-[#E8C97A]" />
                  </div>
                  <span className="text-sm">
                    {locale === "th" ? item.th : item.en}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Form */}
        <div className="flex items-center justify-center px-4 py-12 lg:py-12 overflow-y-auto">
          <div className="w-full max-w-md">
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-stone-900 text-white mb-3">
                <Building2 className="w-7 h-7" />
              </div>
            </div>

            <div className="flex items-center gap-2 text-[#C8A951] text-xs uppercase tracking-widest font-medium mb-2">
              <span className="w-6 h-px bg-[#C8A951]" />
              {locale === "th" ? "สมัครสมาชิก" : "Create Account"}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-2">
              {t.registerTitle}
            </h2>
            <p className="text-sm text-stone-500 mb-8">
              {locale === "th"
                ? "ใช้เวลาเพียง 1 นาทีเพื่อสร้างบัญชี"
                : "Takes less than a minute"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Field label={t.firstName}>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) =>
                      setForm({ ...form, firstName: e.target.value })
                    }
                    required
                    className={inputCls}
                  />
                </Field>
                <Field label={t.lastName}>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) =>
                      setForm({ ...form, lastName: e.target.value })
                    }
                    required
                    className={inputCls}
                  />
                </Field>
              </div>

              <Field label={t.email}>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="email"
                  className={inputCls}
                />
              </Field>

              <Field label={t.phone}>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={inputCls}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label={t.password}>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className={inputCls}
                  />
                </Field>
                <Field label={t.confirmPassword}>
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) =>
                      setForm({ ...form, confirmPassword: e.target.value })
                    }
                    required
                    autoComplete="new-password"
                    className={inputCls}
                  />
                </Field>
              </div>

              <Field label={t.role}>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className={inputCls}
                >
                  <option value="BUYER">{t.buyer}</option>
                  <option value="OWNER">{t.owner}</option>
                  <option value="AGENT">{t.agent}</option>
                </select>
              </Field>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#C8A951] hover:bg-[#B8993F] text-white py-3.5 rounded-full font-semibold text-sm transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                {t.registerTitle}
              </button>
            </form>

            <p className="text-center mt-8 text-sm text-stone-500">
              {t.hasAccount}{" "}
              <Link
                href={`/${locale}/auth/login`}
                className="inline-flex items-center gap-1 text-[#C8A951] hover:text-[#B8993F] font-semibold"
              >
                {messages.common.login}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A951]/30 focus:border-[#C8A951]";

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
