"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Building2, Users, FileText, Star, Loader2, Settings,
  Menu, X, Trophy, Zap, Globe, Wallet, Layers, Mail, FileSignature, Lock, Crown, LayoutList, UserSearch, CalendarDays,
} from "lucide-react";

// Full list of every menu item a CO_AGENT can ever be given access to.
// Sensitive admin pages (users, settings, languages, menu-config, subscriptions)
// are intentionally excluded — the backend still enforces their own auth checks.
const ALL_AGENT_MENU_ITEMS = [
  { key: "agent-dashboard",        href: (l: string) => `/${l}/admin/agent-dashboard`,       icon: LayoutDashboard, labelTh: "ภาพรวม",              labelEn: "Dashboard" },
  { key: "properties",             href: (l: string) => `/${l}/admin/properties`,             icon: Building2,       labelTh: "ทรัพย์ของฉัน",        labelEn: "My Properties" },
  { key: "projects",               href: (l: string) => `/${l}/admin/projects`,               icon: Layers,          labelTh: "โครงการ",              labelEn: "Projects" },
  { key: "customer-leads",         href: (l: string) => `/${l}/admin/customer-leads`,         icon: UserSearch,      labelTh: "Matching ลูกค้า",      labelEn: "Customer Matching" },
  { key: "contracts",              href: (l: string) => `/${l}/admin/contracts`,              icon: FileSignature,   labelTh: "สัญญาเช่า",            labelEn: "Contracts" },
  { key: "contract-calendar",     href: (l: string) => `/${l}/admin/calendar`,               icon: CalendarDays,    labelTh: "ปฏิทินสัญญา",          labelEn: "Contract Calendar" },
  { key: "closed-contracts",       href: (l: string) => `/${l}/admin/closed-contracts`,       icon: Lock,            labelTh: "สัญญาที่ปิดแล้ว",      labelEn: "Closed Contracts" },
  { key: "electricity-calculator", href: (l: string) => `/${l}/admin/electricity-calculator`, icon: Zap,             labelTh: "คำนวณค่าไฟ",           labelEn: "Electricity Calc" },
  { key: "accounting",             href: (l: string) => `/${l}/admin/accounting`,             icon: Wallet,          labelTh: "งบการเงิน / บัญชี",    labelEn: "Accounting" },
  { key: "messages",               href: (l: string) => `/${l}/admin/messages`,               icon: Mail,            labelTh: "ข้อความติดต่อ",         labelEn: "Messages" },
  { key: "reviews",                href: (l: string) => `/${l}/admin/reviews`,                icon: Star,            labelTh: "รีวิว",                 labelEn: "Reviews" },
  { key: "portfolio",              href: (l: string) => `/${l}/admin/portfolio`,              icon: Trophy,          labelTh: "Portfolio",             labelEn: "Portfolio" },
  { key: "articles",               href: (l: string) => `/${l}/admin/articles`,               icon: FileText,        labelTh: "บทความ",               labelEn: "Articles" },
  { key: "dashboard",              href: (l: string) => `/${l}/admin`,                        icon: LayoutDashboard, labelTh: "Admin Dashboard",      labelEn: "Admin Dashboard" },
];

