"use client";

import { useState, useMemo } from "react";
import { Search, X, User, Check } from "lucide-react";

interface Agent {
  id: number;
  firstName: string;
  lastName: string;
}

export default function AgentPickerModal({
  agents,
  selectedId,
  onSelect,
  onClose,
  locale,
}: {
  agents: Agent[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  onClose: () => void;
  locale: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return agents;
    return agents.filter((a) =>
      `${a.firstName} ${a.lastName}`.toLowerCase().includes(q)
    );
  }, [agents, query]);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-md shadow-xl flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <h3 className="font-semibold text-gray-900 text-sm">
            {locale === "th" ? "เลือกตัวแทน (Agent)" : "Select Agent"}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-3 border-b shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={locale === "th" ? "ค้นหาชื่อ..." : "Search by name..."}
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C8A951]/30 focus:border-[#C8A951]"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 py-1">
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              onClose();
            }}
            className={`w-full flex items-center justify-between gap-2 px-5 py-2.5 text-sm text-left hover:bg-stone-50 ${
              selectedId === null ? "text-amber-800 font-medium" : "text-stone-500"
            }`}
          >
            {locale === "th" ? "— ไม่ระบุ —" : "— None —"}
            {selectedId === null && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
          </button>

          {filtered.length === 0 ? (
            <p className="text-center text-sm text-stone-400 py-8">
              {locale === "th" ? "ไม่พบตัวแทนที่ค้นหา" : "No agents found"}
            </p>
          ) : (
            filtered.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  onSelect(a.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between gap-2 px-5 py-2.5 text-sm text-left hover:bg-stone-50 ${
                  selectedId === a.id ? "bg-amber-50 text-amber-800 font-medium" : "text-stone-700"
                }`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span className="truncate">{a.firstName} {a.lastName}</span>
                </span>
                {selectedId === a.id && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
