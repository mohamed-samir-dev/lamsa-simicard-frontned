"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";

const logos = [
  { src: "/stc.webp", alt: "STC", brand: "STC" },
  { src: "/mobilay.webp", alt: "Mobily", brand: "موبايلي" },
  { src: "/zein.webp", alt: "Zain", brand: "زين" },
  { src: "/vergin.webp", alt: "Virgin", brand: "Virgin Mobile" },
  { src: "/sslam.webp", alt: "Salam", brand: "سلام موبايل" },
];

export default function TelecomPartnersSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  return (
    <section className="py-10 sm:py-14 md:py-16" dir="rtl">
      <div className="text-center mb-8 sm:mb-10 px-4">
        <div className="flex items-center justify-center gap-3 mb-2 sm:mb-3">
          {/* نقط يمين */}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: "#C8A375" }} />
            <span className="w-2 h-2 rounded-full" style={{ background: "#B5854A" }} />
            <span className="w-2 h-2 rounded-full" style={{ background: "#8B6535" }} />
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-black ">
            شركات الاتصالات
          </h2>

          {/* نقط شمال */}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: "#8B6535" }} />
            <span className="w-2 h-2 rounded-full" style={{ background: "#B5854A" }} />
            <span className="w-2 h-2 rounded-full" style={{ background: "#C8A375" }} />
          </div>
        </div>
        <p className="text-xs sm:text-sm text-black max-w-xs sm:max-w-md mx-auto leading-relaxed">
          جميع الشرائح تعمل على شركات الاتصالات السعودية
        </p>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-6">
        {/* سهم يمين */}
        <button
          onClick={() => scroll("right")}
          className="shrink-0 w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-full transition hover:scale-105"
          style={{ background: "#f3f4f6", border: "1px solid #e5e7eb", color: "#B5854A" }}
        >
          <IoChevronForward size={18} />
        </button>

        {/* اللوجوز */}
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-5 overflow-x-auto scrollbar-hide flex-1"
          style={{ direction: "ltr" }}
        >
          {logos.map((logo, i) => (
            <Link
              key={i}
              href={`/all-products?brand=${encodeURIComponent(logo.brand)}`}
              className="flex items-center justify-center rounded-xl sm:rounded-2xl shrink-0 hover:scale-105 transition-all duration-300"
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                padding: "clamp(14px, 2.5vw, 24px) clamp(20px, 4vw, 40px)",
                minWidth: "clamp(110px, 22vw, 160px)",
              }}
            >
              <Image
                src={logo.src}
                alt={logo.alt}
                width={100}
                height={50}
                className="object-contain opacity-85 hover:opacity-100 transition-opacity duration-300"
                style={{ width: "clamp(65px, 12vw, 100px)", height: "auto" }}
              />
            </Link>
          ))}
        </div>

        {/* سهم يسار */}
        <button
          onClick={() => scroll("left")}
          className="shrink-0 w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-full transition hover:scale-105"
          style={{ background: "#f3f4f6", border: "1px solid #e5e7eb", color: "#B5854A" }}
        >
          <IoChevronBack size={18} />
        </button>
      </div>
    </section>
  );
}
