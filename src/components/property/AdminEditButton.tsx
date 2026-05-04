"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Edit3, Settings } from "lucide-react";

interface AdminEditButtonProps {
  propertyId: number;
  locale: string;
  variant?: "card" | "top";
}

export default function AdminEditButton({ propertyId, locale, variant = "card" }: AdminEditButtonProps) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  if (role !== "ADMIN") return null;

  if (variant === "top") {
    return (
      <Link
        href={`/${locale}/admin/properties/add?edit=${propertyId}`}
        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors text-sm"
      >
        <Edit3 className="w-4 h-4" />
        แก้ไขข้อมูลห้อง
      </Link>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3 text-amber-800">
        <Settings className="w-4 h-4" />
        <span className="text-sm font-semibold">Admin Tools</span>
      </div>
      <Link
        href={`/${locale}/admin/properties/add?edit=${propertyId}`}
        className="flex items-center justify-center gap-2 w-full py-2.5 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors text-sm"
      >
        <Edit3 className="w-4 h-4" />
        แก้ไขข้อมูลห้อง
      </Link>
    </div>
  );
}
