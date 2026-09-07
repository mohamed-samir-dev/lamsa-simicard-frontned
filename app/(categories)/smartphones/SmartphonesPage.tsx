"use client";

import Link from "next/link";
import Image from "next/image";

const iphoneCards = [
  { label: "آيفون 17 برو ماكس", href: "/smartphones/iphone-17-pro-max", image: "/phones/iphone-17-pro-max.webp" },
  { label: "آيفون 17 برو", href: "/smartphones/iphone-17-pro", image: "/phones/iphone-17-pro.webp" },
  { label: "آيفون 17 Air", href: "/smartphones/iphone-17-air", image: "/phones/iphone-17-air.webp" },
  { label: "آيفون 17 عادي", href: "/smartphones/iphone-17", image: "/phones/iphone-17.webp" },
  { label: "آيفون 16 برو ماكس", href: "/smartphones/iphone-16-pro-max", image: "/phones/iphone-16-pro-max.webp" },
  { label: "آيفون 16 برو", href: "/smartphones/iphone-16-pro", image: "/phones/iphone-16-pro.webp" },
  { label: "آيفون 16 بلس", href: "/smartphones/iphone-16-plus", image: "/phones/iphone-16-plus.webp" },
  { label: "آيفون 16 عادي", href: "/smartphones/iphone-16", image: "/phones/iphone-16.webp" },
  { label: "آيفون 15 برو ماكس", href: "/smartphones/iphone-15-pro-max", image: "/phones/iphone-15-pro-max.webp" },
  { label: "آيفون 15 بلس", href: "/smartphones/iphone-15-plus", image: "/phones/iphone-15-plus.webp" },
  { label: "آيفون 14 برو ماكس", href: "/smartphones/iphone-14-pro-max", image: "/phones/iphone-14-pro-max.webp" },
  { label: "آيفون 14 برو", href: "/smartphones/iphone-14-pro", image: "/phones/iphone-14-pro.webp" },
  { label: "فقط آبل", href: "/smartphones/apple-only", image: "/phones/apple-only.webp" },
];

const samsungCards = [
  { label: "سامسونج S26 الترا", href: "/smartphones/samsung-s26-ultra", image: "/phones/samsung-s26-ultra.webp" },
  { label: "سامسونج S25 الترا", href: "/smartphones/samsung-s25-ultra", image: "/phones/samsung-s25-ultra.webp" },
  { label: "سامسونج S24 الترا", href: "/smartphones/samsung-s24-ultra", image: "/phones/samsung-s24-ultra.webp" },
  { label: "سامسونج S23 الترا", href: "/smartphones/samsung-s23-ultra", image: "/phones/samsung-s23-ultra.webp" },
  { label: "سامسونج S22 الترا", href: "/smartphones/samsung-s22-ultra", image: "/phones/samsung-s22-ultra.webp" },
];

function PhoneCard({ card }: { card: { label: string; href: string; image: string } }) {
  return (
    <Link
      href={card.href}
      className="group relative overflow-hidden rounded-2xl lg:rounded-3xl aspect-[3/4] flex flex-col justify-end cursor-pointer shadow-md hover:shadow-xl transition-shadow duration-300"
    >
      <Image
        src={card.image}
        alt={card.label}
        fill
        className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
        unoptimized
      />
      <div className="relative p-3 sm:p-4 flex flex-col gap-1 bg-gradient-to-t from-black/60 via-black/10 to-transparent">
        <h3 className="text-white font-black text-sm sm:text-base leading-tight">{card.label}</h3>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-black text-[10px] sm:text-xs font-bold w-fit group-hover:bg-white/90 transition-all duration-300 mt-1">
          تسوق الآن
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-2.5 h-2.5 sm:w-3 sm:h-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </span>
      </div>
    </Link>
  );
}

export default function SmartphonesPage() {
  return (
    <section dir="rtl" className="w-full py-8 sm:py-12 lg:py-16 px-3 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-6 sm:mb-10 lg:mb-14">
          <span className="inline-block px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold tracking-widest text-teal-600 border border-teal-500/30 bg-teal-500/10 mb-3 sm:mb-4">
            📱 تسوق حسب الموديل
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black text-gray-900 leading-tight">
            اختر موديلك
            <span className="block bg-gradient-to-l from-teal-500 to-cyan-400 bg-clip-text text-transparent">
              المناسب لك
            </span>
          </h2>
        </div>

        <div className="flex flex-col gap-8 sm:gap-12">

          {/* آيفون */}
          <div>
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <span className="text-xl sm:text-2xl"></span>
              <h3 className="text-lg sm:text-2xl font-black text-gray-900">آيفون</h3>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gray-200" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {iphoneCards.map((card) => (
                <PhoneCard key={card.href} card={card} />
              ))}
            </div>
          </div>

          {/* سامسونج */}
          <div>
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <span className="text-xl sm:text-2xl">🤖</span>
              <h3 className="text-lg sm:text-2xl font-black text-gray-900">سامسونج</h3>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gray-200" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {samsungCards.map((card) => (
                <PhoneCard key={card.href} card={card} />
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
