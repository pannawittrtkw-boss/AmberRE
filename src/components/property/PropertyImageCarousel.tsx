"use client";

import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CarouselImage {
  imageUrl: string;
  isPrimary?: boolean;
}

interface PropertyImageCarouselProps {
  images: CarouselImage[];
  alt: string;
  className?: string;
  imageClassName?: string;
  /**
   * Always show arrow buttons (true) vs. only on hover for desktop (false).
   * On touch devices arrows are always visible regardless.
   */
  alwaysShowArrows?: boolean;
}

export default function PropertyImageCarousel({
  images,
  alt,
  className = "",
  imageClassName = "",
  alwaysShowArrows = false,
}: PropertyImageCarouselProps) {
  // Prefer the primary image first
  const ordered = (() => {
    if (!images || images.length === 0) {
      return [{ imageUrl: "/placeholder-property.jpg" }];
    }
    const primary = images.find((i) => i.isPrimary);
    if (!primary) return images;
    return [primary, ...images.filter((i) => i !== primary)];
  })();

  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);

  const total = ordered.length;
  const hasMultiple = total > 1;

  const goPrev = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i - 1 + total) % total);
  };
  const goNext = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i + 1) % total);
  };
  const goTo = (e: React.MouseEvent, i: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex(i);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };
  const onTouchEnd = () => {
    if (touchStartX.current === null) return;
    const delta = touchDeltaX.current;
    const threshold = 40; // pixels
    if (Math.abs(delta) > threshold) {
      if (delta < 0) setIndex((i) => (i + 1) % total);
      else setIndex((i) => (i - 1 + total) % total);
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  const arrowVisibilityCls = alwaysShowArrows
    ? "opacity-100"
    : "opacity-0 group-hover:opacity-100 sm:opacity-0 max-sm:opacity-100";

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onTouchStart={hasMultiple ? onTouchStart : undefined}
      onTouchMove={hasMultiple ? onTouchMove : undefined}
      onTouchEnd={hasMultiple ? onTouchEnd : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ordered[index].imageUrl}
        alt={alt}
        className={`w-full h-full object-cover transition-transform duration-500 ${imageClassName}`}
        loading="lazy"
      />

      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous image"
            className={`absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 hover:bg-white text-stone-800 shadow-md flex items-center justify-center transition-opacity ${arrowVisibilityCls}`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next image"
            className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 hover:bg-white text-stone-800 shadow-md flex items-center justify-center transition-opacity ${arrowVisibilityCls}`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            {ordered.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => goTo(e, i)}
                aria-label={`Go to image ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index
                    ? "w-4 bg-white"
                    : "w-1.5 bg-white/60 hover:bg-white/90"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
