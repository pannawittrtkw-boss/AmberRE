import prisma from "@/lib/prisma";
import { Star } from "lucide-react";
import SatisfactionForm from "./SatisfactionForm";
import ReviewFeedbackList from "./ReviewFeedbackList";

async function getMessages(locale: string) {
  return (await import(`@/messages/${locale}.json`)).default;
}

export default async function SatisfactionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const messages = await getMessages(locale);
  const ts = messages.satisfaction;

  const surveys = await prisma.survey.findMany({
    where: { isApproved: true },
    include: {
      user: { select: { firstName: true, lastName: true, profileImage: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const avgRating = surveys.length > 0 ? surveys.reduce((sum, s) => sum + s.rating, 0) / surveys.length : 0;

  const feedbackEntries = surveys
    .filter((s) => s.feedback)
    .map((s) => ({ ...s, createdAt: s.createdAt.toISOString() }));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-1">{ts.pageTitle}</h1>
      <p className="text-gray-500 mb-8">{ts.pageSubtitle}</p>

      <SatisfactionForm locale={locale} ts={ts} />

      {/* Summary */}
      <div className="bg-white rounded-xl shadow-sm border p-8 mb-8 text-center">
        <div className="text-5xl font-bold text-yellow-500 mb-2">{avgRating.toFixed(1)}</div>
        <div className="flex justify-center gap-1 mb-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className={`w-6 h-6 ${s <= Math.round(avgRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
          ))}
        </div>
        <p className="text-gray-500">{ts.avgRatingLabel} · {surveys.length} {ts.submissionsLabel}</p>
      </div>

      {/* Feedback list */}
      <ReviewFeedbackList surveys={feedbackEntries} locale={locale} ts={ts} />
    </div>
  );
}
