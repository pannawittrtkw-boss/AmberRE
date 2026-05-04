"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Loader2,
  Search,
  MapPin,
  Building2,
  Layers,
  Star,
  Calendar,
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
}

export default function ProjectsListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState("th");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [heroImage, setHeroImage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/site-settings?keys=projectsHeroImage")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setHeroImage(d.data.projectsHeroImage || null);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    params.then(({ locale: l }) => setLocale(l));
  }, [params]);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/projects${search ? `?search=${encodeURIComponent(search)}` : ""}`
      );
      const data = await res.json();
      if (data.success) setProjects(data.data);
    } catch {}
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchProjects, 300);
    return () => clearTimeout(t);
  }, [fetchProjects]);

  const featured = projects.filter((p) => p.isPopular);
  const others = projects.filter((p) => !p.isPopular);

  return (
    <div className="bg-stone-50 min-h-screen">
      {/* HERO — Luxe Black with Gold accents */}
      <section className="relative bg-stone-950 text-white py-12 md:py-14 overflow-hidden">
        {/* Background image (if set) */}
        {heroImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
        )}

        {/* Subtle radial gold glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(200,169,81,0.18),transparent_60%)]" />

        {/* Top fade gradient */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C8A951]/60 to-transparent" />

        {/* Corner gold blurs */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#C8A951]/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-[#C8A951]/10 rounded-full blur-3xl" />

        {/* Decorative dotted grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #C8A951 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-3 text-[#E8C97A] text-[11px] uppercase tracking-[0.3em] font-medium mb-3">
            <span className="w-10 h-px bg-gradient-to-r from-transparent to-[#C8A951]" />
            {locale === "th" ? "โครงการ" : "Projects"}
            <span className="w-10 h-px bg-gradient-to-l from-transparent to-[#C8A951]" />
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05] mb-3 tracking-tight">
            {locale === "th" ? (
              <>
                ค้นหา
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E8C97A] via-[#C8A951] to-[#8B6F2F]">
                  {" "}
                  โครงการ{" "}
                </span>
                คุณภาพ
              </>
            ) : (
              <>
                Explore Curated
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E8C97A] via-[#C8A951] to-[#8B6F2F]">
                  {" "}
                  Projects
                </span>
              </>
            )}
          </h1>

          {/* Gold accent line */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="w-12 h-px bg-[#C8A951]/40" />
            <span className="w-1.5 h-1.5 rotate-45 bg-[#C8A951]" />
            <span className="w-12 h-px bg-[#C8A951]/40" />
          </div>

          {/* Subtitle */}
          <p className="text-base md:text-lg text-stone-400 max-w-2xl mx-auto leading-relaxed font-light">
            {locale === "th"
              ? "รวมโครงการอสังหาริมทรัพย์ พร้อมข้อมูลครบครัน สิ่งอำนวยความสะดวก และห้องพร้อมเช่า/ขาย"
              : "Browse all projects with full details, facilities, and available units"}
          </p>

          {/* Search */}
          <div className="mt-6 max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                locale === "th"
                  ? "ค้นหาด้วยชื่อโครงการ, developer, ทำเล..."
                  : "Search by project name, developer, location..."
              }
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur text-white placeholder:text-stone-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A951]/40 focus:border-[#C8A951]/40 focus:bg-white/10 transition-all"
            />
          </div>
        </div>

        {/* Bottom fade gradient */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#C8A951]/60 to-transparent" />
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#C8A951]" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">
              {locale === "th"
                ? "ไม่พบโครงการ"
                : "No projects found"}
            </p>
          </div>
        ) : (
          <>
            {/* Featured */}
            {featured.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-[#C8A951] fill-[#C8A951]" />
                  <h2 className="text-xl font-bold">
                    {locale === "th" ? "โครงการแนะนำ" : "Featured Projects"}
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {featured.map((p) => (
                    <ProjectCard key={p.id} project={p} locale={locale} featured />
                  ))}
                </div>
              </section>
            )}

            {/* All */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">
                  {locale === "th" ? "โครงการทั้งหมด" : "All Projects"}
                </h2>
                <span className="text-sm text-gray-500">
                  {projects.length}{" "}
                  {locale === "th" ? "โครงการ" : "projects"}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {others.map((p) => (
                  <ProjectCard key={p.id} project={p} locale={locale} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  locale,
  featured,
}: {
  project: Project;
  locale: string;
  featured?: boolean;
}) {
  return (
    <Link
      href={`/${locale}/projects/${project.id}`}
      className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
    >
      {/* Image */}
      <div className="relative aspect-video bg-gray-100">
        {project.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.imageUrl}
            alt={project.nameTh}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300">
            <Building2 className="w-12 h-12" />
          </div>
        )}
        {featured && (
          <span className="absolute top-3 left-3 bg-[#C8A951] text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
            <Star className="w-3 h-3 fill-white" />
            {locale === "th" ? "แนะนำ" : "Featured"}
          </span>
        )}
        {project._count.properties > 0 && (
          <span className="absolute top-3 right-3 bg-white/95 text-gray-900 text-xs font-medium px-2.5 py-1 rounded-full shadow">
            {project._count.properties}{" "}
            {locale === "th" ? "ห้อง" : "units available"}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold text-lg line-clamp-1">{project.nameTh}</h3>
        {project.nameEn && (
          <p className="text-sm text-gray-500 line-clamp-1">{project.nameEn}</p>
        )}

        <div className="mt-3 space-y-1.5 text-sm text-gray-600">
          {project.developer && (
            <p className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate">{project.developer}</span>
            </p>
          )}
          {(project.location || project.district || project.province) && (
            <p className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate">
                {[project.location, project.district, project.province]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {project.totalUnits && (
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3" />
                {project.totalUnits} {locale === "th" ? "ยูนิต" : "units"}
              </span>
            )}
            {project.floors && (
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {project.floors} {locale === "th" ? "ชั้น" : "floors"}
              </span>
            )}
            {project.yearCompleted && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {project.yearCompleted}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
