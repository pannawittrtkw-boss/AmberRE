import prisma from "@/lib/prisma";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Trophy, CheckCircle, Key, Heart } from "lucide-react";

const CATEGORY_LABELS: Record<string, { th: string; en: string }> = {
  RENT_CONDO: { th: "เช่าคอนโด", en: "Rent Condo" },
  SALE_CONDO: { th: "ขายคอนโด", en: "Sale Condo" },
  RENT_HOUSE: { th: "เช่าบ้าน", en: "Rent House" },
  SALE_HOUSE: { th: "ขายบ้าน", en: "Sale House" },
};

const PER_PAGE = 12;

async function getMessages(locale: string) {
  return (await import(`@/messages/${locale}.json`)).default;
}

export default async function PortfolioPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale } = await params;
  const { page: pageStr } = await searchParams;
  const messages = await getMessages(locale);

  const currentPage = Math.max(1, parseInt(pageStr || "1"));
  const [total, successStories, heroSetting] = await Promise.all([
    prisma.successStory.count(),
    prisma.successStory.findMany({
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.siteSetting.findUnique({ where: { key: "portfolioHeroImage" } }),
  ]);
  const totalPages = Math.ceil(total / PER_PAGE);
  const portfolioHeroImage = heroSetting?.valueTh || null;

  return (
    <div className="bg-stone-50 min-h-screen">
      {/* HERO — Image background with overlay */}
      <section className="relative text-white overflow-hidden">
        <div className="relative h-[72vh] min-h-[540px] max-h-[700px]">
          {/* Background image or fallback gradient */}
          {portfolioHeroImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={portfolioHeroImage}
              alt="Our Portfolio"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-800 to-[#5a4621]" />
          )}

          {/* Dark overlay for text contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/55 to-stone-950/35" />

          {/* Decorative gold blurs */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#C8A951]/15 rounded-full blur-3xl -translate-y-24 translate-x-24" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-[#C8A951]/10 rounded-full blur-3xl translate-y-16 -translate-x-16" />

          {/* Top fade gold line */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C8A951]/60 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#C8A951]/60 to-transparent" />

          {/* Content positioned in upper third */}
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col items-center justify-start text-center pt-16 sm:pt-20 lg:pt-24">
            {/* Tagline */}
            <div className="text-[#E8C97A] text-[11px] uppercase tracking-[0.35em] font-medium mb-3">
              {locale === "th" ? "ผลงานของเรา" : "Our Portfolio"}
            </div>

            {/* Heading */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-[1.2] tracking-tight drop-shadow-lg">
              {locale === "th" ? (
                <>
                  เราไม่ได้แค่หาบ้าน
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E8C97A] via-[#C8A951] to-[#E8C97A]">
                    เราส่งมอบความสุข
                  </span>
                </>
              ) : (
                <>
                  We don&apos;t just find houses.
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E8C97A] via-[#C8A951] to-[#E8C97A]">
                    We deliver happiness.
                  </span>
                </>
              )}
            </h1>

            {/* Stats / subtitle */}
            <p className="mt-4 inline-flex items-center gap-1.5 text-xs sm:text-sm text-[#E8C97A] uppercase tracking-[0.2em] font-semibold">
              <span className="font-bold text-white">
                {total.toLocaleString()}
              </span>
              {locale === "th"
                ? "ผลงานปิดการขาย/เช่าสำเร็จ"
                : "Successful Sales & Rentals Delivered"}
              <Key className="w-3.5 h-3.5 text-[#E8C97A]" />
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
            </p>
          </div>
        </div>
      </section>

      {/* Cards section overlapping hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 -mt-32 relative z-10">
        {successStories.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl">
            <Trophy className="w-12 h-12 mx-auto text-stone-300 mb-3" />
            <p className="text-stone-500">{messages.common.noResults}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {successStories.map((story) => {
              const catLabel =
                CATEGORY_LABELS[story.category] || CATEGORY_LABELS.RENT_CONDO;
              const categoryText = locale === "th" ? catLabel.th : catLabel.en;

              return (
                <div
                  key={story.id}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Image with ribbon */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {story.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={story.imageUrl}
                        alt={story.titleTh}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-300">
                        <Trophy className="w-10 h-10" />
                      </div>
                    )}

                    {/* Success ribbon */}
                    <div
                      className="absolute top-0 left-0 bg-gradient-to-r from-[#C8A951] to-[#B8993F] text-white text-xs font-bold px-8 py-1 shadow-md"
                      style={{
                        transform: "rotate(-45deg) translate(-30%, -10%)",
                        transformOrigin: "center",
                        width: "140px",
                        textAlign: "center",
                      }}
                    >
                      Success
                    </div>

                    {/* Property sold thumbnail (if exists) */}
                    {story.propertyImageUrl && (
                      <div className="absolute bottom-3 right-3 w-16 h-12 rounded-lg overflow-hidden border-2 border-white shadow-lg">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={story.propertyImageUrl}
                          alt="Property"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span
                            className="text-white text-[7px] font-black tracking-wider uppercase"
                            style={{
                              transform: "rotate(-15deg)",
                              textShadow: "1px 1px 2px rgba(0,0,0,0.6)",
                            }}
                          >
                            SOLD
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 text-[#C8A951] text-xs uppercase tracking-widest font-medium mb-1.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Completed
                    </div>
                    <p className="font-bold text-stone-900">{categoryText}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer: count + pagination */}
        {total > 0 && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-12">
            <p className="text-sm text-stone-500">
              {locale === "th"
                ? `แสดง ${(currentPage - 1) * PER_PAGE + 1}-${Math.min(
                    currentPage * PER_PAGE,
                    total
                  )} จาก ${total} ผลงาน`
                : `Showing ${(currentPage - 1) * PER_PAGE + 1}-${Math.min(
                    currentPage * PER_PAGE,
                    total
                  )} of ${total}`}
            </p>

            <div className="flex items-center gap-1">
              {currentPage > 1 ? (
                <Link
                  href={`/${locale}/portfolio?page=${currentPage - 1}`}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              ) : (
                <span className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-stone-200 text-stone-300">
                  <ChevronLeft className="w-4 h-4" />
                </span>
              )}

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`/${locale}/portfolio?page=${p}`}
                  className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    p === currentPage
                      ? "bg-stone-900 text-white shadow"
                      : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  {p}
                </Link>
              ))}

              {currentPage < totalPages ? (
                <Link
                  href={`/${locale}/portfolio?page=${currentPage + 1}`}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <span className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-stone-200 text-stone-300">
                  <ChevronRight className="w-4 h-4" />
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
