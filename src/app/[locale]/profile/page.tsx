"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User, Loader2, CheckCircle } from "lucide-react";

export default function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [locale, setLocale] = useState("th");
  const [messages, setMessages] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profile, setProfile] = useState({ firstName: "", lastName: "", phone: "", language: "th" });

  useEffect(() => {
    params.then(({ locale: l }) => {
      setLocale(l);
      import(`@/messages/${l}.json`).then((m) => setMessages(m.default));
    });
  }, [params]);

  useEffect(() => {
    if (status === "unauthenticated") router.push(`/${locale}/auth/login`);
    if (session) {
      fetch("/api/users/profile").then(r => r.json()).then(d => {
        if (d.success && d.data) {
          setProfile({
            firstName: d.data.firstName || "",
            lastName: d.data.lastName || "",
            phone: d.data.phone || "",
            language: d.data.language || "th",
          });
        }
      }).catch(() => {});
    }
  }, [session, status, router, locale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (data.success) setSaved(true);
    } catch {}
    setLoading(false);
  };

  if (!messages || status === "loading") return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl shadow-sm border p-8">
        <div className="flex items-center gap-3 mb-8">
          <User className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold">{messages.common.profile}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {saved && (
            <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> {messages.common.save} ✓
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{messages.auth.firstName}</label>
              <input type="text" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{messages.auth.lastName}</label>
              <input type="text" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{messages.auth.phone}</label>
            <input type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{messages.common.language}</label>
            <select value={profile.language} onChange={(e) => setProfile({ ...profile, language: e.target.value })} className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="th">ไทย</option>
              <option value="en">English</option>
              <option value="zh">中文</option>
              <option value="my">မြန်မာ</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {messages.common.save}
          </button>
        </form>
      </div>
    </div>
  );
}
