import prisma from "@/lib/prisma";
import { getIntlLocale } from "@/lib/utils";
import { Star } from "lucide-react";

async function getMessages(locale: string) {
  return (await import(`@/messages/${locale}.json`)).default;
}

export default async function SurveyResultsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const messages = await getMessages(locale);

  const reviews = await prisma.review.findMany({
    where: { isApproved: true },
    include: {
      user: { select: { firstName: true, lastName: true } },
      property: { select: { titleTh: true, titleEn: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">{locale === "th" ? "ผลรีวิวจากลูกค้า" : "Customer Reviews"}</h1>

      {/* Summary */}
      <div className="bg-white rounded-xl shadow-sm border p-8 mb-8 text-center">
        <div className="text-5xl font-bold text-yellow-500 mb-2">{avgRating.toFixed(1)}</div>
        <div className="flex justify-center gap-1 mb-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className={`w-6 h-6 ${s <= Math.round(avgRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
          ))}
        </div>
        <p className="text-gray-500">{reviews.length} {locale === "th" ? "รีวิว" : "reviews"}</p>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-16 text-gray-500">{messages.common.noResults}</div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{review.user.firstName} {review.user.lastName}</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-4 h-4 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                  ))}
                </div>
              </div>
              {review.comment && <p className="text-gray-600 text-sm">{review.comment}</p>}
              <p className="text-xs text-gray-400 mt-2">
                {new Date(review.createdAt).toLocaleDateString(getIntlLocale(locale))}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
