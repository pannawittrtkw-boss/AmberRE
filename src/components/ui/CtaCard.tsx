import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

interface CtaCardProps {
  title: string;
  description: string;
  buttonLabel: string;
  buttonHref: string;
}

/** Dark gradient sticky-sidebar CTA card with gold glow */
export default function CtaCard({
  title,
  description,
  buttonLabel,
  buttonHref,
}: CtaCardProps) {
  return (
    <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-[#5a4621] text-white rounded-3xl p-7 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#C8A951]/20 rounded-full blur-3xl -translate-y-12 translate-x-12" />
      <div className="relative">
        <Sparkles className="w-6 h-6 text-[#E8C97A] mb-3" />
        <h3 className="font-bold text-xl mb-1.5">{title}</h3>
        <p className="text-sm text-white/70 mb-5 leading-relaxed">
          {description}
        </p>
        <Link
          href={buttonHref}
          className="inline-flex items-center justify-center gap-2 w-full bg-[#C8A951] hover:bg-[#D4B968] text-stone-900 font-semibold py-3 rounded-full text-sm transition-colors"
        >
          {buttonLabel}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
