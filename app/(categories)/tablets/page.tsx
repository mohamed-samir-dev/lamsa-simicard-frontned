"use client";

import CategoryLandingClient from "../../components/CategoryLandingClient";
import type { SubCategoryCard } from "../../components/CategoryLandingClient";
import type { Product } from "../../components/products/types";

const subCategories: SubCategoryCard[] = [
  { slug: "ipad-pro", label: "آيباد برو", emoji: "📱", href: "/tablets/ipad-pro" },
  { slug: "ipad-air", label: "آيباد إير", emoji: "💨", href: "/tablets/ipad-air" },
  { slug: "ipad-mini", label: "آيباد ميني", emoji: "🔹", href: "/tablets/ipad-mini" },
  { slug: "ipad", label: "آيباد عادي", emoji: "📲", href: "/tablets/ipad" },
  { slug: "samsung-tab", label: "تابلت سامسونج", emoji: "🤖", href: "/tablets/samsung-tab" },
];

const filterFn = (p: Product) =>
  p.category?.toLowerCase().includes("tablet") ||
  p.category?.toLowerCase().includes("ipad") ||
  p.category?.includes("ايباد") ||
  p.category?.includes("آيباد") ||
  p.category?.includes("الأجهزة اللوحية") ||
  p.category?.includes("ايبادات") ||
  false;

export default function TabletsPage() {
  return (
    <CategoryLandingClient
      title="الأجهزة اللوحية"
      emoji="📱"
      subCategories={subCategories}
      filterFn={filterFn}
    />
  );
}
