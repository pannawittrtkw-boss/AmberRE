"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  const [dragDelta, setDragDelta] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);
  const draggedRef = useRef(false); // tracks whether motion exceeded click threshold

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

  // Shared pointer logic for both mouse + touch
  const onPointerDown = useCallback((clientX: number) => {
    if (!hasMultiple) return;
    startX.current = clientX;
    draggedRef.current = false;
    setIsDragging(true);
  }, [hasMultiple]);

  const onPointerMove = useCallback((clientX: number) => {
    if (startX.current === null) return;
    const delta = clientX - startX.current;
    if (Math.abs(delta) > 5) draggedRef.current = true;
    setDragDelta(delta);
  }, []);

  const onPointerUp = useCallback(() => {
    if (startX.current === null) return;
    const containerWidth = containerRef.current?.offsetWidth || 1;
    const threshold = containerWidth * 0.2; // need to drag 20% of width to advance
    const delta = dragDelta;
    if (delta < -threshold) {
      setIndex((i) => (i + 1) % total);
    } else if (delta > threshold) {
      setIndex((i) => (i - 1 + total) % total);
    }
    startX.current = null;
    setDragDelta(0);
    setIsDragging(false);
  }, [dragDelta, total]);

  // Mouse handlers (use window listeners while dragging so pointer can leave)
  const onMouseDown = (e: React.MouseEvent) => {
    if (!hasMultiple) return;
    if (e.button !== 0) return; // only left mouse button
    e.preventDefault();
    onPointerDown(e.clientX);
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => onPointerMove(e.clientX);
    const handleMouseUp = () => onPointerUp();
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, onPointerMove, onPointerUp]);

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    onPointerDown(e.touches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    onPointerMove(e.touches[0].clientX);
  };
  const onTouchEnd = () => {
    onPointerUp();
  };

  // Block parent Link click if user actually dragged
  const onClickCapture = (e: React.MouseEvent) => {
    if (draggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      draggedRef.current = false;
    }
  };

  const arrowVisibilityCls = alwaysShowArrows
    ? "opacity-100"
    : "opacity-0 group-hover:opacity-100 max-sm:opacity-100";

  // Translate the strip: each image is 100% of container width
  const trackTransform = `translateX(calc(${-index * 100}% + ${dragDelta}px))`;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden select-none ${
        hasMultiple ? (isDragging ? "cursor-grabbing" : "cursor-grab") : ""
      } ${className}`}
      onMouseDown={onMouseDown}
      onTouchStart={hasMultiple ? onTouchStart : undefined}
      onTouchMove={hasMultiple ? onTouchMove : undefined}
      onTouchEnd={hasMultiple ? onTouchEnd : undefined}
      onClickCapture={onClickCapture}
    >
      {/* Track of all images side-by-side */}
      <div
        className={`flex h-full ${
          isDragging ? "" : "transition-transform duration-300 ease-out"
        }`}
        style={{ transform: trackTransform }}
      >
        {ordered.map((img, i) => (
          <div key={i} className="relative w-full h-full shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.imageUrl}
              alt={alt}
              draggable={false}
              className={`w-full h-full object-cover transition-transform duration-500 ${imageClassName}`}
              loading={i === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}
      </div>

      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous image"
            className={`absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 hover:bg-white text-stone-800 shadow-md flex items-center justify-center transition-opacity z-10 ${arrowVisibilityCls}`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next image"
            className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 hover:bg-white text-stone-800 shadow-md flex items-center justify-center transition-opacity z-10 ${arrowVisibilityCls}`}
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
