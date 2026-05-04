"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, Globe, User, LogOut, ChevronDown, Heart, Layers } from "lucide-react";
import { useFavorites } from "@/lib/favorites";
import { useCompare } from "@/lib/compare";

interface HeaderProps {
  locale: string;
  messages: any;
  logoUrl?: string | null;
}

export default function Header({ locale, messages, logoUrl }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();
  const { count: favCount } = useFavorites();
  const { count: compareCount } = useCompare();
  const t = messages.common;

  const localeLabels: Record<string, string> = {
    th: "🇹🇭 ไทย",
    en: "🇬🇧 English",
    zh: "🇨🇳 中文",
    my: "🇲🇲 မြန်မာ",
  };
  const localeShort: Record<string, string> = {
    th: "TH",
    en: "EN",
    zh: "ZH",
    my: "MY",
  };
  const allLocales = ["th", "en", "zh", "my"];
  const getLocalePath = (targetLocale: string) =>
    pathname.replace(`/${locale}`, `/${targetLocale}`);

  const navLinks = [
    { href: `/${locale}`, label: t.home },
    { href: `/${locale}/properties`, label: t.properties },
    { href: `/${locale}/projects`, label: t.projects || "Projects" },
    { href: `/${locale}/map-search`, label: t.mapSearch },
    { href: `/${locale}/articles`, label: t.articles },
    { href: `/${locale}/portfolio`, label: t.portfolio },
    { href: `/${locale}/co-agent`, label: t.coAgent },
    { href: `/${locale}/contact`, label: t.contact },
  ];

  return (
    <header className="bg-white sticky top-0 z-50 shadow-sm border-b-2 border-[#C8A951]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2">
            {logoUrl ? (
              <img src={logoUrl} alt="NPB Property" className="h-10 max-w-[160px] object-contain" />
            ) : (
              <>
                <span className="text-2xl font-bold text-[#C8A951]">NPB</span>
                <span className="text-sm text-gray-600 hidden sm:block">Property</span>
              </>
            )}
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-[#C8A951] ${
                  pathname === link.href ? "text-gray-900 font-semibold" : "text-gray-700"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Favorites */}
            <Link
              href={`/${locale}/favorites`}
              className="relative p-2 text-gray-600 hover:text-red-500 transition-colors"
              title={t.favorites || "Favorites"}
            >
              <Heart className={`w-5 h-5 ${favCount > 0 ? "fill-red-500 text-red-500" : ""}`} />
              {favCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 min-w-[18px] min-h-[18px] flex items-center justify-center">
                  {favCount}
                </span>
              )}
            </Link>

            {/* Compare */}
            <Link
              href={`/${locale}/compare`}
              className="relative p-2 text-gray-600 hover:text-blue-500 transition-colors"
              title={t.compare || "Compare"}
            >
              <Layers className={`w-5 h-5 ${compareCount > 0 ? "text-blue-500" : ""}`} />
              {compareCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] min-h-[18px] flex items-center justify-center">
                  {compareCount}
                </span>
              )}
            </Link>

            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1 px-2 py-1 rounded text-sm text-gray-600 hover:text-[#C8A951] hover:bg-gray-50"
              >
                <Globe className="w-4 h-4" />
                {localeShort[locale]}
                <ChevronDown className="w-3 h-3" />
              </button>
              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg border py-1 z-50">
                  {allLocales.map((loc) => (
                    <Link
                      key={loc}
                      href={getLocalePath(loc)}
                      className={`block px-4 py-2 text-sm hover:bg-yellow-50 hover:text-[#C8A951] ${
                        loc === locale ? "text-[#C8A951] font-medium bg-yellow-50" : "text-gray-700"
                      }`}
                      onClick={() => setLangMenuOpen(false)}
                    >
                      {localeLabels[loc]}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* User Menu */}
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-700 hover:text-[#C8A951] hover:bg-gray-50"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{session.user?.name}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-50">
                    <Link
                      href={`/${locale}/profile`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-yellow-50 hover:text-[#C8A951]"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      {t.profile}
                    </Link>
                    {(session.user as any)?.role === "ADMIN" && (
                      <Link
                        href={`/${locale}/admin`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-yellow-50 hover:text-[#C8A951]"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        {t.admin}
                      </Link>
                    )}
                    <button
                      onClick={() => signOut()}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <LogOut className="w-3 h-3" />
                      {t.logout}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href={`/${locale}/auth/login`}
                  className="text-sm text-gray-700 hover:text-[#C8A951]"
                >
                  {t.login}
                </Link>
                <Link
                  href={`/${locale}/auth/register`}
                  className="text-sm bg-[#C8A951] text-white px-4 py-1.5 rounded-lg hover:bg-[#B8993F]"
                >
                  {t.register}
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-[#C8A951]/30">
          <div className="px-4 py-3 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded text-sm ${
                  pathname === link.href
                    ? "bg-yellow-50 text-[#C8A951]"
                    : "text-gray-700 hover:bg-yellow-50 hover:text-[#C8A951]"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={`/${locale}/favorites`}
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
                pathname === `/${locale}/favorites`
                  ? "bg-yellow-50 text-[#C8A951]"
                  : "text-gray-700 hover:bg-yellow-50 hover:text-[#C8A951]"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Heart className="w-4 h-4" />
              {t.favorites || "Favorites"}
              {favCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] min-h-[18px] flex items-center justify-center">
                  {favCount}
                </span>
              )}
            </Link>
            <Link
              href={`/${locale}/compare`}
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
                pathname === `/${locale}/compare`
                  ? "bg-yellow-50 text-[#C8A951]"
                  : "text-gray-700 hover:bg-yellow-50 hover:text-[#C8A951]"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Layers className="w-4 h-4" />
              {t.compare || "Compare"}
              {compareCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] min-h-[18px] flex items-center justify-center">
                  {compareCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
