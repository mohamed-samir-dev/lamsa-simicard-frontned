"use client";

import CategoryLandingClient from "../../components/CategoryLandingClient";
import type { SubCategoryCard } from "../../components/CategoryLandingClient";
import type { Product } from "../../components/products/types";

const subCategories: SubCategoryCard[] = [
  { slug: "smart-watches", label: "الساعات الذكية", emoji: "⌚", href: "/smart-watches/smart-watches" },
];

const filterFn = (p: Product) =>
  p.category?.includes("ساعات ذكية") ||
  p.category?.toLowerCase().includes("smart") ||
  false;

export default function SmartWatchesClient() {
  return (
    <CategoryLandingClient
      title="الساعات الذكية"
      emoji="⌚"
      subCategories={subCategories}
      filterFn={filterFn}
    />
  );
}
