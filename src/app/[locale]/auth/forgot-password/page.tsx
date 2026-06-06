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
  const [messages, setMessages] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    params.then(({ locale: l }) => {
      setLocale(l);
      import(`@/messages/${l}.json`).then((m) => setMessages(m.default));
    });
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

  if (!messages)
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-[#C8A951]" />
      </div>
    );
  const t = messages.auth;

  return (
    <div className="bg-stone-50 min-h-screen flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 max-w-md w-full p-8">
        <div className="flex items-center gap-2 text-[#C8A951] text-xs uppercase tracking-widest font-medium mb-2">
          <span className="w-6 h-px bg-[#C8A951]" />
          {t.forgotPasswordTitle}
        </div>
        <h1 className="text-2xl font-bold text-stone-900 mb-2">
          {t.resetPassword}
        </h1>
        <p className="text-sm text-stone-500 mb-6">
          {t.resetPasswordDesc}
        </p>

        {!submitted ? (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                {t.email}
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
              {t.sendResetLink}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm">
              {t.emailExists}
            </div>

            {resetUrl && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-xs text-amber-800 mb-2 font-medium">
                  {t.resetLinkValid}
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
                  {t.openLink}
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
          {t.backToLogin}
        </Link>
      </div>
    </div>
  );
}
