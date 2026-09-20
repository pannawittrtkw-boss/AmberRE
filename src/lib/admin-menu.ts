import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, Building2, Users, FileText, Star, Settings, Trophy, Zap, Globe, Wallet,
  Layers, Mail, FileSignature, Lock, Crown, LayoutList, UserSearch, CalendarDays, Percent,
  BarChart3, Bot, CloudUpload,
} from "lucide-react";

export interface AdminMenuItem {
  key: string;
  icon: LucideIcon;
  hrefSuffix: string; // relative to /{locale}/admin ("" = the admin dashboard root itself)
  labelTh: string;
  labelEn: string;
  group: "admin" | "shared"; // admin-only vs. also assignable to an agent's package tier
}

// Single source of truth for every admin page that's gated by package
// config. The sidebar nav (admin/layout.tsx) and the package config page +
// API (admin/menu-config) all read from this one list — a new admin page
// only needs to be registered here once. Previously these lived as three
// separately hand-maintained lists that silently drifted out of sync
// (a new page would work fine via direct URL but never show up as a
// selectable row in the package config screen, or even in the sidebar).
export const ADMIN_MENU_ITEMS: AdminMenuItem[] = [
  // ─── Admin-only pages ─────────────────────────────────────────────────
  { key: "dashboard",              icon: LayoutDashboard, hrefSuffix: "",                       labelTh: "Dashboard (Admin)",        labelEn: "Dashboard (Admin)",     group: "admin" },
  { key: "users",                  icon: Users,           hrefSuffix: "/users",                 labelTh: "จัดการผู้ใช้",              labelEn: "User Management",       group: "admin" },
  { key: "subscriptions",          icon: Crown,           hrefSuffix: "/subscriptions",         labelTh: "จัดการ Package",           labelEn: "Subscriptions",         group: "admin" },
  { key: "commission-tiers",       icon: Percent,         hrefSuffix: "/commission-tiers",      labelTh: "ตั้งค่าค่าคอมมิชชั่น",       labelEn: "Commission Tiers",      group: "admin" },
  { key: "commission-overview",    icon: BarChart3,       hrefSuffix: "/commission-overview",   labelTh: "ภาพรวมค่าคอม Agent",       labelEn: "Commission Overview",   group: "admin" },
  { key: "settings",               icon: Settings,        hrefSuffix: "/settings",              labelTh: "ตั้งค่า",                  labelEn: "Settings",              group: "admin" },
  { key: "languages",              icon: Globe,           hrefSuffix: "/settings/languages",    labelTh: "ตั้งค่าภาษา",              labelEn: "Language Settings",     group: "admin" },
  // ─── Shared pages (Admin + Agent Workspace, assignable per package tier) ─
  { key: "agent-dashboard",        icon: LayoutDashboard, hrefSuffix: "/agent-dashboard",       labelTh: "ภาพรวม (Agent Dashboard)", labelEn: "Agent Dashboard",       group: "shared" },
  { key: "properties",             icon: Building2,       hrefSuffix: "/properties",            labelTh: "ทรัพย์สิน",                labelEn: "Properties",            group: "shared" },
  { key: "projects",               icon: Layers,          hrefSuffix: "/projects",              labelTh: "โครงการ",                  labelEn: "Projects",              group: "shared" },
  { key: "customer-leads",         icon: UserSearch,      hrefSuffix: "/customer-leads",        labelTh: "Matching ลูกค้า",           labelEn: "Customer Matching",     group: "shared" },
  { key: "contracts",              icon: FileSignature,   hrefSuffix: "/contracts",             labelTh: "สัญญาเช่า",                labelEn: "Contracts",             group: "shared" },
  { key: "contract-calendar",      icon: CalendarDays,    hrefSuffix: "/calendar",              labelTh: "ปฏิทินสัญญา",              labelEn: "Contract Calendar",     group: "shared" },
  { key: "closed-contracts",       icon: Lock,            hrefSuffix: "/closed-contracts",      labelTh: "สัญญาที่ปิดแล้ว",          labelEn: "Closed Contracts",      group: "shared" },
  { key: "electricity-calculator", icon: Zap,             hrefSuffix: "/electricity-calculator",labelTh: "คำนวณค่าไฟ",               labelEn: "Electricity Calc",      group: "shared" },
  { key: "accounting",             icon: Wallet,          hrefSuffix: "/accounting",            labelTh: "งบการเงิน / บัญชี",         labelEn: "Accounting",            group: "shared" },
  { key: "messages",               icon: Mail,            hrefSuffix: "/messages",              labelTh: "ข้อความติดต่อ",             labelEn: "Messages",              group: "shared" },
  { key: "reviews",                icon: Star,            hrefSuffix: "/reviews",               labelTh: "รีวิว",                    labelEn: "Reviews",               group: "shared" },
  { key: "portfolio",              icon: Trophy,          hrefSuffix: "/portfolio",             labelTh: "Portfolio",                labelEn: "Portfolio",             group: "shared" },
  { key: "articles",               icon: FileText,        hrefSuffix: "/articles",              labelTh: "บทความ",                   labelEn: "Articles",              group: "shared" },
];

// Utility/ops pages that always render in the admin sidebar regardless of
// package config — not meant to be tier-gated (agents can't reach them
// either way), so intentionally excluded from ADMIN_MENU_ITEMS and the
// config grid: there's nothing meaningful to toggle.
export const ALWAYS_VISIBLE_NAV_ITEMS: AdminMenuItem[] = [
  { key: "menu-config",       icon: LayoutList,   hrefSuffix: "/menu-config",                 labelTh: "เมนูตาม Package",         labelEn: "Menu Config",           group: "admin" },
  { key: "storage-migration", icon: CloudUpload,  hrefSuffix: "/settings/storage-migration",  labelTh: "ย้ายไฟล์ไป Cloudflare",   labelEn: "Migrate to Cloudflare", group: "admin" },
  { key: "ai-office",         icon: Bot,          hrefSuffix: "/ai-office",                   labelTh: "AI Office",             labelEn: "AI Office",             group: "admin" },
  { key: "scanlink",          icon: FileText,     hrefSuffix: "/scanlink",                    labelTh: "ScanLink",              labelEn: "ScanLink",              group: "admin" },
];

export const ALWAYS_VISIBLE_ADMIN_KEYS = ALWAYS_VISIBLE_NAV_ITEMS.map((i) => i.key);

export const ALL_MENU_KEYS = ADMIN_MENU_ITEMS.map((m) => m.key);

export const DEFAULT_MENU_CONFIG: Record<string, string[]> = {
  STANDARD: ["agent-dashboard", "properties"],
  PRO:      ["agent-dashboard", "properties", "projects", "customer-leads", "contracts", "electricity-calculator", "accounting"],
  ELITE:    ["agent-dashboard", "properties", "projects", "customer-leads", "contracts", "closed-contracts", "electricity-calculator", "accounting", "messages", "reviews"],
  ADMIN:    ALL_MENU_KEYS,
};
