"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, Loader2, Sparkles, ArrowRight, Building2 } from "lucide-react";

export default function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const router = useRouter();
  const [locale, setLocale] = useState("th");
  const [messages, setMessages] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    params.then(({ locale: l }) => {
      setLocale(l);
      import(`@/messages/${l}.json`).then((m) => setMessages(m.default));
    });
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(messages?.auth?.loginError || "Invalid credentials");
      setLoading(false);
    } else {
      router.push(`/${locale}`);
      router.refresh();
    }
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
                    ค้นหาบ้านในฝัน
                    <br />
                    <span className="text-[#E8C97A]">ที่ใช่สำหรับคุณ</span>
                  </>
                ) : (
                  <>
                    Find Your Perfect
                    <br />
                    <span className="text-[#E8C97A]">Property</span>
                  </>
                )}
              </h1>
              <p className="text-white/70 leading-relaxed">
                {locale === "th"
                  ? "เข้าสู่ระบบเพื่อบันทึกรายการโปรด เปรียบเทียบทรัพย์ และจัดการการค้นหาของคุณ"
                  : "Sign in to save favorites, compare listings, and manage your search."}
              </p>
            </div>

            <div className="space-y-3 mt-12">
              {[
                {
                  th: "บันทึกรายการโปรด",
                  en: "Save your favorite listings",
                },
                {
                  th: "เปรียบเทียบหลายทรัพย์",
                  en: "Compare multiple properties",
                },
                {
                  th: "ติดต่อตัวแทนได้รวดเร็ว",
                  en: "Quick contact with agents",
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
        <div className="flex items-center justify-center px-4 py-12 lg:py-0">
          <div className="w-full max-w-md">
            {/* Logo on mobile */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-stone-900 text-white mb-3">
                <Building2 className="w-7 h-7" />
              </div>
            </div>

            <div className="flex items-center gap-2 text-[#C8A951] text-xs uppercase tracking-widest font-medium mb-2">
              <span className="w-6 h-px bg-[#C8A951]" />
              {locale === "th" ? "เข้าสู่ระบบ" : "Welcome Back"}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-2">
              {t.loginTitle}
            </h2>
            <p className="text-sm text-stone-500 mb-8">
              {locale === "th"
                ? "กรอกข้อมูลด้านล่างเพื่อเข้าสู่ระบบ"
                : "Enter your credentials below to sign in"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  {t.email}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A951]/30 focus:border-[#C8A951]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">
                  {t.password}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A951]/30 focus:border-[#C8A951]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#C8A951] hover:bg-[#B8993F] text-white py-3.5 rounded-full font-semibold text-sm transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                {t.loginTitle}
              </button>

              <div className="text-right">
                <Link
                  href={`/${locale}/auth/forgot-password`}
                  className="text-xs text-stone-500 hover:text-[#C8A951]"
                >
                  {locale === "th" ? "ลืมรหัสผ่าน?" : "Forgot password?"}
                </Link>
              </div>
            </form>

            <p className="text-center mt-8 text-sm text-stone-500">
              {t.noAccount}{" "}
              <Link
                href={`/${locale}/auth/register`}
                className="inline-flex items-center gap-1 text-[#C8A951] hover:text-[#B8993F] font-semibold"
              >
                {messages.common.register}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
