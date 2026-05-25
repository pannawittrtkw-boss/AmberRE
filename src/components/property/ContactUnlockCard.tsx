"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Phone, MessageSquare, Lock, Unlock, Loader2, AlertCircle, Crown } from "lucide-react";

interface Props {
  propertyId: number;
  phone: string;
  lineId: string | null;
  locale: string;
}

function mask(value: string): string {
  if (!value) return value;
  const clean = value.replace(/\s/g, "");
  return "*".repeat(Math.max(0, clean.length - 4)) + clean.slice(-4);
}

export default function ContactUnlockCard({ propertyId, phone, lineId, locale }: Props) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const tier: string = (session?.user as any)?.subscriptionTier ?? "STANDARD";

  const [messages, setMessages] = useState<any>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [quota, setQuota] = useState<{ used: number; max: number | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const needsUnlock = role === "CO_AGENT";

  useEffect(() => {
    import(`@/messages/${locale}.json`).then((m) => setMessages(m.default));
  }, [locale]);

  useEffect(() => {
    if (!needsUnlock) { setLoading(false); return; }
    fetch(`/api/contact-unlock?propertyId=${propertyId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setUnlocked(d.data.isUnlocked);
          setQuota({ used: d.data.usedThisMonth, max: d.data.quota });
        }
      })
      .finally(() => setLoading(false));
  }, [needsUnlock, propertyId]);

  const handleUnlock = async () => {
    setUnlocking(true);
    setError(null);
    const res = await fetch("/api/contact-unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId }),
    });
    const d = await res.json();
    if (d.success) {
      setUnlocked(true);
      if (quota) setQuota((q) => q ? { ...q, used: q.used + 1 } : q);
    } else if (d.error === "quota_exceeded") {
      const tc = messages?.common;
      setError(tc
        ? `${tc.unlimited ? "" : ""}${d.quota} — ${tc.unlimited}`
        : `Monthly quota of ${d.quota} unlocks reached. Upgrade to PRO or ELITE for unlimited access.`
      );
    } else {
      setError(d.message || "Failed to unlock");
    }
    setUnlocking(false);
  };

  if (loading || !messages) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
      </div>
    );
  }

  const tc = messages.common;

  if (!needsUnlock) {
    return <ContactButtons phone={phone} lineId={lineId} callLabel={tc.call} />;
  }

  if (unlocked) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-green-600 mb-2">
          <Unlock className="w-3.5 h-3.5" />
          {tc.contactUnlocked}
        </div>
        <ContactButtons phone={phone} lineId={lineId} callLabel={tc.call} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200 opacity-60">
          <Phone className="w-4 h-4 text-stone-400" />
          <span className="text-sm font-mono text-stone-500 tracking-wider">{mask(phone)}</span>
        </div>
        {lineId && (
          <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200 opacity-60">
            <MessageSquare className="w-4 h-4 text-stone-400" />
            <span className="text-sm font-mono text-stone-500 tracking-wider">{mask(lineId)}</span>
          </div>
        )}
      </div>

      {quota && quota.max !== null && (
        <div className="text-xs text-stone-500 text-center">
          {quota.used}/{quota.max} {tc.unlockContact}
        </div>
      )}
      {tier !== "STANDARD" && (
        <div className="flex items-center gap-1.5 text-xs text-amber-600 justify-center">
          <Crown className="w-3 h-3" />
          {tier} — {tc.unlimited}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      <button
        onClick={handleUnlock}
        disabled={unlocking || (quota !== null && quota.max !== null && quota.used >= quota.max)}
        className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-stone-300 disabled:cursor-not-allowed text-white py-3 rounded-xl font-medium text-sm transition-colors"
      >
        {unlocking ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Lock className="w-4 h-4" />
        )}
        {tc.unlockContact}
      </button>
    </div>
  );
}

function ContactButtons({ phone, lineId, callLabel }: { phone: string; lineId: string | null; callLabel: string }) {
  return (
    <div className="space-y-2">
      {phone && (
        <a
          href={`tel:${phone}`}
          className="w-full flex items-center justify-center gap-2 bg-[#C8A951] hover:bg-[#b8993f] text-white py-3 rounded-xl font-medium text-sm transition-colors"
        >
          <Phone className="w-4 h-4" />
          {callLabel} {phone}
        </a>
      )}
      {lineId && (
        <a
          href={`https://line.me/R/ti/p/${lineId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 bg-[#06C755] hover:bg-[#05a347] text-white py-3 rounded-xl font-medium text-sm transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Line: {lineId}
        </a>
      )}
    </div>
  );
}
