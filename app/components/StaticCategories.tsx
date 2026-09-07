import Link from "next/link";
import Image from "next/image";

const categories = [
  { name: "شرائح SIM", desc: "شرائح محلية ودولية وeSIM", href: "/sim-cards", image: "/hero39.webp", glow: "rgba(252,204,0,0.25)" },
  { name: "راوترات 5G", desc: "إنترنت فائق السرعة للمنزل والسفر", href: "/routers/5g", image: "/hero40.webp", glow: "rgba(0,49,96,0.35)" },
  { name: "راوترات بورتابل", desc: "انترنت في كل مكان بدون انقطاع", href: "/routers/portable", image: "/hero38.webp", glow: "rgba(0,31,68,0.35)" },
  { name: "باقات الإنترنت", desc: "باقات شهرية وسنوية بأسعار تنافسية", href: "/internet-packages", image: "/hero5.webp", glow: "rgba(227,168,0,0.25)" },
];

function CardContent({ cat, wide }: { cat: typeof categories[0]; wide?: boolean }) {
  return (
    <div className="relative p-3 sm:p-4 lg:p-5 flex flex-col gap-1 sm:gap-2 bg-gradient-to-t from-black/60 via-black/10 to-transparent">
      <h3 className={`text-white font-black leading-tight ${wide ? "text-base sm:text-xl lg:text-2xl" : "text-sm sm:text-base lg:text-lg"}`}>
        {cat.name}
      </h3>
      <p className={`text-white/70 leading-snug ${wide ? "text-xs sm:text-sm lg:text-base" : "text-[10px] sm:text-xs"}`}>
        {cat.desc}
      </p>
      <span className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-white backdrop-blur-sm border border-white/20 text-black text-[10px] sm:text-xs font-bold w-fit group-hover:bg-white group-hover:text-gray-900 transition-all duration-300 mt-1">
        تسوق الآن
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-2.5 h-2.5 sm:w-3 sm:h-3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
      </span>
    </div>
  );
}

export default function StaticCategories() {
  const first = categories[0];
  const last = categories[categories.length - 1];
  const middle = categories.slice(1, categories.length - 1);

  return (
    <section dir="rtl" className="w-full py-8 sm:py-12 lg:py-16 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-6 sm:mb-10 lg:mb-14">
          <span className="inline-block px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold tracking-widest text-yellow-300 border border-yellow-400/40 bg-yellow-400/10 mb-3 sm:mb-4">
            📡 تسوق حسب الأقسام
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black text-white leading-tight">
            اختر القسم
            <span className="block bg-gradient-to-l from-yellow-400 to-amber-300 bg-clip-text text-transparent">
              المناسب لك
            </span>
          </h2>
        </div>

        <div className="flex flex-col gap-3 sm:gap-4 lg:gap-5">

          {/* أول كارد — بالعرض */}
          <Link
            href={first.href}
            className="group relative overflow-hidden rounded-2xl lg:rounded-3xl w-full aspect-[16/6] sm:aspect-[16/5] flex flex-col justify-end cursor-pointer"
            style={{ boxShadow: `0 4px 24px ${first.glow}` }}
          >
            <Image src={first.image} alt={first.name} fill className="object-cover object-center transition-transform duration-700 group-hover:scale-105" unoptimized />
            <CardContent cat={first} wide />
          </Link>

          {/* الكاردات الوسطى — بالطول */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {middle.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="group relative overflow-hidden rounded-2xl lg:rounded-3xl aspect-[3/4] flex flex-col justify-end cursor-pointer"
                style={{ boxShadow: `0 4px 24px ${cat.glow}` }}
              >
                <Image src={cat.image} alt={cat.name} fill className="object-cover object-center transition-transform duration-700 group-hover:scale-105" unoptimized />
                <CardContent cat={cat} />
              </Link>
            ))}
          </div>

          {/* آخر كارد — بالعرض */}
          <Link
            href={last.href}
            className="group relative overflow-hidden rounded-2xl lg:rounded-3xl w-full aspect-[16/6] sm:aspect-[16/5] flex flex-col justify-end cursor-pointer"
            style={{ boxShadow: `0 4px 24px ${last.glow}` }}
          >
            <Image src={last.image} alt={last.name} fill className="object-cover object-center transition-transform duration-700 group-hover:scale-105" unoptimized />
            <CardContent cat={last} wide />
          </Link>

        </div>
      </div>
    </section>
  );
}
