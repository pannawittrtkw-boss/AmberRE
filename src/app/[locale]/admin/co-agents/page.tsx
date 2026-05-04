"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function AdminCoAgentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const [locale, setLocale] = useState("th");
  const [messages, setMessages] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(({ locale: l }) => {
      setLocale(l);
      import(`@/messages/${l}.json`).then((m) => setMessages(m.default));
    });
  }, [params]);

  const fetchApplications = async () => {
    try {
      const res = await fetch("/api/admin/co-agents");
      const data = await res.json();
      if (data.success) setApplications(data.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchApplications(); }, []);

  const updateStatus = async (id: number, status: string) => {
    await fetch("/api/admin/co-agents", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    fetchApplications();
  };

  if (!messages || loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{messages.admin.coAgentApproval}</h1>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4">ID</th>
                <th className="text-left py-3 px-4">{locale === "th" ? "ชื่อ" : "Name"}</th>
                <th className="text-left py-3 px-4">{locale === "th" ? "บริษัท" : "Company"}</th>
                <th className="text-left py-3 px-4">{locale === "th" ? "ใบอนุญาต" : "License"}</th>
                <th className="text-left py-3 px-4">{locale === "th" ? "ประสบการณ์" : "Experience"}</th>
                <th className="text-left py-3 px-4">{locale === "th" ? "สถานะ" : "Status"}</th>
                <th className="text-center py-3 px-4">{locale === "th" ? "จัดการ" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app: any) => (
                <tr key={app.id} className="border-t hover:bg-gray-50">
                  <td className="py-3 px-4">{app.id}</td>
                  <td className="py-3 px-4">{app.user.firstName} {app.user.lastName}</td>
                  <td className="py-3 px-4">{app.companyName || "-"}</td>
                  <td className="py-3 px-4">{app.licenseNumber || "-"}</td>
                  <td className="py-3 px-4">{app.experienceYears ? `${app.experienceYears} yrs` : "-"}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      app.status === "APPROVED" ? "bg-green-100 text-green-700" :
                      app.status === "REJECTED" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>{app.status}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {app.status === "PENDING" && (
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => updateStatus(app.id, "APPROVED")} className="p-1 text-green-500 hover:text-green-700"><CheckCircle className="w-5 h-5" /></button>
                        <button onClick={() => updateStatus(app.id, "REJECTED")} className="p-1 text-red-500 hover:text-red-700"><XCircle className="w-5 h-5" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
