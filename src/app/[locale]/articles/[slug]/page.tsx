import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, ChevronLeft, Tag, User, Share2 } from "lucide-react";
import prisma from "@/lib/prisma";
import { getIntlLocale } from "@/lib/utils";

async function getMessages(locale: string) {
  return (await import(`@/messages/${locale}.json`)).default;
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const messages = await getMessages(locale);

  const article = await prisma.article.findUnique({
    where: { slug },
    include: {
      category: true,
      author: { select: { firstName: true, lastName: true } },
    },
  });

  if (!article || !article.isPublished) notFound();

  const title =
    locale !== "th" && article.titleEn ? article.titleEn : article.titleTh;
  const content =
    locale !== "th" && article.contentEn
      ? article.contentEn
      : article.contentTh;

  // Related articles
  const related = await prisma.article.findMany({
    where: {
      isPublished: true,
      id: { not: article.id },
      categoryId: article.categoryId,
    },
    include: { category: true },
    take: 3,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="bg-stone-50 min-h-screen">
      {/* HERO */}
      <section className="relative">
        <div className="relative h-[55vh] min-h-[380px] max-h-[520px] overflow-hidden bg-stone-900">
          {article.featuredImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.featuredImage}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-800 to-[#5a4621]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/50 to-stone-900/10" />

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 z-10">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
              <Link
                href={`/${locale}/articles`}
                className="inline-flex items-center gap-1.5 text-sm text-white/90 hover:text-white bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                {locale === "th" ? "บทความทั้งหมด" : "All Articles"}
              </Link>
            </div>
          </div>

          {/* Bottom info */}
          <div className="absolute bottom-0 left-0 right-0 z-10 text-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
              <div className="flex items-center gap-2 text-[#E8C97A] text-xs uppercase tracking-widest font-medium mb-3">
                <span className="w-6 h-px bg-[#E8C97A]" />
                <Tag className="w-3 h-3" />
                {locale !== "th"
                  ? article.category.nameEn
                  : article.category.nameTh}
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4">
                {title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#E8C97A]" />
                  {article.author.firstName} {article.author.lastName}
                </span>
                <span className="text-white/40">•</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#E8C97A]" />
                  {new Date(article.createdAt).toLocaleDateString(
                    getIntlLocale(locale),
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ARTICLE BODY */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div
          className="prose prose-lg prose-stone max-w-none
            prose-headings:font-bold prose-headings:text-stone-900
            prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4
            prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-stone-700 prose-p:leading-relaxed
            prose-a:text-[#C8A951] hover:prose-a:text-[#B8993F] prose-a:no-underline hover:prose-a:underline
            prose-strong:text-stone-900
            prose-blockquote:border-l-4 prose-blockquote:border-[#C8A951] prose-blockquote:bg-amber-50/50 prose-blockquote:py-1 prose-blockquote:px-6 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
            prose-img:rounded-2xl prose-img:shadow-sm
            prose-li:text-stone-700"
          dangerouslySetInnerHTML={{ __html: content || "" }}
        />

        {/* Article Footer */}
        <div className="mt-16 pt-8 border-t border-stone-200 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center">
              <User className="w-5 h-5 text-stone-400" />
            </div>
            <div>
              <p className="font-medium text-stone-900">
                {article.author.firstName} {article.author.lastName}
              </p>
              <p className="text-xs text-stone-500">
                {locale === "th" ? "ผู้เขียน" : "Author"}
              </p>
            </div>
          </div>
          <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-full text-sm font-medium transition-colors">
            <Share2 className="w-4 h-4" />
            {locale === "th" ? "แชร์บทความ" : "Share"}
          </button>
        </div>
      </article>

      {/* RELATED ARTICLES */}
      {related.length > 0 && (
        <section className="bg-white border-t border-stone-200 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-[#C8A951] text-xs uppercase tracking-widest font-medium mb-2 justify-center">
              <span className="w-6 h-px bg-[#C8A951]" />
              {locale === "th" ? "บทความที่เกี่ยวข้อง" : "Related"}
              <span className="w-6 h-px bg-[#C8A951]" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-stone-900 text-center mb-10">
              {locale === "th" ? "บทความอื่นๆ ที่น่าสนใจ" : "More Articles"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((r) => {
                const rTitle =
                  locale !== "th" && r.titleEn ? r.titleEn : r.titleTh;
                return (
                  <Link
                    key={r.id}
                    href={`/${locale}/articles/${r.slug}`}
                    className="group"
                  >
                    <article className="bg-stone-50 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full">
                      {r.featuredImage && (
                        <div className="aspect-[16/10] overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={r.featuredImage}
                            alt={rTitle}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}
                      <div className="p-5">
                        <span className="inline-block bg-amber-50 text-[#8B6F2F] text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded mb-3">
                          {locale !== "th"
                            ? r.category.nameEn
                            : r.category.nameTh}
                        </span>
                        <h3 className="font-bold text-stone-900 line-clamp-2 group-hover:text-[#C8A951] transition-colors">
                          {rTitle}
                        </h3>
                        <p className="text-xs text-stone-500 mt-2">
                          {new Date(r.createdAt).toLocaleDateString(
                            getIntlLocale(locale)
                          )}
                        </p>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
