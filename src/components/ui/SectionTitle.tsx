interface SectionTitleProps {
  badge?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
}

/**
 * Editorial-style section title:
 *   ━━ BADGE
 *   Big Heading
 *   optional subtitle
 */
export default function SectionTitle({
  badge,
  title,
  subtitle,
  align = "left",
  className = "",
}: SectionTitleProps) {
  const alignCls = align === "center" ? "text-center items-center" : "items-start";
  return (
    <div className={`flex flex-col ${alignCls} ${className}`}>
      {badge && (
        <div
          className={`flex items-center gap-2 text-[#C8A951] text-xs uppercase tracking-widest font-medium mb-2 ${
            align === "center" ? "justify-center" : ""
          }`}
        >
          <span className="w-6 h-px bg-[#C8A951]" />
          {badge}
          {align === "center" && <span className="w-6 h-px bg-[#C8A951]" />}
        </div>
      )}
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-stone-900 leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-stone-500 text-sm md:text-base mt-2 max-w-2xl">
          {subtitle}
        </p>
      )}
    </div>
  );
}
