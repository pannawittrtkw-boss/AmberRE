"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Zap, Loader2, X, Check, Search, RefreshCw, Bot } from "lucide-react";

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

const SKIN_COLORS = ["#FFE0BD", "#FFCD94", "#EAA96A", "#C68642", "#8D5524"];
const HAIR_COLORS = [
  "#1C1C1C", "#3B1F0A", "#7B3F00", "#C9A96E",
  "#E8272C", "#E0E0E0", "#7B3FBF", "#2563EB", "#DB2777",
];
const HAIR_STYLES: { id: CharacterAppearance["hairStyle"]; label: string }[] = [
  { id: "short", label: "สั้น" },
  { id: "long",  label: "ยาว" },
  { id: "spiky", label: "แหลม" },
  { id: "curly", label: "หยิก" },
  { id: "bald",  label: "โล้น" },
];
const OUTFIT_COLORS = [
  "#2563EB","#4F46E5","#7C3AED","#DB2777",
  "#DC2626","#D97706","#059669","#0891B2","#475569","#111827",
];
const OUTFIT_STYLES: { id: CharacterAppearance["outfitStyle"]; label: string }[] = [
  { id: "suit",   label: "สูท" },
  { id: "casual", label: "เสื้อ" },
  { id: "hoodie", label: "ฮูดี้" },
];

const DEFAULT_APPEARANCE: CharacterAppearance = {
  skinColor:   "#FFE0BD",
  hairColor:   "#1C1C1C",
  hairStyle:   "short",
  outfitColor: "#2563EB",
  outfitStyle: "casual",
};

// ── Color helpers ─────────────────────────────────────────────────────────
function dk(hex: string, a = 0.22): string {
  if (!hex.startsWith("#") || hex.length < 7) return hex;
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgb(${Math.round(r*(1-a))},${Math.round(g*(1-a))},${Math.round(b*(1-a))})`;
}
function lt(hex: string, a = 0.3): string {
  if (!hex.startsWith("#") || hex.length < 7) return hex;
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgb(${Math.round(r+(255-r)*a)},${Math.round(g+(255-g)*a)},${Math.round(b+(255-b)*a)})`;
}

function parseAppearance(raw?: string | null): CharacterAppearance {
  if (!raw) return DEFAULT_APPEARANCE;
  try { return { ...DEFAULT_APPEARANCE, ...JSON.parse(raw) }; } catch { return DEFAULT_APPEARANCE; }
}

