"use client";

import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";

interface PropertyInquiryFormProps {
  propertyId: number;
  propertyName: string;
  locale: string;
}

export default function PropertyInquiryForm({
  propertyId,
  propertyName,
  locale,
}: PropertyInquiryFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(
    locale === "th" ? "สนใจห้องนี้..." : "I'm interested in this property..."
  );
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          subject: `${propertyName} (#${propertyId})`,
          message: `${message}\n\n— ${
            locale === "th" ? "อ้างอิงทรัพย์" : "Property"
          }: ${propertyName} (ID: ${propertyId})`,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(
          data.error ||
            (locale === "th" ? "ส่งไม่สำเร็จ ลองใหม่" : "Failed to send")
        );
        setSubmitting(false);
        return;
      }
      setSuccess(true);
      setSubmitting(false);
      // Clear form
      setName("");
      setPhone("");
      setEmail("");
    } catch {
      setError(locale === "th" ? "ส่งไม่สำเร็จ ลองใหม่" : "Failed to send");
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="pt-5 border-t border-stone-100">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="font-semibold text-green-800 text-sm">
            {locale === "th" ? "ส่งสำเร็จ!" : "Message sent!"}
          </p>
          <p className="text-xs text-green-700 mt-1">
            {locale === "th"
              ? "เจ้าหน้าที่จะติดต่อกลับโดยเร็ว"
              : "Our agent will contact you shortly"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 pt-5 border-t border-stone-100"
    >
      <p className="text-xs uppercase tracking-widest text-stone-400">
        {locale === "th" ? "ส่งข้อมูลติดต่อ" : "Inquiry Form"}
      </p>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-xs">
          {error}
        </div>
      )}

      <input
        type="text"
        name="name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={locale === "th" ? "ชื่อของคุณ" : "Your Name"}
        className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#C8A951]/30 focus:border-[#C8A951]"
      />
      <input
        type="tel"
        name="phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder={locale === "th" ? "เบอร์โทร" : "Phone"}
        className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#C8A951]/30 focus:border-[#C8A951]"
      />
      <input
        type="email"
        name="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#C8A951]/30 focus:border-[#C8A951]"
      />
      <textarea
        name="message"
        rows={3}
        required
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#C8A951]/30 focus:border-[#C8A951] resize-none"
      />
      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-2 py-3 bg-[#C8A951] hover:bg-[#B8993F] text-white rounded-full font-semibold text-sm transition-colors disabled:opacity-60"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {submitting
          ? locale === "th" ? "กำลังส่ง..." : "Sending..."
          : locale === "th" ? "ส่งข้อความ" : "Send Inquiry"}
      </button>
    </form>
  );
}
