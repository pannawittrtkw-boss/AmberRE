"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Zap, Loader2, X, Check, Search, RefreshCw, Bot } from "lucide-react";

interface AiAgent {
  id: number;
  name: string;
  position: string;
  duties: string;
  icon: string;
  color: string;
  isActive: boolean;
  actionType: string;
}

const ACTION_TYPES = [
  { value: "NONE", label: "ไม่มี action" },
  { value: "CONTENT_WRITER", label: "เขียน Description" },
];

const DEFAULT_AGENTS: Omit<AiAgent, "id">[] = [
  {
    name: "Content AI",
    position: "นักเขียน Content อสังหาริมทรัพย์",
    duties: "สร้างคำอธิบายทรัพย์สินภาษาไทยและภาษาอังกฤษที่น่าสนใจ ดึงดูดผู้เช่าและผู้ซื้อ โดยอ้างอิงจากข้อมูลทรัพย์สินที่มีอยู่ในระบบ",
    icon: "✍️",
    color: "#6366f1",
    isActive: true,
    actionType: "CONTENT_WRITER",
  },
];

const EMOJI_OPTIONS = ["🤖", "✍️", "📊", "🔍", "📣", "🏠", "💡", "🎯", "⚡", "🌟", "🧠", "📈"];

function AgentFormModal({
  agent,
  onClose,
  onSave,
}: {
  agent: Partial<AiAgent> | null;
  onClose: () => void;
  onSave: (data: Omit<AiAgent, "id">) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: agent?.name ?? "",
    position: agent?.position ?? "",
    duties: agent?.duties ?? "",
    icon: agent?.icon ?? "🤖",
    color: agent?.color ?? "#6366f1",
    isActive: agent?.isActive ?? true,
    actionType: agent?.actionType ?? "NONE",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form).finally(() => setSaving(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-bold text-gray-900">
            {agent?.id ? "แก้ไข AI Agent" : "เพิ่ม AI Agent"}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">Icon</label>
              <div className="flex flex-wrap gap-1.5 w-36">
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, icon: e }))}
                    className={`text-xl w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                      form.icon === e ? "bg-indigo-100 ring-2 ring-indigo-500" : "hover:bg-gray-100"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1.5 block">สี</label>
                <div className="flex gap-2 flex-wrap">
                  {["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, color: c }))}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        form.color === c ? "border-gray-900 scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Preview</label>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${form.color}cc, ${form.color})` }}
                >
                  {form.icon}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">ชื่อ Agent *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="เช่น Content AI"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">ตำแหน่ง *</label>
            <input
              value={form.position}
              onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
              required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="เช่น นักเขียน Content"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">หน้าที่ *</label>
            <textarea
              value={form.duties}
              onChange={(e) => setForm((f) => ({ ...f, duties: e.target.value }))}
              required
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="อธิบายหน้าที่ของ Agent..."
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">Action Type</label>
              <select
                value={form.actionType}
                onChange={(e) => setForm((f) => ({ ...f, actionType: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {ACTION_TYPES.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end pb-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                  className={`w-10 h-6 rounded-full transition-colors relative ${form.isActive ? "bg-green-500" : "bg-gray-300"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? "translate-x-5" : "translate-x-1"}`} />
                </div>
                <span className="text-xs font-medium text-gray-600">Active</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              บันทึก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ContentWriterModal({ agent, onClose }: { agent: AiAgent; onClose: () => void }) {
  const [propertyId, setPropertyId] = useState("");
  const [propertyTitle, setPropertyTitle] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ descriptionTh: string; descriptionEn: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const searchProperty = async () => {
    if (!propertyId.trim()) return;
    setSearching(true);
    setPropertyTitle(null);
    setResult(null);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/properties/${propertyId.trim()}`);
      const data = await res.json();
      if (data.success) {
        setPropertyTitle(data.data?.titleTh || data.data?.title || `Property #${propertyId}`);
      } else {
        setError("ไม่พบทรัพย์สิน");
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการค้นหา");
    } finally {
      setSearching(false);
    }
  };

  const generate = async () => {
    setGenerating(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/ai/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: parseInt(propertyId, 10) }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
        setSaved(true);
      } else {
        setError(data.error || "เกิดข้อผิดพลาด");
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 p-5 border-b sticky top-0 bg-white z-10">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ background: `linear-gradient(135deg, ${agent.color}cc, ${agent.color})` }}
          >
            {agent.icon}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">{agent.name}</h3>
            <p className="text-xs text-gray-500">{agent.position}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600">{agent.duties}</p>

          <div className="bg-indigo-50 rounded-xl p-4">
            <label className="text-xs font-semibold text-indigo-700 mb-2 block">Property ID</label>
            <div className="flex gap-2">
              <input
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchProperty()}
                className="flex-1 border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                placeholder="กรอก Property ID เช่น 42"
                type="number"
                min={1}
              />
              <button
                onClick={searchProperty}
                disabled={searching || !propertyId.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                ค้นหา
              </button>
            </div>

            {propertyTitle && (
              <div className="mt-2 flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
                <Check className="w-4 h-4 shrink-0" />
                <span className="font-medium">{propertyTitle}</span>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
          )}

          {propertyTitle && !result && (
            <button
              onClick={generate}
              disabled={generating}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-all"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังสร้าง Content...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  สร้าง Content ด้วย AI
                </>
              )}
            </button>
          )}

          {result && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                <Check className="w-4 h-4" />
                บันทึกลงระบบแล้ว
              </div>

              <div className="border rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <span className="text-xs font-semibold text-gray-600">ภาษาไทย</span>
                </div>
                <div className="p-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {result.descriptionTh}
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <span className="text-xs font-semibold text-gray-600">English</span>
                </div>
                <div className="p-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {result.descriptionEn}
                </div>
              </div>

              <button
                onClick={() => {
                  setResult(null);
                  setSaved(false);
                  setPropertyTitle(null);
                  setPropertyId("");
                }}
                className="w-full py-2.5 border border-indigo-300 text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-50 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                สร้างอีกรายการ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AiOfficePage() {
  const [agents, setAgents] = useState<AiAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editAgent, setEditAgent] = useState<Partial<AiAgent> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeAgent, setActiveAgent] = useState<AiAgent | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const loadAgents = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/ai-agents");
      const data = await res.json();
      if (data.success) setAgents(data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAgents(); }, [loadAgents]);

  const handleSave = async (formData: Omit<AiAgent, "id">) => {
    if (editAgent?.id) {
      await fetch(`/api/admin/ai-agents/${editAgent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
    } else {
      await fetch("/api/admin/ai-agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
    }
    setShowForm(false);
    setEditAgent(null);
    await loadAgents();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("ลบ AI Agent นี้?")) return;
    setDeleting(id);
    await fetch(`/api/admin/ai-agents/${id}`, { method: "DELETE" });
    setDeleting(null);
    await loadAgents();
  };

  const seedDefaults = async () => {
    for (const agent of DEFAULT_AGENTS) {
      await fetch("/api/admin/ai-agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agent),
      });
    }
    await loadAgents();
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl mb-6 bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] p-6 sm:p-8">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full opacity-20 animate-pulse"
              style={{
                width: Math.random() * 6 + 3 + "px",
                height: Math.random() * 6 + 3 + "px",
                background: ["#6366f1", "#a855f7", "#ec4899", "#3b82f6"][i % 4],
                top: Math.random() * 100 + "%",
                left: Math.random() * 100 + "%",
                animationDelay: i * 0.4 + "s",
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">AI Office</h1>
            </div>
            <p className="text-white/60 text-sm max-w-md">
              ทีม AI ที่ช่วยจัดการงานหลังบ้านอัตโนมัติ — จัดการและใช้งาน Agent ได้จากที่นี่
            </p>
          </div>
          <button
            onClick={() => { setEditAgent({}); setShowForm(true); }}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-sm font-medium transition-colors backdrop-blur border border-white/20"
          >
            <Plus className="w-4 h-4" />
            เพิ่ม Agent
          </button>
        </div>

        <div className="relative z-10 flex gap-4 mt-5">
          <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2.5 text-center">
            <p className="text-2xl font-bold text-white">{agents.length}</p>
            <p className="text-white/60 text-xs">ทั้งหมด</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2.5 text-center">
            <p className="text-2xl font-bold text-green-400">{agents.filter((a) => a.isActive).length}</p>
            <p className="text-white/60 text-xs">Active</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2.5 text-center">
            <p className="text-2xl font-bold text-indigo-300">{agents.filter((a) => a.actionType !== "NONE").length}</p>
            <p className="text-white/60 text-xs">มี Action</p>
          </div>
        </div>
      </div>

      {/* Agents grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto text-3xl">🤖</div>
          <p className="text-gray-600 font-medium">ยังไม่มี AI Agent</p>
          <p className="text-gray-400 text-sm">เพิ่ม Agent แรก หรือสร้างชุดเริ่มต้น</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => { setEditAgent({}); setShowForm(true); }}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              เพิ่ม Agent
            </button>
            <button
              onClick={seedDefaults}
              className="px-5 py-2.5 border border-indigo-300 text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-50 flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              สร้างชุดเริ่มต้น
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className={`relative bg-white rounded-2xl shadow-sm border overflow-hidden transition-all hover:shadow-md ${
                !agent.isActive ? "opacity-60" : ""
              }`}
            >
              {/* Card top accent */}
              <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${agent.color}, ${agent.color}88)` }} />

              <div className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-md shrink-0"
                    style={{ background: `linear-gradient(135deg, ${agent.color}cc, ${agent.color})` }}
                  >
                    {agent.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900 text-base">{agent.name}</h3>
                      {!agent.isActive && (
                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{agent.position}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-4">{agent.duties}</p>

                {agent.actionType !== "NONE" && (
                  <div className="mb-3">
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{ background: agent.color + "15", color: agent.color }}
                    >
                      <Zap className="w-3 h-3" />
                      {ACTION_TYPES.find((a) => a.value === agent.actionType)?.label || agent.actionType}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-3 border-t">
                  {agent.actionType !== "NONE" && agent.isActive && (
                    <button
                      onClick={() => setActiveAgent(agent)}
                      className="flex-1 py-2 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      style={{ background: `linear-gradient(135deg, ${agent.color}dd, ${agent.color})` }}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      ใช้งาน
                    </button>
                  )}
                  <button
                    onClick={() => { setEditAgent(agent); setShowForm(true); }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(agent.id)}
                    disabled={deleting === agent.id}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    {deleting === agent.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add new card */}
          <button
            onClick={() => { setEditAgent({}); setShowForm(true); }}
            className="bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all flex flex-col items-center justify-center gap-3 p-8 text-gray-400 hover:text-indigo-600 min-h-[200px]"
          >
            <div className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-indigo-100 flex items-center justify-center transition-colors">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium">เพิ่ม AI Agent</span>
          </button>
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <AgentFormModal
          agent={editAgent}
          onClose={() => { setShowForm(false); setEditAgent(null); }}
          onSave={handleSave}
        />
      )}

      {activeAgent?.actionType === "CONTENT_WRITER" && (
        <ContentWriterModal
          agent={activeAgent}
          onClose={() => setActiveAgent(null)}
        />
      )}
    </div>
  );
}
