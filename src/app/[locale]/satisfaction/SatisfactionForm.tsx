"use client";

import { useState } from "react";
import { Star, Loader2 } from "lucide-react";

export default function SatisfactionForm({ ts }: { locale: string; ts: any }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  if (submitted) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-8 mb-8 text-center">
        <p className="font-semibold text-gray-800 mb-1">{ts.thankYou}</p>
        <p className="text-gray-500 text-sm mb-4">{ts.thankYouNote}</p>
        <button
          onClick={() => { setSubmitted(false); setRating(0); setFeedback(""); setName(""); setAnonymous(false); }}
          className="text-sm text-[#C8A951] hover:underline"
        >
          {ts.submitAnother}
        </button>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (rating < 1) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/satisfaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          feedback: feedback.trim() || undefined,
          name: anonymous ? undefined : name.trim() || undefined,
          anonymous,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setError(ts.errorGeneric);
      }
    } catch {
      setError(ts.errorGeneric);
    }
    setSubmitting(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-8 mb-8">
      <p className="font-medium text-gray-800 mb-2 text-center">{ts.yourRating}</p>
      <div className="flex justify-center gap-1 mb-6">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setRating(s)}
            onMouseEnter={() => setHoverRating(s)}
            onMouseLeave={() => setHoverRating(0)}
            className="p-0.5"
          >
            <Star
              className={`w-9 h-9 transition-colors ${
                s <= (hoverRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>

      <label className="block text-sm font-medium text-gray-700 mb-1">{ts.nameLabel}</label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={anonymous}
        placeholder={ts.namePlaceholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A951] disabled:bg-gray-100 disabled:text-gray-400 mb-2"
      />
      <label className="flex items-center gap-2 mb-4 cursor-pointer select-none text-sm text-gray-600">
        <input
          type="checkbox"
          checked={anonymous}
          onChange={(e) => setAnonymous(e.target.checked)}
          className="accent-[#C8A951]"
        />
        {ts.anonymousToggle}
      </label>

      <label className="block text-sm font-medium text-gray-700 mb-1">{ts.feedbackLabel}</label>
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder={ts.feedbackPlaceholder}
        rows={4}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A951]"
      />

      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={rating < 1 || submitting}
        className="mt-4 w-full bg-[#C8A951] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#B8993F] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {submitting ? ts.submitting : ts.submit}
      </button>
    </div>
  );
}
