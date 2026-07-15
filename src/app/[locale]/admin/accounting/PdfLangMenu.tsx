"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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

const MENU_WIDTH = 176; // px, matches w-44

// Same icon/position as the plain "view PDF" link it replaces, but opens a
// small menu to pick which language the generated PDF should render in
// (acc-pdf.tsx accepts `?lang=TH|EN`, defaulting to the original bilingual
// layout when omitted).
//
// The menu is rendered into a portal (document.body) instead of inline —
// accounting list tables wrap their rows in overflow-hidden/overflow-x-auto
// containers for the rounded card + horizontal scroll, which was clipping
// an inline absolutely-positioned dropdown. Portal + fixed coordinates
// computed from the button's own rect sidesteps that entirely.
export default function PdfLangMenu({
  href,
  title = "ดู PDF",
  buttonHoverClass = "hover:text-[#C8A951] hover:bg-amber-50",
}: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const openMenu = () => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      setPos({
        top: rect.bottom + 4,
        left: Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8),
      });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !menuRef.current?.contains(target) &&
        !btnRef.current?.contains(target)
      ) setOpen(false);
    };
    const onScrollOrResize = () => setOpen(false);
    document.addEventListener("mousedown", onClick);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        className={`p-1.5 text-gray-400 rounded ${buttonHoverClass}`}
        title={title}
      >
        <ExternalLink className="w-3.5 h-3.5" />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: "fixed", top: pos.top, left: pos.left, width: MENU_WIDTH }}
            className="bg-white rounded-lg shadow-lg border py-1 z-[9999] text-left"
          >
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
          </div>,
          document.body
        )}
    </>
  );
}
