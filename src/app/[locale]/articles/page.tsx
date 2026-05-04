import Link from "next/link";
import { Calendar, Tag, ArrowRight, BookOpen } from "lucide-react";
import prisma from "@/lib/prisma";
import { getIntlLocale } from "@/lib/utils";

async function getMessages(locale: string) {
  return (await import(`@/messages/${locale}.json`)).default;
}

export default async function ArticlesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages(locale);

  const [articles, categories, heroSetting] = await Promise.all([
    prisma.article.findMany({
      where: { isPublished: true },
      include: {
        category: true,
        author: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.articleCategory.findMany({ orderBy: { nameTh: "asc" } }),
    prisma.siteSetting.findUnique({ where: { key: "articlesHeroImage" } }),
  ]);
  const heroImage = heroSetting?.valueTh || null;

  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <div className="bg-stone-50 min-h-screen">
      {/* HERO */}
      <section className="relative bg-gradient-to-br from-stone-900 via-stone-800 to-[#5a4621] text-white overflow-hidden h-[65vh] min-h-[480px] max-h-[640px] flex items-end pb-16 md:pb-20">
        {heroImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-top opacity-40"
          />
        )}
        {/* Dark overlay */}
        {heroImage && (
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/75 via-stone-950/30 to-stone-950/10" />
        )}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C8A951]/20 rounded-full blur-3xl -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#C8A951]/10 rounded-full blur-3xl translate-y-20 -translate-x-20" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center gap-2 text-[#E8C97A] text-xs uppercase tracking-widest font-medium mb-3">
            <span className="w-6 h-px bg-[#E8C97A]" />
            {locale === "th" ? "บทความ" : "Insights"}
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-3">
            {messages.common.articles}
          </h1>
          <p className="text-lg text-white/70 max-w-2xl">
            {locale === "th"
              ? "ความรู้และข่าวสารวงการอสังหาริมทรัพย์ที่จะช่วยให้คุณตัดสินใจได้อย่างมั่นใจ"
              : "Real estate insights and stories to help you decide with confidence"}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Categories pills */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-10">
            {categories.map((cat) => (
              <span
                key={cat.id}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white rounded-full shadow-sm text-sm text-stone-700"
              >
                <Tag className="w-3 h-3 text-[#C8A951]" />
                {locale !== "th" ? cat.nameEn : cat.nameTh}
              </span>
            ))}
          </div>
        )}

        {articles.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl">
            <BookOpen className="w-12 h-12 mx-auto text-stone-300 mb-3" />
            <p className="text-stone-500">{messages.common.noResults}</p>
          </div>
        ) : (
          <>
            {/* FEATURED ARTICLE */}
            {featured && (
              <Link
                href={`/${locale}/articles/${featured.slug}`}
                className="group block mb-12"
              >
                <article className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                  <div className="relative aspect-[16/10] rounded-3xl overflow-hidden bg-stone-100 shadow-sm order-1 lg:order-1">
                    {featured.featuredImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={featured.featuredImage}
                        alt={
                          locale !== "th" && featured.titleEn
                            ? featured.titleEn
                            : featured.titleTh
                        }
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-stone-100" />
                    )}
                    <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-[#C8A951] text-white text-[10px] font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      {locale === "th" ? "บทความล่าสุด" : "Latest"}
                    </div>
                  </div>
                  <div className="order-2 lg:order-2">
                    <div className="flex items-center gap-2 text-[#C8A951] text-xs uppercase tracking-widest font-medium mb-3">
                      <span className="w-6 h-px bg-[#C8A951]" />
                      {locale !== "th"
                        ? featured.category.nameEn
                        : featured.category.nameTh}
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-stone-900 leading-tight mb-4 group-hover:text-[#C8A951] transition-colors">
                      {locale !== "th" && featured.titleEn
                        ? featured.titleEn
                        : featured.titleTh}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-stone-500 mb-5">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {new Date(featured.createdAt).toLocaleDateString(
                          getIntlLocale(locale)
                        )}
                      </span>
                      <span className="text-stone-300">•</span>
                      <span>
                        {featured.author.firstName} {featured.author.lastName}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-2 text-stone-900 font-medium group-hover:gap-3 transition-all">
                      {locale === "th" ? "อ่านต่อ" : "Read Article"}
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </article>
              </Link>
            )}

            {/* REST ARTICLES */}
            {rest.length > 0 && (
              <div className="border-t border-stone-200 pt-12">
                <div className="flex items-center gap-2 text-[#C8A951] text-xs uppercase tracking-widest font-medium mb-2">
                  <span className="w-6 h-px bg-[#C8A951]" />
                  {locale === "th" ? "บทความทั้งหมด" : "All Articles"}
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-stone-900 mb-8">
                  {locale === "th"
                    ? `บทความ (${rest.length})`
                    : `${rest.length} more articles`}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rest.map((article) => {
                    const title =
                      locale !== "th" && article.titleEn
                        ? article.titleEn
                        : article.titleTh;
                    return (
                      <Link
                        key={article.id}
                        href={`/${locale}/articles/${article.slug}`}
                        className="group"
                      >
                        <article className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
                          {article.featuredImage && (
                            <div className="aspect-[16/10] overflow-hidden">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={article.featuredImage}
                                alt={title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                          )}
                          <div className="p-5 flex-1 flex flex-col">
                            <span className="inline-block self-start bg-amber-50 text-[#8B6F2F] text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded mb-3">
                              {locale !== "th"
                                ? article.category.nameEn
                                : article.category.nameTh}
                            </span>
                            <h3 className="font-bold text-lg text-stone-900 mb-3 line-clamp-2 group-hover:text-[#C8A951] transition-colors">
                              {title}
                            </h3>
                            <div className="flex items-center gap-3 text-xs text-stone-500 mt-auto pt-3 border-t border-stone-100">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(article.createdAt).toLocaleDateString(
                                  getIntlLocale(locale)
                                )}
                              </span>
                              <span className="text-stone-300">•</span>
                              <span>
                                {article.author.firstName}{" "}
                                {article.author.lastName}
                              </span>
                            </div>
                          </div>
                        </article>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
