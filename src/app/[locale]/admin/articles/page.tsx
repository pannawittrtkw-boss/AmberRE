"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Loader2, Edit3, Trash2, Calendar } from "lucide-react";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "Today";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} months ago`;
}

export default function AdminArticlesPage() {
  const { locale } = useParams();
  const router = useRouter();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/articles?limit=100");
      const data = await res.json();
      if (data.success) setArticles(data.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchArticles(); }, []);

  const handleDelete = async (slug: string) => {
    if (!confirm("ยืนยันการลบบทความนี้?")) return;
    await fetch(`/api/articles/${slug}`, { method: "DELETE" });
    fetchArticles();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-600" /></div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Article Management</h1>
          <p className="text-sm text-gray-500 mt-1">Create, edit, and manage your articles.</p>
        </div>
      </div>

      {/* Article List */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-semibold text-sm text-gray-700">Article List</h2>
          <span className="text-xs text-gray-400">A list of all articles on your website.</span>
        </div>

        <div className="flex justify-end px-4 py-3">
          <Link
            href={`/${locale}/admin/articles/new`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#C8A951] text-white rounded-lg hover:bg-[#B8993F] transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Article
          </Link>
        </div>

        {/* Desktop Table */}
        <table className="w-full hidden sm:table">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Image</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Title</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 hidden lg:table-cell">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Last Updated</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {articles.map((article) => (
              <tr key={article.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  {article.featuredImage ? (
                    <img src={article.featuredImage} alt="" className="w-16 h-12 object-cover rounded" />
                  ) : (
                    <div className="w-16 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-[10px]">No img</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">{article.titleTh}</p>
                  {article.titleEn && <p className="text-xs text-gray-400 line-clamp-1">{article.titleEn}</p>}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                    {article.category?.nameTh || "-"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{timeAgo(article.updatedAt || article.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => router.push(`/${locale}/admin/articles/new?edit=${article.slug}`)}
                      className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(article.slug)}
                      className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mobile Cards */}
        <div className="sm:hidden divide-y">
          {articles.map((article) => (
            <div key={article.id} className="p-4 flex items-center gap-3">
              {article.featuredImage ? (
                <img src={article.featuredImage} alt="" className="w-14 h-14 object-cover rounded shrink-0" />
              ) : (
                <div className="w-14 h-14 bg-gray-100 rounded shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{article.titleTh}</p>
                <p className="text-xs text-gray-500 mt-0.5">{timeAgo(article.updatedAt || article.createdAt)}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => router.push(`/${locale}/admin/articles/new?edit=${article.slug}`)}
                  className="p-2 text-blue-600"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(article.slug)} className="p-2 text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {articles.length === 0 && (
          <div className="py-16 text-center text-gray-400">No articles yet</div>
        )}
      </div>
    </div>
  );
}
