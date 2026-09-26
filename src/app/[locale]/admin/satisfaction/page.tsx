"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Star, Loader2, User } from "lucide-react";

type SurveyEntry = {
  id: number;
  rating: number;
  feedback: string | null;
  name: string | null;
  isApproved: boolean;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string } | null;
};

export default function AdminSatisfactionPage({ params }: { params: Promise<{ locale: string }> }) {
  const [locale, setLocale] = useState("th");
  const [surveys, setSurveys] = useState<SurveyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(({ locale: l }) => setLocale(l));
  }, [params]);

  // Reusable for post-mutation refreshes (approve/delete) — not referenced
  // from any effect, so it isn't subject to effect-cleanup/race concerns.
  const refreshSurveys = async () => {
    const res = await fetch("/api/admin/satisfaction");
    const data = await res.json();
    if (data.success) setSurveys(data.data);
  };

  useEffect(() => {
    let ignore = false;
    fetch("/api/admin/satisfaction")
      .then((res) => res.json())
      .then((data) => {
        if (ignore) return;
        if (data.success) setSurveys(data.data);
        setLoading(false);
      })
      .catch(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, []);

  const isTh = locale === "th";

  const toggleApproval = async (id: number, current: boolean) => {
    await fetch("/api/admin/satisfaction", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isApproved: !current }),
    });
    refreshSurveys();
  };

  const deleteSurvey = async (id: number) => {
    if (!confirm(isTh ? "ยืนยันการลบ?" : "Confirm delete?")) return;
    await fetch(`/api/admin/satisfaction?id=${id}`, { method: "DELETE" });
    refreshSurveys();
  };

  const avgRating = surveys.length > 0 ? surveys.reduce((sum, s) => sum + s.rating, 0) / surveys.length : 0;
  const approvedCount = surveys.filter((s) => s.isApproved).length;

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">{isTh ? "แบบประเมินความพึงพอใจ" : "Satisfaction Survey"}</h1>
      <p className="text-sm text-gray-500 mb-6">
        {isTh ? "ดูและอนุมัติความคิดเห็นของลูกค้าก่อนแสดงต่อสาธารณะ" : "Review and approve customer feedback before it appears publicly"}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">{isTh ? "คะแนนเฉลี่ย" : "Average Rating"}</p>
          <p className="text-2xl font-bold text-yellow-500">{avgRating.toFixed(1)}</p>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">{isTh ? "ทั้งหมด" : "Total"}</p>
          <p className="text-2xl font-bold text-gray-800">{surveys.length}</p>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">{isTh ? "อนุมัติแล้ว" : "Approved"}</p>
          <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
        </div>
      </div>

      {surveys.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border">
          {isTh ? "ยังไม่มีข้อมูลการประเมิน" : "No survey submissions yet"}
        </div>
      ) : (
        <div className="space-y-4">
          {surveys.map((survey) => (
            <div key={survey.id} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">
                      {survey.name || (survey.user ? `${survey.user.firstName} ${survey.user.lastName}` : (isTh ? "ไม่ระบุชื่อ" : "Anonymous"))}
                    </span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-4 h-4 ${s <= survey.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                      ))}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${survey.isApproved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {survey.isApproved ? (isTh ? "อนุมัติแล้ว" : "Approved") : (isTh ? "รอตรวจสอบ" : "Pending")}
                    </span>
                  </div>
                  {survey.feedback && <p className="text-gray-700 text-sm mt-1">{survey.feedback}</p>}
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(survey.createdAt).toLocaleDateString(isTh ? "th-TH" : "en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleApproval(survey.id, survey.isApproved)}
                    title={survey.isApproved ? (isTh ? "ยกเลิกอนุมัติ" : "Unapprove") : (isTh ? "อนุมัติ" : "Approve")}
                    className={`p-1 ${survey.isApproved ? "text-yellow-500" : "text-green-500"}`}
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                  <button onClick={() => deleteSurvey(survey.id)} title={isTh ? "ลบ" : "Delete"} className="p-1 text-red-500">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
