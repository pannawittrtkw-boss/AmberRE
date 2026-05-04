"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import {
  ArrowLeft, Loader2, Upload, X,
  Bold, Italic, Strikethrough, Underline as UnderlineIcon,
  Heading1, Heading2, Heading3,
  List, ListOrdered, ImageIcon, Undo, Redo,
} from "lucide-react";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ก-๛]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    || `article-${Date.now()}`;
}

function MenuBar({ editor }: { editor: any }) {
  if (!editor) return null;

  const btnClass = (active: boolean) =>
    `p-2 rounded hover:bg-gray-200 transition-colors ${active ? "bg-gray-200 text-gray-900" : "text-gray-500"}`;

  const addImage = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success && data.data?.url) {
        editor.chain().focus().setImage({ src: data.data.url }).run();
      }
    };
    input.click();
  };

  return (
    <div className="flex items-center gap-0.5 flex-wrap border-b px-2 py-1.5 bg-gray-50 rounded-t-lg">
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btnClass(editor.isActive("heading", { level: 1 }))}>
        <Heading1 className="w-4 h-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive("heading", { level: 2 }))}>
        <Heading2 className="w-4 h-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btnClass(editor.isActive("heading", { level: 3 }))}>
        <Heading3 className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-gray-300 mx-1" />

      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive("bold"))}>
        <Bold className="w-4 h-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive("italic"))}>
        <Italic className="w-4 h-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btnClass(editor.isActive("strike"))}>
        <Strikethrough className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-gray-300 mx-1" />

      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive("bulletList"))}>
        <List className="w-4 h-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive("orderedList"))}>
        <ListOrdered className="w-4 h-4" />
      </button>

      <button type="button" onClick={addImage} className={btnClass(false)}>
        <ImageIcon className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-gray-300 mx-1" />

      <button type="button" onClick={() => editor.chain().focus().undo().run()} className={btnClass(false)} disabled={!editor.can().undo()}>
        <Undo className="w-4 h-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().redo().run()} className={btnClass(false)} disabled={!editor.can().redo()}>
        <Redo className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function CreateArticlePage() {
  const { locale } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editSlug = searchParams.get("edit");

  const [title, setTitle] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [categoryId, setCategoryId] = useState<number>(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!editSlug);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ HTMLAttributes: { class: "rounded-lg max-w-full mx-auto my-4" } }),
      Underline,
    ],
    content: "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none px-4 py-3 min-h-[300px] focus:outline-none",
      },
    },
  });

  // Fetch categories
  useEffect(() => {
    fetch("/api/articles?limit=1").then(async () => {
      // Fetch categories from DB
      const res = await fetch("/api/article-categories");
      const data = await res.json();
      if (data.success && data.data?.length > 0) {
        setCategories(data.data);
        if (!editSlug) setCategoryId(data.data[0].id);
      }
    }).catch(() => {});
  }, [editSlug]);

  // Load article for editing
  useEffect(() => {
    if (!editSlug || !editor) return;
    setLoading(true);
    fetch(`/api/articles/${editSlug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          const a = data.data;
          setTitle(a.titleTh || "");
          setFeaturedImage(a.featuredImage || "");
          setImagePreview(a.featuredImage || "");
          setCategoryId(a.categoryId);
          editor.commands.setContent(a.contentTh || "");
        }
      })
      .finally(() => setLoading(false));
  }, [editSlug, editor]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return alert("กรุณาใส่ชื่อบทความ");
    if (!editor) return;

    setSaving(true);
    try {
      let imageUrl = featuredImage;

      // Upload featured image if new
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (uploadData.success) imageUrl = uploadData.data?.url;
      }

      const content = editor.getHTML();
      const slug = editSlug || slugify(title) || `article-${Date.now()}`;

      const payload = {
        titleTh: title,
        contentTh: content,
        featuredImage: imageUrl || null,
        categoryId: categoryId || categories[0]?.id,
        slug,
      };

      const res = await fetch(
        editSlug ? `/api/articles/${editSlug}` : "/api/articles",
        {
          method: editSlug ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (data.success) {
        router.push(`/${locale}/admin/articles`);
      } else {
        alert(data.error || "Error saving article");
      }
    } catch {
      alert("Error saving article");
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-600" /></div>;

  return (
    <div>
      {/* Header */}
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-xl sm:text-2xl font-bold mb-1">{editSlug ? "Edit Article" : "Create New Article"}</h1>
      <p className="text-sm text-gray-500 mb-6">Fill in the details below to publish a new article.</p>

      <div className="bg-white rounded-xl border shadow-sm p-5 sm:p-6 max-w-3xl space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold mb-1">Article Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Top 5 Neighborhoods in Bangkok"
            className="w-full border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
          />
        </div>

        {/* Featured Image */}
        <div>
          <label className="block text-sm font-semibold mb-1">Featured Image</label>
          <div className="flex items-start gap-4">
            {imagePreview ? (
              <div className="relative w-60 h-36 rounded-lg overflow-hidden border">
                <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(""); setFeaturedImage(""); }}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="w-60 h-36 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm">
                No Image
              </div>
            )}
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-[#C8A951] text-[#C8A951] rounded-lg text-sm font-medium hover:bg-amber-50 transition-colors">
              <Upload className="w-4 h-4" />
              Upload Image
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          </div>
          <p className="text-xs text-gray-400 mt-1">Recommended aspect ratio 16:9 (e.g., 1920x1080 or 1280x720 pixels).</p>
        </div>

        {/* Category */}
        {categories.length > 0 && (
          <div>
            <label className="block text-sm font-semibold mb-1">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="w-full border rounded-lg px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-amber-500 outline-none"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.nameTh} / {cat.nameEn}</option>
              ))}
            </select>
          </div>
        )}

        {/* Rich Text Editor */}
        <div>
          <label className="block text-sm font-semibold mb-1">Content</label>
          <div className="border rounded-lg overflow-hidden">
            <MenuBar editor={editor} />
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-6 py-2.5 bg-[#C8A951] text-white rounded-lg font-medium text-sm hover:bg-[#B8993F] transition-colors disabled:opacity-50 inline-flex items-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {editSlug ? "Update Article" : "Publish Article"}
        </button>
      </div>
    </div>
  );
}
