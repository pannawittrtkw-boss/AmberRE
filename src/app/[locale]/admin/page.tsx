"use client";

import { useState, useEffect } from "react";
import { Building2, Users, Eye, Clock, Loader2, FileSignature } from "lucide-react";
import Link from "next/link";

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
    { icon: Building2, label: t.totalProperties, value: stats?.totalProperties || 0, color: "bg-blue-500", href: `/${locale}/admin/properties` },
    { icon: FileSignature, label: t.activeContracts, value: stats?.activeContractsCount || 0, color: "bg-emerald-600", href: `/${locale}/admin/contracts` },
    { icon: Users, label: t.totalUsers, value: stats?.totalUsers || 0, color: "bg-green-500", href: `/${locale}/admin/users` },
    { icon: Clock, label: t.pendingApprovals, value: stats?.pendingApprovals || 0, color: "bg-yellow-500", href: `/${locale}/admin/co-agents` },
    { icon: Eye, label: t.totalViews, value: stats?.totalViews || 0, color: "bg-purple-500", href: null },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t.dashboard}</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {statCards.map((card, i) => {
          const inner = (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500 leading-tight">{card.label}</p>
                <div className={`${card.color} p-1.5 rounded-lg opacity-80`}>
                  <card.icon className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 tracking-tight">{card.value.toLocaleString()}</p>
            </div>
          );
          return card.href ? (
            <Link key={i} href={card.href} className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md hover:border-gray-300 transition-all">
              {inner}
            </Link>
          ) : (
            <div key={i} className="bg-white rounded-xl shadow-sm border p-4">
              {inner}
            </div>
          );
        })}
      </div>

      {/* Recent Properties */}
      {stats?.recentProperties && stats.recentProperties.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">{t.recentProperties}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">ID</th>
                  <th className="text-left py-3 px-2">{messages.property.propertyTypeLabel}</th>
                  <th className="text-left py-3 px-2">{messages.property.listingTypeLabel}</th>
                  <th className="text-left py-3 px-2">{messages.property.price}</th>
                  <th className="text-left py-3 px-2">{t.status}</th>
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
                        {p.isSold ? messages.property.sold : messages.property.available}
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
