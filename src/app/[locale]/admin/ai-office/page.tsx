"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Zap, Loader2, X, Check, Search, RefreshCw, Bot, Monitor } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────
interface CharacterAppearance {
  skinColor: string;
  hairColor: string;
  hairStyle: "short" | "long" | "spiky" | "curly" | "bald";
  outfitColor: string;
  outfitStyle: "suit" | "casual" | "hoodie";
}

interface AiAgent {
  id: number;
  name: string;
  position: string;
  duties: string;
  icon: string;
  color: string;
  isActive: boolean;
  actionType: string;
  appearance?: string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────
const ACTION_TYPES = [
  { value: "NONE", label: "ไม่มี action" },
  { value: "CONTENT_WRITER", label: "เขียน Description" },
];

const SKIN_COLORS = ["#FFDBB4", "#F4A460", "#C68642", "#8B5E3C", "#3D1C02"];
const HAIR_COLORS = [
  "#1a1a2e", "#3D1C02", "#8B4513", "#D4AF37",
  "#C0392B", "#D3D3D3", "#8B5CF6", "#3B82F6", "#EC4899",
];
const HAIR_STYLES: { id: CharacterAppearance["hairStyle"]; label: string }[] = [
  { id: "short", label: "สั้น" },
  { id: "long", label: "ยาว" },
  { id: "spiky", label: "แหลม" },
  { id: "curly", label: "หยิก" },
  { id: "bald", label: "โล้น" },
];
const OUTFIT_COLORS = [
  "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899",
  "#EF4444", "#F59E0B", "#10B981", "#14B8A6", "#64748B", "#1e293b",
];
const OUTFIT_STYLES: { id: CharacterAppearance["outfitStyle"]; label: string }[] = [
  { id: "suit", label: "สูท" },
  { id: "casual", label: "เสื้อ" },
  { id: "hoodie", label: "ฮูดี้" },
];

const DEFAULT_APPEARANCE: CharacterAppearance = {
  skinColor: "#FFDBB4",
  hairColor: "#1a1a2e",
  hairStyle: "short",
  outfitColor: "#3B82F6",
  outfitStyle: "casual",
};

// ── Color helper ──────────────────────────────────────────────────────────
function dk(hex: string, a = 0.22): string {
  if (!hex.startsWith("#") || hex.length < 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r * (1 - a))},${Math.round(g * (1 - a))},${Math.round(b * (1 - a))})`;
}

function parseAppearance(raw?: string | null): CharacterAppearance {
  if (!raw) return DEFAULT_APPEARANCE;
  try { return { ...DEFAULT_APPEARANCE, ...JSON.parse(raw) }; } catch { return DEFAULT_APPEARANCE; }
}

// ── Character SVG ─────────────────────────────────────────────────────────
function AgentCharacter({
  appearance,
  size = 72,
  isActive = true,
}: {
  appearance: CharacterAppearance;
  size?: number;
  isActive?: boolean;
}) {
  const { skinColor, hairColor, hairStyle, outfitColor, outfitStyle } = appearance;

  const hair = () => {
    if (hairStyle === "bald") return null;
    if (hairStyle === "long")
      return (
        <>
          <rect x="8" y="2" width="24" height="10" rx="5" fill={hairColor} />
          <rect x="4" y="10" width="6" height="16" rx="3" fill={hairColor} />
          <rect x="30" y="10" width="6" height="16" rx="3" fill={hairColor} />
        </>
      );
    if (hairStyle === "spiky")
      return (
        <>
          <polygon points="10,10 14,0 18,10" fill={hairColor} />
          <polygon points="17,10 21,0 25,10" fill={hairColor} />
          <polygon points="24,10 27,2 30,10" fill={hairColor} />
          <rect x="9" y="7" width="22" height="6" rx="2" fill={hairColor} />
        </>
      );
    if (hairStyle === "curly")
      return (
        <>
          <ellipse cx="20" cy="7" rx="12" ry="8" fill={hairColor} />
          <circle cx="9" cy="13" r="5" fill={hairColor} />
          <circle cx="31" cy="13" r="5" fill={hairColor} />
        </>
      );
    // short
    return <rect x="8" y="2" width="24" height="10" rx="5" fill={hairColor} />;
  };

  const outfit = () => {
    if (outfitStyle === "suit")
      return (
        <>
          <rect x="7" y="32" width="26" height="20" rx="4" fill={outfitColor} />
          <path d="M20 33 L14 41 L20 43 L26 41 Z" fill={dk(outfitColor, 0.12)} />
          <path d="M16 33 L20 37 L24 33" stroke="white" strokeWidth="1.5" fill="none" />
          <path d="M20 36 L18 49 L20 51 L22 49 Z" fill="#ef4444" />
        </>
      );
    if (outfitStyle === "hoodie")
      return (
        <>
          <rect x="7" y="32" width="26" height="20" rx="4" fill={outfitColor} />
          <path d="M7 32 Q20 23 33 32" stroke={dk(outfitColor)} strokeWidth="2" fill="none" />
          <rect x="14" y="43" width="12" height="7" rx="3" fill={dk(outfitColor, 0.14)} />
        </>
      );
    // casual
    return (
      <>
        <rect x="7" y="32" width="26" height="20" rx="4" fill={outfitColor} />
        <path d="M16 32 L20 38 L24 32" stroke={dk(outfitColor)} strokeWidth="1.5" fill="none" />
        <rect x="22" y="36" width="6" height="5" rx="1.5" fill={dk(outfitColor, 0.1)} />
      </>
    );
  };

  return (
    <svg width={size} height={size * 1.55} viewBox="0 0 40 62">
      {/* Shadow */}
      <ellipse cx="20" cy="61" rx="12" ry="2.5" fill="rgba(0,0,0,0.12)" />
      {/* Shoes */}
      <rect x="7" y="57" width="11" height="5" rx="2.5" fill="#1e293b" />
      <rect x="22" y="57" width="11" height="5" rx="2.5" fill="#1e293b" />
      {/* Legs */}
      <rect x="10" y="50" width="8" height="10" rx="3" fill="#334155" />
      <rect x="22" y="50" width="8" height="10" rx="3" fill="#334155" />
      {/* Outfit */}
      {outfit()}
      {/* Arms */}
      <rect x="0" y="32" width="8" height="16" rx="4" fill={outfitColor} />
      <rect x="32" y="32" width="8" height="16" rx="4" fill={outfitColor} />
      {/* Hands */}
      <circle cx="4" cy="49" r="4.5" fill={skinColor} />
      <circle cx="36" cy="49" r="4.5" fill={skinColor} />
      {/* Neck */}
      <rect x="17" y="27" width="6" height="6" fill={skinColor} />
      {/* Head */}
      <rect x="8" y="8" width="24" height="22" rx="9" fill={skinColor} />
      {/* Hair */}
      {hair()}
      {/* Eyes */}
      <rect x="11" y="15" width="5" height="6" rx="2.5" fill="#1a1a2e" />
      <rect x="24" y="15" width="5" height="6" rx="2.5" fill="#1a1a2e" />
      <rect x="12" y="16" width="2" height="2" rx="1" fill="white" />
      <rect x="25" y="16" width="2" height="2" rx="1" fill="white" />
      {/* Blush */}
      <ellipse cx="10" cy="24" rx="3.5" ry="2" fill="#ffaaaa" opacity="0.45" />
      <ellipse cx="30" cy="24" rx="3.5" ry="2" fill="#ffaaaa" opacity="0.45" />
      {/* Mouth */}
      <path d="M14 27 Q20 32 26 27" stroke="#1a1a2e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Active dot */}
      {isActive && (
        <circle cx="35" cy="9" r="3.5" fill="#22c55e">
          <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
}

// ── Character Customizer ──────────────────────────────────────────────────
function CharacterCustomizer({
  value,
  onChange,
}: {
  value: CharacterAppearance;
  onChange: (a: CharacterAppearance) => void;
}) {
  const set = (patch: Partial<CharacterAppearance>) => onChange({ ...value, ...patch });

  return (
    <div className="bg-gradient-to-br from-slate-50 to-indigo-50 rounded-2xl p-4 border">
      <p className="text-xs font-bold text-gray-600 mb-3 uppercase tracking-wide">ออกแบบตัวละคร</p>
      <div className="flex gap-4">
        {/* Preview */}
        <div className="shrink-0 flex flex-col items-center justify-end bg-gradient-to-b from-sky-200 to-green-100 rounded-2xl w-28 h-40 pb-2 overflow-hidden relative">
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-green-200 to-transparent" />
          <AgentCharacter appearance={value} size={68} />
        </div>

        {/* Options */}
        <div className="flex-1 space-y-3 overflow-y-auto max-h-40 pr-1">
          {/* Skin */}
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-wider">ผิว</p>
            <div className="flex gap-2 flex-wrap">
              {SKIN_COLORS.map((c) => (
                <button
                  key={c} type="button" onClick={() => set({ skinColor: c })}
                  className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${value.skinColor === c ? "border-indigo-600 scale-110 shadow-md" : "border-white shadow"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Hair style */}
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-wider">ทรงผม</p>
            <div className="flex gap-1 flex-wrap">
              {HAIR_STYLES.map((s) => (
                <button
                  key={s.id} type="button" onClick={() => set({ hairStyle: s.id })}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${value.hairStyle === s.id ? "bg-indigo-600 text-white shadow-sm" : "bg-white text-gray-600 border hover:border-indigo-300"}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hair color */}
          {value.hairStyle !== "bald" && (
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-wider">สีผม</p>
              <div className="flex gap-1.5 flex-wrap">
                {HAIR_COLORS.map((c) => (
                  <button
                    key={c} type="button" onClick={() => set({ hairColor: c })}
                    className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${value.hairColor === c ? "border-indigo-600 scale-110 shadow-md" : "border-white shadow-sm"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Outfit style */}
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-wider">ชุด</p>
            <div className="flex gap-1 flex-wrap">
              {OUTFIT_STYLES.map((s) => (
                <button
                  key={s.id} type="button" onClick={() => set({ outfitStyle: s.id })}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${value.outfitStyle === s.id ? "bg-indigo-600 text-white shadow-sm" : "bg-white text-gray-600 border hover:border-indigo-300"}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Outfit color */}
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-wider">สีชุด</p>
            <div className="flex gap-1.5 flex-wrap">
              {OUTFIT_COLORS.map((c) => (
                <button
                  key={c} type="button" onClick={() => set({ outfitColor: c })}
                  className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${value.outfitColor === c ? "border-indigo-600 scale-110 shadow-md" : "border-white shadow-sm"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Agent Form Modal ──────────────────────────────────────────────────────
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
  const [appearance, setAppearance] = useState<CharacterAppearance>(
    parseAppearance(agent?.appearance)
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ ...form, appearance: JSON.stringify(appearance) } as any).finally(() => setSaving(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-bold text-gray-900">
            {agent?.id ? "แก้ไข AI Agent" : "เพิ่ม AI Agent"}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Character customizer */}
          <CharacterCustomizer value={appearance} onChange={setAppearance} />

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
              rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="อธิบายหน้าที่..."
            />
          </div>
          <div className="flex gap-3">
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

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50">
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

// ── Content Writer Modal ──────────────────────────────────────────────────
function ContentWriterModal({ agent, onClose }: { agent: AiAgent; onClose: () => void }) {
  const [propertyId, setPropertyId] = useState("");
  const [propertyTitle, setPropertyTitle] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ descriptionTh: string; descriptionEn: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const appearance = parseAppearance(agent.appearance);

  const searchProperty = async () => {
    if (!propertyId.trim()) return;
    setSearching(true); setPropertyTitle(null); setResult(null); setError(null);
    try {
      const res = await fetch(`/api/admin/properties/${propertyId.trim()}`);
      const data = await res.json();
      if (data.success) {
        setPropertyTitle(data.data?.titleTh || data.data?.title || `Property #${propertyId}`);
      } else setError("ไม่พบทรัพย์สิน");
    } catch { setError("เกิดข้อผิดพลาดในการค้นหา"); }
    finally { setSearching(false); }
  };

  const generate = async () => {
    setGenerating(true); setError(null);
    try {
      const res = await fetch("/api/ai/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: parseInt(propertyId, 10) }),
      });
      const data = await res.json();
      if (data.success) setResult(data.data);
      else setError(data.error || "เกิดข้อผิดพลาด");
    } catch { setError("เกิดข้อผิดพลาดในการเชื่อมต่อ"); }
    finally { setGenerating(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center gap-3 p-5 border-b shrink-0">
          <div className="shrink-0">
            <AgentCharacter appearance={appearance} size={44} isActive={agent.isActive} />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900">{agent.name}</h3>
            <p className="text-xs text-gray-500">{agent.position}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
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
                type="number" min={1}
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

          {error && <div className="bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

          {propertyTitle && !result && (
            <button
              onClick={generate}
              disabled={generating}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" />กำลังสร้าง Content...</> : <><Zap className="w-4 h-4" />สร้าง Content ด้วย AI</>}
            </button>
          )}

          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                <Check className="w-4 h-4" />บันทึกลงระบบแล้ว
              </div>
              <div className="border rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b"><span className="text-xs font-semibold text-gray-600">ภาษาไทย</span></div>
                <div className="p-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{result.descriptionTh}</div>
              </div>
              <div className="border rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b"><span className="text-xs font-semibold text-gray-600">English</span></div>
                <div className="p-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{result.descriptionEn}</div>
              </div>
              <button
                onClick={() => { setResult(null); setPropertyTitle(null); setPropertyId(""); }}
                className="w-full py-2.5 border border-indigo-300 text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-50 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />สร้างอีกรายการ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Desk Workstation ──────────────────────────────────────────────────────
function AgentDesk({
  agent,
  onUse,
  onEdit,
  onDelete,
  deleting,
}: {
  agent: AiAgent;
  onUse?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const appearance = parseAppearance(agent.appearance);

  return (
    <div className={`flex flex-col items-center group transition-all ${!agent.isActive ? "opacity-50" : ""}`}>
      {/* Character + badge */}
      <div className="relative">
        <AgentCharacter appearance={appearance} size={72} isActive={agent.isActive} />
        {agent.actionType !== "NONE" && agent.isActive && (
          <span
            className="absolute -top-1 -right-2 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow animate-bounce"
            style={{ background: agent.color }}
          >
            AI
          </span>
        )}
      </div>

      {/* Monitor */}
      <div className="flex flex-col items-center -mt-1">
        <div
          className="w-16 h-11 rounded-t-lg border-2 flex items-center justify-center shadow-sm"
          style={{ borderColor: agent.color + "88", background: "#0f172a" }}
        >
          <Monitor className="w-5 h-5 opacity-80" style={{ color: agent.color }} />
        </div>
        <div className="w-2 h-2 bg-gray-500 rounded-sm" />
        <div className="w-7 h-1 bg-gray-500 rounded mb-0.5" />
      </div>

      {/* Desk surface */}
      <div className="w-full">
        <div
          className="w-full h-7 rounded-t-lg flex items-center justify-between px-2.5 shadow"
          style={{ background: "linear-gradient(180deg,#c49a5c,#a87c3e)" }}
        >
          <div className="w-4 h-4 rounded bg-amber-100/70 border border-amber-300/50 shadow-sm" />
          <div className="w-3 h-3 rounded-full bg-amber-200/60" />
          <div className="w-3 h-2 rounded bg-amber-100/60" />
        </div>
        <div className="w-full h-2.5 rounded-b-lg" style={{ background: "#7a5530" }} />
      </div>

      {/* Name tag */}
      <div className="mt-2 text-center px-1">
        <p className="text-xs font-bold text-gray-800 truncate max-w-[110px]">{agent.name}</p>
        <p className="text-[10px] text-gray-500 truncate max-w-[110px]">{agent.position}</p>
      </div>

      {/* Action buttons — show on hover */}
      <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {agent.actionType !== "NONE" && agent.isActive && onUse && (
          <button
            onClick={onUse}
            className="px-2.5 py-1 text-white text-[11px] font-semibold rounded-lg transition-colors shadow-sm"
            style={{ background: agent.color }}
          >
            ใช้งาน
          </button>
        )}
        <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-white rounded-lg shadow-sm transition-colors">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={onDelete} disabled={deleting} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg shadow-sm transition-colors">
          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
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
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAgents(); }, [loadAgents]);

  const handleSave = async (formData: Omit<AiAgent, "id">) => {
    const method = editAgent?.id ? "PUT" : "POST";
    const url = editAgent?.id ? `/api/admin/ai-agents/${editAgent.id}` : "/api/admin/ai-agents";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
    setShowForm(false); setEditAgent(null);
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
    await fetch("/api/admin/ai-agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Content AI", position: "นักเขียน Content อสังหาริมทรัพย์",
        duties: "สร้างคำอธิบายทรัพย์สินภาษาไทยและภาษาอังกฤษที่น่าสนใจ ดึงดูดผู้เช่าและผู้ซื้อ",
        icon: "✍️", color: "#6366f1", isActive: true, actionType: "CONTENT_WRITER",
        appearance: JSON.stringify({ skinColor: "#FFDBB4", hairColor: "#1a1a2e", hairStyle: "short", outfitColor: "#6366f1", outfitStyle: "suit" }),
      }),
    });
    await loadAgents();
  };

  const activeAgents = agents.filter((a) => a.isActive);
  const inactiveAgents = agents.filter((a) => !a.isActive);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl mb-6 p-6 sm:p-8"
        style={{ background: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)" }}>
        {/* Floating dots */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(14)].map((_, i) => (
            <div key={i} className="absolute rounded-full animate-pulse"
              style={{
                width: (i % 3) * 3 + 4 + "px", height: (i % 3) * 3 + 4 + "px",
                background: ["#6366f1","#a855f7","#ec4899","#38bdf8"][i % 4],
                opacity: 0.25 + (i % 3) * 0.1,
                top: ((i * 37) % 90) + "%",
                left: ((i * 53) % 90) + "%",
                animationDelay: i * 0.35 + "s",
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">AI Office</h1>
            </div>
            <p className="text-white/60 text-sm max-w-md">
              ทีม AI ที่ช่วยจัดการงานหลังบ้านอัตโนมัติ — ออกแบบตัวละครและใช้งาน Agent ได้จากที่นี่
            </p>
          </div>
          <button
            onClick={() => { setEditAgent({}); setShowForm(true); }}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-sm font-medium transition-colors backdrop-blur border border-white/20"
          >
            <Plus className="w-4 h-4" />เพิ่ม Agent
          </button>
        </div>

        <div className="relative z-10 flex gap-3 mt-5 flex-wrap">
          {[
            { label: "ทั้งหมด", value: agents.length, color: "text-white" },
            { label: "Active", value: activeAgents.length, color: "text-green-400" },
            { label: "มี Action", value: agents.filter(a => a.actionType !== "NONE").length, color: "text-indigo-300" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/10 backdrop-blur rounded-xl px-4 py-2.5 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-white/60 text-xs">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : agents.length === 0 ? (
        /* Empty state */
        <div className="text-center py-16 space-y-4">
          <div className="flex justify-center">
            <AgentCharacter appearance={DEFAULT_APPEARANCE} size={80} />
          </div>
          <p className="text-gray-600 font-medium">ยังไม่มี AI Agent</p>
          <p className="text-gray-400 text-sm">เพิ่ม Agent แรก หรือสร้างชุดเริ่มต้น</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => { setEditAgent({}); setShowForm(true); }}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />เพิ่ม Agent
            </button>
            <button
              onClick={seedDefaults}
              className="px-5 py-2.5 border border-indigo-300 text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-50 flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />สร้างชุดเริ่มต้น
            </button>
          </div>
        </div>
      ) : (
        /* Office scene */
        <div className="rounded-2xl overflow-hidden border shadow-md">
          {/* Office room */}
          <div
            className="relative px-6 pt-8 pb-4 min-h-[340px]"
            style={{
              background: "linear-gradient(180deg, #dbeafe 0%, #eff6ff 42%, #e8d5b7 42%, #f5e6d0 100%)",
            }}
          >
            {/* Wall decorations */}
            <div className="absolute top-4 left-8 w-16 h-20 rounded border-4 border-amber-300/60 bg-amber-50/40 flex items-center justify-center text-2xl opacity-60">🖼️</div>
            <div className="absolute top-3 right-12 w-10 h-14 rounded border-4 border-blue-300/60 bg-blue-50/40 flex items-center justify-center text-xl opacity-60">🏢</div>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-white/30 rounded-full blur-sm" />

            {/* Floor lines */}
            <div className="absolute inset-x-0 bottom-0 h-[58%] pointer-events-none"
              style={{
                backgroundImage: "repeating-linear-gradient(90deg,transparent,transparent 48px,rgba(0,0,0,0.04) 48px,rgba(0,0,0,0.04) 50px)",
              }}
            />

            {/* Plants at corners */}
            <div className="absolute bottom-4 left-4 text-3xl opacity-70 select-none">🌿</div>
            <div className="absolute bottom-4 right-4 text-3xl opacity-70 select-none">🌱</div>

            {/* Agents grid */}
            <div className="relative z-10 flex flex-wrap justify-center gap-8 sm:gap-12">
              {activeAgents.map((agent) => (
                <AgentDesk
                  key={agent.id}
                  agent={agent}
                  onUse={agent.actionType !== "NONE" ? () => setActiveAgent(agent) : undefined}
                  onEdit={() => { setEditAgent(agent); setShowForm(true); }}
                  onDelete={() => handleDelete(agent.id)}
                  deleting={deleting === agent.id}
                />
              ))}

              {/* Add new desk */}
              <button
                onClick={() => { setEditAgent({}); setShowForm(true); }}
                className="flex flex-col items-center gap-2 opacity-40 hover:opacity-80 transition-opacity group"
              >
                <div className="w-16 h-[111px] border-2 border-dashed border-gray-400 rounded-xl flex items-center justify-center bg-white/50">
                  <Plus className="w-7 h-7 text-gray-500" />
                </div>
                <span className="text-[11px] text-gray-500 font-medium">เพิ่ม Agent</span>
              </button>
            </div>
          </div>

          {/* Inactive section */}
          {inactiveAgents.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-t">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Inactive</p>
              <div className="flex flex-wrap gap-6">
                {inactiveAgents.map((agent) => (
                  <AgentDesk
                    key={agent.id}
                    agent={agent}
                    onEdit={() => { setEditAgent(agent); setShowForm(true); }}
                    onDelete={() => handleDelete(agent.id)}
                    deleting={deleting === agent.id}
                  />
                ))}
              </div>
            </div>
          )}
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
        <ContentWriterModal agent={activeAgent} onClose={() => setActiveAgent(null)} />
      )}
    </div>
  );
}
