"use client";

import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Thumbs } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { X, ChevronLeft, ChevronRight, Expand } from "lucide-react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/thumbs";

interface ImageGalleryProps {
  images: { id: number; imageUrl: string; isPrimary: boolean }[];
  title: string;
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") setActiveIndex((i) => (i - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") setActiveIndex((i) => (i + 1) % images.length);
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightboxOpen, images.length]);

  if (images.length === 0) {
    return (
      <div className="w-full h-80 sm:h-[520px] lg:h-[640px] bg-gray-200 rounded-xl flex items-center justify-center text-gray-500">
        No images available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Slider */}
      <Swiper
        modules={[Navigation, Pagination, Thumbs]}
        navigation
        pagination={{ clickable: true }}
        thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
        onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
        className="w-full h-80 sm:h-[520px] lg:h-[640px] rounded-xl overflow-hidden group"
      >
        {images.map((img, idx) => (
          <SwiperSlide key={img.id}>
            <div
              className="relative w-full h-full cursor-zoom-in"
              onClick={() => {
                setActiveIndex(idx);
                setLightboxOpen(true);
              }}
            >
              <img
                src={img.imageUrl}
                alt={title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 p-2 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <Expand className="w-4 h-4" />
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Thumbnails */}
      {images.length > 1 && (
        <Swiper
          onSwiper={setThumbsSwiper}
          slidesPerView={Math.min(images.length, 4)}
          breakpoints={{
            640: { slidesPerView: Math.min(images.length, 5) },
            1024: { slidesPerView: Math.min(images.length, 6) },
          }}
          spaceBetween={8}
          watchSlidesProgress
          className="h-20"
        >
          {images.map((img) => (
            <SwiperSlide key={img.id} className="cursor-pointer">
              <img
                src={img.imageUrl}
                alt={title}
                className="w-full h-full object-cover rounded-lg opacity-70 hover:opacity-100 transition-opacity"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full"
          >
            <X className="w-7 h-7" />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((i) => (i - 1 + images.length) % images.length);
                }}
                className="absolute left-2 sm:left-6 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex((i) => (i + 1) % images.length);
                }}
                className="absolute right-2 sm:right-6 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          <img
            src={images[activeIndex].imageUrl}
            alt={title}
            onClick={(e) => e.stopPropagation()}
            className="max-w-[95vw] max-h-[90vh] object-contain"
          />

          <div className="absolute bottom-4 text-white/70 text-sm">
            {activeIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}
