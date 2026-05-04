"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Heart, Share2, Loader2 } from "lucide-react";
import FeaturedPropertyCard from "@/components/property/FeaturedPropertyCard";
import { useFavorites } from "@/lib/favorites";

export default function FavoritesPage() {
  const params = useParams();
  const locale = (params.locale as string) || "th";
  const { favorites } = useFavorites();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any>(null);

  useEffect(() => {
    import(`@/messages/${locale}.json`)
      .then((m) => setMessages(m.default))
      .catch(() => {});
  }, [locale]);

  useEffect(() => {
    if (favorites.length === 0) {
      setProperties([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/properties?ids=${favorites.join(",")}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const serialized = (data.data || []).map((p: any) => ({
            ...p,
            price: Number(p.price),
            salePrice: p.salePrice ? Number(p.salePrice) : null,
            sizeSqm: p.sizeSqm ? Number(p.sizeSqm) : null,
            latitude: p.latitude ? Number(p.latitude) : null,
            longitude: p.longitude ? Number(p.longitude) : null,
          }));
          setProperties(serialized);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [favorites]);

  const handleShare = async () => {
    const ids = favorites.join(",");
    const url = `${window.location.origin}/${locale}/favorites?shared=${ids}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Favorite Properties", url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      alert(locale === "th" ? "คัดลอกลิงก์แล้ว" : "Link copied!");
    }
  };

  const labels = {
    th: {
      title: "รายการโปรด",
      subtitle: "อสังหาริมทรัพย์ที่คุณบันทึกไว้",
      share: "แชร์รายการโปรด",
      empty: "ยังไม่มีรายการโปรด",
      emptyDesc:
        "กดไอคอนหัวใจเพื่อบันทึกอสังหาริมทรัพย์ที่คุณสนใจ",
    },
    en: {
      title: "Favorite Listings",
      subtitle: "Your saved properties",
      share: "Share Favorites",
      empty: "No favorites yet",
      emptyDesc: "Click the heart icon to save properties you're interested in",
    },
    zh: {
      title: "收藏列表",
      subtitle: "您保存的房产",
      share: "分享收藏",
      empty: "暂无收藏",
      emptyDesc: "点击心形图标保存您感兴趣的房产",
    },
    my: {
      title: "နှစ်သက်ရာ စာရင်း",
      subtitle: "သင် သိမ်းဆည်းထားသော အိမ်ခြံမြေများ",
      share: "နှစ်သက်ရာ မျှဝေရန်",
      empty: "နှစ်သက်ရာ မရှိသေးပါ",
      emptyDesc:
        "နှလုံးသား အိုင်ကွန်ကို နှိပ်၍ အိမ်ခြံမြေများ သိမ်းဆည်းပါ",
    },
  };
  const l = labels[locale as keyof typeof labels] || labels.en;

  if (!messages) return null;

  return (
    <div className="bg-stone-50 min-h-screen">
      {/* HERO */}
      <section className="relative bg-gradient-to-br from-stone-900 via-stone-800 to-[#5a4621] text-white py-12 md:py-14 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/15 rounded-full blur-3xl -translate-y-32 translate-x-32" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#E8C97A] text-xs uppercase tracking-widest font-medium mb-2">
              <span className="w-6 h-px bg-[#E8C97A]" />
              {locale === "th" ? "บันทึกไว้ดูภายหลัง" : "Saved Items"}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight flex items-center gap-3">
              {l.title}
              {favorites.length > 0 && (
                <span className="inline-flex items-center justify-center min-w-9 h-9 px-2 rounded-full bg-rose-500 text-white text-sm font-bold">
                  {favorites.length}
                </span>
              )}
            </h1>
            <p className="text-sm md:text-base text-white/70 mt-2">
              {l.subtitle}
            </p>
          </div>
          {favorites.length > 0 && (
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20 rounded-full text-sm transition-colors"
            >
              <Share2 className="w-4 h-4" />
              {l.share}
            </button>
          )}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-[#C8A951]" />
          </div>
        ) : properties.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-10 h-10 text-rose-300" />
            </div>
            <h2 className="text-xl font-bold text-stone-700 mb-2">
              {l.empty}
            </h2>
            <p className="text-stone-400 text-sm max-w-md mx-auto">
              {l.emptyDesc}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {properties.map((property: any) => (
              <FeaturedPropertyCard
                key={property.id}
                property={property}
                locale={locale}
                messages={messages}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
