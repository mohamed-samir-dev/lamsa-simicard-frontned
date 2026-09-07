"use client";

import CategoryLandingClient from "../../components/CategoryLandingClient";
import type { SubCategoryCard } from "../../components/CategoryLandingClient";
import type { Product } from "../../components/products/types";

const subCategories: SubCategoryCard[] = [
  { slug: "iphone-17-pro-max", label: "آيفون 17 برو ماكس", emoji: "📱", href: "/smartphones/iphone-17-pro-max" },
  { slug: "iphone-17-pro", label: "آيفون 17 برو", emoji: "📱", href: "/smartphones/iphone-17-pro" },
  { slug: "iphone-17", label: "آيفون 17 عادي", emoji: "📱", href: "/smartphones/iphone-17" },
  { slug: "iphone-17-air", label: "آيفون 17 Air", emoji: "🪶", href: "/smartphones/iphone-17-air" },
  { slug: "iphone-16-pro-max", label: "آيفون 16 برو ماكس", emoji: "📱", href: "/smartphones/iphone-16-pro-max" },
  { slug: "iphone-16-pro", label: "آيفون 16 برو", emoji: "📱", href: "/smartphones/iphone-16-pro" },
  { slug: "iphone-16-plus", label: "آيفون 16 بلس", emoji: "📱", href: "/smartphones/iphone-16-plus" },
  { slug: "iphone-16", label: "آيفون 16 عادي", emoji: "📱", href: "/smartphones/iphone-16" },
  { slug: "iphone-15-pro-max", label: "آيفون 15 برو ماكس", emoji: "📱", href: "/smartphones/iphone-15-pro-max" },
  { slug: "iphone-15-pro", label: "آيفون 15 برو", emoji: "📱", href: "/smartphones/iphone-15-pro" },
  { slug: "iphone-15-plus", label: "آيفون 15 بلس", emoji: "📱", href: "/smartphones/iphone-15-plus" },
  { slug: "iphone-15", label: "آيفون 15 عادي", emoji: "📱", href: "/smartphones/iphone-15" },
  { slug: "samsung-s26-ultra", label: "سامسونج S26 الترا", emoji: "📲", href: "/smartphones/samsung-s26-ultra" },
  { slug: "samsung-s25-ultra", label: "سامسونج S25 الترا", emoji: "📲", href: "/smartphones/samsung-s25-ultra" },
  { slug: "samsung-s24-ultra", label: "سامسونج S24 الترا", emoji: "📲", href: "/smartphones/samsung-s24-ultra" },
  { slug: "samsung-s23-ultra", label: "سامسونج S23 الترا", emoji: "📲", href: "/smartphones/samsung-s23-ultra" },
  { slug: "samsung-s22-ultra", label: "سامسونج S22 الترا", emoji: "📲", href: "/smartphones/samsung-s22-ultra" },
];

const filterFn = (p: Product) =>
  p.category?.includes("ايفون") ||
  p.category?.includes("جالكسي") ||
  p.category?.includes("جالاكسي") ||
  p.category?.includes("جلاكسي") ||
  p.category?.toLowerCase().includes("iphone") ||
  p.category?.toLowerCase().includes("samsung") ||
  false;

export default function SmartphonesClient() {
  return (
    <CategoryLandingClient
      title="الهواتف الذكية"
      emoji="📱"
      subCategories={subCategories}
      filterFn={filterFn}
    />
  );
}
