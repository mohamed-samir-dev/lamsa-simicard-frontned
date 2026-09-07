"use client";

import CategoryLandingClient from "../../components/CategoryLandingClient";
import type { SubCategoryCard } from "../../components/CategoryLandingClient";
import type { Product } from "../../components/products/types";

const subCategories: SubCategoryCard[] = [
  { slug: "airpods-pro", label: "سماعات أبل", emoji: "🎧", href: "/audio/airpods-pro" },
  { slug: "airpods-max", label: "سماعات سبيكر", emoji: "🔊", href: "/audio/airpods-max" },
  { slug: "samsung-buds", label: "سماعات متنوعة", emoji: "🎵", href: "/audio/samsung-buds" },
];

const filterFn = (p: Product) =>
  p.category?.includes("سماعات ابل") ||
  p.category?.includes("سماعات أبل") ||
  p.category === "سماعات" ||
  p.category?.toLowerCase() === "speaker" ||
  p.category?.toLowerCase() === "earbuds" ||
  p.subCategory?.includes("سماعات") ||
  p.subCategory === "هيدفون" ||
  false;

export default function AudioClient() {
  return (
    <CategoryLandingClient
      title="أجهزة صوت و سماعات"
      emoji="🎧"
      subCategories={subCategories}
      filterFn={filterFn}
    />
  );
}
