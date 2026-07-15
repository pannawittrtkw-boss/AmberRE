"use client";

import { useState, useRef, useEffect } from "react";
import { ExternalLink, Globe } from "lucide-react";

interface Props {
  href: string; // base PDF route, e.g. `/api/admin/acc/invoices/123/pdf`
  title?: string;
  buttonHoverClass?: string;
}

const OPTIONS: Array<{ lang: string | null; label: string }> = [
  { lang: null, label: "ทั้งสองภาษา / Bilingual" },
  { lang: "TH", label: "ไทยเท่านั้น" },
  { lang: "EN", label: "English only" },
];

// Same icon/position as the plain "view PDF" link it replaces, but opens a
// small menu to pick which language the generated PDF should render in
// (acc-pdf.tsx accepts `?lang=TH|EN`, defaulting to the original bilingual
// layout when omitted).
export default function PdfLangMenu({
  href,
  title = "ดู PDF",
  buttonHoverClass = "hover:text-[#C8A951] hover:bg-amber-50",
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`p-1.5 text-gray-400 rounded ${buttonHoverClass}`}
        title={title}
      >
        <ExternalLink className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border py-1 z-50 text-left">
          <div className="px-3 py-1.5 text-[11px] text-gray-400 flex items-center gap-1">
            <Globe className="w-3 h-3" /> เลือกภาษา PDF
          </div>
          {OPTIONS.map((opt) => (
            <a
              key={opt.label}
              href={opt.lang ? `${href}?lang=${opt.lang}` : href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="block px-3 py-1.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-[#C8A951]"
            >
              {opt.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
