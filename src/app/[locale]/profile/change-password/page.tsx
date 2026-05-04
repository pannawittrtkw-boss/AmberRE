"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, KeyRound, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ChangePasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const router = useRouter();
  const { status } = useSession();
  const [locale, setLocale] = useState("th");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    params.then(({ locale: l }) => setLocale(l));
  }, [params]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/${locale}/auth/login`);
    }
  }, [status, locale, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (next.length < 6) {
      setError(locale === "th" ? "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร" : "New password must be at least 6 characters");
      return;
    }
    if (next !== confirm) {
      setError(locale === "th" ? "รหัสผ่านไม่ตรงกัน" : "Passwords do not match");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.error || (locale === "th" ? "เกิดข้อผิดพลาด" : "Error"));
      return;
    }
    setSuccess(true);
    setCurrent(""); setNext(""); setConfirm("");
  };

  return (
    <div className="bg-stone-50 min-h-screen flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 max-w-md w-full p-8">
        <div className="flex items-center gap-2 text-[#C8A951] text-xs uppercase tracking-widest font-medium mb-2">
          <span className="w-6 h-px bg-[#C8A951]" />
          {locale === "th" ? "บัญชีของฉัน" : "My Account"}
        </div>
        <h1 className="text-2xl font-bold text-stone-900 mb-2">
          {locale === "th" ? "เปลี่ยนรหัสผ่าน" : "Change Password"}
        </h1>
        <p className="text-sm text-stone-500 mb-6">
          {locale === "th"
            ? "กรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่"
            : "Enter your current and new password"}
        </p>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4" />
            {locale === "th" ? "เปลี่ยนรหัสผ่านสำเร็จ" : "Password changed successfully"}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              {locale === "th" ? "รหัสผ่านปัจจุบัน" : "Current Password"}
            </label>
            <input
              type="password"
              required
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
              className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A951]/30 focus:border-[#C8A951]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              {locale === "th" ? "รหัสผ่านใหม่" : "New Password"}
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
              className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A951]/30 focus:border-[#C8A951]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              {locale === "th" ? "ยืนยันรหัสผ่านใหม่" : "Confirm New Password"}
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
            {locale === "th" ? "เปลี่ยนรหัสผ่าน" : "Change Password"}
          </button>
        </form>

        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-[#C8A951] mt-6"
        >
          <ArrowLeft className="w-3 h-3" />
          {locale === "th" ? "กลับหน้าหลัก" : "Back to home"}
        </Link>
      </div>
    </div>
  );
}
