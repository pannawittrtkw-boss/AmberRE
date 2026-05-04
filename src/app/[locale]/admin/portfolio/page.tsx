"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2, Edit3, Trash2, X, Upload } from "lucide-react";

const CATEGORIES = [
  { value: "RENT_CONDO", label: "Rent Condo" },
  { value: "SALE_CONDO", label: "Sale Condo" },
  { value: "RENT_HOUSE", label: "Rent House" },
  { value: "SALE_HOUSE", label: "Sale House" },
];

function getCategoryLabel(val: string) {
  return CATEGORIES.find((c) => c.value === val)?.label || val;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "Today";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} months ago`;
}

export default function AdminPortfolioPage() {
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [category, setCategory] = useState("RENT_CONDO");
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainImagePreview, setMainImagePreview] = useState("");
  const [propImageFile, setPropImageFile] = useState<File | null>(null);
  const [propImagePreview, setPropImagePreview] = useState("");

  const fetchStories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/success-stories");
      const data = await res.json();
      if (data.success) setStories(data.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchStories(); }, []);

  const openAdd = () => {
    setEditing(null);
    setCategory("RENT_CONDO");
    setMainImageFile(null);
    setMainImagePreview("");
    setPropImageFile(null);
    setPropImagePreview("");
    setShowModal(true);
  };

  const openEdit = (story: any) => {
    setEditing(story);
    setCategory(story.category || "RENT_CONDO");
    setMainImageFile(null);
    setMainImagePreview(story.imageUrl || "");
    setPropImageFile(null);
    setPropImagePreview(story.propertyImageUrl || "");
    setShowModal(true);
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    return data.success ? data.data?.url : null;
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      let imageUrl = editing?.imageUrl || null;
      let propertyImageUrl = editing?.propertyImageUrl || null;

      if (mainImageFile) {
        imageUrl = await uploadFile(mainImageFile);
      }
      if (propImageFile) {
        propertyImageUrl = await uploadFile(propImageFile);
      }

      const payload = {
        ...(editing && { id: editing.id }),
        titleTh: getCategoryLabel(category),
        category,
        imageUrl,
        propertyImageUrl,
      };

      await fetch("/api/success-stories", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setShowModal(false);
      fetchStories();
    } catch {
      alert("Error saving");
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("ยืนยันการลบ?")) return;
    await fetch(`/api/success-stories?id=${id}`, { method: "DELETE" });
    fetchStories();
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPreview: (s: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-600" /></div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Success Stories</h1>
          <p className="text-sm text-gray-500 mt-1">A list of all success stories for your portfolio page.</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#C8A951] text-white rounded-lg hover:bg-[#B8993F] transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Story
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {/* Desktop table */}
        <table className="w-full hidden sm:table">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Main Image</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Property Image</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date Added</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {stories.map((story) => (
              <tr key={story.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  {story.imageUrl ? (
                    <img src={story.imageUrl} alt="" className="w-32 h-24 object-cover rounded-lg" />
                  ) : (
                    <div className="w-32 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">No image</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {story.propertyImageUrl ? (
                    <img src={story.propertyImageUrl} alt="" className="w-32 h-24 object-cover rounded-lg" />
                  ) : (
                    <div className="w-32 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">No image</div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{getCategoryLabel(story.category)}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{timeAgo(story.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(story)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(story.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mobile cards */}
        <div className="sm:hidden divide-y">
          {stories.map((story) => (
            <div key={story.id} className="p-4 space-y-3">
              <div className="flex gap-3">
                {story.imageUrl ? (
                  <img src={story.imageUrl} alt="" className="w-20 h-20 object-cover rounded-lg shrink-0" />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded-lg shrink-0" />
                )}
                {story.propertyImageUrl ? (
                  <img src={story.propertyImageUrl} alt="" className="w-20 h-20 object-cover rounded-lg shrink-0" />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded-lg shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{getCategoryLabel(story.category)}</div>
                  <div className="text-xs text-gray-500 mt-1">{timeAgo(story.createdAt)}</div>
                </div>
              </div>
              <div className="flex justify-end gap-1">
                <button onClick={() => openEdit(story)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(story.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {stories.length === 0 && (
          <div className="py-16 text-center text-gray-400">No success stories yet</div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">{editing ? "Edit Story" : "Add New Success Story"}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-semibold mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-[#C8A951] rounded-lg px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-[#C8A951] outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Images */}
              <div className="grid grid-cols-2 gap-4">
                {/* Main Image */}
                <div>
                  <label className="block text-sm font-semibold mb-1">Main Image</label>
                  <label className="block cursor-pointer">
                    {mainImagePreview ? (
                      <div className="relative">
                        <img src={mainImagePreview} alt="" className="w-full aspect-square object-cover rounded-lg border" />
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); setMainImageFile(null); setMainImagePreview(""); }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                        <Upload className="w-6 h-6 text-gray-400" />
                        <span className="text-xs text-gray-400">Click to upload</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, setMainImageFile, setMainImagePreview)}
                    />
                  </label>
                </div>

                {/* Property Image */}
                <div>
                  <label className="block text-sm font-semibold mb-1">Property Image (Sold)</label>
                  <label className="block cursor-pointer">
                    {propImagePreview ? (
                      <div className="relative">
                        <img src={propImagePreview} alt="" className="w-full aspect-square object-cover rounded-lg border" />
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); setPropImageFile(null); setPropImagePreview(""); }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                        <Upload className="w-6 h-6 text-gray-400" />
                        <span className="text-xs text-gray-400">Click to upload</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, setPropImageFile, setPropImagePreview)}
                    />
                  </label>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#C8A951] text-white rounded-lg font-medium text-sm hover:bg-[#B8993F] transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editing ? "Update Story" : "Add Story"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
