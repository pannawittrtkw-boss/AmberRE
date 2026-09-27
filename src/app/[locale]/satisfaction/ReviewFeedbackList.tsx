"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
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

const PAGE_SIZE = 4;
const AUTO_ADVANCE_MS = 6000;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ReviewFeedbackList({ surveys, locale, ts }: Props) {
  // Renders in the server-given order on first paint (so SSR and the
  // initial client render match), then shuffles once client-side right
  // after mount — each visit still ends up with a different order.
  const [shuffled, setShuffled] = useState(surveys);
  useEffect(() => {
    setShuffled(shuffle(surveys));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pages = useMemo(() => {
    const chunks: SurveyEntry[][] = [];
    for (let i = 0; i < shuffled.length; i += PAGE_SIZE) {
      chunks.push(shuffled.slice(i, i + PAGE_SIZE));
    }
    return chunks;
  }, [shuffled]);

  const [currentPage, setCurrentPage] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (pages.length <= 1) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setCurrentPage((p) => (p + 1) % pages.length);
    }, AUTO_ADVANCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentPage, pages.length]);

  const respondentTypeLabels: Record<string, string> = {
    TENANT_BUYER: ts.respondentTypeTenantBuyer,
    OWNER: ts.respondentTypeOwner,
    AGENT: ts.respondentTypeAgent,
  };

  if (surveys.length === 0) {
    return <div className="text-center py-16 text-gray-500">{ts.noFeedbackYet}</div>;
  }

  const goTo = (index: number) => {
    setCurrentPage(((index % pages.length) + pages.length) % pages.length);
  };

  return (
    <div>
      <div className="relative">
        {pages.length > 1 && (
          <button
            type="button"
            onClick={() => goTo(currentPage - 1)}
            aria-label={locale === "th" ? "ก่อนหน้า" : "Previous"}
            className="hidden sm:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm items-center justify-center text-gray-500 hover:text-gray-800 hover:shadow-md transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentPage * 100}%)` }}
          >
            {pages.map((page, pageIdx) => (
              <div key={pageIdx} className="w-full shrink-0 grid grid-cols-1 md:grid-cols-2 gap-4 px-0.5">
                {page.map((survey) => {
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
            ))}
          </div>
        </div>

        {pages.length > 1 && (
          <button
            type="button"
            onClick={() => goTo(currentPage + 1)}
            aria-label={locale === "th" ? "ถัดไป" : "Next"}
            className="hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm items-center justify-center text-gray-500 hover:text-gray-800 hover:shadow-md transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {pages.length > 1 && (
        <div className="flex items-center justify-center gap-3 mt-5">
          <button
            type="button"
            onClick={() => goTo(currentPage - 1)}
            aria-label={locale === "th" ? "ก่อนหน้า" : "Previous"}
            className="sm:hidden w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            {pages.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`${locale === "th" ? "หน้า" : "Page"} ${i + 1}`}
                className={`h-2 rounded-full transition-all ${
                  i === currentPage ? "w-6 bg-[#C8A951]" : "w-2 bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => goTo(currentPage + 1)}
            aria-label={locale === "th" ? "ถัดไป" : "Next"}
            className="sm:hidden w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
