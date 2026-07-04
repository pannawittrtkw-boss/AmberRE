"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Zap, Loader2, X, Check, Search, RefreshCw, Bot } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────
interface CharacterAppearance {
  gender: "male" | "female";
  skinColor: string;
  hairColor: string;
  hairStyle: string;
  eyeColor: string;
  topStyle: string;
  topColor: string;
  bottomStyle: string;
  bottomColor: string;
  shoeColor: string;
  accessories: string[];
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

// ── Palette constants ─────────────────────────────────────────────────────
const SKIN_COLORS = ["#FFDBB4", "#F4C28A", "#D4956A", "#B07040", "#7A4520"];
const HAIR_COLORS = ["#1C1C1C", "#3B1C08", "#7B4A1E", "#C9A050", "#E8272C", "#E0E0E0", "#7B3FBF", "#2563EB", "#DB2777"];
const EYE_COLORS  = ["#1a1a2e", "#4B3A2A", "#5B8A3C", "#3A7FC1", "#8B6914", "#7B3FBF"];
const OUTFIT_COLORS = ["#1e293b","#334155","#1d4ed8","#4f46e5","#7c3aed","#db2777","#dc2626","#d97706","#059669","#0891b2","#64748b","#e2e8f0"];
const SHOE_COLORS  = ["#1C1C1C","#334155","#7C5C3A","#D4C9A8","#C0392B","#FFFFFF"];

const MALE_HAIR   = [{ id:"short",  label:"สั้น" },{ id:"slick",  label:"เนี้ยบ" },{ id:"spiky",  label:"แหลม" },{ id:"wavy",   label:"หยัก" },{ id:"buzz",   label:"รองทรง" }];
const FEMALE_HAIR = [{ id:"long",   label:"ยาวตรง" },{ id:"wavy",   label:"ยาวหยัก" },{ id:"bob",    label:"บ็อบ" },{ id:"ponytail",label:"หางม้า" },{ id:"bun",    label:"มวย" }];

const MALE_TOPS   = [{ id:"tshirt", label:"เสื้อยืด" },{ id:"shirt",  label:"เชิ้ต" },{ id:"polo",   label:"โปโล" },{ id:"hoodie", label:"ฮูดี้" },{ id:"suit",   label:"สูท" }];
const FEMALE_TOPS = [{ id:"blouse", label:"บลาวส์" },{ id:"tshirt", label:"เสื้อยืด" },{ id:"sweater",label:"สเวตเตอร์" },{ id:"hoodie", label:"ฮูดี้" },{ id:"suit",   label:"สูท" }];

const MALE_BOTTOMS   = [{ id:"jeans",  label:"ยีนส์" },{ id:"chinos", label:"ผ้า" },{ id:"shorts", label:"ขาสั้น" },{ id:"formal", label:"สแล็ค" }];
const FEMALE_BOTTOMS = [{ id:"jeans",  label:"ยีนส์" },{ id:"skirt",  label:"กระโปรง" },{ id:"mini",   label:"มินิ" },{ id:"formal", label:"สแล็ค" }];

const ALL_ACCESSORIES = [
  { id:"glasses",    label:"แว่น" },
  { id:"sunglasses", label:"แว่นดำ" },
  { id:"hat",        label:"หมวก" },
  { id:"earrings",   label:"ต่างหู" },
  { id:"tie",        label:"เน็กไท" },
];

const DEFAULT_MALE: CharacterAppearance = {
  gender:"male", skinColor:"#FFDBB4", hairColor:"#1C1C1C", hairStyle:"short",
  eyeColor:"#1a1a2e", topStyle:"tshirt", topColor:"#1d4ed8",
  bottomStyle:"jeans", bottomColor:"#334155", shoeColor:"#1C1C1C", accessories:[],
};
const DEFAULT_FEMALE: CharacterAppearance = {
  gender:"female", skinColor:"#FFDBB4", hairColor:"#1C1C1C", hairStyle:"long",
  eyeColor:"#1a1a2e", topStyle:"blouse", topColor:"#db2777",
  bottomStyle:"skirt", bottomColor:"#4f46e5", shoeColor:"#1C1C1C", accessories:[],
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
function parseAppearance(raw?: string|null): CharacterAppearance {
  if (!raw) return DEFAULT_MALE;
  try { const p = JSON.parse(raw); return p.gender === "female" ? { ...DEFAULT_FEMALE, ...p } : { ...DEFAULT_MALE, ...p }; }
  catch { return DEFAULT_MALE; }
}

// ── Character SVG  viewBox="0 0 60 96" ───────────────────────────────────
function AgentCharacter({ appearance, size = 80, isActive = true }: { appearance: CharacterAppearance; size?: number; isActive?: boolean }) {
  const { gender, skinColor, hairColor, hairStyle, eyeColor, topStyle, topColor, bottomStyle, bottomColor, shoeColor, accessories = [] } = appearance;
  const f = gender === "female";

  // ── Hair ──────────────────────────────────────────────────────────────
  const hair = () => {
    if (f) {
      if (hairStyle === "long") return <>
        <ellipse cx="30" cy="10" rx="15" ry="12" fill={hairColor} />
        <rect x="7"  y="14" width="7" height="30" rx="3.5" fill={hairColor} />
        <rect x="46" y="14" width="7" height="30" rx="3.5" fill={hairColor} />
        <path d="M7 24 Q5 38 8 44" stroke={hairColor} strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M53 24 Q55 38 52 44" stroke={hairColor} strokeWidth="6" fill="none" strokeLinecap="round" />
      </>;
      if (hairStyle === "wavy") return <>
        <ellipse cx="30" cy="10" rx="15" ry="12" fill={hairColor} />
        <path d="M7 18 Q5 28 8 34 Q6 40 9 46" stroke={hairColor} strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d="M53 18 Q55 28 52 34 Q54 40 51 46" stroke={hairColor} strokeWidth="7" fill="none" strokeLinecap="round" />
      </>;
      if (hairStyle === "bob") return <>
        <ellipse cx="30" cy="10" rx="15" ry="12" fill={hairColor} />
        <rect x="7"  y="14" width="6" height="16" rx="3" fill={hairColor} />
        <rect x="47" y="14" width="6" height="16" rx="3" fill={hairColor} />
      </>;
      if (hairStyle === "ponytail") return <>
        <ellipse cx="30" cy="10" rx="15" ry="12" fill={hairColor} />
        <rect x="7"  y="14" width="5" height="12" rx="2.5" fill={hairColor} />
        <rect x="48" y="14" width="5" height="12" rx="2.5" fill={hairColor} />
        <ellipse cx="30" cy="4" rx="5" ry="4" fill={hairColor} />
        <path d="M30 6 Q36 0 38 8 Q40 16 34 20" stroke={hairColor} strokeWidth="5" fill="none" strokeLinecap="round" />
      </>;
      if (hairStyle === "bun") return <>
        <ellipse cx="30" cy="10" rx="15" ry="12" fill={hairColor} />
        <circle cx="30" cy="2" r="7" fill={hairColor} />
        <rect x="7"  y="14" width="5" height="10" rx="2.5" fill={hairColor} />
        <rect x="48" y="14" width="5" height="10" rx="2.5" fill={hairColor} />
      </>;
      return <ellipse cx="30" cy="10" rx="15" ry="12" fill={hairColor} />;
    } else {
      if (hairStyle === "slick") return <>
        <ellipse cx="30" cy="9" rx="16" ry="10" fill={hairColor} />
        <path d="M14 10 Q30 4 46 10" stroke={dk(hairColor,0.2)} strokeWidth="2" fill="none" />
      </>;
      if (hairStyle === "spiky") return <>
        <polygon points="12,13 10,1 20,12" fill={hairColor} />
        <polygon points="20,11 23,0 30,11" fill={hairColor} />
        <polygon points="30,11 37,0 40,11" fill={hairColor} />
        <polygon points="40,12 50,1 48,13" fill={hairColor} />
        <ellipse cx="30" cy="10" rx="16" ry="9" fill={hairColor} />
      </>;
      if (hairStyle === "wavy") return <>
        <ellipse cx="30" cy="10" rx="16" ry="11" fill={hairColor} />
        <rect x="10" y="14" width="6" height="14" rx="3" fill={hairColor} />
        <rect x="44" y="14" width="6" height="14" rx="3" fill={hairColor} />
      </>;
      if (hairStyle === "buzz") return <>
        <ellipse cx="30" cy="8" rx="16" ry="7" fill={hairColor} />
      </>;
      // short default
      return <>
        <ellipse cx="30" cy="9" rx="16" ry="11" fill={hairColor} />
        <rect x="10" y="13" width="5" height="10" rx="2.5" fill={hairColor} />
        <rect x="45" y="13" width="5" height="10" rx="2.5" fill={hairColor} />
      </>;
    }
  };

  // ── Top / shirt ────────────────────────────────────────────────────────
  const top = () => {
    const bw = f ? 34 : 40; // body width
    const bx = (60 - bw) / 2;
    if (topStyle === "suit") return <>
      <rect x={bx} y="38" width={bw} height="26" rx="5" fill={topColor} />
      <rect x="27" y="38" width="6" height="26" fill="white" />
      <path d={`M27 38 L${bx+4} 46 L30 48 L${bx+bw-4} 46 L33 38`} fill={dk(topColor,0.08)} />
      {accessories.includes("tie") && <path d="M30 38 L27.5 46 L30 52 L32.5 46 Z" fill="#e53e3e" />}
      {!f && <><rect x={bx-1} y="38" width="5" height="26" rx="2" fill={topColor} /><rect x={bx+bw-4} y="38" width="5" height="26" rx="2" fill={topColor} /></>}
    </>;
    if (topStyle === "hoodie") return <>
      <rect x={bx} y="38" width={bw} height="26" rx="5" fill={topColor} />
      <path d={`M${bx} 38 Q30 28 ${bx+bw} 38`} stroke={dk(topColor,0.18)} strokeWidth="2" fill="none" />
      <rect x="21" y="54" width="18" height="9" rx="4" fill={dk(topColor,0.14)} />
      <line x1="30" y1="54" x2="30" y2="63" stroke={dk(topColor,0.22)} strokeWidth="1" />
    </>;
    if (topStyle === "polo") return <>
      <rect x={bx} y="38" width={bw} height="26" rx="5" fill={topColor} />
      <path d="M26 38 L30 44 L34 38" stroke={dk(topColor,0.3)} strokeWidth="2" fill="none" />
      <rect x="28" y="44" width="4" height="6" rx="1" fill={dk(topColor,0.12)} />
    </>;
    if (topStyle === "blouse") return <>
      <rect x={bx} y="38" width={bw} height="26" rx="5" fill={topColor} />
      <path d="M25 38 Q30 46 35 38" stroke={dk(topColor,0.25)} strokeWidth="1.5" fill="none" />
      <ellipse cx="30" cy="50" rx="3" ry="1.5" fill={dk(topColor,0.1)} />
    </>;
    if (topStyle === "sweater") return <>
      <rect x={bx} y="38" width={bw} height="26" rx="5" fill={topColor} />
      <path d={`M${bx} 38 Q${bx+4} 36 30 37 Q${bx+bw-4} 36 ${bx+bw} 38`} stroke={dk(topColor,0.2)} strokeWidth="2" fill="none" />
      {[0,1,2,3,4].map(i=><line key={i} x1={bx+2} y1={44+i*4} x2={bx+bw-2} y2={44+i*4} stroke={dk(topColor,0.1)} strokeWidth="1" />)}
    </>;
    if (topStyle === "shirt") return <>
      <rect x={bx} y="38" width={bw} height="26" rx="5" fill={topColor} />
      <path d="M26 38 L30 43 L34 38" stroke={dk(topColor,0.3)} strokeWidth="2" fill="none" />
      {[0,1,2,3].map(i=><circle key={i} cx="30" cy={46+i*4} r="1" fill={dk(topColor,0.25)} />)}
    </>;
    // tshirt default
    return <>
      <rect x={bx} y="38" width={bw} height="26" rx="5" fill={topColor} />
      <path d="M24 38 L30 44 L36 38" stroke={dk(topColor,0.2)} strokeWidth="1.5" fill="none" />
    </>;
  };

  // ── Bottom ─────────────────────────────────────────────────────────────
  const bottom = () => {
    if (bottomStyle === "skirt") return <>
      <path d="M20 64 Q18 82 15 88 Q30 92 45 88 Q42 82 40 64 Z" fill={bottomColor} />
      <path d="M20 64 Q30 68 40 64" stroke={dk(bottomColor,0.15)} strokeWidth="1.5" fill="none" />
    </>;
    if (bottomStyle === "mini") return <>
      <path d="M20 64 Q19 74 17 78 Q30 82 43 78 Q41 74 40 64 Z" fill={bottomColor} />
    </>;
    if (bottomStyle === "formal" || bottomStyle === "chinos") return <>
      <rect x="17" y="64" width="11" height="24" rx="4" fill={bottomColor} />
      <rect x="32" y="64" width="11" height="24" rx="4" fill={bottomColor} />
      <line x1="30" y1="64" x2="30" y2="88" stroke={dk(bottomColor,0.15)} strokeWidth="1" />
    </>;
    if (bottomStyle === "shorts") return <>
      <rect x="17" y="64" width="11" height="14" rx="4" fill={bottomColor} />
      <rect x="32" y="64" width="11" height="14" rx="4" fill={bottomColor} />
    </>;
    // jeans default
    return <>
      <rect x="17" y="64" width="11" height="24" rx="4" fill={bottomColor} />
      <rect x="32" y="64" width="11" height="24" rx="4" fill={bottomColor} />
      <line x1="17" y1="70" x2="28" y2="70" stroke={dk(bottomColor,0.2)} strokeWidth="1" />
      <line x1="32" y1="70" x2="43" y2="70" stroke={dk(bottomColor,0.2)} strokeWidth="1" />
      <line x1="30" y1="64" x2="30" y2="88" stroke={dk(bottomColor,0.12)} strokeWidth="1.5" />
    </>;
  };

  // ── Shoes ──────────────────────────────────────────────────────────────
  const shoes = () => {
    if (f) return <>
      <ellipse cx="22" cy="90" rx="7" ry="3.5" fill={shoeColor} />
      <ellipse cx="38" cy="90" rx="7" ry="3.5" fill={shoeColor} />
      <rect x="20" y="86" width="4" height="5" rx="1" fill={dk(shoeColor,0.05)} />
      <rect x="36" y="86" width="4" height="5" rx="1" fill={dk(shoeColor,0.05)} />
    </>;
    return <>
      <rect x="14" y="87" width="14" height="5" rx="3" fill={shoeColor} />
      <rect x="32" y="87" width="14" height="5" rx="3" fill={shoeColor} />
    </>;
  };

  // ── Accessories ────────────────────────────────────────────────────────
  const glasses = () => <g>
    <rect x="16" y="19" width="10" height="7" rx="3" fill="none" stroke="#1a1a2e" strokeWidth="1.5" />
    <rect x="34" y="19" width="10" height="7" rx="3" fill="none" stroke="#1a1a2e" strokeWidth="1.5" />
    <line x1="26" y1="22" x2="34" y2="22" stroke="#1a1a2e" strokeWidth="1.5" />
    <line x1="16" y1="22" x2="13" y2="21" stroke="#1a1a2e" strokeWidth="1.5" />
    <line x1="44" y1="22" x2="47" y2="21" stroke="#1a1a2e" strokeWidth="1.5" />
  </g>;

  const sunglasses = () => <g>
    <rect x="15" y="19" width="11" height="7" rx="3" fill="#1a1a2e" opacity="0.85" />
    <rect x="34" y="19" width="11" height="7" rx="3" fill="#1a1a2e" opacity="0.85" />
    <line x1="26" y1="22" x2="34" y2="22" stroke="#1a1a2e" strokeWidth="1.8" />
    <line x1="15" y1="22" x2="12" y2="21" stroke="#1a1a2e" strokeWidth="1.8" />
    <line x1="45" y1="22" x2="48" y2="21" stroke="#1a1a2e" strokeWidth="1.8" />
  </g>;

  const hat = () => <g>
    <ellipse cx="30" cy="6" rx="18" ry="4" fill={hairColor} />
    <rect x="14" y="1" width="32" height="8" rx="3" fill={hairColor} />
    {topColor !== "#e2e8f0" && <rect x="14" y="7" width="32" height="2" fill={topColor} />}
  </g>;

  const earrings = () => f ? <g>
    <circle cx="13" cy="24" r="2.5" fill="#D4AF37" />
    <circle cx="47" cy="24" r="2.5" fill="#D4AF37" />
  </g> : null;

  // ── Body arms ──────────────────────────────────────────────────────────
  const bw = f ? 34 : 40;
  const bx = (60 - bw) / 2;
  const armW = f ? 7 : 8;

  return (
    <svg width={size} height={size * 1.6} viewBox="0 0 60 96">
      {/* Shadow */}
      <ellipse cx="30" cy="94" rx="14" ry="3" fill="rgba(0,0,0,0.12)" />

      {/* Shoes */}
      {shoes()}

      {/* Bottom */}
      {bottom()}

      {/* Top/body */}
      {top()}

      {/* Arms */}
      <rect x={bx-armW} y="38" width={armW} height="20" rx={armW/2} fill={topColor} />
      <rect x={bx+bw}   y="38" width={armW} height="20" rx={armW/2} fill={topColor} />

      {/* Hands */}
      <circle cx={bx - armW/2}      cy="59" r="5" fill={skinColor} />
      <circle cx={bx + bw + armW/2} cy="59" r="5" fill={skinColor} />

      {/* Neck */}
      <rect x={f?27:26} y="36" width={f?6:8} height="5" rx="2" fill={skinColor} />

      {/* Ears */}
      <ellipse cx="13" cy="22" rx="4" ry="4.5" fill={dk(skinColor,0.07)} />
      <ellipse cx="47" cy="22" rx="4" ry="4.5" fill={dk(skinColor,0.07)} />

      {/* Earrings (behind head) */}
      {accessories.includes("earrings") && earrings()}

      {/* Head */}
      <ellipse cx="30" cy="21" rx={f?14:15} ry={f?16:17} fill={skinColor} />

      {/* Hair */}
      {hair()}

      {/* Hat covers hair */}
      {accessories.includes("hat") && hat()}

      {/* Eyebrows */}
      <path d={f ? "M17 13 Q21 11 25 13" : "M16 12 Q21 9.5 26 12"}
        stroke={hairColor} strokeWidth={f?1.6:1.8} fill="none" strokeLinecap="round" />
      <path d={f ? "M35 13 Q39 11 43 13" : "M34 12 Q39 9.5 44 12"}
        stroke={hairColor} strokeWidth={f?1.6:1.8} fill="none" strokeLinecap="round" />

      {/* Eyes – sclera */}
      <ellipse cx="21" cy="21" rx={f?5:5.5} ry={f?5.5:6}   fill="white" />
      <ellipse cx="39" cy="21" rx={f?5:5.5} ry={f?5.5:6}   fill="white" />
      {/* iris */}
      <ellipse cx="21.5" cy="21.5" rx="3.5" ry="4"   fill={eyeColor} />
      <ellipse cx="39.5" cy="21.5" rx="3.5" ry="4"   fill={eyeColor} />
      {/* pupil */}
      <circle cx="22"   cy="22"   r="2.2" fill="#070707" />
      <circle cx="40"   cy="22"   r="2.2" fill="#070707" />
      {/* shine */}
      <circle cx="23.2" cy="20.2" r="1.4" fill="white" />
      <circle cx="41.2" cy="20.2" r="1.4" fill="white" />
      {/* eyelash */}
      <path d={f?"M16 17.5 Q21 14.5 27 17.5":"M15 17 Q21 14 27 17"} stroke="#0f172a" strokeWidth={f?1.4:1.2} fill="none" strokeLinecap="round" />
      <path d={f?"M33 17.5 Q39 14.5 45 17.5":"M33 17 Q39 14 45 17"} stroke="#0f172a" strokeWidth={f?1.4:1.2} fill="none" strokeLinecap="round" />
      {f && <>
        <path d="M16 18 L14 16" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M26 17 L26.5 14.5" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M44 18 L46 16" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M34 17 L33.5 14.5" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" />
      </>}

      {/* Nose */}
      <ellipse cx="30" cy="26" rx="1.8" ry="1.2" fill={dk(skinColor,0.1)} />

      {/* Mouth */}
      <path d={f?"M23 31 Q30 36.5 37 31":"M23 31 Q30 36 37 31"} stroke={f?"#c06060":"#a05050"} strokeWidth="2" fill="none" strokeLinecap="round" />
      {f && <path d="M25 31 Q30 34.5 35 31" fill={lt("#ffb3b3",0.15)} stroke="none" />}

      {/* Blush */}
      <ellipse cx="14" cy="27" rx="4.5" ry="2.5" fill="#ffb3b3" opacity={f?0.55:0.3} />
      <ellipse cx="46" cy="27" rx="4.5" ry="2.5" fill="#ffb3b3" opacity={f?0.55:0.3} />

      {/* Accessories over face */}
      {accessories.includes("glasses")    && glasses()}
      {accessories.includes("sunglasses") && sunglasses()}

      {/* Active dot */}
      {isActive && <circle cx="44" cy="8" r="3.5" fill="#22c55e">
        <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
      </circle>}
    </svg>
  );
}


// ── Character Customizer ──────────────────────────────────────────────────
function CharacterCustomizer({ value, onChange }: { value: CharacterAppearance; onChange: (a: CharacterAppearance) => void }) {
  const set = (p: Partial<CharacterAppearance>) => onChange({ ...value, ...p });
  const f = value.gender === "female";
  const hairOptions   = f ? FEMALE_HAIR   : MALE_HAIR;
  const topOptions    = f ? FEMALE_TOPS   : MALE_TOPS;
  const bottomOptions = f ? FEMALE_BOTTOMS: MALE_BOTTOMS;

  const switchGender = (g: "male"|"female") => {
    onChange(g === "female" ? { ...DEFAULT_FEMALE, hairColor: value.hairColor, skinColor: value.skinColor } : { ...DEFAULT_MALE, hairColor: value.hairColor, skinColor: value.skinColor });
  };

  const toggleAcc = (id: string) => {
    const cur = value.accessories || [];
    set({ accessories: cur.includes(id) ? cur.filter(a => a !== id) : [...cur, id] });
  };

  const ColorRow = ({ label, colors, current, onPick }: { label: string; colors: string[]; current: string; onPick: (c: string) => void }) => (
    <div>
      <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-wider">{label}</p>
      <div className="flex gap-1.5 flex-wrap">
        {colors.map(c => (
          <button key={c} type="button" onClick={() => onPick(c)}
            className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${current===c?"border-indigo-600 scale-110 shadow-md":"border-white shadow-sm"}`}
            style={{ backgroundColor: c }} />
        ))}
      </div>
    </div>
  );

  const ChipRow = ({ label, options, current, onPick }: { label: string; options: {id:string;label:string}[]; current: string; onPick: (v: string) => void }) => (
    <div>
      <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-wider">{label}</p>
      <div className="flex gap-1 flex-wrap">
        {options.map(o => (
          <button key={o.id} type="button" onClick={() => onPick(o.id)}
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${current===o.id?"bg-indigo-600 text-white":"bg-white text-gray-600 border hover:border-indigo-400"}`}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-slate-50 to-indigo-50 rounded-2xl p-4 border">
      <div className="flex gap-4">
        {/* Preview */}
        <div className="shrink-0 flex flex-col items-center justify-end bg-gradient-to-b from-sky-200 to-green-100 rounded-2xl w-28 h-52 overflow-hidden pb-1">
          <AgentCharacter appearance={value} size={76} />
        </div>

        {/* Controls */}
        <div className="flex-1 space-y-2.5 overflow-y-auto max-h-52 pr-0.5">
          {/* Gender */}
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-wider">เพศ</p>
            <div className="flex gap-1">
              {(["male","female"] as const).map(g => (
                <button key={g} type="button" onClick={() => switchGender(g)}
                  className={`px-3 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${value.gender===g?"bg-indigo-600 text-white":"bg-white text-gray-600 border hover:border-indigo-400"}`}>
                  {g==="male"?"ชาย":"หญิง"}
                </button>
              ))}
            </div>
          </div>

          <ColorRow label="ผิว"  colors={SKIN_COLORS}   current={value.skinColor}   onPick={c=>set({skinColor:c})} />
          <ChipRow  label="ทรงผม" options={hairOptions}  current={value.hairStyle}   onPick={v=>set({hairStyle:v})} />
          <ColorRow label="สีผม" colors={HAIR_COLORS}   current={value.hairColor}   onPick={c=>set({hairColor:c})} />
          <ColorRow label="สีตา" colors={EYE_COLORS}    current={value.eyeColor}    onPick={c=>set({eyeColor:c})} />

          <ChipRow  label="เสื้อ"     options={topOptions}    current={value.topStyle}    onPick={v=>set({topStyle:v})} />
          <ColorRow label="สีเสื้อ"   colors={OUTFIT_COLORS}  current={value.topColor}    onPick={c=>set({topColor:c})} />

          <ChipRow  label="กางเกง/กระโปรง" options={bottomOptions} current={value.bottomStyle} onPick={v=>set({bottomStyle:v})} />
          <ColorRow label="สีกางเกง"  colors={OUTFIT_COLORS}  current={value.bottomColor} onPick={c=>set({bottomColor:c})} />

          <ColorRow label="รองเท้า"   colors={SHOE_COLORS}    current={value.shoeColor}   onPick={c=>set({shoeColor:c})} />

          {/* Accessories */}
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-wider">เครื่องประดับ</p>
            <div className="flex gap-1 flex-wrap">
              {ALL_ACCESSORIES.filter(a => a.id !== "earrings" || f).map(a => (
                <button key={a.id} type="button" onClick={() => toggleAcc(a.id)}
                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${(value.accessories||[]).includes(a.id)?"bg-indigo-600 text-white":"bg-white text-gray-600 border hover:border-indigo-400"}`}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Agent Form Modal ──────────────────────────────────────────────────────
const ACTION_TYPES = [{ value:"NONE", label:"ไม่มี action" },{ value:"CONTENT_WRITER", label:"เขียน Description" }];

function AgentFormModal({ agent, onClose, onSave }: {
  agent: Partial<AiAgent>|null; onClose: ()=>void; onSave: (d: Omit<AiAgent,"id">)=>Promise<void>;
}) {
  const [form, setForm] = useState({ name: agent?.name??"", position: agent?.position??"", duties: agent?.duties??"", icon: agent?.icon??"🤖", color: agent?.color??"#4f46e5", isActive: agent?.isActive??true, actionType: agent?.actionType??"NONE" });
  const [appearance, setAppearance] = useState<CharacterAppearance>(parseAppearance(agent?.appearance));
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    await onSave({ ...form, appearance: JSON.stringify(appearance) } as any).finally(()=>setSaving(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="text-lg font-bold">{agent?.id?"แก้ไข":"เพิ่ม"} AI Agent</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <CharacterCustomizer value={appearance} onChange={setAppearance} />
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">ชื่อ Agent *</label>
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="เช่น Content AI" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">ตำแหน่ง *</label>
            <input value={form.position} onChange={e=>setForm(f=>({...f,position:e.target.value}))} required className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="เช่น นักเขียน Content" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">หน้าที่ *</label>
            <textarea value={form.duties} onChange={e=>setForm(f=>({...f,duties:e.target.value}))} required rows={2} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="อธิบายหน้าที่..." />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Action</label>
              <select value={form.actionType} onChange={e=>setForm(f=>({...f,actionType:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {ACTION_TYPES.map(a=><option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
            <div className="flex items-end pb-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div onClick={()=>setForm(f=>({...f,isActive:!f.isActive}))} className={`w-10 h-6 rounded-full transition-colors relative ${form.isActive?"bg-green-500":"bg-gray-300"}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive?"translate-x-5":"translate-x-1"}`} />
                </div>
                <span className="text-xs font-medium text-gray-600">Active</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg text-sm text-gray-700 hover:bg-gray-50">ยกเลิก</button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {saving?<Loader2 className="w-4 h-4 animate-spin"/>:<Check className="w-4 h-4"/>}บันทึก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Content Writer Modal ──────────────────────────────────────────────────
function ContentWriterModal({ agent, onClose }: { agent: AiAgent; onClose: ()=>void }) {
  const [propertyId, setPropertyId] = useState("");
  const [propertyTitle, setPropertyTitle] = useState<string|null>(null);
  const [searching, setSearching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{descriptionTh:string;descriptionEn:string}|null>(null);
  const [error, setError] = useState<string|null>(null);
  const appearance = parseAppearance(agent.appearance);

  const searchProperty = async () => {
    if (!propertyId.trim()) return;
    setSearching(true); setPropertyTitle(null); setResult(null); setError(null);
    try {
      const res = await fetch(`/api/admin/properties/${propertyId.trim()}`);
      const d = await res.json();
      if (d.success) setPropertyTitle(d.data?.titleTh || `Property #${propertyId}`);
      else setError("ไม่พบทรัพย์สิน");
    } catch { setError("เกิดข้อผิดพลาด"); } finally { setSearching(false); }
  };

  const generate = async () => {
    setGenerating(true); setError(null);
    try {
      const res = await fetch("/api/ai/content",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({propertyId:parseInt(propertyId,10)}) });
      const d = await res.json();
      if (d.success) setResult(d.data); else setError(d.error||"เกิดข้อผิดพลาด");
    } catch { setError("เชื่อมต่อไม่ได้"); } finally { setGenerating(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center gap-3 p-5 border-b shrink-0">
          <AgentCharacter appearance={appearance} size={44} isActive={agent.isActive} />
          <div className="flex-1"><h3 className="text-base font-bold">{agent.name}</h3><p className="text-xs text-gray-500">{agent.position}</p></div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          <p className="text-sm text-gray-600">{agent.duties}</p>
          <div className="bg-indigo-50 rounded-xl p-4">
            <label className="text-xs font-semibold text-indigo-700 mb-2 block">Property ID</label>
            <div className="flex gap-2">
              <input value={propertyId} onChange={e=>setPropertyId(e.target.value)} onKeyDown={e=>e.key==="Enter"&&searchProperty()} className="flex-1 border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" placeholder="กรอก Property ID" type="number" min={1} />
              <button onClick={searchProperty} disabled={searching||!propertyId.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                {searching?<Loader2 className="w-4 h-4 animate-spin"/>:<Search className="w-4 h-4"/>}ค้นหา
              </button>
            </div>
            {propertyTitle && <div className="mt-2 flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2"><Check className="w-4 h-4 shrink-0"/>{propertyTitle}</div>}
          </div>
          {error && <div className="bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}
          {propertyTitle && !result && (
            <button onClick={generate} disabled={generating} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {generating?<><Loader2 className="w-4 h-4 animate-spin"/>กำลังสร้าง...</>:<><Zap className="w-4 h-4"/>สร้าง Content ด้วย AI</>}
            </button>
          )}
          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600 text-sm font-medium"><Check className="w-4 h-4"/>บันทึกแล้ว</div>
              {[{title:"ภาษาไทย",text:result.descriptionTh},{title:"English",text:result.descriptionEn}].map(({title,text})=>(
                <div key={title} className="border rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b"><span className="text-xs font-semibold">{title}</span></div>
                  <div className="p-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{text}</div>
                </div>
              ))}
              <button onClick={()=>{setResult(null);setPropertyTitle(null);setPropertyId("");}} className="w-full py-2.5 border border-indigo-300 text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-50 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4"/>สร้างอีกรายการ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Office Scene ──────────────────────────────────────────────────────────
// Positions mapped to characters in the Amber RE office photo (landscape 16:9).
const SEATS = [
  { left:"30%", top:"45%" }, // guy sitting at left desk
  { left:"53%", top:"30%" }, // first woman center
  { left:"62%", top:"27%" }, // second woman center
  { left:"84%", top:"29%" }, // guy right with controller
  { left:"72%", top:"48%" }, // extra seat
  { left:"42%", top:"52%" }, // extra seat
  { left:"18%", top:"35%" }, // extra seat back
  { left:"90%", top:"50%" }, // extra seat far right
];

function OfficeScene({ agents, onUse, onEdit, onDelete, onAdd, deleting }: {
  agents: AiAgent[]; onUse:(a:AiAgent)=>void; onEdit:(a:AiAgent)=>void;
  onDelete:(id:number)=>void; onAdd:()=>void; deleting:number|null;
}) {
  const activeAgents = agents.filter(a => a.isActive);
  const inactiveAgents = agents.filter(a => !a.isActive);

  return (
    <div className="rounded-2xl overflow-hidden border shadow-lg">
      <div className="relative w-full" style={{ paddingBottom:"56%" }}>
        <img src="/images/office-bg.png" alt="office" className="absolute inset-0 w-full h-full object-cover object-top" />
        <div className="absolute inset-0 bg-black/5" />

        {SEATS.map((seat, idx) => {
          const agent = activeAgents[idx];
          if (!agent) {
            if (idx !== activeAgents.length) return null;
            return (
              <button key={idx} onClick={onAdd} className="absolute group"
                style={{ left:seat.left, top:seat.top, transform:"translate(-50%,-100%)" }}>
                <div className="w-14 h-18 rounded-xl border-2 border-dashed border-white/70 bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/40 transition-colors p-3">
                  <Plus className="w-5 h-5 text-white" />
                </div>
              </button>
            );
          }

          const appearance = parseAppearance(agent.appearance);
          return (
            <div key={agent.id} className="absolute group"
              style={{ left:seat.left, top:seat.top, transform:"translate(-50%,-100%)" }}>
              <div className={`relative flex flex-col items-center ${!agent.isActive?"opacity-50":""}`}>
                {/* AI badge */}
                {agent.actionType !== "NONE" && (
                  <span className="absolute -top-1 -right-2 z-20 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-lg"
                    style={{ background: agent.color }}>AI</span>
                )}

                {/* Character */}
                <div className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]">
                  <AgentCharacter appearance={appearance} size={60} isActive={agent.isActive} />
                </div>

                {/* Name tag */}
                <div className="bg-white/95 backdrop-blur-sm rounded-lg px-2.5 py-1 shadow-lg border border-white/60 mt-0.5">
                  <p className="text-[11px] font-bold text-gray-900 whitespace-nowrap max-w-[90px] truncate text-center">{agent.name}</p>
                </div>

                {/* Hover popup */}
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all pointer-events-none group-hover:pointer-events-auto z-30 w-40">
                  <div className="bg-white/98 backdrop-blur rounded-xl shadow-2xl p-3 border border-gray-100">
                    <p className="text-[10px] text-gray-500 mb-2">{agent.position}</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {agent.actionType !== "NONE" && agent.isActive && (
                        <button onClick={()=>onUse(agent)} className="flex-1 text-white text-[11px] font-bold px-2 py-1 rounded-lg"
                          style={{ background: agent.color }}>ใช้งาน</button>
                      )}
                      <button onClick={()=>onEdit(agent)} className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"><Pencil className="w-3.5 h-3.5"/></button>
                      <button onClick={()=>onDelete(agent.id)} disabled={deleting===agent.id} className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg">
                        {deleting===agent.id?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<Trash2 className="w-3.5 h-3.5"/>}
                      </button>
                    </div>
                  </div>
                  <div className="w-3 h-3 bg-white rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-r border-b border-gray-100" />
                </div>
              </div>
            </div>
          );
        })}

        {activeAgents.length >= SEATS.length && (
          <button onClick={onAdd} className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/90 hover:bg-white text-gray-800 text-xs font-semibold rounded-xl px-3 py-2 shadow-lg border transition-all">
            <Plus className="w-3.5 h-3.5"/>เพิ่ม Agent
          </button>
        )}
      </div>

      {inactiveAgents.length > 0 && (
        <div className="bg-gray-50 px-6 py-4 border-t">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Inactive</p>
          <div className="flex flex-wrap gap-6 items-end">
            {inactiveAgents.map(agent=>{
              const ap = parseAppearance(agent.appearance);
              return (
                <div key={agent.id} className="flex flex-col items-center gap-1 opacity-50 group">
                  <AgentCharacter appearance={ap} size={50} isActive={false} />
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
  const [editAgent, setEditAgent] = useState<Partial<AiAgent>|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeAgent, setActiveAgent] = useState<AiAgent|null>(null);
  const [deleting, setDeleting] = useState<number|null>(null);

  const load = useCallback(async () => {
    try { const r = await fetch("/api/admin/ai-agents"); const d = await r.json(); if(d.success) setAgents(d.data); }
    catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(()=>{ load(); },[load]);

  const handleSave = async (data: Omit<AiAgent,"id">) => {
    const method = editAgent?.id?"PUT":"POST";
    const url = editAgent?.id?`/api/admin/ai-agents/${editAgent.id}`:"/api/admin/ai-agents";
    await fetch(url,{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
    setShowForm(false); setEditAgent(null); await load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("ลบ AI Agent นี้?")) return;
    setDeleting(id); await fetch(`/api/admin/ai-agents/${id}`,{method:"DELETE"});
    setDeleting(null); await load();
  };

  const seedDefault = async () => {
    await fetch("/api/admin/ai-agents",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
      name:"Content AI", position:"นักเขียน Content อสังหาริมทรัพย์",
      duties:"สร้างคำอธิบายทรัพย์สินภาษาไทยและอังกฤษที่น่าสนใจ",
      icon:"✍️", color:"#6366f1", isActive:true, actionType:"CONTENT_WRITER",
      appearance:JSON.stringify({ gender:"female", skinColor:"#FFDBB4", hairColor:"#1C1C1C", hairStyle:"long", eyeColor:"#3A7FC1", topStyle:"blouse", topColor:"#6366f1", bottomStyle:"skirt", bottomColor:"#334155", shoeColor:"#1C1C1C", accessories:[] }),
    })});
    await load();
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl mb-6 p-6 sm:p-8" style={{background:"linear-gradient(135deg,#0f0c29,#302b63,#24243e)"}}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(14)].map((_,i)=>(
            <div key={i} className="absolute rounded-full animate-pulse"
              style={{width:(i%3)*3+4+"px",height:(i%3)*3+4+"px",background:["#6366f1","#a855f7","#ec4899","#38bdf8"][i%4],opacity:0.2+(i%3)*0.1,top:((i*37)%90)+"%",left:((i*53)%90)+"%",animationDelay:i*0.35+"s"}}/>
          ))}
        </div>
        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center"><Bot className="w-6 h-6 text-white"/></div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">AI Office</h1>
            </div>
            <p className="text-white/60 text-sm">ทีม AI ผู้ช่วยจัดการงานหลังบ้าน — hover ที่ตัวละครเพื่อใช้งาน</p>
          </div>
          <button onClick={()=>{setEditAgent({});setShowForm(true);}} className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-sm font-medium border border-white/20 backdrop-blur transition-colors">
            <Plus className="w-4 h-4"/>เพิ่ม Agent
          </button>
        </div>
        <div className="relative z-10 flex gap-3 mt-5 flex-wrap">
          {[{l:"ทั้งหมด",v:agents.length,c:"text-white"},{l:"Active",v:agents.filter(a=>a.isActive).length,c:"text-green-400"},{l:"มี Action",v:agents.filter(a=>a.actionType!=="NONE").length,c:"text-indigo-300"}].map(s=>(
            <div key={s.l} className="bg-white/10 backdrop-blur rounded-xl px-4 py-2.5 text-center">
              <p className={`text-2xl font-bold ${s.c}`}>{s.v}</p><p className="text-white/60 text-xs">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600"/></div>
      ) : agents.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="flex justify-center"><AgentCharacter appearance={DEFAULT_FEMALE} size={80}/></div>
          <p className="text-gray-600 font-medium">ยังไม่มี AI Agent</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={()=>{setEditAgent({});setShowForm(true);}} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"><Plus className="w-4 h-4"/>เพิ่ม Agent</button>
            <button onClick={seedDefault} className="px-5 py-2.5 border border-indigo-300 text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-50 flex items-center gap-2"><Zap className="w-4 h-4"/>สร้างชุดเริ่มต้น</button>
          </div>
        </div>
      ) : (
        <OfficeScene agents={agents} onUse={a=>setActiveAgent(a)} onEdit={a=>{setEditAgent(a);setShowForm(true);}} onDelete={handleDelete} onAdd={()=>{setEditAgent({});setShowForm(true);}} deleting={deleting} />
      )}

      {showForm && <AgentFormModal agent={editAgent} onClose={()=>{setShowForm(false);setEditAgent(null);}} onSave={handleSave}/>}
      {activeAgent?.actionType==="CONTENT_WRITER" && <ContentWriterModal agent={activeAgent} onClose={()=>setActiveAgent(null)}/>}
    </div>
  );
}
