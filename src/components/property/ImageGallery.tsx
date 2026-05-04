"use client";

import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Thumbs } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
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

  if (images.length === 0) {
    return (
      <div className="w-full h-48 sm:h-72 lg:h-96 bg-gray-200 rounded-xl flex items-center justify-center text-gray-500">
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
        className="w-full h-48 sm:h-72 lg:h-96 rounded-xl overflow-hidden"
      >
        {images.map((img) => (
          <SwiperSlide key={img.id}>
            <img
              src={img.imageUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
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
    </div>
  );
}
