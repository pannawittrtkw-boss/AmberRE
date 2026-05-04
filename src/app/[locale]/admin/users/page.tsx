"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { getIntlLocale } from "@/lib/utils";

export default function AdminUsersPage({ params }: { params: Promise<{ locale: string }> }) {
  const [locale, setLocale] = useState("th");
  const [messages, setMessages] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(({ locale: l }) => {
      setLocale(l);
      import(`@/messages/${l}.json`).then((m) => setMessages(m.default));
    });
  }, [params]);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => { if (d.success) setUsers(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateRole = async (userId: number, role: string) => {
    await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    // Refresh
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    if (data.success) setUsers(data.data);
  };

  if (!messages || loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{messages.admin.userManagement}</h1>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4">ID</th>
                <th className="text-left py-3 px-4">{locale === "th" ? "ชื่อ" : "Name"}</th>
                <th className="text-left py-3 px-4">Email</th>
                <th className="text-left py-3 px-4">{locale === "th" ? "เบอร์โทร" : "Phone"}</th>
                <th className="text-left py-3 px-4">Role</th>
                <th className="text-left py-3 px-4">{locale === "th" ? "วันที่สมัคร" : "Joined"}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id} className="border-t hover:bg-gray-50">
                  <td className="py-3 px-4">{u.id}</td>
                  <td className="py-3 px-4">{u.firstName} {u.lastName}</td>
                  <td className="py-3 px-4">{u.email}</td>
                  <td className="py-3 px-4">{u.phone || "-"}</td>
                  <td className="py-3 px-4">
                    <select
                      value={u.role}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                      className="border rounded px-2 py-1 text-xs"
                    >
                      {["BUYER", "OWNER", "AGENT", "CO_AGENT", "ADMIN"].map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString(getIntlLocale(locale))}
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
