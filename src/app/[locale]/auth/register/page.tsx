"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserPlus, Loader2, Sparkles, ArrowRight, Building2,
  User, Home, Briefcase,
} from "lucide-react";

const ROLES = [
  { value: "BUYER", icon: User, labelKey: "buyer", descKey: "buyerDesc" },
  { value: "OWNER", icon: Home, labelKey: "owner", descKey: "ownerDesc" },
  { value: "AGENT", icon: Briefcase, labelKey: "agent", descKey: "agentDesc" },
];

export default function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const router = useRouter();
  const [locale, setLocale] = useState("th");
  const [messages, setMessages] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    role: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    // Agent-specific
    agentType: "FREELANCE" as "FREELANCE" | "COMPANY",
    companyName: "",
    lineId: "",
  });

  useEffect(() => {
    params.then(({ locale: l }) => {
      setLocale(l);
      import(`@/messages/${l}.json`).then((m) => setMessages(m.default));
    });
  }, [params]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.role) {
      setError(messages?.auth?.roleRequired || "Please select a role");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError(messages?.auth?.passwordMismatch || "Passwords do not match");
      return;
    }
    if (form.role === "AGENT" && !form.lineId.trim()) {
      setError(messages?.auth?.lineIdRequired || "Please enter your Line ID");
      return;
    }
    if (form.role === "AGENT" && !form.phone.trim()) {
      setError(messages?.auth?.phoneRequired || "Please enter your phone number");
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
          lineId: form.role === "AGENT" ? form.lineId : undefined,
          companyName: form.role === "AGENT" && form.agentType === "COMPANY" ? form.companyName : undefined,
          agentType: form.role === "AGENT" ? form.agentType : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Agent: redirect to login with notice; others: straight to login
        const loginUrl = data.data.pendingAgent
          ? `/${locale}/auth/login?notice=agent`
          : `/${locale}/auth/login`;
        router.push(loginUrl);
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
  const isAgent = form.role === "AGENT";

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
                Amber Real Estate
              </div>
              <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-4">
                <span className="text-[#E8C97A]">{messages.home.heroTitle}</span>
              </h1>
              <p className="text-white/70 leading-relaxed">
                {messages.home.heroSubtitle}
              </p>
            </div>
            <div className="space-y-3 mt-12">
              {[
                messages.home.wideSelection,
                messages.home.trustedByMany,
                messages.home.expertAgents,
              ].map((label, i) => (
                <div key={i} className="flex items-center gap-3 text-white/80">
                  <div className="w-8 h-8 rounded-full bg-[#C8A951]/20 border border-[#C8A951]/30 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-[#E8C97A]" />
                  </div>
                  <span className="text-sm">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Form */}
        <div className="flex items-start justify-center px-4 py-10 lg:py-12 overflow-y-auto">
          <div className="w-full max-w-md">
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-stone-900 text-white mb-3">
                <Building2 className="w-7 h-7" />
              </div>
            </div>

            <div className="flex items-center gap-2 text-[#C8A951] text-xs uppercase tracking-widest font-medium mb-2">
              <span className="w-6 h-px bg-[#C8A951]" />
              {t.createAccount}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-2">{t.registerTitle}</h2>
            <p className="text-sm text-stone-500 mb-7">
              {t.registerSubtitle}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {/* ── Step 1: Role ── */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">
                  {t.whoAreYou} <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLES.map(r => {
                    const Icon = r.icon;
                    const selected = form.role === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, role: r.value }))}
                        className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                          selected
                            ? "border-[#C8A951] bg-amber-50 shadow-sm"
                            : "border-stone-200 bg-white hover:border-stone-300"
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${selected ? "bg-[#C8A951]" : "bg-stone-100"}`}>
                          <Icon className={`w-4 h-4 ${selected ? "text-white" : "text-stone-500"}`} />
                        </div>
                        <span className={`text-xs font-medium leading-tight ${selected ? "text-[#C8A951]" : "text-stone-600"}`}>
                          {t[r.labelKey as keyof typeof t] || r.labelKey}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {form.role && (
                  <p className="text-xs text-stone-400 mt-1.5 text-center">
                    {t[ROLES.find(r => r.value === form.role)?.descKey as keyof typeof t] || ""}
                  </p>
                )}
              </div>

              {/* ── Step 2: Personal Info ── */}
              {form.role && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={t.firstName}>
                      <input type="text" required value={form.firstName} onChange={set("firstName")} className={inputCls} />
                    </Field>
                    <Field label={t.lastName}>
                      <input type="text" required value={form.lastName} onChange={set("lastName")} className={inputCls} />
                    </Field>
                  </div>

                  <Field label={t.email}>
                    <input type="email" required autoComplete="email" value={form.email} onChange={set("email")} className={inputCls} />
                  </Field>

                  <Field label={`${t.phone}${isAgent ? " *" : ""}`}>
                    <input type="tel" required={isAgent} value={form.phone} onChange={set("phone")} className={inputCls} placeholder="08x-xxx-xxxx" />
                  </Field>

                  {/* ── Agent extra fields ── */}
                  {isAgent && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-4">
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                        {t.agentSection}
                      </p>

                      {/* Freelance / Company toggle */}
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                          {t.agentTypeLabel} <span className="text-rose-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {(["FREELANCE", "COMPANY"] as const).map(type => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setForm(f => ({ ...f, agentType: type }))}
                              className={`py-2.5 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                                form.agentType === type
                                  ? "border-amber-500 bg-amber-500 text-white"
                                  : "border-stone-200 bg-white text-stone-600 hover:border-amber-300"
                              }`}
                            >
                              {type === "FREELANCE" ? "Freelance" : t.company}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Company name — only if Company */}
                      {form.agentType === "COMPANY" && (
                        <Field label={t.companyName}>
                          <input
                            type="text"
                            required
                            value={form.companyName}
                            onChange={set("companyName")}
                            placeholder={t.companyPlaceholder}
                            className={inputCls}
                          />
                        </Field>
                      )}

                      {/* Line ID */}
                      <Field label="Line ID *">
                        <input
                          type="text"
                          required
                          value={form.lineId}
                          onChange={set("lineId")}
                          placeholder="@yourlineid"
                          className={inputCls}
                        />
                      </Field>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <Field label={t.password}>
                      <input
                        type="password"
                        required
                        minLength={6}
                        autoComplete="new-password"
                        value={form.password}
                        onChange={set("password")}
                        className={inputCls}
                      />
                    </Field>
                    <Field label={t.confirmPassword}>
                      <input
                        type="password"
                        required
                        autoComplete="new-password"
                        value={form.confirmPassword}
                        onChange={set("confirmPassword")}
                        className={inputCls}
                      />
                    </Field>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#C8A951] hover:bg-[#B8993F] text-white py-3.5 rounded-full font-semibold text-sm transition-colors disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    {t.registerTitle}
                  </button>
                </>
              )}
            </form>

            <p className="text-center mt-6 text-sm text-stone-500">
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
  "w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A951]/30 focus:border-[#C8A951] bg-white";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