// All admin nav items with their config key
const ALL_ADMIN_NAV = [
  { key: "dashboard",              icon: LayoutDashboard, hrefSuffix: "",                         labelKey: "dashboard" },
  { key: "properties",             icon: Building2,       hrefSuffix: "/properties",               labelKey: "propertyManagement" },
  { key: "projects",               icon: Layers,          hrefSuffix: "/projects",                 labelKey: "projectManagement" },
  { key: "customer-leads",         icon: UserSearch,      hrefSuffix: "/customer-leads",           labelKey: null, labelFallback: { th: "Matching ลูกค้า", en: "Customer Matching" } },
  { key: "users",                  icon: Users,           hrefSuffix: "/users",                    labelKey: "userManagement" },
  { key: "messages",               icon: Mail,            hrefSuffix: "/messages",                 labelKey: null, labelFallback: { th: "ข้อความติดต่อ", en: "Messages" }, badge: true },
  { key: "articles",               icon: FileText,        hrefSuffix: "/articles",                 labelKey: "articleManagement" },
  { key: "portfolio",              icon: Trophy,          hrefSuffix: "/portfolio",                labelKey: "portfolioManagement", fallback: "Portfolio" },
  { key: "electricity-calculator", icon: Zap,             hrefSuffix: "/electricity-calculator",   labelKey: null, labelMsg: "electricityCalculator.navLabel", fallback: "Electricity Calc" },
  { key: "accounting",             icon: Wallet,          hrefSuffix: "/accounting",               labelKey: "accounting", fallback: "Accounting" },
  { key: "contracts",              icon: FileSignature,   hrefSuffix: "/contracts",                labelKey: null, labelFallback: { th: "สัญญาเช่า", en: "Contracts" } },
  { key: "contract-calendar",     icon: CalendarDays,    hrefSuffix: "/calendar",                 labelKey: null, labelFallback: { th: "ปฏิทินสัญญา", en: "Contract Calendar" } },
  { key: "closed-contracts",       icon: Lock,            hrefSuffix: "/closed-contracts",         labelKey: null, labelFallback: { th: "Closed Contracts", en: "Closed Contracts" } },
  { key: "subscriptions",          icon: Crown,           hrefSuffix: "/subscriptions",            labelKey: null, labelFallback: { th: "จัดการ Package", en: "Subscriptions" } },
  { key: "menu-config",            icon: LayoutList,      hrefSuffix: "/menu-config",              labelKey: null, labelFallback: { th: "เมนูตาม Package", en: "Menu Config" } },
  { key: "reviews",                icon: Star,            hrefSuffix: "/reviews",                  labelKey: "reviewModeration" },
  { key: "settings",               icon: Settings,        hrefSuffix: "/settings",                 labelKey: "settings", fallback: "Settings" },
  { key: "languages",              icon: Globe,           hrefSuffix: "/settings/languages",       labelKey: "languageSettings", fallback: "ตั้งค่าภาษา" },
];

