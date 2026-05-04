"use client";

import { useState } from "react";
import { Phone } from "lucide-react";

interface AgentContactButtonsProps {
  phone: string;
  lineId: string;
  locale: string;
}

// LINE brand-ish icon (simple speech-bubble glyph). Lucide doesn't ship a LINE
// icon, so we render an inline SVG with currentColor so it inherits text color.
function LineIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 2C6.477 2 2 5.93 2 10.78c0 4.34 3.55 7.97 8.36 8.66.33.07.77.22.88.51.1.27.07.69.03.96 0 0-.12.7-.14.86-.05.25-.2 1 .87.55 1.07-.45 5.7-3.36 7.78-5.74C20.86 14.28 22 12.66 22 10.78 22 5.93 17.523 2 12 2zm-3.65 11.4H6.93a.32.32 0 01-.32-.32V9.55c0-.18.14-.33.32-.33.18 0 .33.15.33.33v3.21h1.09c.18 0 .33.14.33.32a.33.33 0 01-.33.32zm1.39-.32a.33.33 0 01-.66 0V9.55a.33.33 0 01.66 0v3.53zm4.16 0a.32.32 0 01-.22.31.34.34 0 01-.11.02.33.33 0 01-.27-.13l-1.81-2.46v2.26a.33.33 0 01-.66 0V9.55c0-.14.09-.27.23-.31a.32.32 0 01.37.13l1.81 2.46V9.55a.33.33 0 01.66 0v3.53zm2.66-2.09a.33.33 0 010 .65h-1.09v.7h1.09a.33.33 0 010 .66h-1.42a.32.32 0 01-.32-.33V9.55c0-.18.14-.32.32-.32h1.42a.33.33 0 010 .65h-1.09v.7h1.09z" />
    </svg>
  );
}

export default function AgentContactButtons({
  phone,
  lineId,
  locale,
}: AgentContactButtonsProps) {
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const cleanPhone = phone.replace(/[^0-9+]/g, "");

  // Admin can put either:
  //   - a LINE id like "@cfx5958x" → wrap with the LINE OA URL pattern
  //   - a short link like "https://lin.ee/hH0DQWy" → use as-is
  //   - a full line.me URL → use as-is
  const isUrl = /^https?:\/\//i.test(lineId.trim());
  const lineUrl = isUrl
    ? lineId.trim()
    : `https://line.me/R/ti/p/${encodeURIComponent(
        lineId.startsWith("@") ? lineId : `@${lineId}`
      )}`;

  const handleCallClick = () => {
    if (!phoneRevealed) {
      setPhoneRevealed(true);
    } else {
      window.location.href = `tel:${cleanPhone}`;
    }
  };

  return (
    <div className="space-y-2 mb-5">
      <button
        onClick={handleCallClick}
        className="flex items-center justify-center gap-2 w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-full font-medium text-sm transition-colors"
      >
        <Phone className="w-4 h-4" />
        {phoneRevealed
          ? phone
          : locale === "th"
          ? "โทรหาเจ้าหน้าที่"
          : "Call Agent"}
      </button>
      {phoneRevealed && (
        <p className="text-center text-[11px] text-stone-400 -mt-1">
          {locale === "th" ? "แตะอีกครั้งเพื่อโทร" : "Tap again to call"}
        </p>
      )}
      <a
        href={lineUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 bg-[#06C755] hover:bg-[#05B14B] text-white rounded-full font-medium text-sm transition-colors"
      >
        <LineIcon className="w-4 h-4" />
        Line Official
      </a>
    </div>
  );
}
