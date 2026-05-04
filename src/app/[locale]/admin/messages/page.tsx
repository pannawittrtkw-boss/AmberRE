"use client";

import { useState, useEffect } from "react";
import { Loader2, Mail, MailOpen, Trash2, Phone, Clock, X } from "lucide-react";
import { getIntlLocale } from "@/lib/utils";

type Message = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export default function AdminMessagesPage({ params }: { params: Promise<{ locale: string }> }) {
  const [locale, setLocale] = useState("th");
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Message | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    params.then(({ locale: l }) => setLocale(l));
  }, [params]);

  const refresh = async () => {
    const res = await fetch("/api/admin/messages");
    const data = await res.json();
    if (data.success) {
      setMessages(data.data.messages);
      setUnreadCount(data.data.unreadCount);
    }
  };

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const openMessage = async (msg: Message) => {
    setSelected(msg);
    if (!msg.isRead) {
      await fetch(`/api/admin/messages/${msg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
      await refresh();
    }
  };

  const toggleRead = async (msg: Message) => {
    await fetch(`/api/admin/messages/${msg.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: !msg.isRead }),
    });
    await refresh();
  };

  const deleteMessage = async (msg: Message) => {
    if (!confirm(locale === "th" ? `ลบข้อความจาก ${msg.name}?` : `Delete message from ${msg.name}?`)) return;
    await fetch(`/api/admin/messages/${msg.id}`, { method: "DELETE" });
    if (selected?.id === msg.id) setSelected(null);
    await refresh();
  };

  const filtered = filter === "unread" ? messages.filter((m) => !m.isRead) : messages;

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="w-6 h-6" />
            {locale === "th" ? "ข้อความติดต่อ" : "Contact Messages"}
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-medium">
                {unreadCount} {locale === "th" ? "ยังไม่อ่าน" : "unread"}
              </span>
            )}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {locale === "th"
              ? "ข้อความที่ลูกค้าส่งจากหน้า Contact"
              : "Messages submitted via the Contact page"}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-sm ${filter === "all" ? "bg-blue-600 text-white" : "bg-white border"}`}
          >
            {locale === "th" ? "ทั้งหมด" : "All"} ({messages.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-3 py-1.5 rounded-lg text-sm ${filter === "unread" ? "bg-blue-600 text-white" : "bg-white border"}`}
          >
            {locale === "th" ? "ยังไม่อ่าน" : "Unread"} ({unreadCount})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* List */}
        <div className="lg:col-span-1 space-y-2 max-h-[70vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="bg-white border rounded-xl p-6 text-center text-gray-400 text-sm">
              {locale === "th" ? "ยังไม่มีข้อความ" : "No messages yet"}
            </div>
          ) : (
            filtered.map((m) => (
              <button
                key={m.id}
                onClick={() => openMessage(m)}
                className={`w-full text-left bg-white border rounded-xl p-4 hover:border-[#C8A951] transition-colors ${
                  selected?.id === m.id ? "border-[#C8A951] ring-2 ring-[#C8A951]/20" : ""
                } ${!m.isRead ? "bg-amber-50" : ""}`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    {!m.isRead && <span className="w-2 h-2 bg-red-500 rounded-full shrink-0" />}
                    <span className={`font-medium truncate ${!m.isRead ? "font-bold" : ""}`}>
                      {m.name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    {new Date(m.createdAt).toLocaleDateString(getIntlLocale(locale))}
                  </span>
                </div>
                <div className="text-xs text-gray-500 truncate">{m.email}</div>
                {m.subject && (
                  <div className="text-sm font-medium text-gray-700 mt-1 truncate">{m.subject}</div>
                )}
                <div className="text-xs text-gray-500 mt-1 line-clamp-2">{m.message}</div>
              </button>
            ))
          )}
        </div>

        {/* Detail */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="bg-white border rounded-xl p-6 sticky top-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">{selected.subject || (locale === "th" ? "(ไม่มีหัวข้อ)" : "(No subject)")}</h2>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                    <Clock className="w-3 h-3" />
                    {new Date(selected.createdAt).toLocaleString(getIntlLocale(locale))}
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="lg:hidden p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="border-t border-b py-3 mb-4 space-y-1.5 text-sm">
                <div>
                  <span className="text-gray-500 mr-2">{locale === "th" ? "ชื่อ:" : "From:"}</span>
                  <span className="font-medium">{selected.name}</span>
                </div>
                <div>
                  <span className="text-gray-500 mr-2">Email:</span>
                  <a href={`mailto:${selected.email}`} className="text-[#C8A951] hover:underline">
                    {selected.email}
                  </a>
                </div>
                {selected.phone && (
                  <div>
                    <span className="text-gray-500 mr-2">{locale === "th" ? "เบอร์โทร:" : "Phone:"}</span>
                    <a href={`tel:${selected.phone.replace(/[^0-9+]/g, "")}`} className="text-[#C8A951] hover:underline">
                      {selected.phone}
                    </a>
                  </div>
                )}
              </div>

              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mb-6">
                {selected.message}
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <a
                  href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject || "Your message")}`}
                  className="flex items-center gap-2 px-4 py-2 bg-[#C8A951] hover:bg-[#B8993F] text-white rounded-lg text-sm"
                >
                  <Mail className="w-4 h-4" />
                  {locale === "th" ? "ตอบกลับ" : "Reply"}
                </a>
                {selected.phone && (
                  <a
                    href={`tel:${selected.phone.replace(/[^0-9+]/g, "")}`}
                    className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
                  >
                    <Phone className="w-4 h-4" />
                    {locale === "th" ? "โทร" : "Call"}
                  </a>
                )}
                <button
                  onClick={() => toggleRead(selected)}
                  className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
                >
                  {selected.isRead ? <Mail className="w-4 h-4" /> : <MailOpen className="w-4 h-4" />}
                  {selected.isRead
                    ? (locale === "th" ? "ทำเป็นยังไม่อ่าน" : "Mark unread")
                    : (locale === "th" ? "ทำเป็นอ่านแล้ว" : "Mark read")}
                </button>
                <button
                  onClick={() => deleteMessage(selected)}
                  className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 ml-auto"
                >
                  <Trash2 className="w-4 h-4" />
                  {locale === "th" ? "ลบ" : "Delete"}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-dashed rounded-xl p-12 text-center text-gray-400">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
              {locale === "th" ? "เลือกข้อความเพื่อดูรายละเอียด" : "Select a message to view details"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
