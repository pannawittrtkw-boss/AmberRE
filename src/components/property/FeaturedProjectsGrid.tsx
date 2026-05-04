"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  Camera,
  MapPin,
  Building2,
  Layers,
  Calendar,
  Star,
  Home,
} from "lucide-react";

interface Project {
  id: number;
  nameTh: string;
  nameEn: string | null;
  developer: string | null;
  imageUrl: string | null;
  logoUrl: string | null;
  location: string | null;
  province: string | null;
  district: string | null;
  totalUnits: number | null;
  floors: number | null;
  yearCompleted: number | null;
  isPopular: boolean;
  _count: { properties: number };
  salesCount?: number;
  rentsCount?: number;
}

interface Props {
  locale: string;
}

export default function FeaturedProjectsGrid({ locale }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setProjects(d.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[#C8A951]" />
      </div>
    );
  }

  if (projects.length === 0) {
    return null;
  }

  // Take first 8 projects (popular ones first since API sorts by isPopular DESC)
  const displayProjects = projects.slice(0, 8);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayProjects.map((p) => (
          <ProjectCard key={p.id} project={p} locale={locale} />
        ))}
      </div>

      {/* View all */}
      {projects.length > 8 && (
        <div className="text-center mt-10">
          <Link
            href={`/${locale}/projects`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-full text-sm font-medium transition-colors"
          >
            {locale === "th"
              ? `ดูโครงการทั้งหมด (${projects.length})`
              : `View All Projects (${projects.length})`}
          </Link>
        </div>
      )}
    </>
  );
}

function ProjectCard({ project, locale }: { project: Project; locale: string }) {
  const title = locale !== "th" && project.nameEn ? project.nameEn : project.nameTh;
  const subtitle = locale !== "th" && project.nameTh !== project.nameEn ? project.nameTh : null;

  const locationParts = [project.location, project.district, project.province]
    .filter(Boolean)
    .join(", ");

  return (
    <Link href={`/${locale}/projects/${project.id}`} className="block group">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          {project.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.imageUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-300">
              <Building2 className="w-14 h-14" />
            </div>
          )}

          {/* Popular badge */}
          {project.isPopular && (
            <div className="absolute top-3 left-3 flex items-center gap-1 bg-[#C8A951] text-white text-xs font-medium px-2.5 py-1 rounded-full shadow">
              <Star className="w-3 h-3 fill-white" />
              {locale === "th" ? "แนะนำ" : "Featured"}
            </div>
          )}

          {/* Available units badge */}
          {project._count.properties > 0 && (
            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur text-stone-900 text-[10px] font-semibold px-2.5 py-1 rounded-full shadow flex items-center gap-1">
              <Home className="w-3 h-3" />
              {project._count.properties}{" "}
              {locale === "th" ? "ห้องว่าง" : "units"}
            </div>
          )}

          {/* Logo overlay */}
          {project.logoUrl && (
            <div className="absolute bottom-3 left-3 w-12 h-12 bg-white/95 backdrop-blur rounded-lg p-1.5 shadow">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={project.logoUrl}
                alt=""
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Status pills */}
          <div className="flex gap-1.5 mb-2">
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[11px] font-medium px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {locale === "th" ? "พร้อมเข้าอยู่" : "Ready"}
            </span>
            {project.developer && (
              <span className="inline-flex bg-amber-50 text-[#8B6F2F] text-[11px] font-medium px-2 py-0.5 rounded truncate max-w-[140px]">
                {project.developer}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-stone-900 text-base line-clamp-1">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-stone-500 line-clamp-1 mb-1">{subtitle}</p>
          )}

          {/* Location */}
          {locationParts && (
            <p className="flex items-center gap-1 text-xs text-stone-600 mt-1">
              <MapPin className="w-3 h-3 text-[#C8A951] shrink-0" />
              <span className="truncate">{locationParts}</span>
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-stone-600 mt-3">
            {project.totalUnits != null && (
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-stone-400" />
                {project.totalUnits.toLocaleString()}
              </span>
            )}
            {project.floors != null && (
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-stone-400" />
                {project.floors} {locale === "th" ? "ชั้น" : "Fl"}
              </span>
            )}
            {project.yearCompleted != null && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                {project.yearCompleted}
              </span>
            )}
          </div>

          {/* Bottom: rent / sale units split */}
          <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1">
              <div className="flex-1 bg-emerald-50 rounded-lg px-2.5 py-1.5">
                <div className="text-[9px] text-emerald-700 uppercase tracking-wider font-semibold">
                  {locale === "th" ? "เช่า" : "Rent"}
                </div>
                <div className="text-sm font-bold text-emerald-700 leading-tight">
                  {project.rentsCount ?? 0}
                  <span className="text-[10px] font-normal text-emerald-600 ml-0.5">
                    {locale === "th" ? "ห้อง" : "units"}
                  </span>
                </div>
              </div>
              <div className="flex-1 bg-amber-50 rounded-lg px-2.5 py-1.5">
                <div className="text-[9px] text-[#8B6F2F] uppercase tracking-wider font-semibold">
                  {locale === "th" ? "ขาย" : "Sale"}
                </div>
                <div className="text-sm font-bold text-[#8B6F2F] leading-tight">
                  {project.salesCount ?? 0}
                  <span className="text-[10px] font-normal text-[#8B6F2F] ml-0.5">
                    {locale === "th" ? "ห้อง" : "units"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* View link */}
          <div className="mt-2 text-right">
            <span className="text-xs font-medium text-stone-700 group-hover:text-[#C8A951] transition-colors">
              {locale === "th" ? "ดูรายละเอียด →" : "View →"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
