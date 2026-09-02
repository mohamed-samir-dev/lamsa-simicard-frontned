"use client";

import CategoryLandingClient from "../../components/CategoryLandingClient";
import type { SubCategoryCard } from "../../components/CategoryLandingClient";
import type { Product } from "../../components/products/types";

const subCategories: SubCategoryCard[] = [
  { slug: "macbook-pro", label: "ماك بوك برو", emoji: "💻", href: "/laptops/macbook-pro" },
  { slug: "macbook-air", label: "ماك بوك إير", emoji: "🌬️", href: "/laptops/macbook-air" },
  { slug: "samsung-monitors", label: "شاشات سامسونج", emoji: "🖥️", href: "/laptops/samsung-monitors" },
  { slug: "windows-laptops", label: "لابتوبات ويندوز", emoji: "🪟", href: "/laptops/windows-laptops" },
];

const filterFn = (p: Product) =>
  p.category?.toLowerCase().includes("laptop") ||
  p.category?.toLowerCase().includes("macbook") ||
  p.category?.toLowerCase().includes("monitor") ||
  p.category?.includes("لابتوب") ||
  p.category?.includes("ماك بوك") ||
  p.category?.includes("لابتوبات") ||
  false;

export default function LaptopsPage() {
  return (
    <CategoryLandingClient
      title="لابتوبات وشاشات"
      emoji="💻"
      subCategories={subCategories}
      filterFn={filterFn}
    />
  );
}