export default function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [locale, setLocale] = useState("th");
  const [messages, setMessages] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [menuConfig, setMenuConfig] = useState<Record<string, string[]> | null>(null);
  // Fetch tier fresh from DB — avoids stale JWT cache showing wrong tier
  const [freshTier, setFreshTier] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ locale: l }) => {
      setLocale(l);
      import(`@/messages/${l}.json`).then((m) => setMessages(m.default));
    });
  }, [params]);

  const fetchMenuConfig = useCallback(async () => {
    try {
      const [cfgRes, tierRes] = await Promise.all([
        fetch("/api/admin/menu-config"),
        fetch("/api/agent/tier"),
      ]);
      const cfg = await cfgRes.json();
      const tierData = await tierRes.json();
      if (cfg.success) setMenuConfig(cfg.data);
      if (tierData.success) setFreshTier(tierData.tier);
    } catch {
      // fall back to session value / showing all items
    }
  }, []);

  useEffect(() => { fetchMenuConfig(); }, [fetchMenuConfig]);

  // Poll unread message count
  useEffect(() => {
    if ((session?.user as any)?.role !== "ADMIN") return;
    const fetchUnread = () => {
      fetch("/api/admin/messages")
        .then((r) => r.json())
        .then((d) => { if (d.success) setUnreadMessages(d.data.unreadCount); })
        .catch(() => {});
    };
    fetchUnread();
    const id = setInterval(fetchUnread, 30 * 60_000);
    return () => clearInterval(id);
  }, [session, pathname]);

  const role = (session?.user as any)?.role;
  // Prefer freshTier (direct DB read) over JWT-cached session value
  const userTier: string = freshTier ?? (session?.user as any)?.subscriptionTier ?? "STANDARD";

  // All paths a CO_AGENT may visit — matches keys in ALL_AGENT_MENU_ITEMS
  const CO_AGENT_ALLOWED_PATHS = [
    "/admin/agent-dashboard",
    "/admin/properties",
    "/admin/projects",
    "/admin/customer-leads",
    "/admin/contracts",
    "/admin/calendar",
    "/admin/closed-contracts",
    "/admin/electricity-calculator",
    "/admin/accounting",
    "/admin/messages",
    "/admin/reviews",
    "/admin/portfolio",
    "/admin/articles",
  ];
  const isCoAgentAllowed =
    role === "CO_AGENT" &&
    CO_AGENT_ALLOWED_PATHS.some((p) => pathname.includes(p));

  const isCoAgentAddPage = role === "CO_AGENT" && pathname.includes("/admin/properties/add");

  useEffect(() => {
    if (status === "unauthenticated") router.push(`/${locale}/auth/login`);
    if (session && role !== "ADMIN" && role !== "CO_AGENT") router.push(`/${locale}`);
    if (session && role === "CO_AGENT" && !isCoAgentAllowed) {
      router.push(`/${locale}/agent`);
    }
  }, [session, status, router, locale, role, pathname, isCoAgentAllowed]);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  if (status === "loading" || !messages) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  if (role !== "ADMIN" && !isCoAgentAllowed) return null;

  if (isCoAgentAddPage) {
    return <div className="bg-gray-50 min-h-screen p-4 sm:p-6">{children}</div>;
  }

  const isCoAgentWorkspace = role === "CO_AGENT" && !isCoAgentAddPage;
  const t = messages.admin;

  // CO_AGENT sidebar: filter by tier menu config
  const agentAllowedKeys: string[] = menuConfig?.[userTier] ?? ALL_AGENT_MENU_ITEMS.map((i) => i.key);
  const agentNavItems = ALL_AGENT_MENU_ITEMS
    .filter((item) => agentAllowedKeys.includes(item.key))
    .map((item) => ({
      href: item.href(locale),
      icon: item.icon,
      label: locale === "th" ? item.labelTh : item.labelEn,
    }));

  // Admin sidebar: filter by ADMIN menu config
  // "menu-config" is always visible to admin to prevent lockout
  const adminAllowedKeys: string[] = menuConfig?.ADMIN ?? ALL_ADMIN_NAV.map((i) => i.key);
  const getLabel = (item: (typeof ALL_ADMIN_NAV)[number]): string => {
    if (item.labelKey) return t[item.labelKey] || (item as any).fallback || item.key;
    if (item.labelMsg) {
      const parts = item.labelMsg.split(".");
      return messages[parts[0]]?.[parts[1]] || (item as any).fallback || item.key;
    }
    if ((item as any).labelFallback) {
      return locale === "th" ? (item as any).labelFallback.th : (item as any).labelFallback.en;
    }
    return item.key;
  };

  const navItems = ALL_ADMIN_NAV
    .filter((item) => item.key === "menu-config" || adminAllowedKeys.includes(item.key))
    .map((item) => ({
      key: item.key,
      href: `/${locale}/admin${item.hrefSuffix}`,
      icon: item.icon,
      label: getLabel(item),
      badge: (item as any).badge ? unreadMessages : undefined,
    }));

  const renderNavList = (items: { href: string; icon: any; label: string; badge?: number }[]) => (
    <nav className="space-y-1">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/") ||
          (item.href.endsWith("/admin") && pathname === item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              isActive ? "bg-[#C8A951] text-white" : "text-gray-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <item.icon className="w-4 h-4" />
            <span className="flex-1">{item.label}</span>
            {item.badge && item.badge > 0 ? (
              <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  const SidebarContent = () => (
    <>
      <h2 className="text-lg font-bold mb-6">
        {isCoAgentWorkspace ? "Agent Workspace" : t.dashboard}
      </h2>
      {isCoAgentWorkspace ? renderNavList(agentNavItems) : renderNavList(navItems)}
    </>
  );

  return (
    <div className="flex" style={{ minHeight: "calc(100vh - 64px)" }}>
      <div className="lg:hidden fixed top-16 left-0 right-0 z-40 bg-[#112240] text-white px-4 py-2 flex items-center gap-3">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1">
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <span className="text-sm font-medium">{t.dashboard}</span>
      </div>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`
          fixed lg:relative top-0 left-0 z-40 w-64 flex-shrink-0 transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
        style={{ minHeight: "calc(100vh - 64px)" }}
      >
        <div className="h-full bg-[#112240] text-white">
          <div className="p-4 pt-20 lg:pt-4">
            <SidebarContent />
          </div>
        </div>
      </aside>

      <div className="flex-1 bg-gray-50 p-4 sm:p-6 pt-16 lg:pt-6 min-w-0">
        {children}
      </div>
    </div>
  );
}
