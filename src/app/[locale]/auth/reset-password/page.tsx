"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, KeyRound, ArrowLeft, CheckCircle2 } from "lucide-react";

function ResetPasswordContent({ locale }: { locale: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      return;
    }
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => setTokenValid(!!d.success))
      .catch(() => setTokenValid(false));
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError(locale === "th" ? "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" : "Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError(locale === "th" ? "รหัสผ่านไม่ตรงกัน" : "Passwords do not match");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.error || (locale === "th" ? "เกิดข้อผิดพลาด" : "Error"));
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push(`/${locale}/auth/login`), 2000);
  };

  if (tokenValid === null) {
    return <Loader2 className="w-6 h-6 animate-spin text-[#C8A951] mx-auto" />;
  }

  if (!tokenValid) {
    return (
      <div className="space-y-4">
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
          {locale === "th"
            ? "ลิงก์ไม่ถูกต้องหรือหมดอายุแล้ว กรุณาขอลิงก์ใหม่"
            : "Invalid or expired link. Please request a new one."}
        </div>
        <Link
          href={`/${locale}/auth/forgot-password`}
          className="block w-full text-center bg-[#C8A951] hover:bg-[#B8993F] text-white py-3 rounded-full font-semibold text-sm"
        >
          {locale === "th" ? "ขอลิงก์ใหม่" : "Request new link"}
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
        <p className="text-sm text-stone-700">
          {locale === "th"
            ? "เปลี่ยนรหัสผ่านสำเร็จ กำลังนำไปหน้าเข้าสู่ระบบ..."
            : "Password reset successful. Redirecting to login..."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          {locale === "th" ? "รหัสผ่านใหม่" : "New Password"}
        </label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A951]/30 focus:border-[#C8A951]"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          {locale === "th" ? "ยืนยันรหัสผ่าน" : "Confirm Password"}
        </label>
        <input
          type="password"
          required
          minLength={6}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A951]/30 focus:border-[#C8A951]"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 bg-[#C8A951] hover:bg-[#B8993F] text-white py-3 rounded-full font-semibold text-sm disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
        {locale === "th" ? "เปลี่ยนรหัสผ่าน" : "Reset Password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState("th");

  useEffect(() => {
    params.then(({ locale: l }) => setLocale(l));
  }, [params]);

  return (
    <div className="bg-stone-50 min-h-screen flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 max-w-md w-full p-8">
        <div className="flex items-center gap-2 text-[#C8A951] text-xs uppercase tracking-widest font-medium mb-2">
          <span className="w-6 h-px bg-[#C8A951]" />
          {locale === "th" ? "รีเซ็ตรหัสผ่าน" : "Reset Password"}
        </div>
        <h1 className="text-2xl font-bold text-stone-900 mb-2">
          {locale === "th" ? "ตั้งรหัสผ่านใหม่" : "Set New Password"}
        </h1>
        <p className="text-sm text-stone-500 mb-6">
          {locale === "th" ? "กรอกรหัสผ่านใหม่ของคุณ" : "Enter your new password below"}
        </p>

        <Suspense fallback={<Loader2 className="w-6 h-6 animate-spin text-[#C8A951] mx-auto" />}>
          <ResetPasswordContent locale={locale} />
        </Suspense>

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
