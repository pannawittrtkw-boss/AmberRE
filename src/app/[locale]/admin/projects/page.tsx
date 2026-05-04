"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Loader2,
  Plus,
  Search,
  Pencil,
  Trash2,
  MapPin,
  Building2,
  Star,
  Layers,
} from "lucide-react";

interface Project {
  id: number;
  nameTh: string;
  nameEn: string | null;
  developer: string | null;
  imageUrl: string | null;
  province: string | null;
  district: string | null;
  isPopular: boolean;
  totalUnits: number | null;
  yearCompleted: number | null;
  _count: { properties: number };
}

export default function AdminProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState("th");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    params.then(({ locale: l }) => setLocale(l));
  }, [params]);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/projects${search ? `?search=${encodeURIComponent(search)}` : ""}`
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

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/projects/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert(data.error || "Delete failed");
      }
    } catch {
      alert("Delete failed");
    }
    setDeleteConfirm(null);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Project Management / จัดการโครงการ</h1>
          <p className="text-sm text-gray-500 mt-1">
            {projects.length} projects in database
          </p>
        </div>
        <Link
          href={`/${locale}/admin/projects/new`}
          className="flex items-center gap-2 bg-[#C8A951] hover:bg-[#B8993F] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Project
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by project name or developer..."
          className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
        />
      </div>

      {/* Project Grid */}
      {loading ? (
        <div className="text-center py-20">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#C8A951]" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border">
          <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500">No projects found</p>
          <Link
            href={`/${locale}/admin/projects/new`}
            className="inline-flex items-center gap-2 mt-4 text-sm text-[#C8A951] hover:underline"
          >
            <Plus className="w-4 h-4" />
            Add your first project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Image */}
              <div className="aspect-video bg-gray-100 relative">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.imageUrl}
                    alt={p.nameTh}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-300">
                    <Building2 className="w-12 h-12" />
                  </div>
                )}
                {p.isPopular && (
                  <span className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 fill-white" />
                    Popular
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-base line-clamp-1">{p.nameTh}</h3>
                {p.nameEn && (
                  <p className="text-xs text-gray-500 line-clamp-1">{p.nameEn}</p>
                )}

                <div className="mt-3 space-y-1 text-xs text-gray-500">
                  {p.developer && (
                    <p className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {p.developer}
                    </p>
                  )}
                  {(p.province || p.district) && (
                    <p className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {[p.district, p.province].filter(Boolean).join(", ")}
                    </p>
                  )}
                  <p className="flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    {p._count.properties} properties
                    {p.totalUnits ? ` / ${p.totalUnits} total units` : ""}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t">
                  <Link
                    href={`/${locale}/admin/projects/${p.id}/edit`}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </Link>
                  {deleteConfirm === p.id ? (
                    <>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-3 py-1.5 text-xs border rounded hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(p.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
