"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Smartphone, Truck, ShieldCheck, Zap, ChevronLeft } from "lucide-react";
import AnimatedBackground from "../../components/AnimatedBackground";

const iphoneCards = [
  { label: "آيفون 17 برو ماكس", href: "/smartphones/iphone-17-pro-max", image: "/iphone17.webp" },
  { label: "آيفون 17 برو", href: "/smartphones/iphone-17-pro", image: "/i17pro.webp" },
  { label: "آيفون 17 Air", href: "/smartphones/iphone-17-air", image: "/i17air.webp" },
  { label: "آيفون 17 عادي", href: "/smartphones/iphone-17", image: "/i17.webp" },
  { label: "آيفون 16 برو ماكس", href: "/smartphones/iphone-16-pro-max", image: "/i16promax.webp" },
  { label: "آيفون 16 برو", href: "/smartphones/iphone-16-pro", image: "/i16pro.webp" },
  { label: "آيفون 16 بلس", href: "/smartphones/iphone-16-plus", image: "/i16plus.webp" },
  { label: "آيفون 16 عادي", href: "/smartphones/iphone-16", image: "/i16.webp" },
  { label: "آيفون 15 برو ماكس", href: "/smartphones/iphone-15-pro-max", image: "/i15promax.webp" },
  { label: "آيفون 15 بلس", href: "/smartphones/iphone-15-plus", image: "/i15plus.webp" },
  { label: "آيفون 14 برو ماكس", href: "/smartphones/iphone-14-pro-max", image: "/i14promax.webp" },
  { label: "آيفون 13 برو ماكس", href: "/smartphones/iphone-13-pro-max", image: "/i13promax.webp" },
];

const samsungCards = [
  { label: "سامسونج S26 الترا", href: "/smartphones/samsung-s26-ultra", image: "/s26altra.webp" },
  { label: "سامسونج S25 الترا", href: "/smartphones/samsung-s25-ultra", image: "/s25.webp" },
  { label: "سامسونج S24 الترا", href: "/smartphones/samsung-s24-ultra", image: "/s24.webp" },
  { label: "سامسونج S23 الترا", href: "/smartphones/samsung-s23-ultra", image: "/s23.webp" },
  { label: "سامسونج S22 الترا", href: "/smartphones/samsung-s22-ultra", image: "/s22.webp" },
];

function PhoneCard({ card }: { card: { label: string; href: string; image: string } }) {
  return (
    <Link
      href={card.href}
      className="group relative overflow-hidden rounded-2xl lg:rounded-3xl aspect-[3/4] flex flex-col justify-end cursor-pointer shadow-lg hover:shadow-teal-500/20 hover:shadow-2xl transition-shadow duration-300"
    >
      <Image
        src={card.image}
        alt={card.label}
        fill
        className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
        style={{ willChange: "transform" }}
        unoptimized
      />
      {/* overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      {/* border glow on hover */}
      <div className="absolute inset-0 rounded-2xl lg:rounded-3xl ring-1 ring-white/10 group-hover:ring-teal-400/40 transition-all duration-300" />
      <div className="relative p-3 sm:p-4 flex flex-col gap-1">
        <h3 className="text-white font-black text-sm sm:text-base leading-tight drop-shadow-md">
          {card.label}
        </h3>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-400/90 text-black text-[10px] sm:text-xs font-bold w-fit group-hover:bg-teal-300 transition-colors duration-300 mt-1">
          تسوق الآن
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-2.5 h-2.5 sm:w-3 sm:h-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </span>
      </div>
    </Link>
  );
}

type Card = { label: string; href: string; image: string };

function CardSection({ emoji, title, cards }: { emoji: string; title: string; cards: Card[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? cards : cards.slice(0, 4);

  return (
    <div>
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-5 lg:mb-6">
        <span className="text-lg sm:text-xl lg:text-2xl">{emoji}</span>
        <h3 className="text-base sm:text-xl lg:text-2xl font-black text-white whitespace-nowrap">{title}</h3>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-teal-500/30 to-teal-400/50" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        {visible.map((card) => (
          <PhoneCard key={card.href} card={card} />
        ))}
      </div>

      {cards.length > 4 && (
        <div className="flex justify-center mt-5 sm:mt-6">
          <button
            onClick={() => setShowAll((p) => !p)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-white/80 hover:border-teal-400/50 hover:text-teal-300 hover:bg-teal-500/10 transition-all duration-300"
          >
            {showAll ? "عرض أقل" : `عرض المزيد (${cards.length - 4}+)`}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-4 h-4 transition-transform duration-300 ${showAll ? "rotate-180" : ""}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

const badges = [
  { icon: Truck, label: "شحن سريع" },
  { icon: ShieldCheck, label: "ضمان معتمد" },
  { icon: Zap, label: "تقسيط مريح" },
];

export default function SmartphonesPage() {
  return (
    <>
      <AnimatedBackground />
      <section dir="rtl" className="w-full min-h-screen relative z-10">

        {/* ══════════ HERO HEADER ══════════ */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-10 sm:pb-14">

          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-1.5 text-xs text-white/40 mb-8"
          >
            <Link href="/" className="hover:text-white/70 transition-colors">الرئيسية</Link>
            <ChevronLeft size={12} />
            <span className="text-white/70">الهواتف الذكية</span>
          </motion.div>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">

            {/* Title */}
            <div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-400/20 text-teal-300 text-[11px] font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-4"
              >
                <Smartphone size={12} />
                تسوق حسب الموديل
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight drop-shadow-lg"
              >
                اختر موديلك
                <span className="block mt-1 bg-gradient-to-l from-teal-400 to-cyan-300 bg-clip-text text-transparent">
                  المناسب لك
                </span>
              </motion.h1>
            </div>

            {/* Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="flex flex-wrap gap-3"
            >
              {badges.map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 + i * 0.08 }}
                  className="flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 backdrop-blur-sm text-white/80 text-xs font-medium px-4 py-2.5 rounded-2xl transition-colors cursor-default"
                >
                  <b.icon size={14} className="text-teal-300" />
                  {b.label}
                </motion.div>
              ))}
            </motion.div>

          </div>
        </div>

        {/* ══════════ CARDS ══════════ */}
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 pb-16 sm:pb-20">
          <div className="flex flex-col gap-8 sm:gap-10 lg:gap-14">
            <CardSection emoji="" title="آيفون" cards={iphoneCards} />
            <CardSection emoji="🤖" title="سامسونج" cards={samsungCards} />
          </div>
        </div>

      </section>
    </>
  );
}
