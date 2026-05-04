import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Providers from "@/components/layout/Providers";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const locales = ["th", "en", "zh", "my"];

async function getMessages(locale: string) {
  try {
    return (await import(`@/messages/${locale}.json`)).default;
  } catch {
    notFound();
  }
}

async function getSiteSettings() {
  try {
    const settings = await prisma.siteSetting.findMany({
      where: { key: { in: ["logo"] } },
    });
    const map: Record<string, string | null> = {};
    for (const s of settings) {
      map[s.key] = s.valueTh;
    }
    return map;
  } catch {
    return {};
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale)) notFound();

  const [messages, siteSettings] = await Promise.all([
    getMessages(locale),
    getSiteSettings(),
  ]);

  return (
    <Providers>
      <div className="min-h-screen flex flex-col">
        <Header locale={locale} messages={messages} logoUrl={siteSettings.logo || null} />
        <main className="flex-1">{children}</main>
        <Footer locale={locale} messages={messages} logoUrl={siteSettings.logo || null} />
      </div>
    </Providers>
  );
}
