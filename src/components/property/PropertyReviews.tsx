"use client";

import { useState, useEffect } from "react";
import { Star, Loader2, MessageSquare } from "lucide-react";

interface ReviewEntry {
  id: number;
  rating: number;
  comment: string | null;
  name: string | null;
  createdAt: string;
  user: { firstName: string; lastName: string } | null;
}

interface Props {
  propertyId: number;
  locale: string;
  initialReviews: ReviewEntry[];
}

export default function PropertyReviews({ propertyId, locale, initialReviews }: Props) {
  const [messages, setMessages] = useState<any>(null);
  const [reviews] = useState<ReviewEntry[]>(initialReviews);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    import(`@/messages/${locale}.json`).then((m) => setMessages(m.default));
  }, [locale]);

  const T = messages?.property ?? {
    reviews: "Reviews",
    writeReview: "Write a Review",
    reviewSubmitted: "Review submitted, pending approval",
    noReviewsYet: "No reviews yet for this property",
    commentPlaceholder: "Share your thoughts about this property (optional)",
    reviewerNameLabel: "Your name (optional)",
    reviewerNamePlaceholder: "Enter your name...",
    reviewAnonymousToggle: "Submit anonymously",
    reviewAnonymousLabel: "Anonymous",
  };
  const commonT = messages?.common ?? { submit: "Submit", sending: "Sending..." };

  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          rating,
          comment: comment.trim() || undefined,
          name: anonymous ? undefined : name,
          anonymous,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Failed");
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
      setRating(0);
      setName("");
      setAnonymous(false);
      setComment("");
      setSubmitting(false);
    } catch {
      setError("Failed");
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3">
        <MessageSquare className="w-5 h-5 text-[#C8A951]" />
        <h2 className="text-xl font-bold text-stone-900">{T.reviews}</h2>
        {reviews.length > 0 && (
          <span className="flex items-center gap-1.5 text-sm text-stone-500">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            {avgRating.toFixed(1)} · {reviews.length}
          </span>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-stone-400">{T.noReviewsYet}</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-stone-800 text-sm">
                  {r.name || (r.user ? `${r.user.firstName} ${r.user.lastName}` : T.reviewAnonymousLabel)}
                </span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${s <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-stone-200"}`}
                    />
                  ))}
                </div>
              </div>
              {r.comment && <p className="text-sm text-stone-600">{r.comment}</p>}
              <p className="text-xs text-stone-400 mt-2">
                {new Date(r.createdAt).toLocaleDateString(locale === "th" ? "th-TH" : "en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm p-5">
        {submitted ? (
          <p className="text-sm text-green-600 font-medium">{T.reviewSubmitted}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-sm font-medium text-stone-700">{T.writeReview}</p>
            <div className="flex gap-1">
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
                    className={`w-6 h-6 ${
                      s <= (hoverRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-stone-200"
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={T.reviewerNamePlaceholder}
                disabled={anonymous}
                className="flex-1 rounded-xl border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A951]/40 disabled:bg-stone-50 disabled:text-stone-400"
              />
              <label className="flex items-center gap-1.5 text-xs text-stone-500 shrink-0">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  className="rounded border-stone-300"
                />
                {T.reviewAnonymousToggle}
              </label>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={T.commentPlaceholder}
              rows={3}
              className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A951]/40"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={rating < 1 || submitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full bg-[#C8A951] hover:bg-[#B8993F] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {submitting ? commonT.sending : commonT.submit}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
