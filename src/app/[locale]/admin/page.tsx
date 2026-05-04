"use client";

import { useState, useEffect } from "react";
import { Building2, Users, Eye, Clock, Loader2 } from "lucide-react";

export default function AdminDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const [locale, setLocale] = useState("th");
  const [messages, setMessages] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(({ locale: l }) => {
      setLocale(l);
      import(`@/messages/${l}.json`).then((m) => setMessages(m.default));
    });
  }, [params]);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => { if (d.success) setStats(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!messages || loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  const t = messages.admin;

  const statCards = [
    { icon: Building2, label: t.totalProperties, value: stats?.totalProperties || 0, color: "bg-blue-500" },
    { icon: Users, label: t.totalUsers, value: stats?.totalUsers || 0, color: "bg-green-500" },
    { icon: Eye, label: t.totalViews, value: stats?.totalViews || 0, color: "bg-purple-500" },
    { icon: Clock, label: t.pendingApprovals, value: stats?.pendingApprovals || 0, color: "bg-yellow-500" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t.dashboard}</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center gap-4">
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold">{card.value.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Properties */}
      {stats?.recentProperties && stats.recentProperties.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">{locale === "th" ? "ทรัพย์สินล่าสุด" : "Recent Properties"}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">ID</th>
                  <th className="text-left py-3 px-2">{locale === "th" ? "ชื่อ" : "Title"}</th>
                  <th className="text-left py-3 px-2">{locale === "th" ? "ประเภท" : "Type"}</th>
                  <th className="text-left py-3 px-2">{locale === "th" ? "ราคา" : "Price"}</th>
                  <th className="text-left py-3 px-2">{locale === "th" ? "สถานะ" : "Status"}</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentProperties.map((p: any) => (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2">{p.id}</td>
                    <td className="py-3 px-2">{p.titleTh}</td>
                    <td className="py-3 px-2">{p.propertyType} / {p.listingType}</td>
                    <td className="py-3 px-2">฿{Number(p.price).toLocaleString()}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded text-xs ${p.isSold ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                        {p.isSold ? (locale === "th" ? "ขายแล้ว" : "Sold") : (locale === "th" ? "ว่าง" : "Available")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
