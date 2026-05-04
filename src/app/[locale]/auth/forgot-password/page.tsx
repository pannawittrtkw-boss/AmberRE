"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, KeyRound, ArrowLeft, Copy, Check } from "lucide-react";

export default function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState("th");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    params.then(({ locale: l }) => setLocale(l));
  }, [params]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      setSubmitted(true);
      setResetUrl(data.data?.resetUrl || null);
    }
  };

  const copyLink = async () => {
    if (!resetUrl) return;
    await navigator.clipboard.writeText(resetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-stone-50 min-h-screen flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 max-w-md w-full p-8">
        <div className="flex items-center gap-2 text-[#C8A951] text-xs uppercase tracking-widest font-medium mb-2">
          <span className="w-6 h-px bg-[#C8A951]" />
          {locale === "th" ? "ลืมรหัสผ่าน" : "Forgot Password"}
        </div>
        <h1 className="text-2xl font-bold text-stone-900 mb-2">
          {locale === "th" ? "รีเซ็ตรหัสผ่าน" : "Reset Password"}
        </h1>
        <p className="text-sm text-stone-500 mb-6">
          {locale === "th"
            ? "กรอกอีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน"
            : "Enter your email to receive a reset link"}
        </p>

        {!submitted ? (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                {locale === "th" ? "อีเมล" : "Email"}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A951]/30 focus:border-[#C8A951]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#C8A951] hover:bg-[#B8993F] text-white py-3 rounded-full font-semibold text-sm disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              {locale === "th" ? "ส่งลิงก์รีเซ็ต" : "Send reset link"}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm">
              {locale === "th"
                ? "หากอีเมลนี้มีในระบบ ลิงก์รีเซ็ตได้ถูกสร้างแล้ว"
                : "If this email exists, a reset link has been generated."}
            </div>

            {resetUrl && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-xs text-amber-800 mb-2 font-medium">
                  {locale === "th"
                    ? "ลิงก์รีเซ็ตของคุณ (ใช้ภายใน 1 ชั่วโมง):"
                    : "Your reset link (valid for 1 hour):"}
                </p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={resetUrl}
                    className="flex-1 border border-amber-300 rounded px-2 py-1.5 text-xs bg-white font-mono"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={copyLink}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#C8A951] text-white rounded text-xs hover:bg-[#B8993F]"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <a
                  href={resetUrl}
                  className="inline-block mt-2 text-xs text-[#C8A951] hover:underline"
                >
                  {locale === "th" ? "เปิดลิงก์ →" : "Open link →"}
                </a>
              </div>
            )}
          </div>
        )}

        <Link
          href={`/${locale}/auth/login`}
          className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-[#C8A951] mt-6"
        >
          <ArrowLeft className="w-3 h-3" />
          {locale === "th" ? "กลับหน้าเข้าสู่ระบบ" : "Back to login"}
        </Link>
      </div>
    </div>
  );
}
