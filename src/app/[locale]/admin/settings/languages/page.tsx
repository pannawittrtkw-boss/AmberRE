"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Search,
  Save,
  Check,
  Plus,
  Trash2,
  X,
  ChevronDown,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface TranslationRow {
  key: string;
  th: string;
  en: string;
  zh: string;
  my: string;
}

type LocaleCode = "th" | "en" | "zh" | "my";

const LOCALE_LABELS: Record<LocaleCode, string> = {
  th: "ไทย (TH)",
  en: "English (EN)",
  zh: "中文 (ZH)",
  my: "Myanmar (MY)",
};

const LOCALE_FLAGS: Record<LocaleCode, string> = {
  th: "TH",
  en: "EN",
  zh: "ZH",
  my: "MY",
};

export default function LanguagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState("th");
  const [messages, setMessages] = useState<any>(null);
  const [rows, setRows] = useState<TranslationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSection, setFilterSection] = useState<string>("all");
  const [editingCell, setEditingCell] = useState<{
    key: string;
    locale: LocaleCode;
  } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedCell, setSavedCell] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValues, setNewValues] = useState({ th: "", en: "", zh: "", my: "" });
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ locale: l }) => {
      setLocale(l);
      import(`@/messages/${l}.json`).then((m) => setMessages(m.default));
    });
  }, [params]);

  const fetchTranslations = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/languages");
      const data = await res.json();
      if (data.success) setRows(data.data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTranslations();
  }, [fetchTranslations]);

  // Get unique sections (top-level keys)
  const sections = Array.from(
    new Set(rows.map((r) => r.key.split(".")[0]))
  ).sort();

  // Toggle section expanded/collapsed
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  // Expand all / collapse all
  const expandAll = () => setExpandedSections(new Set(sections));
  const collapseAll = () => setExpandedSections(new Set());

  // Filter rows
  const filteredRows = rows.filter((row) => {
    const matchesSearch =
      !search ||
      row.key.toLowerCase().includes(search.toLowerCase()) ||
      row.th.toLowerCase().includes(search.toLowerCase()) ||
      row.en.toLowerCase().includes(search.toLowerCase()) ||
      row.zh.toLowerCase().includes(search.toLowerCase()) ||
      row.my.toLowerCase().includes(search.toLowerCase());

    const matchesSection =
      filterSection === "all" || row.key.startsWith(filterSection + ".");

    return matchesSearch && matchesSection;
  });

  // Group rows by section
  const groupedRows: Record<string, TranslationRow[]> = {};
  for (const row of filteredRows) {
    const section = row.key.split(".")[0];
    if (!groupedRows[section]) groupedRows[section] = [];
    groupedRows[section].push(row);
  }

  // Find missing translations
  const getMissingLocales = (row: TranslationRow): LocaleCode[] => {
    const missing: LocaleCode[] = [];
    if (!row.th) missing.push("th");
    if (!row.en) missing.push("en");
    if (!row.zh) missing.push("zh");
    if (!row.my) missing.push("my");
    return missing;
  };

  const startEdit = (key: string, loc: LocaleCode, currentValue: string) => {
    setEditingCell({ key, locale: loc });
    setEditValue(currentValue);
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const saveEdit = async () => {
    if (!editingCell) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/languages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: editingCell.key,
          locale: editingCell.locale,
          value: editValue,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRows((prev) =>
          prev.map((r) =>
            r.key === editingCell.key
              ? { ...r, [editingCell.locale]: editValue }
              : r
          )
        );
        const cellId = `${editingCell.key}-${editingCell.locale}`;
        setSavedCell(cellId);
        setTimeout(() => setSavedCell(null), 1500);
      }
    } catch {}
    setSaving(false);
    setEditingCell(null);
  };

  const addNewKey = async () => {
    if (!newKey.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/languages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: newKey,
          ...newValues,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchTranslations();
        setShowAddModal(false);
        setNewKey("");
        setNewValues({ th: "", en: "", zh: "", my: "" });
      }
    } catch {}
    setSaving(false);
  };

  const deleteKey = async (key: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/languages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      if (data.success) {
        setRows((prev) => prev.filter((r) => r.key !== key));
      }
    } catch {}
    setSaving(false);
    setDeleteConfirm(null);
  };

  if (!messages || loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );

  const t = messages.admin;
  const missingCount = rows.filter((r) => getMissingLocales(r).length > 0).length;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link
          href={`/${locale}/admin/settings`}
          className="hover:text-blue-600"
        >
          {t.settings}
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">
          {locale === "th" ? "ตั้งค่าภาษา" : "Language Settings"}
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {locale === "th" ? "ตั้งค่าภาษา" : "Language Settings"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {locale === "th"
              ? `ทั้งหมด ${rows.length} คีย์ ${missingCount > 0 ? `(ขาดคำแปล ${missingCount} คีย์)` : "(ครบทุกคำแปล)"}`
              : `Total ${rows.length} keys ${missingCount > 0 ? `(${missingCount} missing)` : "(all complete)"}`}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {locale === "th" ? "เพิ่มคีย์ใหม่" : "Add New Key"}
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              locale === "th"
                ? "ค้นหาด้วย key หรือคำแปล..."
                : "Search by key or translation..."
            }
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterSection}
          onChange={(e) => setFilterSection(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">
            {locale === "th" ? "ทุกหมวดหมู่" : "All Sections"}
          </option>
          {sections.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            {locale === "th" ? "ขยายทั้งหมด" : "Expand All"}
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            {locale === "th" ? "ยุบทั้งหมด" : "Collapse All"}
          </button>
        </div>
      </div>

      {/* Translation Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {Object.keys(groupedRows)
          .sort()
          .map((section) => {
            const sectionRows = groupedRows[section];
            const isExpanded = expandedSections.has(section);
            const sectionMissing = sectionRows.filter(
              (r) => getMissingLocales(r).length > 0
            ).length;

            return (
              <div key={section} className="border-b last:border-b-0">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                    <span className="font-semibold text-sm text-gray-800">
                      {section}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({sectionRows.length}{" "}
                      {locale === "th" ? "คีย์" : "keys"})
                    </span>
                    {sectionMissing > 0 && (
                      <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        <AlertCircle className="w-3 h-3" />
                        {sectionMissing}
                      </span>
                    )}
                  </div>
                </button>

                {/* Section Rows */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50/50">
                          <th className="text-left px-4 py-2 font-medium text-gray-500 w-[200px] min-w-[200px]">
                            Key
                          </th>
                          {(
                            Object.keys(LOCALE_FLAGS) as LocaleCode[]
                          ).map((loc) => (
                            <th
                              key={loc}
                              className="text-left px-4 py-2 font-medium text-gray-500 min-w-[200px]"
                            >
                              {LOCALE_LABELS[loc]}
                            </th>
                          ))}
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {sectionRows.map((row) => {
                          const missing = getMissingLocales(row);
                          return (
                            <tr
                              key={row.key}
                              className={`border-b last:border-b-0 hover:bg-blue-50/30 ${
                                missing.length > 0 ? "bg-amber-50/30" : ""
                              }`}
                            >
                              <td className="px-4 py-2.5 font-mono text-xs text-gray-600 align-top break-all">
                                {row.key.replace(`${section}.`, "")}
                              </td>
                              {(
                                Object.keys(LOCALE_FLAGS) as LocaleCode[]
                              ).map((loc) => {
                                const cellId = `${row.key}-${loc}`;
                                const isEditing =
                                  editingCell?.key === row.key &&
                                  editingCell?.locale === loc;
                                const isSaved = savedCell === cellId;
                                const value = row[loc];

                                return (
                                  <td
                                    key={loc}
                                    className="px-4 py-2.5 align-top"
                                  >
                                    {isEditing ? (
                                      <div className="flex flex-col gap-1.5">
                                        <textarea
                                          value={editValue}
                                          onChange={(e) =>
                                            setEditValue(e.target.value)
                                          }
                                          className="w-full px-2.5 py-1.5 border-2 border-blue-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                          rows={2}
                                          autoFocus
                                          onKeyDown={(e) => {
                                            if (
                                              e.key === "Enter" &&
                                              !e.shiftKey
                                            ) {
                                              e.preventDefault();
                                              saveEdit();
                                            }
                                            if (e.key === "Escape")
                                              cancelEdit();
                                          }}
                                        />
                                        <div className="flex gap-1">
                                          <button
                                            onClick={saveEdit}
                                            disabled={saving}
                                            className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                                          >
                                            {saving ? (
                                              <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                              <Save className="w-3 h-3" />
                                            )}
                                            {locale === "th"
                                              ? "บันทึก"
                                              : "Save"}
                                          </button>
                                          <button
                                            onClick={cancelEdit}
                                            className="px-2 py-1 text-gray-500 hover:text-gray-700 rounded text-xs border"
                                          >
                                            {locale === "th"
                                              ? "ยกเลิก"
                                              : "Cancel"}
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div
                                        onClick={() =>
                                          startEdit(row.key, loc, value)
                                        }
                                        className={`cursor-pointer px-2 py-1 rounded text-sm min-h-[28px] transition-colors ${
                                          isSaved
                                            ? "bg-green-100 text-green-800"
                                            : value
                                            ? "hover:bg-blue-50"
                                            : "bg-red-50 text-red-400 hover:bg-red-100 italic"
                                        }`}
                                      >
                                        {isSaved ? (
                                          <span className="flex items-center gap-1">
                                            <Check className="w-3 h-3" />
                                            {editValue || value}
                                          </span>
                                        ) : value ? (
                                          value
                                        ) : (
                                          locale === "th"
                                            ? "ยังไม่มีคำแปล"
                                            : "Missing"
                                        )}
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                              <td className="px-2 py-2.5 align-top">
                                {deleteConfirm === row.key ? (
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => deleteKey(row.key)}
                                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                                      title="Confirm delete"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirm(null)}
                                      className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setDeleteConfirm(row.key)}
                                    className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                    title="Delete key"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}

        {Object.keys(groupedRows).length === 0 && (
          <div className="text-center py-12 text-gray-400">
            {locale === "th"
              ? "ไม่พบคำแปลที่ตรงกับการค้นหา"
              : "No translations match your search"}
          </div>
        )}
      </div>

      {/* Add New Key Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-lg w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">
                {locale === "th" ? "เพิ่มคีย์ใหม่" : "Add New Key"}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key (e.g. common.newLabel)
                </label>
                <input
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="section.keyName"
                />
              </div>

              {(Object.keys(LOCALE_LABELS) as LocaleCode[]).map((loc) => (
                <div key={loc}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {LOCALE_LABELS[loc]}
                  </label>
                  <input
                    type="text"
                    value={newValues[loc]}
                    onChange={(e) =>
                      setNewValues((prev) => ({
                        ...prev,
                        [loc]: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={addNewKey}
                  disabled={saving || !newKey.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {locale === "th" ? "เพิ่ม" : "Add"}
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2.5 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  {locale === "th" ? "ยกเลิก" : "Cancel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
