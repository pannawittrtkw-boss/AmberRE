"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Building2, Users, FileText, Star, Loader2, Settings,
  Menu, X, Trophy, Zap, Globe, Wallet, Layers, Mail, FileSignature, Lock, Crown, LayoutList,
} from "lucide-react";

const ALL_AGENT_MENU_ITEMS = [
  { key: "properties",             href: (l: string) => `/${l}/admin/properties`,             icon: Building2,    labelTh: "ทรัพย์ของฉัน",  labelEn: "My Properties" },
  { key: "contracts",              href: (l: string) => `/${l}/admin/contracts`,              icon: FileSignature, labelTh: "สัญญาเช่า",     labelEn: "Contracts" },
  { key: "electricity-calculator", href: (l: string) => `/${l}/admin/electricity-calculator`, icon: Zap,           labelTh: "คำนวณค่าไฟ",    labelEn: "Electricity Calc" },
  { key: "accounting",             href: (l: string) => `/${l}/admin/accounting`,             icon: Wallet,        labelTh: "บัญชี",         labelEn: "Accounting" },
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

  useEffect(() => {
    params.then(({ locale: l }) => {
      setLocale(l);
      import(`@/messages/${l}.json`).then((m) => setMessages(m.default));
    });
  }, [params]);

  // Fetch menu config once (used to filter CO_AGENT sidebar)
  const fetchMenuConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/menu-config");
      const d = await res.json();
      if (d.success) setMenuConfig(d.data);
    } catch {
      // fall back to showing all items
    }
  }, []);

  useEffect(() => { fetchMenuConfig(); }, [fetchMenuConfig]);

  // Poll unread message count for the sidebar badge
  useEffect(() => {
    if ((session?.user as any)?.role !== "ADMIN") return;
    const fetchUnread = () => {
      fetch("/api/admin/messages")
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setUnreadMessages(d.data.unreadCount);
        })
        .catch(() => {});
    };
    fetchUnread();
    const id = setInterval(fetchUnread, 30 * 60_000);
    return () => clearInterval(id);
  }, [session, pathname]);

  const role = (session?.user as any)?.role;
  const userTier: string = (session?.user as any)?.subscriptionTier ?? "STANDARD";

  // Pages in /admin that CO_AGENT is allowed to access
  const CO_AGENT_ALLOWED_PATHS = [
    "/admin/properties",
    "/admin/contracts",
    "/admin/electricity-calculator",
    "/admin/accounting",
  ];
  const isCoAgentAllowed =
    role === "CO_AGENT" &&
    CO_AGENT_ALLOWED_PATHS.some((p) => pathname.includes(p));

  // Add-property page: render without sidebar (full-width form)
  const isCoAgentAddPage = role === "CO_AGENT" && pathname.includes("/admin/properties/add");

  useEffect(() => {
    if (status === "unauthenticated") router.push(`/${locale}/auth/login`);
    if (session && role !== "ADMIN" && role !== "CO_AGENT") router.push(`/${locale}`);
    if (session && role === "CO_AGENT" && !isCoAgentAllowed) {
      router.push(`/${locale}/agent`);
    }
  }, [session, status, router, locale, role, pathname, isCoAgentAllowed]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (status === "loading" || !messages) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  if (role !== "ADMIN" && !isCoAgentAllowed) return null;

  // CO_AGENT on add-property page: render only the content, no admin sidebar
  if (isCoAgentAddPage) {
    return (
      <div className="bg-gray-50 min-h-screen p-4 sm:p-6">
        {children}
      </div>
    );
  }

  // CO_AGENT on workspace pages: sidebar with limited nav filtered by subscription tier
  const isCoAgentWorkspace = role === "CO_AGENT" && !isCoAgentAddPage;

  const t = messages.admin;

  // Build CO_AGENT nav: filter by menu config for their tier
  const allowedKeys: string[] = menuConfig?.[userTier] ?? ALL_AGENT_MENU_ITEMS.map((i) => i.key);
  const agentNavItems = ALL_AGENT_MENU_ITEMS
    .filter((item) => allowedKeys.includes(item.key))
    .map((item) => ({
      href: item.href(locale),
      icon: item.icon,
      label: locale === "th" ? item.labelTh : item.labelEn,
    }));

  const navItems = [
    { href: `/${locale}/admin`, icon: LayoutDashboard, label: t.dashboard },
    { href: `/${locale}/admin/properties`, icon: Building2, label: t.propertyManagement },
    { href: `/${locale}/admin/projects`, icon: Layers, label: t.projectManagement || "Projects" },
    { href: `/${locale}/admin/users`, icon: Users, label: t.userManagement },
    { href: `/${locale}/admin/messages`, icon: Mail, label: locale === "th" ? "ข้อความติดต่อ" : "Messages", badge: unreadMessages },
    { href: `/${locale}/admin/articles`, icon: FileText, label: t.articleManagement },
    { href: `/${locale}/admin/portfolio`, icon: Trophy, label: t.portfolioManagement || "Portfolio" },
    { href: `/${locale}/admin/electricity-calculator`, icon: Zap, label: messages.electricityCalculator?.navLabel || "Electricity Calc" },
    { href: `/${locale}/admin/accounting`, icon: Wallet, label: t.accounting || "Accounting" },
    { href: `/${locale}/admin/contracts`, icon: FileSignature, label: locale === "th" ? "สัญญาเช่า" : "Contracts" },
    { href: `/${locale}/admin/closed-contracts`, icon: Lock, label: locale === "th" ? "Closed Contracts" : "Closed Contracts" },
    { href: `/${locale}/admin/subscriptions`, icon: Crown, label: locale === "th" ? "จัดการ Package" : "Subscriptions" },
    { href: `/${locale}/admin/menu-config`, icon: LayoutList, label: locale === "th" ? "เมนูตาม Package" : "Menu Config" },
    { href: `/${locale}/admin/reviews`, icon: Star, label: t.reviewModeration },
    { href: `/${locale}/admin/settings`, icon: Settings, label: t.settings || "Settings" },
    { href: `/${locale}/admin/settings/languages`, icon: Globe, label: t.languageSettings || "ตั้งค่าภาษา" },
  ];

  const renderNavList = (items: typeof navItems) => (
    <nav className="space-y-1">
      {items.map((item) => {
        const isActive = pathname === item.href || (item.href !== `/${locale}/agent` && pathname.startsWith(item.href));
        const badge = (item as any).badge as number | undefined;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              isActive ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`}
          >
            <item.icon className="w-4 h-4" />
            <span className="flex-1">{item.label}</span>
            {badge && badge > 0 ? (
              <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {badge > 99 ? "99+" : badge}
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
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-16 left-0 right-0 z-40 bg-gray-900 text-white px-4 py-2 flex items-center gap-3">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1">
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <span className="text-sm font-medium">{t.dashboard}</span>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar - Desktop: always visible, Mobile: slide-in */}
      <aside
        className={`
          fixed lg:relative top-0 left-0 z-40 w-64 flex-shrink-0 transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
        style={{ minHeight: "calc(100vh - 64px)" }}
      >
        <div className="h-full bg-gray-900 text-white">
          <div className="p-4 pt-20 lg:pt-4">
            <SidebarContent />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 bg-gray-50 p-4 sm:p-6 pt-16 lg:pt-6 min-w-0">
        {children}
      </div>
    </div>
  );
}
