"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Star, Loader2 } from "lucide-react";

export default function AdminReviewsPage({ params }: { params: Promise<{ locale: string }> }) {
  const [locale, setLocale] = useState("th");
  const [messages, setMessages] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(({ locale: l }) => {
      setLocale(l);
      import(`@/messages/${l}.json`).then((m) => setMessages(m.default));
    });
  }, [params]);

  const fetchReviews = async () => {
    try {
      const res = await fetch("/api/admin/reviews");
      const data = await res.json();
      if (data.success) setReviews(data.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, []);

  const toggleApproval = async (id: number, current: boolean) => {
    await fetch("/api/admin/reviews", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isApproved: !current }),
    });
    fetchReviews();
  };

  const deleteReview = async (id: number) => {
    if (!confirm(locale === "th" ? "ยืนยันการลบ?" : "Confirm delete?")) return;
    await fetch(`/api/admin/reviews?id=${id}`, { method: "DELETE" });
    fetchReviews();
  };

  if (!messages || loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{messages.admin.reviewModeration}</h1>

      <div className="space-y-4">
        {reviews.map((review: any) => (
          <div key={review.id} className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{review.user.firstName} {review.user.lastName}</span>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => <Star key={s} className={`w-4 h-4 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />)}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs ${review.isApproved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {review.isApproved ? "Approved" : "Pending"}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-1">{locale === "th" ? "ทรัพย์สิน" : "Property"}: {review.property.titleTh}</p>
                {review.comment && <p className="text-gray-700 text-sm">{review.comment}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleApproval(review.id, review.isApproved)} className={`p-1 ${review.isApproved ? "text-yellow-500" : "text-green-500"}`}>
                  <CheckCircle className="w-5 h-5" />
                </button>
                <button onClick={() => deleteReview(review.id)} className="p-1 text-red-500"><XCircle className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
