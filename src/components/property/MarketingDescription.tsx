"use client";

import { useState } from "react";
import {
  Copy,
  Check,
  Megaphone,
  Share2,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface Props {
  text: string;
  locale: string;
  propertyUrl: string;
  imageUrls: string[];
}

type ShareStatus = "idle" | "preparing" | "sharing" | "downloading" | "done";

const FB_GROUPS_URL = "https://www.facebook.com/groups/feed/";

async function fetchImageAsFile(
  url: string,
  index: number
): Promise<File | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    const ext = (blob.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
    const filename = `property-image-${index + 1}.${ext}`;
    return new File([blob], filename, { type: blob.type || "image/jpeg" });
  } catch {
    return null;
  }
}

async function triggerDownload(url: string, filename: string): Promise<boolean> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return false;
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(objUrl), 5000);
    return true;
  } catch {
    return false;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function MarketingDescription({
  text,
  locale,
  propertyUrl,
  imageUrls,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [shareStatus, setShareStatus] = useState<ShareStatus>("idle");
  const [shareProgress, setShareProgress] = useState({ done: 0, total: 0 });
  const [showDesktopHint, setShowDesktopHint] = useState(false);

  const T = {
    headerHint:
      locale === "th"
        ? "ข้อความพร้อมโพสต์ Facebook / LINE"
        : "Ready to post on Facebook / LINE",
    copy: locale === "th" ? "คัดลอกข้อความ" : "Copy text",
    copied: locale === "th" ? "คัดลอกแล้ว" : "Copied",
    share: locale === "th" ? "แชร์ไป Facebook" : "Share to Facebook",
    preparing: locale === "th" ? "กำลังเตรียม..." : "Preparing...",
    downloading: locale === "th" ? "กำลังดาวน์โหลดรูป" : "Downloading images",
    done: locale === "th" ? "เสร็จแล้ว" : "Done",
    desktopHintTitle:
      locale === "th"
        ? "ข้อความและรูปพร้อมแล้ว"
        : "Text and images are ready",
    desktopHintBody:
      locale === "th"
        ? "✓ ข้อความถูกคัดลอกแล้ว — กดวาง (Cmd/Ctrl + V) ในช่องโพสต์ของกลุ่ม\n✓ รูปทั้งหมดถูกดาวน์โหลดแล้ว — ลากจาก Downloads วางใน Facebook ได้เลย"
        : "✓ Text copied to clipboard — paste (Cmd/Ctrl + V) in the group's post box\n✓ All images downloaded — drag from Downloads folder into Facebook",
    openFacebook: locale === "th" ? "เปิด Facebook Groups" : "Open Facebook Groups",
    close: locale === "th" ? "ปิด" : "Close",
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.getElementById(
        "npb-marketing-text"
      ) as HTMLTextAreaElement | null;
      if (ta) {
        ta.select();
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleShare = async () => {
    if (shareStatus !== "idle") return;

    const isMobile =
      typeof window !== "undefined" &&
      /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    const canUseShare =
      typeof navigator !== "undefined" && "share" in navigator;

    // Path B: Mobile native share with files
    if (isMobile && canUseShare) {
      try {
        setShareStatus("preparing");
        setShareProgress({ done: 0, total: imageUrls.length });

        const files: File[] = [];
        for (let i = 0; i < imageUrls.length; i++) {
          const f = await fetchImageAsFile(imageUrls[i], i);
          if (f) files.push(f);
          setShareProgress({ done: i + 1, total: imageUrls.length });
        }

        const shareDataWithFiles: ShareData = {
          text: `${text}\n\n${propertyUrl}`,
          files,
        };

        // canShare may not exist on older browsers
        const canShareFiles =
          files.length > 0 &&
          typeof navigator.canShare === "function" &&
          navigator.canShare(shareDataWithFiles);

        setShareStatus("sharing");
        if (canShareFiles) {
          await navigator.share(shareDataWithFiles);
        } else {
          await navigator.share({
            text: text,
            url: propertyUrl,
          });
        }
        setShareStatus("idle");
        return;
      } catch (err) {
        // User cancelled or share failed → fall through to desktop path
        const aborted =
          err instanceof Error && err.name === "AbortError";
        if (aborted) {
          setShareStatus("idle");
          return;
        }
        // Otherwise fall through to desktop fallback
      }
    }

    // Path C: Desktop — copy text + download all images + open Facebook
    try {
      // 1. Copy text
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = document.getElementById(
          "npb-marketing-text"
        ) as HTMLTextAreaElement | null;
        ta?.select();
        document.execCommand("copy");
      }

      // 2. Download images sequentially with small delay
      setShareStatus("downloading");
      setShareProgress({ done: 0, total: imageUrls.length });
      for (let i = 0; i < imageUrls.length; i++) {
        const ext =
          imageUrls[i].split(".").pop()?.split("?")[0]?.toLowerCase() || "jpg";
        const safeExt = /^(jpg|jpeg|png|webp|gif)$/.test(ext) ? ext : "jpg";
        const filename = `property-image-${String(i + 1).padStart(2, "0")}.${safeExt}`;
        await triggerDownload(imageUrls[i], filename);
        setShareProgress({ done: i + 1, total: imageUrls.length });
        // Small gap so browsers don't throttle/block
        if (i < imageUrls.length - 1) await sleep(250);
      }

      // 3. Open Facebook in a new tab
      window.open(FB_GROUPS_URL, "_blank", "noopener,noreferrer");

      setShareStatus("done");
      setShowDesktopHint(true);
      setTimeout(() => setShareStatus("idle"), 4000);
    } catch {
      setShareStatus("idle");
    }
  };

  const shareLabel = (() => {
    if (shareStatus === "preparing") return T.preparing;
    if (shareStatus === "downloading") {
      return `${T.downloading} ${shareProgress.done}/${shareProgress.total}`;
    }
    if (shareStatus === "sharing") return T.preparing;
    if (shareStatus === "done") return T.done;
    return T.share;
  })();

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-3 border-b border-stone-100 bg-stone-50">
        <div className="flex items-center gap-2 text-stone-600">
          <Megaphone className="w-4 h-4 text-[#C8A951]" />
          <span className="text-xs font-medium">{T.headerHint}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-stone-200 hover:bg-stone-300 text-stone-700 transition-colors disabled:opacity-60"
            disabled={copied}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                {T.copied}
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                {T.copy}
              </>
            )}
          </button>
          {imageUrls.length > 0 && (
            <button
              onClick={handleShare}
              disabled={shareStatus !== "idle" && shareStatus !== "done"}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-[#1877F2] hover:bg-[#155CC2] text-white transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {shareStatus === "idle" || shareStatus === "done" ? (
                <Share2 className="w-3.5 h-3.5" />
              ) : (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              {shareLabel}
            </button>
          )}
        </div>
      </div>

      {showDesktopHint && (
        <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 text-sm text-blue-900">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold mb-1">{T.desktopHintTitle}</p>
              <p className="whitespace-pre-line text-xs leading-relaxed">
                {T.desktopHintBody}
              </p>
              <a
                href={FB_GROUPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-[#1877F2] hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                {T.openFacebook}
              </a>
            </div>
            <button
              type="button"
              onClick={() => setShowDesktopHint(false)}
              className="text-xs text-blue-700 hover:text-blue-900 shrink-0"
            >
              {T.close}
            </button>
          </div>
        </div>
      )}

      <pre className="whitespace-pre-wrap break-words text-sm text-stone-800 font-sans leading-relaxed px-5 py-5 max-h-[600px] overflow-y-auto">
        {text}
      </pre>
      <textarea
        id="npb-marketing-text"
        readOnly
        value={text}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}
