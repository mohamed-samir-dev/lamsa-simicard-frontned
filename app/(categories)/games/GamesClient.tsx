"use client";

import CategoryLandingClient from "../../components/CategoryLandingClient";
import type { SubCategoryCard } from "../../components/CategoryLandingClient";
import type { Product } from "../../components/products/types";

const subCategories: SubCategoryCard[] = [
  { slug: "ps5-games", label: "ألعاب الفيديو", emoji: "🎮", href: "/games/ps5-games" },
  { slug: "mice-keyboards", label: "ماوسات وكيبوردات", emoji: "⌨️", href: "/games/mice-keyboards" },
  { slug: "microphones", label: "مايكروفونات", emoji: "🎙️", href: "/games/microphones" },
  { slug: "figures", label: "مجسمات وفيقرز", emoji: "🧸", href: "/games/figures" },
  { slug: "rgb-lighting", label: "اضاءات RGB", emoji: "💡", href: "/games/rgb-lighting" },
];

const GAME_CATEGORIES = ["gaming", "mice-keyboards", "microphone", "figures", "rgb"];

const filterFn = (p: Product) =>
  GAME_CATEGORIES.includes(p.category?.toLowerCase() ?? "");

export default function GamesClient() {
  return (
    <CategoryLandingClient
      title="ألعاب الفيديو"
      emoji="🎮"
      subCategories={subCategories}
      filterFn={filterFn}
    />
  );
}
