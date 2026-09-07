export interface SlugConfig {
  label: string;
  parentLabel: string;
  parentHref: string;
  filters: {
    brand?: string;
    category?: string;
    nameIncludes?: string[];
    nameExcludes?: string[];
  };
}

export const slugConfigs: Record<string, SlugConfig> = {
  // ─── Smartphones ───────────────────────────────────────────
  "iphone-13-pro-max": {
    label: "آيفون 13 برو ماكس",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { category: "ابل ايفون 13 برو ماكس" },
  },
  "iphone-14-pro-max": {
    label: "آيفون 14 برو ماكس",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { category: "ابل ايفون 14 برو ماكس" },
  },
  "iphone-14-pro": {
    label: "آيفون 14 برو",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { category: "ابل ايفون 14 برو" },
  },
  "iphone-14-plus": {
    label: "آيفون 14 بلس",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { category: "ابل ايفون 14 بلس" },
  },
  "iphone-14": {
    label: "آيفون 14 عادي",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { category: "ابل ايفون 14" },
  },
  "iphone-15-pro-max": {
    label: "آيفون 15 برو ماكس",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { category: "ابل ايفون 15 برو ماكس" },
  },
  "iphone-15-pro": {
    label: "آيفون 15 برو",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { category: "ابل ايفون 15 برو" },
  },
  "iphone-15-plus": {
    label: "آيفون 15 بلس",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { category: "ابل ايفون 15 بلس" },
  },
  "iphone-15": {
    label: "آيفون 15 عادي",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { category: "ابل ايفون 15" },
  },
  "iphone-16-pro-max": {
    label: "ابل ايفون 16 برو ماكس",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { category: "ابل ايفون 16 برو ماكس" },
  },
  "iphone-16-pro": {
    label: "ايفون 16 برو",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { category: "ايفون 16 برو" },
  },
  "iphone-16-plus": {
    label: "ايفون 16 بلس",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { brand: "Apple", nameIncludes: ["iphone 16 plus", "ايفون 16 بلس", "آيفون 16 بلس"] },
  },
  "iphone-16": {
    label: "ايفون 16 عادي",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { category: "ايفون 16" },
  },
  "iphone-17-pro-max": {
    label: "أبل آيفون 17 برو ماكس",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { category: "أبل آيفون 17 برو ماكس" },
  },
  "iphone-17-pro": {
    label: "أبل آيفون 17 برو",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { category: "ابل ايفون 17 برو" },
  },
  "iphone-17": {
    label: "أبل آيفون 17 عادي",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { category: "أبل ايفون 17" },
  },
  "iphone-17-air": {
    label: "أبل آيفون 17 Air",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { category: "ابل ايفون 17 اير" },
  },
  "apple-only": {
    label: "فقط آبل",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { brand: "Apple" },
  },
  "samsung-s22-ultra": {
    label: "سامسونج جالكسي اس 22 الترا",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { category: "سامسونج جالاكسي S22" },
  },
  "samsung-s23-ultra": {
    label: "سامسونج جالكسي اس 23 الترا",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { category: "سامسونج جلاكسي S23 الترا" },
  },
  "samsung-s24-ultra": {
    label: "سامسونج جالكسي اس 24 الترا",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { category: "سامسونج جالاكسي S24" },
  },
  "samsung-s25-ultra": {
    label: "سامسونج جالكسي اس 25 الترا",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { category: "سامسونج جالاكسي S25" },
  },
  "samsung-s26-ultra": {
    label: "سامسونج جالكسي اس 26 الترا",
    parentLabel: "الهواتف الذكية",
    parentHref: "/smartphones",
    filters: { category: "سامسونج جالاكسي S26" },
  },

  // ─── Apple Watches ─────────────────────────────────────────
  se: {
    label: "آبل ووتش SE",
    parentLabel: "ساعات ابل",
    parentHref: "/apple-watches",
    filters: { category: "ساعات ابل" },
  },

  // ─── Smart Watches ─────────────────────────────────────────
  "smart-watches": {
    label: "الساعات الذكية",
    parentLabel: "الساعات الذكية",
    parentHref: "/smart-watches",
    filters: { category: "ساعات ذكية" },
  },

  // ─── Audio ─────────────────────────────────────────────────
  "airpods-pro": {
    label: "سماعات أبل",
    parentLabel: "أجهزة صوت و سماعات",
    parentHref: "/audio",
    filters: { category: "سماعات ابل" },
  },
  "airpods-max": {
    label: "سماعات سبيكر",
    parentLabel: "أجهزة صوت و سماعات",
    parentHref: "/audio",
    filters: { category: "speaker" },
  },
  "samsung-buds": {
    label: "سماعات متنوعة",
    parentLabel: "أجهزة صوت و سماعات",
    parentHref: "/audio",
    filters: { category: "earbuds" },
  },

  // ─── PlayStation ───────────────────────────────────────────
  ps5: {
    label: "بلاي ستيشن 5",
    parentLabel: "أجهزة بلاي ستيشن",
    parentHref: "/playstation",
    filters: { category: "ps5" },
  },
  "ps5-slim": {
    label: "بلاي ستيشن 4",
    parentLabel: "أجهزة بلاي ستيشن",
    parentHref: "/playstation",
    filters: { category: "ps4" },
  },
  "xbox-one": {
    label: "أكس بوكس ون",
    parentLabel: "أجهزة بلاي ستيشن",
    parentHref: "/playstation",
    filters: { category: "xbox" },
  },
  controllers: {
    label: "يد تحكم",
    parentLabel: "أجهزة بلاي ستيشن",
    parentHref: "/playstation",
    filters: { category: "controller" },
  },
  "ps-accessories": {
    label: "ملحقات بلاي ستيشن",
    parentLabel: "أجهزة بلاي ستيشن",
    parentHref: "/playstation",
    filters: { category: "gaming-accessories" },
  },
  accessories: {
    label: "ملحقات بلاي ستيشن",
    parentLabel: "أجهزة بلاي ستيشن",
    parentHref: "/playstation",
    filters: { category: "gaming-accessories" },
  },

  // ─── Laptops ───────────────────────────────────────────────
  "macbook-pro": {
    label: "لابتوبات أبل",
    parentLabel: "لابتوبات وشاشات",
    parentHref: "/laptops",
    filters: { category: "laptop" },
  },
  "macbook-air": {
    label: "ماك بوك اير",
    parentLabel: "لابتوبات وشاشات",
    parentHref: "/laptops",
    filters: { brand: "Apple", nameIncludes: ["macbook air", "ماك بوك اير", "ماك بوك إير"] },
  },
  "samsung-monitors": {
    label: "شاشات سامسونج",
    parentLabel: "لابتوبات وشاشات",
    parentHref: "/laptops",
    filters: { category: "monitor" },
  },

  // ─── Tablets ───────────────────────────────────────────────
  "ipad-pro": {
    label: "أبل",
    parentLabel: "الاجهزة اللوحية ايبادات",
    parentHref: "/tablets",
    filters: { category: "tablet" },
  },
  "ipad-air": {
    label: "ايبادات ابل",
    parentLabel: "الاجهزة اللوحية ايبادات",
    parentHref: "/tablets",
    filters: { brand: "Apple", category: "tablet" },
  },

  // ─── Accessories ───────────────────────────────────────────
  "anker-batteries": {
    label: "بطاريات متنقلة",
    parentLabel: "بطاريات متنقلة وكيابل",
    parentHref: "/accessories",
    filters: { category: "بطاريات متنقله" },
  },

  // ─── Games ─────────────────────────────────────────────────
  "ps5-games": {
    label: "ألعاب الفيديو",
    parentLabel: "ألعاب الفيديو",
    parentHref: "/games",
    filters: { category: "gaming" },
  },
  "mice-keyboards": {
    label: "ماوسات وكيبوردات ألعاب",
    parentLabel: "ألعاب الفيديو",
    parentHref: "/games",
    filters: { category: "mice-keyboards" },
  },
  microphones: {
    label: "مايكروفونات",
    parentLabel: "ألعاب الفيديو",
    parentHref: "/games",
    filters: { category: "microphone" },
  },
  figures: {
    label: "مجسمات وفيقرز",
    parentLabel: "ألعاب الفيديو",
    parentHref: "/games",
    filters: { category: "figures" },
  },
  "rgb-lighting": {
    label: "اضاءات RGB",
    parentLabel: "ألعاب الفيديو",
    parentHref: "/games",
    filters: { category: "rgb" },
  },
};
