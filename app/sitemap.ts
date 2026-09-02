import { MetadataRoute } from "next";
import { slugConfigs } from "./lib/categoryConfig";

const BASE_URL = "https://basmathatify.com";
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const staticRoutes = [
  { path: "", priority: 1, changeFrequency: "daily" as const },
  { path: "/sim-cards", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const static_urls: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
    lastModified: new Date(),
  }));

  const slug_urls: MetadataRoute.Sitemap = Object.keys(slugConfigs).map((slug) => ({
    url: `${BASE_URL}/${slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
    lastModified: new Date(),
  }));

  let product_urls: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${BACKEND_URL}/api/products`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const products: { _id: string; updatedAt?: string }[] = await res.json();
      product_urls = products.map((p) => ({
        url: `${BASE_URL}/product/${p._id}`,
        changeFrequency: "daily",
        priority: 0.6,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      }));
    }
  } catch {
    // skip if backend unavailable
  }

  return [...static_urls, ...slug_urls, ...product_urls];
}
