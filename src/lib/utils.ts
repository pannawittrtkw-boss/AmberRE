import { type ClassValue, clsx } from "clsx";

export const LOCALES = ["th", "en", "zh", "my"] as const;
export type Locale = (typeof LOCALES)[number];

const intlLocaleMap: Record<string, string> = {
  th: "th-TH",
  en: "en-US",
  zh: "zh-CN",
  my: "my-MM",
};

export function getIntlLocale(locale: string): string {
  return intlLocaleMap[locale] || "en-US";
}

/** Pick Thai or English DB field based on locale. Non-Thai locales use English if available. */
export function localeText(locale: string, th: string | null | undefined, en: string | null | undefined): string {
  if (locale === "th") return th || en || "";
  return en || th || "";
}

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(" ");
}

export function formatPrice(price: number, locale: string = "th"): string {
  return new Intl.NumberFormat(getIntlLocale(locale), {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatNumber(price: number, locale: string = "th"): string {
  return new Intl.NumberFormat(getIntlLocale(locale)).format(price);
}

export function formatDate(date: string | Date, locale: string = "th"): string {
  return new Date(date).toLocaleDateString(getIntlLocale(locale));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
