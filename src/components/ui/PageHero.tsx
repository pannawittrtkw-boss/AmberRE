import { ChevronLeft } from "lucide-react";
import Link from "next/link";

interface PageHeroProps {
  /** Background image URL, video src, or null for gradient fallback */
  imageUrl?: string | null;
  videoUrl?: string | null;
  /** Small uppercase tagline shown above heading (e.g. "PROPERTIES", "ABOUT") */
  badge?: string;
  /** Big heading */
  title: string;
  /** Optional supporting line under heading */
  subtitle?: string;
  /** Back link config (e.g. "← All Projects") */
  back?: { href: string; label: string };
  /** Extra content rendered to the right (e.g. action buttons) */
  rightAction?: React.ReactNode;
  /** Extra content rendered below heading (e.g. quick stats / search bar) */
  children?: React.ReactNode;
  /** Hero height variant */
  height?: "short" | "medium" | "tall";
}

/**
 * Cinematic page hero:
 *  - Full-width image / video / gradient fallback
 *  - Dark gradient overlay for text contrast
 *  - Top bar with back link + optional right action
 *  - Bottom: badge → big title → subtitle → custom children
 */
export default function PageHero({
  imageUrl,
  videoUrl,
  badge,
  title,
  subtitle,
  back,
  rightAction,
  children,
  height = "medium",
}: PageHeroProps) {
  const heightCls =
    height === "short"
      ? "h-[35vh] min-h-[280px] max-h-[400px]"
      : height === "tall"
      ? "h-[65vh] min-h-[450px] max-h-[650px]"
      : "h-[50vh] min-h-[360px] max-h-[520px]";

  const hasMedia = !!(imageUrl || videoUrl);

  return (
    <section className="relative">
      <div className={`relative ${heightCls} overflow-hidden bg-stone-900`}>
        {videoUrl ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
        ) : imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-800 to-[#5a4621]" />
        )}

        {/* Gradient overlay for text contrast */}
        <div
          className={`absolute inset-0 ${
            hasMedia
              ? "bg-gradient-to-t from-stone-900 via-stone-900/50 to-stone-900/10"
              : ""
          }`}
        />

        {/* Top bar */}
        {(back || rightAction) && (
          <div className="absolute top-0 left-0 right-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
              {back ? (
                <Link
                  href={back.href}
                  className="inline-flex items-center gap-1.5 text-sm text-white/90 hover:text-white bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {back.label}
                </Link>
              ) : (
                <span />
              )}
              {rightAction}
            </div>
          </div>
        )}

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 z-10 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
            {badge && (
              <p className="text-xs sm:text-sm uppercase tracking-widest text-[#E8C97A] mb-3 font-medium">
                {badge}
              </p>
            )}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-base md:text-lg text-white/80 font-light mt-3 max-w-2xl">
                {subtitle}
              </p>
            )}
            {children && <div className="mt-5">{children}</div>}
          </div>
        </div>
      </div>
    </section>
  );
}
