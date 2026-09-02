"use client";

import CategoryLandingClient from "../../components/CategoryLandingClient";
import type { SubCategoryCard } from "../../components/CategoryLandingClient";
import type { Product } from "../../components/products/types";

const subCategories: SubCategoryCard[] = [
  { slug: "series-10", label: "آبل ووتش سيريس 10", emoji: "⌚", href: "/apple-watches/series-10" },
  { slug: "series-9", label: "آبل ووتش سيريس 9", emoji: "⌚", href: "/apple-watches/series-9" },
  { slug: "ultra", label: "آبل ووتش الترا", emoji: "🏔️", href: "/apple-watches/ultra" },
  { slug: "se", label: "آبل ووتش SE", emoji: "✨", href: "/apple-watches/se" },
];

const filterFn = (p: Product) =>
  p.category?.toLowerCase().includes("watch") ||
  p.category?.includes("ساعات ابل") ||
  p.category?.includes("ساعات أبل") ||
  p.category?.includes("apple watch") ||
  false;

export default function AppleWatchesPage() {
  return (
    <CategoryLandingClient
      title="ساعات أبل"
      emoji="⌚"
      subCategories={subCategories}
      filterFn={filterFn}
    />
  );
}
