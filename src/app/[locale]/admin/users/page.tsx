"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Plus, Pencil, Trash2, KeyRound, X, Copy, Check } from "lucide-react";
import { getIntlLocale } from "@/lib/utils";

type User = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
};

const ROLES = ["BUYER", "OWNER", "AGENT", "CO_AGENT", "ADMIN"];

export default function AdminUsersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { data: session } = useSession();
  const [locale, setLocale] = useState("th");
  const [messages, setMessages] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    params.then(({ locale: l }) => {
      setLocale(l);
      import(`@/messages/${l}.json`).then((m) => setMessages(m.default));
    });
  }, [params]);

  const refresh = async () => {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    if (data.success) setUsers(data.data);
  };

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const updateRole = async (userId: number, role: string) => {
    await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    await refresh();
  };

  const handleDelete = async (user: User) => {
    if (!confirm(locale === "th" ? `ลบผู้ใช้ ${user.email}?` : `Delete user ${user.email}?`)) return;
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!data.success) {
      alert(data.error || (locale === "th" ? "ลบไม่สำเร็จ" : "Delete failed"));
      return;
    }
    await refresh();
  };

  const requestResetLink = async (user: User) => {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email }),
    });
    const data = await res.json();
    if (data.success && data.data?.resetUrl) {
      setResetUser(user);
      setResetLink(data.data.resetUrl);
      setCopied(false);
    } else {
      alert(locale === "th" ? "สร้างลิงก์ไม่สำเร็จ" : "Failed to generate link");
    }
  };

  const copyResetLink = async () => {
    if (!resetLink) return;
    await navigator.clipboard.writeText(resetLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!messages || loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );

  const myId = Number((session?.user as any)?.id);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{messages.admin.userManagement}</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-[#C8A951] text-white px-4 py-2 rounded-lg hover:bg-[#B8993F]"
        >
          <Plus className="w-4 h-4" />
          {locale === "th" ? "เพิ่มผู้ใช้" : "Add User"}
        </button>
      </div>

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
                <th className="text-left py-3 px-4">{locale === "th" ? "สถานะ" : "Status"}</th>
                <th className="text-left py-3 px-4">{locale === "th" ? "วันที่สมัคร" : "Joined"}</th>
                <th className="text-right py-3 px-4">{locale === "th" ? "จัดการ" : "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
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
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded ${u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {u.isActive ? (locale === "th" ? "เปิดใช้" : "Active") : (locale === "th" ? "ปิด" : "Disabled")}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString(getIntlLocale(locale))}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => requestResetLink(u)}
                        title={locale === "th" ? "ลิงก์รีเซ็ตรหัสผ่าน" : "Generate reset link"}
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingUser(u)}
                        title={locale === "th" ? "แก้ไข" : "Edit"}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        disabled={u.id === myId}
                        title={u.id === myId ? (locale === "th" ? "ลบบัญชีตัวเองไม่ได้" : "Cannot delete own account") : (locale === "th" ? "ลบ" : "Delete")}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <UserFormModal
          locale={locale}
          mode="add"
          onClose={() => setShowAdd(false)}
          onSaved={async () => { setShowAdd(false); await refresh(); }}
        />
      )}

      {editingUser && (
        <UserFormModal
          locale={locale}
          mode="edit"
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={async () => { setEditingUser(null); await refresh(); }}
        />
      )}

      {resetLink && resetUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{locale === "th" ? "ลิงก์รีเซ็ตรหัสผ่าน" : "Password Reset Link"}</h2>
              <button onClick={() => { setResetLink(null); setResetUser(null); }} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {locale === "th"
                ? `ลิงก์สำหรับ ${resetUser.email} (หมดอายุใน 1 ชั่วโมง) — ส่งให้ผู้ใช้`
                : `Link for ${resetUser.email} (expires in 1 hour) — share with user`}
            </p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={resetLink}
                className="flex-1 border rounded px-3 py-2 text-xs bg-gray-50 font-mono"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={copyResetLink}
                className="flex items-center gap-1 px-3 py-2 bg-[#C8A951] text-white rounded hover:bg-[#B8993F] text-sm"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? (locale === "th" ? "คัดลอกแล้ว" : "Copied") : (locale === "th" ? "คัดลอก" : "Copy")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserFormModal({
  locale, mode, user, onClose, onSaved,
}: {
  locale: string;
  mode: "add" | "edit";
  user?: User;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [email, setEmail] = useState(user?.email || "");
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [role, setRole] = useState(user?.role || "BUYER");
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const url = mode === "add" ? "/api/admin/users" : `/api/admin/users/${user!.id}`;
    const method = mode === "add" ? "POST" : "PUT";

    const body: any = { email, firstName, lastName, phone, role, isActive };
    if (mode === "add" || password) body.password = password;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);

    if (!data.success) {
      setError(data.error || (locale === "th" ? "เกิดข้อผิดพลาด" : "Error"));
      return;
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold">
            {mode === "add"
              ? (locale === "th" ? "เพิ่มผู้ใช้ใหม่" : "Add New User")
              : (locale === "th" ? "แก้ไขผู้ใช้" : "Edit User")}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-3">
          {error && (
            <div className="bg-red-50 text-red-700 px-3 py-2 rounded text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                {locale === "th" ? "ชื่อ *" : "First Name *"}
              </label>
              <input
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {locale === "th" ? "นามสกุล *" : "Last Name *"}
              </label>
              <input
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {locale === "th" ? "เบอร์โทร" : "Phone"}
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {mode === "edit" && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              {locale === "th" ? "เปิดใช้งาน" : "Active"}
            </label>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              {mode === "add"
                ? (locale === "th" ? "รหัสผ่าน *" : "Password *")
                : (locale === "th" ? "รหัสผ่านใหม่ (ไม่กรอก = ไม่เปลี่ยน)" : "New Password (leave blank to keep)")}
            </label>
            <input
              type="password"
              required={mode === "add"}
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder={locale === "th" ? "อย่างน้อย 6 ตัวอักษร" : "Min 6 characters"}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
            >
              {locale === "th" ? "ยกเลิก" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-[#C8A951] text-white rounded-lg text-sm hover:bg-[#B8993F] disabled:opacity-50"
            >
              {saving ? (locale === "th" ? "กำลังบันทึก..." : "Saving...") : (locale === "th" ? "บันทึก" : "Save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
