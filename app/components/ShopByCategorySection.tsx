"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Wifi, Smartphone } from "lucide-react";

const slideVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 30 : -30 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -30 : 30, transition: { duration: 0.3, ease: "easeIn" } }),
};

const contentVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const SLIDES = [
  {
    id: "routers",
    icon: Wifi,
    title: "راوترات",
    subtitle: "أداء أقوى وتغطية أوسع",
    href: "/routers",
    operators: [
      { name: "STC",     color: "#6B21A8", bg: "rgba(107,33,168,0.15)" },
      { name: "موبايلي", color: "#E11D48", bg: "rgba(225,29,72,0.15)"  },
      { name: "زين",     color: "#0EA5E9", bg: "rgba(14,165,233,0.15)" },
      { name: "Virgin",  color: "#16A34A", bg: "rgba(22,163,74,0.15)"  },
    ],
    features: ["سرعات عالية تصل إلى 5G", "تغطية شاملة في كل مكان", "إعداد سهل وسريع"],
    glowPos: "top-right",
  },
  {
    id: "esim",
    icon: Smartphone,
    title: "شرائح إلكترونية",
    subtitle: "متعددة الشركات",
    href: "/sim-cards",
    operators: [
      { name: "STC",     color: "#6B21A8", bg: "rgba(107,33,168,0.15)" },
      { name: "موبايلي", color: "#E11D48", bg: "rgba(225,29,72,0.15)"  },
      { name: "زين",     color: "#0EA5E9", bg: "rgba(14,165,233,0.15)" },
      { name: "Virgin",  color: "#16A34A", bg: "rgba(22,163,74,0.15)"  },
      { name: "Lebara",  color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
      { name: "Salam",   color: "#10B981", bg: "rgba(16,185,129,0.15)" },
    ],
    features: ["تفعيل فوري بدون شريحة فيزيائية", "دعم جميع الأجهزة الحديثة", "باقات مرنة لكل الاحتياجات"],
    glowPos: "top-left",
  },
];

export default function ShopByCategorySection() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(0);

  const goTo = useCallback((index: number, dir?: number) => {
    if (index === current) return;
    setDirection(dir ?? (index > current ? 1 : -1));
    setCurrent(index);
  }, [current]);

  const next = useCallback(() => goTo((current + 1) % SLIDES.length, 1), [current, goTo]);
  const prev = useCallback(() => goTo((current - 1 + SLIDES.length) % SLIDES.length, -1), [current, goTo]);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [next, paused]);

  const s = SLIDES[current];
  const Icon = s.icon;

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
  };

  return (
    <section dir="rtl" className="w-full px-3 sm:px-6 lg:px-8 py-8 sm:py-14">
      <div className="max-w-6xl mx-auto">

        {/* Title */}
        <div className="flex items-center gap-3 mb-6 sm:mb-10">
          <div className="w-1 h-7 rounded-full bg-[#FC0]" />
          <h2 className="text-xl sm:text-3xl font-black text-white">تسوق حسب الفئة</h2>
        </div>

        {/* Slider */}
        <div
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl"
          style={{
            background: "linear-gradient(135deg, #001a3a 0%, #003160 60%, #004080 100%)",
            border: "1px solid rgba(255,205,0,0.15)",
            boxShadow: "0 8px 40px rgba(0,49,96,0.4)",
          }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Decorative glow */}
          <div
            className="absolute w-64 h-64 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(255,205,0,0.10), transparent 70%)",
              top: "-60px",
              [s.glowPos === "top-right" ? "right" : "left"]: "-60px",
              transition: "left 0.5s, right 0.5s",
            }}
          />

          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={s.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="relative p-5 sm:p-8 lg:p-10 flex flex-col justify-between"
            >
              <motion.div
                variants={contentVariants}
                initial="hidden"
                animate="show"
                className="flex flex-col gap-4 sm:gap-6"
              >
                {/* Icon + title */}
                <motion.div variants={itemVariants} className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(255,205,0,0.1)", border: "1px solid rgba(255,205,0,0.25)" }}
                  >
                    <Icon className="w-5 h-5 sm:w-7 sm:h-7 text-[#FC0]" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-3xl font-black text-white">{s.title}</h3>
                    <p className="text-white/50 text-xs sm:text-sm mt-0.5">{s.subtitle}</p>
                  </div>
                </motion.div>

                {/* Operators */}
                <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
                  {s.operators.map((op) => (
                    <span
                      key={op.name}
                      className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold"
                      style={{ color: op.color, background: op.bg, border: `1px solid ${op.color}30` }}
                    >
                      {op.name}
                    </span>
                  ))}
                </motion.div>

                {/* Features */}
                <motion.ul variants={itemVariants} className="flex flex-col gap-2">
                  {s.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-white/70 text-xs sm:text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FC0] shrink-0" />
                      {f}
                    </li>
                  ))}
                </motion.ul>

                {/* CTA */}
                <motion.div variants={itemVariants} className="pt-2">
                  <Link
                    href={s.href}
                    className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3 rounded-xl bg-[#FC0] text-black font-bold text-sm sm:text-base hover:-translate-y-0.5 transition-transform duration-200 shadow-lg shadow-[#FC0]/20"
                  >
                    تسوق الآن
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* Dots */}
          <div className="flex justify-center gap-2 pb-5 pt-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`slide ${i + 1}`}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === current ? "28px" : "8px",
                  background: i === current ? "#FC0" : "rgba(255,255,255,0.3)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
