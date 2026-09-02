"use client";

import CategoryLandingClient from "../../components/CategoryLandingClient";
import type { SubCategoryCard } from "../../components/CategoryLandingClient";
import type { Product } from "../../components/products/types";

const subCategories: SubCategoryCard[] = [
  { slug: "ps5", label: "بلاي ستيشن 5", emoji: "🎮", href: "/playstation/ps5" },
  { slug: "ps5-slim", label: "بلاي ستيشن 4", emoji: "🎮", href: "/playstation/ps5-slim" },
  { slug: "xbox-one", label: "أكس بوكس ون", emoji: "🕹️", href: "/playstation/xbox-one" },
  { slug: "controllers", label: "يد تحكم", emoji: "🎯", href: "/playstation/controllers" },
  { slug: "ps-accessories", label: "ملحقات بلاي ستيشن", emoji: "🔌", href: "/playstation/ps-accessories" },
];

const PS_CATEGORIES = ["ps5", "ps4", "xbox", "controller", "gaming-accessories"];

const filterFn = (p: Product) =>
  PS_CATEGORIES.includes(p.category?.toLowerCase() ?? "");

export default function PlaystationClient() {
  return (
    <CategoryLandingClient
      title="أجهزة بلاي ستيشن"
      emoji="🎮"
      subCategories={subCategories}
      filterFn={filterFn}
    />
  );
}
