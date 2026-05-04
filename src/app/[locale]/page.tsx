import Link from "next/link";
import {
  Building2,
  Home,
  Building,
  Map,
  Shield,
  Users,
  Star,
  ArrowRight,
  Trees,
} from "lucide-react";
import HeroSearchPanel from "@/components/property/HeroSearchPanel";
import FeaturedPropertiesGrid from "@/components/property/FeaturedPropertiesGrid";
import FeaturedProjectsGrid from "@/components/property/FeaturedProjectsGrid";
import SectionTitle from "@/components/ui/SectionTitle";
import prisma from "@/lib/prisma";

async function getMessages(locale: string) {
  return (await import(`@/messages/${locale}.json`)).default;
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages(locale);
  const t = messages.home;
  const tp = messages.property;

  const [propertyCounts, heroSettings] = await Promise.all([
    prisma.property.groupBy({
      by: ["propertyType"],
      _count: true,
      where: { isSold: false },
    }),
    prisma.siteSetting.findMany({
      where: { key: { in: ["heroBgImage", "heroBgVideo", "whyUsImage"] } },
    }),
  ]);

  const heroBgImage =
    heroSettings.find((s) => s.key === "heroBgImage")?.valueTh || null;
  const heroBgVideo =
    heroSettings.find((s) => s.key === "heroBgVideo")?.valueTh || null;
  const whyUsImage =
    heroSettings.find((s) => s.key === "whyUsImage")?.valueTh || null;

  const typeIcons: Record<string, any> = {
    CONDO: Building2,
    HOUSE: Home,
    TOWNHOUSE: Building,
    LAND: Trees,
  };
  const typeLabels: Record<string, string> = {
    CONDO: tp.condo,
    HOUSE: tp.house,
    TOWNHOUSE: tp.townhouse,
    LAND: tp.land || "Land",
  };

  return (
    <div className="bg-stone-50">
      {/* HERO */}
      <section className="relative text-white overflow-hidden">
        <div className="relative h-[85vh] min-h-[600px] max-h-[800px]">
          {/* Background: Video > Image > Gradient */}
          {heroBgVideo ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src={heroBgVideo} type="video/mp4" />
            </video>
          ) : heroBgImage ? (
            <div
              className="absolute inset-0 w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${heroBgImage})` }}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-800 to-[#5a4621]" />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-900/40 to-stone-900/20" />

          {/* Decorative gold blur */}
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#C8A951]/15 rounded-full blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center">
            <div className="flex items-center gap-2 text-[#E8C97A] text-xs uppercase tracking-widest font-medium mb-4 justify-center">
              <span className="w-6 h-px bg-[#E8C97A]" />
              {locale === "th" ? "บ้านดี คอนโดดี NPB Property" : "NPB Property"}
              <span className="w-6 h-px bg-[#E8C97A]" />
            </div>
            <h1 className="text-center text-4xl md:text-6xl lg:text-7xl font-bold leading-tight drop-shadow-2xl mb-5">
              {t.heroTitle}
            </h1>
            <p className="text-center text-base md:text-xl text-white/80 mb-10 max-w-2xl mx-auto drop-shadow">
              {t.heroSubtitle}
            </p>
            <HeroSearchPanel locale={locale} messages={messages} />
            <div className="mt-7 text-center">
              <Link
                href={`/${locale}/map-search`}
                className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-[#E8C97A] transition-colors"
              >
                <Map className="w-4 h-4" /> {t.exploreMap}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SEARCH BY TYPE — floating bar attached to hero */}
      <section className="relative -mt-10 z-10 mb-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-stone-950 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-[#C8A951]/20">
            {/* Top + bottom fade gold lines */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C8A951]/60 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#C8A951]/60 to-transparent" />

            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-[#C8A951]/15">
              {["CONDO", "HOUSE", "TOWNHOUSE", "LAND"].map((type) => {
                const Icon = typeIcons[type];
                const count =
                  propertyCounts.find((c) => c.propertyType === type)?._count ||
                  0;
                return (
                  <Link
                    key={type}
                    href={`/${locale}/properties?propertyType=${type}`}
                    className="group relative px-4 py-5 text-center hover:bg-[#C8A951]/5 transition-colors"
                  >
                    <Icon className="w-5 h-5 text-[#E8C97A] mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <div className="text-base font-bold text-white tracking-tight">
                      {typeLabels[type]}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-stone-400 mt-1">
                      <span className="text-[#E8C97A] font-bold">
                        {count.toLocaleString()}
                      </span>{" "}
                      {locale === "th" ? "รายการ" : "Listings"}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED PROPERTIES */}
      <section className="py-20 bg-white border-y border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle
            badge={locale === "th" ? "แนะนำ" : "Featured"}
            title={t.featuredProperties}
            subtitle={
              locale === "th"
                ? "ห้องที่ดีที่สุดที่เราคัดสรรมาให้คุณ"
                : "Hand-picked listings curated for you"
            }
            align="center"
            className="mb-10"
          />
          <FeaturedPropertiesGrid locale={locale} messages={messages} />
        </div>
      </section>

      {/* FEATURED PROJECTS */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle
            badge={locale === "th" ? "โครงการ" : "Projects"}
            title={
              locale === "th" ? "โครงการแนะนำ" : "Featured Projects"
            }
            subtitle={
              locale === "th"
                ? "เลือกโครงการที่ใช่ พร้อมข้อมูลครบครันและห้องที่พร้อมเข้าอยู่"
                : "Discover the right project with complete details and ready-to-move-in units"
            }
            align="center"
            className="mb-10"
          />
          <FeaturedProjectsGrid locale={locale} />
        </div>
      </section>

      {/* WHY US - Dark editorial section */}
      <section className="relative bg-stone-950 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C8A951]/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-[#C8A951]/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Image */}
            <div className="relative h-[320px] lg:h-auto">
              {whyUsImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={whyUsImage}
                  alt="Why NPB Property"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full min-h-[320px] bg-stone-900 flex items-center justify-center">
                  <span className="text-stone-600 text-sm">
                    {locale === "th"
                      ? "อัปโหลดรูปได้ที่หน้า Settings"
                      : "Upload image in Settings"}
                  </span>
                </div>
              )}
              {/* Gradient on right edge for smooth transition */}
              <div className="hidden lg:block absolute inset-y-0 right-0 w-32 bg-gradient-to-r from-transparent to-stone-950" />
            </div>

            {/* Content */}
            <div className="flex flex-col justify-center px-8 lg:px-16 py-20 lg:py-24">
              <div className="flex items-center gap-2 text-[#E8C97A] text-xs uppercase tracking-widest font-medium mb-3">
                <span className="w-6 h-px bg-[#E8C97A]" />
                {locale === "th" ? "ทำไมต้องเลือกเรา" : "Why Choose Us"}
              </div>
              <h2 className="text-3xl lg:text-5xl font-bold mb-12 leading-tight">
                {locale === "th" ? (
                  <>
                    บ้านดี คอนโดดี{" "}
                    <span className="text-[#E8C97A]">NPB Property</span>
                  </>
                ) : (
                  <>
                    The Trusted Choice in{" "}
                    <span className="text-[#E8C97A]">Real Estate</span>
                  </>
                )}
              </h2>
              <div className="space-y-8">
                {[
                  {
                    icon: Star,
                    title: t.expertAgents,
                    desc: t.expertAgentsDesc,
                  },
                  {
                    icon: Shield,
                    title: t.trustedByMany,
                    desc: t.trustedByManyDesc,
                  },
                  {
                    icon: Users,
                    title: t.wideSelection,
                    desc: t.wideSelectionDesc,
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-[#C8A951]/15 border border-[#C8A951]/30 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-[#E8C97A]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-1">{item.title}</h3>
                      <p className="text-stone-400 text-sm leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href={`/${locale}/contact`}
                className="mt-12 inline-flex items-center gap-2 self-start bg-[#C8A951] hover:bg-[#D4B968] text-stone-900 font-semibold px-7 py-3 rounded-full text-sm transition-colors"
              >
                {locale === "th" ? "ติดต่อเรา" : "Get in Touch"}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
