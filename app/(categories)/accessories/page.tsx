"use client";

import CategoryLandingClient from "../../components/CategoryLandingClient";
import type { SubCategoryCard } from "../../components/CategoryLandingClient";
import type { Product } from "../../components/products/types";

const subCategories: SubCategoryCard[] = [
  { slug: "anker-batteries", label: "بطاريات متنقلة", emoji: "🔋", href: "/accessories/anker-batteries" },
  { slug: "cables", label: "كيابل وشواحن", emoji: "🔌", href: "/accessories/cables" },
  { slug: "cases", label: "كفرات وحماية", emoji: "🛡️", href: "/accessories/cases" },
  { slug: "screen-protectors", label: "حماية شاشة", emoji: "📲", href: "/accessories/screen-protectors" },
];

const filterFn = (p: Product) =>
  p.category?.toLowerCase().includes("powerbank") ||
  p.category?.toLowerCase().includes("accessory") ||
  p.category?.toLowerCase().includes("accessories") ||
  p.category?.toLowerCase().includes("cable") ||
  p.category?.includes("ملحقات") ||
  p.category?.includes("بطاريات") ||
  p.category?.includes("كيابل") ||
  false;

export default function AccessoriesPage() {
  return (
    <CategoryLandingClient
      title="الملحقات والإكسسوارات"
      emoji="🔋"
      subCategories={subCategories}
      filterFn={filterFn}
    />
  );
}
