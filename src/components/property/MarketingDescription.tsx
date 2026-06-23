"use client";

import { useState, useEffect } from "react";
import {
  Copy,
  Check,
  Megaphone,
  Share2,
  Loader2,
  ExternalLink,
  MessageCircle,
  Download,
} from "lucide-react";

interface Props {
  text: string;
  locale: string;
  propertyUrl: string;
  imageUrls: string[];
}

type ShareTarget = "facebook" | "line" | "download";
type ShareStatus = "idle" | "preparing" | "sharing" | "downloading" | "done";

const FB_SHARER_URL = "https://www.facebook.com/sharer/sharer.php?u=";
const FB_GROUPS_URL = "https://www.facebook.com/groups/feed/";
const LINE_SHARE_URL = "https://line.me/R/share?text=";

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
  const [messages, setMessages] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [shareStatus, setShareStatus] = useState<ShareStatus>("idle");
  const [activeTarget, setActiveTarget] = useState<ShareTarget | null>(null);
  const [shareProgress, setShareProgress] = useState({ done: 0, total: 0 });
  const [desktopHint, setDesktopHint] = useState<ShareTarget | null>(null);
  const [mobileHint, setMobileHint] = useState<"files" | "textonly" | null>(null);

  useEffect(() => {
    import(`@/messages/${locale}.json`).then((m) => setMessages(m.default));
  }, [locale]);

  const T = messages?.marketing ?? {
    headerHint: "Share",
    copy: "Copy text",
    copied: "Copied",
    download: "Download all images",
    shareFb: "Share to Facebook",
    shareLine: "Share to LINE",
    preparing: "Preparing...",
    downloading: "Downloading images",
    done: "Done",
    imagesReady: "Text and images are ready",
    fbHint: "",
    lineHint: "",
    lineMobileFilesHint: "",
    lineMobileTextOnlyHint: "",
    openFacebook: "Open Facebook Share",
    openLine: "Get LINE Desktop",
    close: "Close",
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

  const downloadAllImages = async () => {
    setShareStatus("downloading");
    setShareProgress({ done: 0, total: imageUrls.length });
    for (let i = 0; i < imageUrls.length; i++) {
      const ext =
        imageUrls[i].split(".").pop()?.split("?")[0]?.toLowerCase() || "jpg";
      const safeExt = /^(jpg|jpeg|png|webp|gif)$/.test(ext) ? ext : "jpg";
      const filename = `property-image-${String(i + 1).padStart(2, "0")}.${safeExt}`;
      await triggerDownload(imageUrls[i], filename);
      setShareProgress({ done: i + 1, total: imageUrls.length });
      if (i < imageUrls.length - 1) await sleep(250);
    }
  };

  const handleDownloadOnly = async () => {
    if (shareStatus !== "idle") return;
    setActiveTarget("download");
    try {
      await downloadAllImages();
      setShareStatus("done");
      setTimeout(() => {
        setShareStatus("idle");
        setActiveTarget(null);
      }, 2000);
    } catch {
      setShareStatus("idle");
      setActiveTarget(null);
    }
  };

  const handleShare = async (target: ShareTarget) => {
    if (shareStatus !== "idle") return;
    setActiveTarget(target);
    setDesktopHint(null);
    setMobileHint(null);

    const isMobile =
      typeof window !== "undefined" &&
      /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    const canUseShare =
      typeof navigator !== "undefined" && "share" in navigator;

    // Mobile native share with files — user picks the target app
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

        const canShareApi = typeof navigator.canShare === "function";

        // Best case: this device/app supports sharing images and text together.
        const combinedShare: ShareData = {
          text: `${text}\n\n${propertyUrl}`,
          files,
        };
        const canShareCombined =
          files.length > 0 && canShareApi && navigator.canShare(combinedShare);

        // Some browsers (notably iOS Safari) accept files OR text, but not
        // both together — sharing files+text then silently drops the files
        // and only delivers the text. Detect that case and share files alone
        // instead, with the text copied to the clipboard to paste right after.
        const filesOnlyShare: ShareData = { files };
        const canShareFilesOnly =
          !canShareCombined &&
          files.length > 0 &&
          canShareApi &&
          navigator.canShare(filesOnlyShare);

        setShareStatus("sharing");
        if (canShareCombined) {
          await navigator.share(combinedShare);
        } else if (canShareFilesOnly) {
          try {
            await navigator.clipboard.writeText(text);
          } catch {
            /* ignore */
          }
          await navigator.share(filesOnlyShare);
          setMobileHint("files");
        } else {
          // Can't share images at all (no file-share support, or every
          // image failed to fetch) — at minimum save them to the device so
          // the user can attach them manually after sending the text.
          if (imageUrls.length > 0) {
            await downloadAllImages();
          }
          await navigator.share({ text, url: propertyUrl });
          if (imageUrls.length > 0) setMobileHint("textonly");
        }
        setShareStatus("idle");
        setActiveTarget(null);
        return;
      } catch (err) {
        const aborted = err instanceof Error && err.name === "AbortError";
        if (aborted) {
          setShareStatus("idle");
          setActiveTarget(null);
          return;
        }
        // Otherwise fall through to desktop fallback
      }
    }

    // Desktop fallback: copy text + open target share dialog
    try {
      // 1. Copy text to clipboard so user can paste into the share dialog
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = document.getElementById(
          "npb-marketing-text"
        ) as HTMLTextAreaElement | null;
        ta?.select();
        document.execCommand("copy");
      }

      // 2. Facebook → open sharer.php (uses Open Graph tags from property page)
      //    LINE → open line.me/R/share with text + URL prefilled, plus
      //    download images so user can drag them in if needed.
      if (target === "facebook") {
        // Preview image + title come from OG tags on the property page itself
        window.open(
          `${FB_SHARER_URL}${encodeURIComponent(propertyUrl)}`,
          "_blank",
          "noopener,noreferrer,width=720,height=720"
        );
      } else {
        // LINE on desktop: line.me/R/share is a mobile deep link and just lands
        // on line.me's home page in a desktop browser. There is no reliable
        // web share endpoint that targets a chat/group, so we just stage the
        // text + images for the user to drop into LINE Desktop manually.
        await downloadAllImages();
      }

      setShareStatus("done");
      setDesktopHint(target);
      setTimeout(() => {
        setShareStatus("idle");
        setActiveTarget(null);
      }, 4000);
    } catch {
      setShareStatus("idle");
      setActiveTarget(null);
    }
  };

  const labelFor = (target: ShareTarget, defaultLabel: string) => {
    if (activeTarget !== target) return defaultLabel;
    if (shareStatus === "preparing" || shareStatus === "sharing") return T.preparing;
    if (shareStatus === "downloading") {
      return `${T.downloading} ${shareProgress.done}/${shareProgress.total}`;
    }
    if (shareStatus === "done") return T.done;
    return defaultLabel;
  };

  const isBusy = shareStatus !== "idle" && shareStatus !== "done";

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-3 border-b border-stone-100 bg-stone-50">
        <div className="flex items-center gap-2 text-stone-600">
          <Megaphone className="w-4 h-4 text-[#C8A951]" />
          <span className="text-xs font-medium">{T.headerHint}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
              onClick={handleDownloadOnly}
              disabled={isBusy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-stone-700 hover:bg-stone-800 text-white transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {activeTarget === "download" && isBusy ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              {labelFor("download", T.download)}
            </button>
          )}
          {imageUrls.length > 0 && (
            <button
              onClick={() => handleShare("facebook")}
              disabled={isBusy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-[#1877F2] hover:bg-[#155CC2] text-white transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {activeTarget === "facebook" && isBusy ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
              {labelFor("facebook", T.shareFb)}
            </button>
          )}
          <button
            onClick={() => handleShare("line")}
            disabled={isBusy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-[#06C755] hover:bg-[#05A847] text-white transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {activeTarget === "line" && isBusy ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <MessageCircle className="w-3.5 h-3.5" />
            )}
            {labelFor("line", T.shareLine)}
          </button>
        </div>
      </div>

      {desktopHint && (
        <div
          className={`px-5 py-3 border-b text-sm ${
            desktopHint === "line"
              ? "bg-emerald-50 border-emerald-100 text-emerald-900"
              : "bg-blue-50 border-blue-100 text-blue-900"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold mb-1">{T.imagesReady}</p>
              <p className="whitespace-pre-line text-xs leading-relaxed">
                {desktopHint === "line" ? T.lineHint : T.fbHint}
              </p>
              <a
                href={
                  desktopHint === "line"
                    ? "https://line.me/en/download"
                    : `${FB_SHARER_URL}${encodeURIComponent(propertyUrl)}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 mt-2 text-xs font-semibold hover:underline ${
                  desktopHint === "line" ? "text-emerald-700" : "text-[#1877F2]"
                }`}
              >
                <ExternalLink className="w-3 h-3" />
                {desktopHint === "line" ? T.openLine : T.openFacebook}
              </a>
            </div>
            <button
              type="button"
              onClick={() => setDesktopHint(null)}
              className={`text-xs shrink-0 hover:underline ${
                desktopHint === "line" ? "text-emerald-700" : "text-blue-700"
              }`}
            >
              {T.close}
            </button>
          </div>
        </div>
      )}

      {mobileHint && (
        <div className="px-5 py-3 border-b text-sm bg-emerald-50 border-emerald-100 text-emerald-900">
          <div className="flex items-start justify-between gap-3">
            <p className="whitespace-pre-line text-xs leading-relaxed">
              {mobileHint === "files" ? T.lineMobileFilesHint : T.lineMobileTextOnlyHint}
            </p>
            <button
              type="button"
              onClick={() => setMobileHint(null)}
              className="text-xs shrink-0 hover:underline text-emerald-700"
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
