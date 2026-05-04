"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Building2, Users, FileText, UserCheck, Star, Loader2, Settings,
  Menu, X, Trophy, Zap, Globe, Wallet, Layers,
} from "lucide-react";

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

  useEffect(() => {
    params.then(({ locale: l }) => {
      setLocale(l);
      import(`@/messages/${l}.json`).then((m) => setMessages(m.default));
    });
  }, [params]);

  useEffect(() => {
    if (status === "unauthenticated") router.push(`/${locale}/auth/login`);
    if (session && (session.user as any)?.role !== "ADMIN") router.push(`/${locale}`);
  }, [session, status, router, locale]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (status === "loading" || !messages) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  if ((session?.user as any)?.role !== "ADMIN") return null;

  const t = messages.admin;
  const navItems = [
    { href: `/${locale}/admin`, icon: LayoutDashboard, label: t.dashboard },
    { href: `/${locale}/admin/properties`, icon: Building2, label: t.propertyManagement },
    { href: `/${locale}/admin/projects`, icon: Layers, label: t.projectManagement || "Projects" },
    { href: `/${locale}/admin/users`, icon: Users, label: t.userManagement },
    { href: `/${locale}/admin/articles`, icon: FileText, label: t.articleManagement },
    { href: `/${locale}/admin/portfolio`, icon: Trophy, label: t.portfolioManagement || "Portfolio" },
    { href: `/${locale}/admin/electricity-calculator`, icon: Zap, label: messages.electricityCalculator?.navLabel || "Electricity Calc" },
    { href: `/${locale}/admin/accounting`, icon: Wallet, label: t.accounting || "Accounting" },
    { href: `/${locale}/admin/co-agents`, icon: UserCheck, label: t.coAgentApproval },
    { href: `/${locale}/admin/reviews`, icon: Star, label: t.reviewModeration },
    { href: `/${locale}/admin/settings`, icon: Settings, label: t.settings || "Settings" },
    { href: `/${locale}/admin/settings/languages`, icon: Globe, label: t.languageSettings || "ตั้งค่าภาษา" },
  ];

  const SidebarContent = () => (
    <>
      <h2 className="text-lg font-bold mb-6">{t.dashboard}</h2>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
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
