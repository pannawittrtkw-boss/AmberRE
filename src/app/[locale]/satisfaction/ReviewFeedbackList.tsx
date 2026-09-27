"use client";

import { useState } from "react";
import { Star, ChevronDown } from "lucide-react";
import { getIntlLocale } from "@/lib/utils";

interface SurveyEntry {
  id: number;
  rating: number;
  feedback: string | null;
  name: string | null;
  respondentType: string | null;
  createdAt: string;
  user: { firstName: string; lastName: string; profileImage: string | null } | null;
}

interface Props {
  surveys: SurveyEntry[];
  locale: string;
  ts: any;
}

const RESPONDENT_TYPE_STYLES: Record<string, string> = {
  OWNER: "bg-blue-50 text-blue-700 border-blue-200",
  TENANT_BUYER: "bg-emerald-50 text-emerald-700 border-emerald-200",
  AGENT: "bg-purple-50 text-purple-700 border-purple-200",
};

const PAGE_SIZE = 6;

export default function ReviewFeedbackList({ surveys, locale, ts }: Props) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const respondentTypeLabels: Record<string, string> = {
    TENANT_BUYER: ts.respondentTypeTenantBuyer,
    OWNER: ts.respondentTypeOwner,
    AGENT: ts.respondentTypeAgent,
  };

  if (surveys.length === 0) {
    return <div className="text-center py-16 text-gray-500">{ts.noFeedbackYet}</div>;
  }

  const visible = surveys.slice(0, visibleCount);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visible.map((survey) => {
          const displayName =
            survey.name || (survey.user ? `${survey.user.firstName} ${survey.user.lastName}` : ts.anonymousLabel);
          const initial = displayName.trim().charAt(0).toUpperCase() || "?";
          const badgeCls = survey.respondentType ? RESPONDENT_TYPE_STYLES[survey.respondentType] : null;
          return (
            <div key={survey.id} className="bg-white rounded-xl shadow-sm border p-5 flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  {survey.user?.profileImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={survey.user.profileImage}
                      alt={displayName}
                      className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-yellow-100 border border-yellow-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-yellow-700">{initial}</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium truncate">{displayName}</span>
                      {badgeCls && survey.respondentType && respondentTypeLabels[survey.respondentType] && (
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border shrink-0 ${badgeCls}`}>
                          {respondentTypeLabels[survey.respondentType]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-0.5 shrink-0">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-3.5 h-3.5 ${s <= survey.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 text-sm flex-1">{survey.feedback}</p>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(survey.createdAt).toLocaleDateString(getIntlLocale(locale))}
              </p>
            </div>
          );
        })}
      </div>

      {visibleCount < surveys.length && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-medium border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            {ts.showMore || (locale === "th" ? "แสดงเพิ่มเติม" : "Show more")}
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