// ── Character SVG  (viewBox 0 0 60 88) ───────────────────────────────────
function AgentCharacter({
  appearance,
  size = 80,
  isActive = true,
}: {
  appearance: CharacterAppearance;
  size?: number;
  isActive?: boolean;
}) {
  const { skinColor, hairColor, hairStyle, outfitColor, outfitStyle } = appearance;

  // Hair
  const hair = () => {
    if (hairStyle === "bald") return null;

    if (hairStyle === "long")
      return <>
        <ellipse cx="30" cy="11" rx="17" ry="13" fill={hairColor} />
        <rect x="8"  y="16" width="7" height="26" rx="3.5" fill={hairColor} />
        <rect x="45" y="16" width="7" height="26" rx="3.5" fill={hairColor} />
      </>;

    if (hairStyle === "spiky")
      return <>
        <polygon points="13,14 11,2  22,13" fill={hairColor} />
        <polygon points="22,12 24,0  36,12" fill={hairColor} />
        <polygon points="38,13 49,2  47,14" fill={hairColor} />
        <ellipse cx="30" cy="12" rx="17" ry="10" fill={hairColor} />
      </>;

    if (hairStyle === "curly")
      return <>
        <circle cx="30"  cy="9"  r="14" fill={hairColor} />
        <circle cx="14"  cy="15" r="8"  fill={hairColor} />
        <circle cx="46"  cy="15" r="8"  fill={hairColor} />
        <circle cx="22"  cy="7"  r="7"  fill={hairColor} />
        <circle cx="38"  cy="7"  r="7"  fill={hairColor} />
      </>;

    // short (default)
    return <>
      <ellipse cx="30" cy="11" rx="17" ry="12" fill={hairColor} />
      <rect x="10" y="16" width="5" height="10" rx="2.5" fill={hairColor} />
      <rect x="45" y="16" width="5" height="10" rx="2.5" fill={hairColor} />
    </>;
  };

  // Outfit
  const outfit = () => {
    if (outfitStyle === "suit") return <>
      {/* jacket body */}
      <rect x="10" y="46" width="40" height="26" rx="6" fill={outfitColor} />
      {/* white shirt */}
      <rect x="22" y="46" width="16" height="26" rx="3" fill="white" />
      {/* left lapel */}
      <path d="M22 46 L18 52 L30 60 L30 46 Z" fill={dk(outfitColor,0.05)} />
      {/* right lapel */}
      <path d="M38 46 L42 52 L30 60 L30 46 Z" fill={dk(outfitColor,0.05)} />
      {/* tie */}
      <path d="M30 46 L27 52 L30 62 L33 52 Z" fill="#e53e3e" />
      <polygon points="27,52 33,52 30,56" fill={dk("#e53e3e",0.2)} />
    </>;

    if (outfitStyle === "hoodie") return <>
      <rect x="10" y="46" width="40" height="26" rx="6" fill={outfitColor} />
      {/* hood seam */}
      <path d="M10 46 Q30 36 50 46" stroke={dk(outfitColor,0.2)} strokeWidth="2" fill="none" />
      {/* front pocket */}
      <rect x="18" y="60" width="24" height="10" rx="4" fill={dk(outfitColor,0.15)} />
      {/* pocket divider */}
      <line x1="30" y1="60" x2="30" y2="70" stroke={dk(outfitColor,0.25)} strokeWidth="1" />
    </>;

    // casual (default)
    return <>
      <rect x="10" y="46" width="40" height="26" rx="6" fill={outfitColor} />
      {/* V-collar */}
      <path d="M20 46 L30 54 L40 46" stroke={dk(outfitColor,0.3)} strokeWidth="2" fill="none" />
      {/* pocket */}
      <rect x="36" y="50" width="8" height="7" rx="2" fill={dk(outfitColor,0.12)} />
      {/* pocket line */}
      <line x1="36" y1="53" x2="44" y2="53" stroke={dk(outfitColor,0.2)} strokeWidth="0.8" />
    </>;
  };

  return (
    <svg width={size} height={size * 1.47} viewBox="0 0 60 88">
      {/* Ground shadow */}
      <ellipse cx="30" cy="86" rx="16" ry="4" fill="rgba(0,0,0,0.12)" />

      {/* Shoes */}
      <rect x="9"  y="78" width="16" height="6" rx="4" fill="#1a1a2e" />
      <rect x="35" y="78" width="16" height="6" rx="4" fill="#1a1a2e" />

      {/* Legs */}
      <rect x="12" y="68" width="13" height="14" rx="4" fill="#334155" />
      <rect x="35" y="68" width="13" height="14" rx="4" fill="#334155" />

      {/* Outfit */}
      {outfit()}

      {/* Arms */}
      <rect x="1"  y="46" width="10" height="22" rx="5" fill={outfitColor} />
      <rect x="49" y="46" width="10" height="22" rx="5" fill={outfitColor} />

      {/* Hands */}
      <circle cx="6"  cy="69" r="6" fill={skinColor} />
      <circle cx="54" cy="69" r="6" fill={skinColor} />

      {/* Neck */}
      <rect x="24" y="40" width="12" height="8" fill={skinColor} />

      {/* Ears */}
      <ellipse cx="12" cy="26" rx="4.5" ry="5" fill={dk(skinColor,0.06)} />
      <ellipse cx="48" cy="26" rx="4.5" ry="5" fill={dk(skinColor,0.06)} />

      {/* Head */}
      <ellipse cx="30" cy="24" rx="18" ry="20" fill={skinColor} />

      {/* Hair */}
      {hair()}

      {/* Eyebrows */}
      {hairStyle !== "bald" && <>
        <path d="M16 16 Q21 13 26 15" stroke={hairColor} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M34 15 Q39 13 44 16" stroke={hairColor} strokeWidth="2" fill="none" strokeLinecap="round" />
      </>}

      {/* Eyes – white sclera */}
      <ellipse cx="21" cy="24" rx="5.5" ry="6"   fill="white" />
      <ellipse cx="39" cy="24" rx="5.5" ry="6"   fill="white" />
      {/* iris */}
      <ellipse cx="21.5" cy="24.5" rx="4"   ry="4.5" fill="#4B8BDB" />
      <ellipse cx="39.5" cy="24.5" rx="4"   ry="4.5" fill="#4B8BDB" />
      {/* pupil */}
      <circle  cx="22"   cy="25"   r="2.5" fill="#0f172a" />
      <circle  cx="40"   cy="25"   r="2.5" fill="#0f172a" />
      {/* shine */}
      <circle  cx="23.5" cy="23"   r="1.6" fill="white" />
      <circle  cx="41.5" cy="23"   r="1.6" fill="white" />
      {/* eyelashes top */}
      <path d="M16 20 Q21 17 27 20" stroke="#0f172a" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M33 20 Q39 17 45 20" stroke="#0f172a" strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* Nose */}
      <ellipse cx="30" cy="29" rx="2" ry="1.5" fill={dk(skinColor,0.12)} />

      {/* Mouth */}
      <path d="M23 34 Q30 39.5 37 34" stroke="#c0605c" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M25 34 Q30 37 35 34" fill={lt("#e87070",0.1)} stroke="none" />

      {/* Blush */}
      <ellipse cx="13" cy="29" rx="5" ry="3" fill="#ffb3b3" opacity="0.45" />
      <ellipse cx="47" cy="29" rx="5" ry="3" fill="#ffb3b3" opacity="0.45" />

      {/* Status */}
      {isActive && (
        <circle cx="45" cy="9" r="4" fill="#22c55e">
          <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
}

// ── Character Customizer ──────────────────────────────────────────────────
function CharacterCustomizer({ value, onChange }: { value: CharacterAppearance; onChange: (a: CharacterAppearance) => void }) {
  const set = (p: Partial<CharacterAppearance>) => onChange({ ...value, ...p });

  return (
    <div className="bg-gradient-to-br from-slate-50 to-indigo-50 rounded-2xl p-4 border">
      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">ออกแบบตัวละคร</p>
      <div className="flex gap-4">
        {/* Preview */}
        <div className="shrink-0 flex flex-col items-end justify-end bg-gradient-to-b from-sky-200 via-sky-100 to-green-100 rounded-2xl w-28 h-44 overflow-hidden relative">
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-green-200/50" />
          <div className="relative z-10 w-full flex justify-center">
            <AgentCharacter appearance={value} size={72} />
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1 space-y-3 overflow-y-auto max-h-44 pr-0.5">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">ผิว</p>
            <div className="flex gap-2 flex-wrap">
              {SKIN_COLORS.map(c => (
                <button key={c} type="button" onClick={() => set({ skinColor: c })}
                  className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${value.skinColor===c?"border-indigo-600 scale-110 shadow-md":"border-white shadow"}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">ทรงผม</p>
            <div className="flex gap-1 flex-wrap">
              {HAIR_STYLES.map(s => (
                <button key={s.id} type="button" onClick={() => set({ hairStyle: s.id })}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${value.hairStyle===s.id?"bg-indigo-600 text-white":"bg-white text-gray-600 border hover:border-indigo-400"}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {value.hairStyle !== "bald" && (
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">สีผม</p>
              <div className="flex gap-1.5 flex-wrap">
                {HAIR_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => set({ hairColor: c })}
                    className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${value.hairColor===c?"border-indigo-600 scale-110 shadow-md":"border-white shadow-sm"}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">ชุด</p>
            <div className="flex gap-1 flex-wrap">
              {OUTFIT_STYLES.map(s => (
                <button key={s.id} type="button" onClick={() => set({ outfitStyle: s.id })}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${value.outfitStyle===s.id?"bg-indigo-600 text-white":"bg-white text-gray-600 border hover:border-indigo-400"}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">สีชุด</p>
            <div className="flex gap-1.5 flex-wrap">
              {OUTFIT_COLORS.map(c => (
                <button key={c} type="button" onClick={() => set({ outfitColor: c })}
                  className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${value.outfitColor===c?"border-indigo-600 scale-110 shadow-md":"border-white shadow-sm"}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Agent Form Modal ──────────────────────────────────────────────────────
function AgentFormModal({ agent, onClose, onSave }: {
  agent: Partial<AiAgent> | null;
  onClose: () => void;
  onSave: (data: Omit<AiAgent,"id">) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name:       agent?.name       ?? "",
    position:   agent?.position   ?? "",
    duties:     agent?.duties     ?? "",
    icon:       agent?.icon       ?? "🤖",
    color:      agent?.color      ?? "#4F46E5",
    isActive:   agent?.isActive   ?? true,
    actionType: agent?.actionType ?? "NONE",
  });
  const [appearance, setAppearance] = useState<CharacterAppearance>(parseAppearance(agent?.appearance));
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    await onSave({ ...form, appearance: JSON.stringify(appearance) } as any).finally(() => setSaving(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-bold">{agent?.id ? "แก้ไข" : "เพิ่ม"} AI Agent</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <CharacterCustomizer value={appearance} onChange={setAppearance} />

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600 mb-1 block">ชื่อ Agent *</label>
              <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="เช่น Content AI" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600 mb-1 block">ตำแหน่ง *</label>
              <input value={form.position} onChange={e=>setForm(f=>({...f,position:e.target.value}))} required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="เช่น นักเขียน Content" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600 mb-1 block">หน้าที่ *</label>
              <textarea value={form.duties} onChange={e=>setForm(f=>({...f,duties:e.target.value}))} required rows={2}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="อธิบายหน้าที่..." />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Action</label>
              <select value={form.actionType} onChange={e=>setForm(f=>({...f,actionType:e.target.value}))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {ACTION_TYPES.map(a=><option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            <div className="flex items-end pb-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div onClick={()=>setForm(f=>({...f,isActive:!f.isActive}))}
                  className={`w-10 h-6 rounded-full transition-colors relative ${form.isActive?"bg-green-500":"bg-gray-300"}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive?"translate-x-5":"translate-x-1"}`} />
                </div>
                <span className="text-xs font-medium text-gray-600">Active</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50">ยกเลิก</button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}บันทึก
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
      if (data.success) setPropertyTitle(data.data?.titleTh || `Property #${propertyId}`);
      else setError("ไม่พบทรัพย์สิน");
    } catch { setError("เกิดข้อผิดพลาด"); } finally { setSearching(false); }
  };

  const generate = async () => {
    setGenerating(true); setError(null);
    try {
      const res = await fetch("/api/ai/content", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ propertyId: parseInt(propertyId,10) }) });
      const data = await res.json();
      if (data.success) setResult(data.data);
      else setError(data.error || "เกิดข้อผิดพลาด");
    } catch { setError("เชื่อมต่อไม่ได้"); } finally { setGenerating(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center gap-3 p-5 border-b shrink-0">
          <AgentCharacter appearance={appearance} size={44} isActive={agent.isActive} />
          <div className="flex-1">
            <h3 className="text-base font-bold">{agent.name}</h3>
            <p className="text-xs text-gray-500">{agent.position}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          <p className="text-sm text-gray-600">{agent.duties}</p>
          <div className="bg-indigo-50 rounded-xl p-4">
            <label className="text-xs font-semibold text-indigo-700 mb-2 block">Property ID</label>
            <div className="flex gap-2">
              <input value={propertyId} onChange={e=>setPropertyId(e.target.value)} onKeyDown={e=>e.key==="Enter"&&searchProperty()}
                className="flex-1 border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                placeholder="กรอก Property ID เช่น 42" type="number" min={1} />
              <button onClick={searchProperty} disabled={searching||!propertyId.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                {searching?<Loader2 className="w-4 h-4 animate-spin"/>:<Search className="w-4 h-4"/>}ค้นหา
              </button>
            </div>
            {propertyTitle && <div className="mt-2 flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2"><Check className="w-4 h-4 shrink-0"/><span className="font-medium">{propertyTitle}</span></div>}
          </div>
          {error && <div className="bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}
          {propertyTitle && !result && (
            <button onClick={generate} disabled={generating}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {generating?<><Loader2 className="w-4 h-4 animate-spin"/>กำลังสร้าง...</>:<><Zap className="w-4 h-4"/>สร้าง Content ด้วย AI</>}
            </button>
          )}
          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600 text-sm font-medium"><Check className="w-4 h-4"/>บันทึกแล้ว</div>
              {[{title:"ภาษาไทย",text:result.descriptionTh},{title:"English",text:result.descriptionEn}].map(({title,text})=>(
                <div key={title} className="border rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b"><span className="text-xs font-semibold text-gray-600">{title}</span></div>
                  <div className="p-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{text}</div>
                </div>
              ))}
              <button onClick={()=>{setResult(null);setPropertyTitle(null);setPropertyId("");}}
                className="w-full py-2.5 border border-indigo-300 text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-50 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4"/>สร้างอีกรายการ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Office Scene – characters on top of background image ──────────────────
// Landscape office image – seats at desks/workstations across the open plan.
const SEATS = [
  { left: "17%", bottom: "22%" }, // far-left front desk
  { left: "32%", bottom: "32%" }, // center-left desk
  { left: "44%", bottom: "42%" }, // center desk area
  { left: "56%", bottom: "36%" }, // center-right standing area
  { left: "68%", bottom: "24%" }, // right counter/break area
  { left: "80%", bottom: "36%" }, // far-right workstation
  { left: "60%", bottom: "58%" }, // back-center (meeting room)
  { left: "38%", bottom: "58%" }, // back-left desk
];

function OfficeScene({
  agents,
  onUse,
  onEdit,
  onDelete,
  onAdd,
  deleting,
}: {
  agents: AiAgent[];
  onUse: (a: AiAgent) => void;
  onEdit: (a: AiAgent) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
  deleting: number | null;
}) {
  const activeAgents = agents.filter(a => a.isActive);
  const inactiveAgents = agents.filter(a => !a.isActive);

  return (
    <div className="rounded-2xl overflow-hidden border shadow-lg">
      {/* Office background + seated agents */}
      <div className="relative w-full" style={{ paddingBottom: "56%" }}>
        {/* Background image */}
        <img
          src="/images/office-bg.png"
          alt="office"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "top" }}
        />
        {/* Dim overlay so characters stand out */}
        <div className="absolute inset-0 bg-white/10" />

        {/* Seated agents */}
        {SEATS.map((seat, idx) => {
          const agent = activeAgents[idx];
          if (!agent) {
            // Empty seat – show add button
            if (idx === activeAgents.length) return (
              <button key={idx}
                onClick={onAdd}
                className="absolute flex flex-col items-center gap-1 group"
                style={{ left: seat.left, bottom: seat.bottom, transform: "translate(-50%,50%)" }}>
                <div className="w-12 h-16 rounded-xl border-2 border-dashed border-white/60 bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/40 transition-colors">
                  <Plus className="w-5 h-5 text-white/80" />
                </div>
              </button>
            );
            return null;
          }

          const appearance = parseAppearance(agent.appearance);
          return (
            <div key={agent.id}
              className="absolute group"
              style={{ left: seat.left, bottom: seat.bottom, transform: "translate(-50%,50%)" }}>
              {/* Character */}
              <div className={`relative transition-all ${!agent.isActive?"opacity-50":""}`}>
                {/* AI badge */}
                {agent.actionType !== "NONE" && (
                  <span className="absolute -top-2 -right-2 z-20 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-lg animate-bounce"
                    style={{ background: agent.color }}>AI</span>
                )}
                <div className="drop-shadow-lg">
                  <AgentCharacter appearance={appearance} size={56} isActive={agent.isActive} />
                </div>

                {/* Name tag */}
                <div className="bg-white/90 backdrop-blur rounded-lg px-2 py-0.5 text-center shadow-md mt-0.5">
                  <p className="text-[10px] font-bold text-gray-800 whitespace-nowrap max-w-[80px] truncate">{agent.name}</p>
                </div>

                {/* Hover actions */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-30 bg-white/95 backdrop-blur rounded-xl shadow-xl px-2 py-1.5 border">
                  {agent.actionType !== "NONE" && agent.isActive && (
                    <button onClick={()=>onUse(agent)}
                      className="text-white text-[10px] font-bold px-2 py-1 rounded-lg"
                      style={{ background: agent.color }}>ใช้งาน</button>
                  )}
                  <button onClick={()=>onEdit(agent)} className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={()=>onDelete(agent.id)} disabled={deleting===agent.id} className="p-1 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg">
                    {deleting===agent.id?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<Trash2 className="w-3.5 h-3.5"/>}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add button overlay if all seats taken */}
        {activeAgents.length >= SEATS.length && (
          <button onClick={onAdd}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/90 hover:bg-white text-gray-800 text-xs font-semibold rounded-xl px-3 py-2 shadow-lg border transition-all">
            <Plus className="w-3.5 h-3.5"/>เพิ่ม Agent
          </button>
        )}
      </div>

      {/* Inactive agents below */}
      {inactiveAgents.length > 0 && (
        <div className="bg-gray-50 px-6 py-4 border-t">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Inactive</p>
          <div className="flex flex-wrap gap-6 items-end">
            {inactiveAgents.map(agent => {
              const ap = parseAppearance(agent.appearance);
              return (
                <div key={agent.id} className="flex flex-col items-center gap-1 opacity-50 group">
                  <AgentCharacter appearance={ap} size={52} isActive={false} />
                  <p className="text-[10px] font-semibold text-gray-600">{agent.name}</p>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={()=>onEdit(agent)} className="p-1 text-gray-400 hover:text-gray-700 rounded"><Pencil className="w-3 h-3"/></button>
                    <button onClick={()=>onDelete(agent.id)} disabled={deleting===agent.id} className="p-1 text-gray-400 hover:text-red-500 rounded">
                      {deleting===agent.id?<Loader2 className="w-3 h-3 animate-spin"/>:<Trash2 className="w-3 h-3"/>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
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

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/ai-agents");
      const d = await res.json();
      if (d.success) setAgents(d.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data: Omit<AiAgent,"id">) => {
    const method = editAgent?.id ? "PUT" : "POST";
    const url = editAgent?.id ? `/api/admin/ai-agents/${editAgent.id}` : "/api/admin/ai-agents";
    await fetch(url, { method, headers:{"Content-Type":"application/json"}, body: JSON.stringify(data) });
    setShowForm(false); setEditAgent(null); await load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("ลบ AI Agent นี้?")) return;
    setDeleting(id);
    await fetch(`/api/admin/ai-agents/${id}`, { method:"DELETE" });
    setDeleting(null); await load();
  };

  const seedDefault = async () => {
    await fetch("/api/admin/ai-agents", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({
      name:"Content AI", position:"นักเขียน Content อสังหาริมทรัพย์",
      duties:"สร้างคำอธิบายทรัพย์สินภาษาไทยและอังกฤษที่น่าสนใจ ดึงดูดผู้เช่าและผู้ซื้อ",
      icon:"✍️", color:"#6366f1", isActive:true, actionType:"CONTENT_WRITER",
      appearance: JSON.stringify({ skinColor:"#FFE0BD", hairColor:"#1C1C1C", hairStyle:"short", outfitColor:"#6366f1", outfitStyle:"suit" }),
    })});
    await load();
  };

  const activeCount = agents.filter(a=>a.isActive).length;
  const actionCount = agents.filter(a=>a.actionType!=="NONE").length;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl mb-6 p-6 sm:p-8"
        style={{ background:"linear-gradient(135deg,#0f0c29,#302b63,#24243e)" }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(14)].map((_,i)=>(
            <div key={i} className="absolute rounded-full animate-pulse"
              style={{ width:(i%3)*3+4+"px", height:(i%3)*3+4+"px", background:["#6366f1","#a855f7","#ec4899","#38bdf8"][i%4],
                opacity:0.2+(i%3)*0.1, top:((i*37)%90)+"%", left:((i*53)%90)+"%", animationDelay:i*0.35+"s" }} />
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
            <p className="text-white/60 text-sm">ทีม AI ผู้ช่วยจัดการงานหลังบ้าน — hover ที่ตัวละครเพื่อใช้งาน</p>
          </div>
          <button onClick={()=>{setEditAgent({});setShowForm(true);}}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-sm font-medium border border-white/20 backdrop-blur transition-colors">
            <Plus className="w-4 h-4"/>เพิ่ม Agent
          </button>
        </div>
        <div className="relative z-10 flex gap-3 mt-5 flex-wrap">
          {[{l:"ทั้งหมด",v:agents.length,c:"text-white"},{l:"Active",v:activeCount,c:"text-green-400"},{l:"มี Action",v:actionCount,c:"text-indigo-300"}].map(s=>(
            <div key={s.l} className="bg-white/10 backdrop-blur rounded-xl px-4 py-2.5 text-center">
              <p className={`text-2xl font-bold ${s.c}`}>{s.v}</p>
              <p className="text-white/60 text-xs">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600"/></div>
      ) : agents.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="flex justify-center">
            <AgentCharacter appearance={DEFAULT_APPEARANCE} size={80}/>
          </div>
          <p className="text-gray-600 font-medium">ยังไม่มี AI Agent</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={()=>{setEditAgent({});setShowForm(true);}}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 flex items-center gap-2">
              <Plus className="w-4 h-4"/>เพิ่ม Agent
            </button>
            <button onClick={seedDefault}
              className="px-5 py-2.5 border border-indigo-300 text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-50 flex items-center gap-2">
              <Zap className="w-4 h-4"/>สร้างชุดเริ่มต้น
            </button>
          </div>
        </div>
      ) : (
        <OfficeScene
          agents={agents}
          onUse={a=>setActiveAgent(a)}
          onEdit={a=>{setEditAgent(a);setShowForm(true);}}
          onDelete={handleDelete}
          onAdd={()=>{setEditAgent({});setShowForm(true);}}
          deleting={deleting}
        />
      )}

      {showForm && (
        <AgentFormModal agent={editAgent}
          onClose={()=>{setShowForm(false);setEditAgent(null);}}
          onSave={handleSave} />
      )}
      {activeAgent?.actionType==="CONTENT_WRITER" && (
        <ContentWriterModal agent={activeAgent} onClose={()=>setActiveAgent(null)}/>
      )}
    </div>
  );
}
