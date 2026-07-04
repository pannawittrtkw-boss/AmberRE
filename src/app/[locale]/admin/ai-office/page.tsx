"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Pencil, Trash2, Zap, Loader2, X, Check, Search, RefreshCw, Bot, CloudUpload, AlertCircle } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
type AgentStatus = "office" | "online" | "away" | "offline";

interface AgentAppearance {
  imageFile: string;
  posX: number;
  posY: number;
  status: AgentStatus;
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

// ── Constants ──────────────────────────────────────────────────────────────────
const CHAR_FILES = [
  "01.jpg","02.jpeg","03.jpeg","04.jpeg","05.jpeg","06.jpeg",
  "07.jpeg","09.jpeg","10.jpeg","11.jpeg","12.jpeg",
];

const STATUS_CFG: Record<AgentStatus, { label: string; color: string; pulse: boolean }> = {
  office:  { label: "ในออฟฟิศ", color: "#22c55e", pulse: true  },
  online:  { label: "ออนไลน์",  color: "#3b82f6", pulse: true  },
  away:    { label: "ไม่อยู่",   color: "#f59e0b", pulse: false },
  offline: { label: "ออฟไลน์",  color: "#9ca3af", pulse: false },
};

const ACTION_TYPES = [
  { value: "NONE",           label: "ไม่มี action"      },
  { value: "CONTENT_WRITER", label: "เขียน Description" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function parseAppearance(raw?: string | null): AgentAppearance {
  const def: AgentAppearance = { imageFile: "01.jpg", posX: 50, posY: 50, status: "office" };
  if (!raw) return def;
  try { return { ...def, ...JSON.parse(raw) }; }
  catch { return def; }
}

// ── Character Image with local fallback ───────────────────────────────────────
// Always renders — tries R2 URL first, falls back to /public if it 404s
function CharImg({ file, charUrls, className, style, draggable: dr = false }: {
  file: string; charUrls: Record<string, string>;
  className?: string; style?: React.CSSProperties; draggable?: boolean;
}) {
  const local   = `/images/Agent%20Charecter/${encodeURIComponent(file)}`;
  const primary = charUrls[file] || local;
  return (
    <img
      key={primary}
      src={primary}
      onError={e => { (e.currentTarget as HTMLImageElement).src = local; }}
      className={className}
      style={style}
      draggable={dr}
      alt=""
    />
  );
}

// ── Status Dot ─────────────────────────────────────────────────────────────────
function StatusDot({ status, size = 12 }: { status: AgentStatus; size?: number }) {
  const cfg = STATUS_CFG[status];
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      {cfg.pulse && (
        <span className="absolute inset-0 rounded-full animate-ping opacity-50"
          style={{ backgroundColor: cfg.color }} />
      )}
      <span className="relative rounded-full border-2 border-white shadow"
        style={{ width: size, height: size, backgroundColor: cfg.color }} />
    </span>
  );
}

// ── Character Picker ───────────────────────────────────────────────────────────
function CharacterPicker({ value, onChange, charUrls }: {
  value: string;
  onChange: (f: string) => void;
  charUrls: Record<string, string>;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-600 mb-2">เลือกตัวละคร</p>
      <div className="grid grid-cols-4 gap-2 max-h-52 overflow-y-auto pr-0.5">
        {CHAR_FILES.map(file => (
          <button key={file} type="button" onClick={() => onChange(file)}
            className={`relative rounded-xl overflow-hidden border-2 transition-all aspect-[3/4] hover:scale-105 bg-gray-100 ${value === file
              ? "border-indigo-500 ring-2 ring-indigo-300 scale-105 shadow-lg"
              : "border-gray-200 hover:border-indigo-300"}`}>
            <CharImg file={file} charUrls={charUrls} className="w-full h-full object-cover object-top" />
            {value === file && (
              <div className="absolute inset-0 bg-indigo-600/15 flex items-end justify-center pb-1.5">
                <span className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow">✓ เลือก</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Agent Form Modal ───────────────────────────────────────────────────────────
function AgentFormModal({ agent, onClose, onSave, charUrls }: {
  agent: Partial<AiAgent> | null;
  onClose: () => void;
  onSave: (d: Omit<AiAgent, "id">) => Promise<void>;
  charUrls: Record<string, string>;
}) {
  const ap = parseAppearance(agent?.appearance);
  const [imageFile, setImageFile] = useState(ap.imageFile);
  const [status,    setStatus]    = useState<AgentStatus>(ap.status);
  const [form, setForm] = useState({
    name:       agent?.name       ?? "",
    position:   agent?.position   ?? "",
    duties:     agent?.duties     ?? "",
    isActive:   agent?.isActive   ?? true,
    actionType: agent?.actionType ?? "NONE",
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const posX = agent?.id ? ap.posX : Math.round(Math.random() * 60 + 20);
    const posY = agent?.id ? ap.posY : Math.round(Math.random() * 40 + 20);
    await onSave({
      ...form, icon: "🤖", color: "#6366f1",
      appearance: JSON.stringify({ imageFile, posX, posY, status }),
    } as Omit<AiAgent, "id">).finally(() => setSaving(false));
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-4">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-bold">{agent?.id ? "แก้ไข" : "เพิ่ม"} AI Agent</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="flex gap-4">
            {/* Preview */}
            <div className="shrink-0 w-28 rounded-2xl overflow-hidden border-2 border-indigo-100 bg-gradient-to-b from-sky-100 to-blue-50 flex items-end">
              <CharImg file={imageFile} charUrls={charUrls} className="w-full object-cover object-top" />
            </div>
            {/* Picker */}
            <div className="flex-1 min-w-0">
              <CharacterPicker value={imageFile} onChange={setImageFile} charUrls={charUrls} />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-2 block">สถานะ</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(STATUS_CFG) as AgentStatus[]).map(s => (
                <button key={s} type="button" onClick={() => setStatus(s)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${status === s
                    ? "text-white shadow-md border-transparent"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}
                  style={status === s ? { backgroundColor: STATUS_CFG[s].color } : {}}>
                  <StatusDot status={s} size={10} />
                  {STATUS_CFG[s].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">ชื่อ Agent *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
              className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="เช่น Content AI" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">ตำแหน่ง *</label>
            <input value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} required
              className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="เช่น นักเขียน Content" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">หน้าที่ *</label>
            <textarea value={form.duties} onChange={e => setForm(f => ({ ...f, duties: e.target.value }))} required rows={2}
              className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              placeholder="อธิบายหน้าที่..." />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Action</label>
              <select value={form.actionType} onChange={e => setForm(f => ({ ...f, actionType: e.target.value }))}
                className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                {ACTION_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            <div className="flex items-end pb-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                  className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative ${form.isActive ? "bg-green-500" : "bg-gray-300"}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? "translate-x-6" : "translate-x-1"}`} />
                </div>
                <span className="text-xs font-medium text-gray-600">Active</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border rounded-xl text-sm text-gray-700 hover:bg-gray-50 font-medium">ยกเลิก</button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}บันทึก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Content Writer Modal ───────────────────────────────────────────────────────
function ContentWriterModal({ agent, onClose, charUrls }: { agent: AiAgent; onClose: () => void; charUrls: Record<string, string> }) {
  const ap = parseAppearance(agent.appearance);
  const [propertyId,    setPropertyId]    = useState("");
  const [propertyTitle, setPropertyTitle] = useState<string | null>(null);
  const [searching,  setSearching]  = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ descriptionTh: string; descriptionEn: string } | null>(null);
  const [error,  setError]  = useState<string | null>(null);

  const searchProperty = async () => {
    if (!propertyId.trim()) return;
    setSearching(true); setPropertyTitle(null); setResult(null); setError(null);
    try {
      const res = await fetch(`/api/admin/properties/${propertyId.trim()}`);
      const d   = await res.json();
      if (d.success) setPropertyTitle(d.data?.titleTh || `Property #${propertyId}`);
      else setError("ไม่พบทรัพย์สิน");
    } catch { setError("เกิดข้อผิดพลาด"); } finally { setSearching(false); }
  };

  const generate = async () => {
    setGenerating(true); setError(null);
    try {
      const res = await fetch("/api/ai/content", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: parseInt(propertyId, 10) }),
      });
      const d = await res.json();
      if (d.success) setResult(d.data); else setError(d.error || "เกิดข้อผิดพลาด");
    } catch { setError("เชื่อมต่อไม่ได้"); } finally { setGenerating(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center gap-4 p-5 border-b shrink-0">
          <div className="w-16 h-20 rounded-xl overflow-hidden border bg-gradient-to-b from-sky-100 to-indigo-50 shrink-0">
            <CharImg file={ap.imageFile} charUrls={charUrls} className="w-full h-full object-cover object-top" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-base font-bold truncate">{agent.name}</h3>
              <StatusDot status={ap.status} />
            </div>
            <p className="text-xs text-gray-500">{agent.position}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 shrink-0"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          <p className="text-sm text-gray-600">{agent.duties}</p>
          <div className="bg-indigo-50 rounded-xl p-4">
            <label className="text-xs font-semibold text-indigo-700 mb-2 block">Property ID</label>
            <div className="flex gap-2">
              <input value={propertyId} onChange={e => setPropertyId(e.target.value)}
                onKeyDown={e => e.key === "Enter" && searchProperty()}
                className="flex-1 border border-indigo-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                placeholder="กรอก Property ID" type="number" min={1} />
              <button onClick={searchProperty} disabled={searching || !propertyId.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}ค้นหา
              </button>
            </div>
            {propertyTitle && (
              <div className="mt-2 flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-xl px-3 py-2">
                <Check className="w-4 h-4 shrink-0" />{propertyTitle}
              </div>
            )}
          </div>
          {error && <div className="bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}
          {propertyTitle && !result && (
            <button onClick={generate} disabled={generating}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" />กำลังสร้าง...</> : <><Zap className="w-4 h-4" />สร้าง Content ด้วย AI</>}
            </button>
          )}
          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600 text-sm font-medium"><Check className="w-4 h-4" />บันทึกแล้ว</div>
              {[{ title: "ภาษาไทย", text: result.descriptionTh }, { title: "English", text: result.descriptionEn }].map(({ title, text }) => (
                <div key={title} className="border rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b"><span className="text-xs font-semibold">{title}</span></div>
                  <div className="p-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{text}</div>
                </div>
              ))}
              <button onClick={() => { setResult(null); setPropertyTitle(null); setPropertyId(""); }}
                className="w-full py-2.5 border border-indigo-300 text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-50 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4" />สร้างอีกรายการ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Office Scene ───────────────────────────────────────────────────────────────
function OfficeScene({ agents, onEdit, onDelete, onUse, onAdd, onPositionUpdate, deleting, charUrls }: {
  agents: AiAgent[];
  onEdit: (a: AiAgent) => void;
  onDelete: (id: number) => void;
  onUse: (a: AiAgent) => void;
  onAdd: () => void;
  onPositionUpdate: (id: number, x: number, y: number) => void;
  deleting: number | null;
  charUrls: Record<string, string>;
}) {
  const containerRef   = useRef<HTMLDivElement>(null);
  const [draggingId,   setDraggingId]   = useState<number | null>(null);
  const [localPos,     setLocalPos]     = useState<Record<number, { x: number; y: number }>>({});
  const lastPosRef     = useRef<{ x: number; y: number } | null>(null);
  // Pending drag — tracks mousedown before threshold is exceeded
  const pendingRef     = useRef<{ id: number; startX: number; startY: number } | null>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      // Activate drag only after 7px threshold
      if (pendingRef.current && draggingId === null) {
        const dx = Math.abs(e.clientX - pendingRef.current.startX);
        const dy = Math.abs(e.clientY - pendingRef.current.startY);
        if (dx > 7 || dy > 7) {
          setDraggingId(pendingRef.current.id);
          pendingRef.current = null;
        }
        return;
      }

      if (draggingId === null || !containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      const x = Math.round(Math.max(5,  Math.min(95, ((e.clientX - r.left)  / r.width)  * 100)));
      const y = Math.round(Math.max(5,  Math.min(90, ((e.clientY - r.top)   / r.height) * 100)));
      lastPosRef.current = { x, y };
      setLocalPos(p => ({ ...p, [draggingId]: { x, y } }));
    };

    const onUp = () => {
      pendingRef.current = null; // cancel any pending drag (it was just a click)
      if (draggingId !== null) {
        if (lastPosRef.current) onPositionUpdate(draggingId, lastPosRef.current.x, lastPosRef.current.y);
        lastPosRef.current = null;
        setDraggingId(null);
      }
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup",   onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup",   onUp);
    };
  }, [draggingId, onPositionUpdate]);

  const getPos = (agent: AiAgent) => {
    const ap = parseAppearance(agent.appearance);
    return localPos[agent.id] ?? { x: ap.posX, y: ap.posY };
  };

  return (
    <div className="rounded-2xl overflow-hidden border shadow-xl">
      <div ref={containerRef}
        className="relative w-full select-none overflow-hidden"
        style={{ paddingBottom: "56%", cursor: draggingId !== null ? "grabbing" : "default" }}>

        <img src="/images/office-bg.png" alt=""
          className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none" />
        <div className="absolute inset-0 bg-black/8 pointer-events-none" />

        {agents.map(agent => {
          const ap  = parseAppearance(agent.appearance);
          const pos = getPos(agent);
          const isD = draggingId === agent.id;

          return (
            <div key={agent.id}
              className={`absolute group ${isD ? "z-50" : "z-10 hover:z-20"}`}
              style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -100%)" }}>

              <div className={`flex flex-col items-center transition-transform duration-75 ${isD ? "scale-110 drop-shadow-2xl" : ""}`}>

                {/* Character */}
                <div
                  onMouseDown={e => {
                    // Record mousedown intent; drag only activates after movement threshold
                    e.preventDefault();
                    pendingRef.current = { id: agent.id, startX: e.clientX, startY: e.clientY };
                  }}
                  className={`relative cursor-grab active:cursor-grabbing ${!agent.isActive ? "opacity-50 grayscale" : ""}`}>

                  {agent.actionType !== "NONE" && (
                    <span className="absolute top-1 left-1 z-10 bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow">AI</span>
                  )}
                  <span className="absolute top-1 right-1 z-10">
                    <StatusDot status={ap.status} size={12} />
                  </span>

                  <CharImg file={ap.imageFile} charUrls={charUrls}
                    className="object-cover object-top rounded-xl shadow-[0_6px_20px_rgba(0,0,0,0.35)]"
                    style={{ height: 90, width: "auto" }} />
                </div>

                {/* Name tag */}
                <div className="mt-1 bg-white/95 backdrop-blur-sm rounded-lg px-2.5 py-1 shadow-lg border border-white/60 flex items-center gap-1.5 max-w-[110px]">
                  <StatusDot status={ap.status} size={8} />
                  <p className="text-[10px] font-bold text-gray-900 truncate">{agent.name}</p>
                </div>

                {/* Hover popup — only when not dragging */}
                {!isD && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-44 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-30 group">
                    <div className="bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 p-3.5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-12 rounded-lg overflow-hidden shrink-0 border bg-gray-100">
                          <CharImg file={ap.imageFile} charUrls={charUrls} className="w-full h-full object-cover object-top" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">{agent.name}</p>
                          <p className="text-[10px] text-gray-500 truncate">{agent.position}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <StatusDot status={ap.status} size={7} />
                            <span className="text-[10px]" style={{ color: STATUS_CFG[ap.status].color }}>
                              {STATUS_CFG[ap.status].label}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-600 leading-relaxed mb-3 line-clamp-2">{agent.duties}</p>
                      <div className="flex gap-1.5">
                        {agent.actionType !== "NONE" && agent.isActive && (
                          <button onClick={() => onUse(agent)}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-2 py-1.5 rounded-lg transition-colors">
                            <Zap className="w-3 h-3 inline mr-0.5" />ใช้งาน
                          </button>
                        )}
                        <button onClick={() => onEdit(agent)}
                          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => onDelete(agent.id)} disabled={deleting === agent.id}
                          className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          {deleting === agent.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <p className="text-[9px] text-gray-400 text-center mt-2">↕ ลากเพื่อย้ายตำแหน่ง</p>
                    </div>
                    <div className="w-3 h-3 bg-white rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-r border-b border-gray-100" />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <button onClick={onAdd}
          className="absolute bottom-4 right-4 z-20 flex items-center gap-2 bg-white/90 hover:bg-white text-gray-800 text-sm font-semibold rounded-xl px-4 py-2.5 shadow-lg border border-white/60 backdrop-blur transition-all hover:shadow-xl">
          <Plus className="w-4 h-4" />เพิ่ม Agent
        </button>
      </div>

      {/* Legend */}
      <div className="bg-white border-t px-5 py-3 flex flex-wrap gap-x-5 gap-y-1 items-center">
        {(Object.keys(STATUS_CFG) as AgentStatus[]).map(s => (
          <div key={s} className="flex items-center gap-1.5">
            <StatusDot status={s} size={10} />
            <span className="text-xs text-gray-500">{STATUS_CFG[s].label}</span>
          </div>
        ))}
        <span className="ml-auto text-xs text-gray-400 italic hidden sm:inline">hover ที่ตัวละครเพื่อดูรายละเอียด · ลากเพื่อย้าย</span>
      </div>
    </div>
  );
}

// ── Upload Banner ──────────────────────────────────────────────────────────────
function UploadBanner({ onSuccess }: { onSuccess: (urls: Record<string, string>) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const handleUpload = async () => {
    setUploading(true); setError(null);
    try {
      const res = await fetch("/api/admin/ai-characters", { method: "POST" });
      const d   = await res.json();
      if ((d.data?.uploaded ?? 0) > 0 || d.success) {
        // Pass back the real R2 URLs — no re-probe needed
        onSuccess(d.data?.urls ?? {});
      } else {
        const errs = d.data?.errors as string[] | undefined;
        setError(errs?.join(", ") || "Upload ไม่สำเร็จ กรุณาลองใหม่");
      }
    } catch { setError("เชื่อมต่อไม่ได้"); } finally { setUploading(false); }
  };

  return (
    <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-800">รูปตัวละครยังไม่ได้อัปโหลดขึ้น Cloudflare R2</p>
        <p className="text-xs text-amber-600 mt-0.5">กด Upload เพื่อส่งรูปทั้งหมดไปเก็บ Cloud (ทำครั้งเดียว)</p>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
      <button onClick={handleUpload} disabled={uploading}
        className="shrink-0 flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors">
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
        {uploading ? "กำลัง Upload..." : "Upload to Cloud"}
      </button>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AiOfficePage() {
  const [agents,      setAgents]      = useState<AiAgent[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [editAgent,   setEditAgent]   = useState<Partial<AiAgent> | null>(null);
  const [showForm,    setShowForm]    = useState(false);
  const [activeAgent, setActiveAgent] = useState<AiAgent | null>(null);
  const [deleting,    setDeleting]    = useState<number | null>(null);
  const [charUrls,   setCharUrls]   = useState<Record<string, string>>({});
  const [needUpload, setNeedUpload] = useState(false);

  const loadCharUrls = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/ai-characters");
      const d = await r.json();
      if (d.success) {
        setCharUrls(d.data.urls);
        // Show upload banner when R2 is configured — images might not be there yet.
        // CharImg always falls back to local /public so images still show either way.
        if (d.data.source === "r2") {
          const firstUrl: string = d.data.urls[CHAR_FILES[0]];
          if (firstUrl) {
            const img = new Image();
            img.onload  = () => setNeedUpload(false);
            img.onerror = () => setNeedUpload(true);
            img.src = firstUrl;
          }
        } else {
          setNeedUpload(false);
        }
      }
    } catch { /* ignore */ }
  }, []);

  const loadAgents = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/ai-agents");
      const d = await r.json();
      if (d.success) setAgents(d.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadCharUrls(); loadAgents(); }, [loadCharUrls, loadAgents]);

  const handleSave = async (data: Omit<AiAgent, "id">) => {
    const method = editAgent?.id ? "PUT" : "POST";
    const url    = editAgent?.id ? `/api/admin/ai-agents/${editAgent.id}` : "/api/admin/ai-agents";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    setShowForm(false); setEditAgent(null); await loadAgents();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("ลบ AI Agent นี้?")) return;
    setDeleting(id);
    await fetch(`/api/admin/ai-agents/${id}`, { method: "DELETE" });
    setDeleting(null); await loadAgents();
  };

  const handlePositionUpdate = useCallback(async (id: number, x: number, y: number) => {
    const agent = agents.find(a => a.id === id);
    if (!agent) return;
    const ap = parseAppearance(agent.appearance);
    const newAp = { ...ap, posX: x, posY: y };
    await fetch(`/api/admin/ai-agents/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appearance: newAp }),
    });
    setAgents(prev => prev.map(a =>
      a.id === id ? { ...a, appearance: JSON.stringify(newAp) } : a
    ));
  }, [agents]);

  const seedDefault = async () => {
    const items = [
      { name:"Content AI", position:"นักเขียน Content", duties:"สร้างคำอธิบายทรัพย์สิน", actionType:"CONTENT_WRITER", imageFile:"02.jpeg", posX:30, posY:45, status:"office" as AgentStatus },
      { name:"Analyst",    position:"นักวิเคราะห์ตลาด", duties:"วิเคราะห์ราคาและแนวโน้มตลาด",  actionType:"NONE",           imageFile:"05.jpeg", posX:65, posY:35, status:"online" as AgentStatus },
    ];
    for (const d of items) {
      await fetch("/api/admin/ai-agents", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name:d.name, position:d.position, duties:d.duties, icon:"🤖", color:"#6366f1", isActive:true, actionType:d.actionType, appearance:JSON.stringify({ imageFile:d.imageFile, posX:d.posX, posY:d.posY, status:d.status }) }),
      });
    }
    await loadAgents();
  };

  const total    = agents.length;
  const active   = agents.filter(a => a.isActive).length;
  const inOffice = agents.filter(a => parseAppearance(a.appearance).status === "office").length;
  const online   = agents.filter(a => parseAppearance(a.appearance).status === "online").length;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl mb-6 p-6 sm:p-8"
        style={{ background: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)" }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="absolute rounded-full animate-pulse"
              style={{ width:(i%3)*4+6+"px", height:(i%3)*4+6+"px", background:["#6366f1","#a855f7","#ec4899","#38bdf8"][i%4], opacity:0.15+(i%3)*0.08, top:((i*41)%90)+"%", left:((i*57)%90)+"%", animationDelay:i*0.4+"s" }} />
          ))}
        </div>
        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">AI Office</h1>
            </div>
            <p className="text-white/60 text-sm">hover เพื่อดูรายละเอียด · ลากเพื่อย้ายตำแหน่ง</p>
          </div>
          <button onClick={() => { setEditAgent({}); setShowForm(true); }}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-sm font-medium border border-white/20 backdrop-blur transition-colors">
            <Plus className="w-4 h-4" />เพิ่ม Agent
          </button>
        </div>
        <div className="relative z-10 flex gap-3 mt-5 flex-wrap">
          {[
            { l:"ทั้งหมด", v:total,    c:"text-white"       },
            { l:"Active",  v:active,   c:"text-green-400"   },
            { l:"ในออฟฟิศ",v:inOffice, c:"text-emerald-300" },
            { l:"ออนไลน์", v:online,   c:"text-blue-300"    },
          ].map(s => (
            <div key={s.l} className="bg-white/10 backdrop-blur rounded-xl px-4 py-2.5 text-center min-w-[70px]">
              <p className={`text-2xl font-bold ${s.c}`}>{s.v}</p>
              <p className="text-white/60 text-xs">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Upload banner — detected via Image probe, always hides after successful upload */}
      {needUpload && (
        <UploadBanner onSuccess={(urls) => {
          // Update charUrls with real R2 URLs directly — no re-probe needed
          setCharUrls(prev => ({ ...prev, ...urls }));
          setNeedUpload(false);
        }} />
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
      ) : agents.length === 0 ? (
        <div className="text-center py-20 space-y-5">
          <div className="flex justify-center gap-6">
            {["02.jpeg","05.jpeg","09.jpeg"].map(f => (
              <div key={f} className="w-20 rounded-2xl overflow-hidden border-2 border-indigo-100 shadow-lg opacity-70 bg-gray-100">
                <CharImg file={f} charUrls={charUrls} className="w-full object-cover object-top" />
              </div>
            ))}
          </div>
          <div>
            <p className="text-gray-700 font-semibold text-lg">ยังไม่มี AI Agent</p>
            <p className="text-gray-400 text-sm mt-1">เพิ่ม agent แล้วลากวางในออฟฟิศได้เลย</p>
          </div>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => { setEditAgent({}); setShowForm(true); }}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 flex items-center gap-2">
              <Plus className="w-4 h-4" />เพิ่ม Agent
            </button>
            <button onClick={seedDefault}
              className="px-5 py-2.5 border border-indigo-300 text-indigo-600 rounded-xl text-sm font-semibold hover:bg-indigo-50 flex items-center gap-2">
              <Zap className="w-4 h-4" />สร้างชุดเริ่มต้น
            </button>
          </div>
        </div>
      ) : (
        <OfficeScene
          agents={agents}
          charUrls={charUrls}
          onEdit={a  => { setEditAgent(a); setShowForm(true); }}
          onDelete={handleDelete}
          onUse={setActiveAgent}
          onAdd={() => { setEditAgent({}); setShowForm(true); }}
          onPositionUpdate={handlePositionUpdate}
          deleting={deleting}
        />
      )}

      {showForm && (
        <AgentFormModal
          agent={editAgent}
          charUrls={charUrls}
          onClose={() => { setShowForm(false); setEditAgent(null); }}
          onSave={handleSave}
        />
      )}
      {activeAgent?.actionType === "CONTENT_WRITER" && (
        <ContentWriterModal agent={activeAgent} charUrls={charUrls} onClose={() => setActiveAgent(null)} />
      )}
    </div>
  );
}
