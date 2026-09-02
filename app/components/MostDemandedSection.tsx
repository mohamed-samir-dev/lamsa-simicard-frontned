"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";
import type { Product } from "./products/types";
import ProductCard from "./products/ProductCard";

export default function MostDemandedSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const IDS = [
    "6a943492832465e62427be05",
    "6a9437e6cd7da0bf04e86916",
    "6a9430ba2f39401999e29c50",
    "6a94389df64d29e186524b77",
  ];

  useEffect(() => {
    const BASE = process.env.NEXT_PUBLIC_API_URL || "";
    Promise.all(
      IDS.map((id) =>
        fetch(`${BASE}/api/products/${id}`)
          .then((r) => r.json())
          .then((data) => (data && data._id ? data : null))
          .catch(() => null)
      )
    )
      .then((results) => setProducts(results.filter(Boolean) as Product[]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section dir="rtl" className="w-full px-2 sm:px-6 lg:px-8 py-8 sm:py-14">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-10">
          <div className="flex items-center gap-3">
            <div className="w-1 h-7 rounded-full bg-[#B5854A]" />
            <div>
              <h2 className="text-xl sm:text-3xl font-black text-gray-900">الأكثر طلباً</h2>
              <p className="text-gray-500 text-xs sm:text-sm mt-0.5">منتجات يختارها عملاؤنا باستمرار</p>
            </div>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: "rgba(181,133,74,0.1)", border: "1px solid rgba(181,133,74,0.25)" }}
          >
            <TrendingUp className="w-3.5 h-3.5 text-[#B5854A]" />
            <span className="text-[#B5854A] text-xs font-bold">الأعلى مبيعاً</span>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-5">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl animate-pulse"
                style={{ background: "#e5e7eb", height: "220px" }}
              />
            ))}
          </div>
        ) : products.length === 0 ? null : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-5">
            {products.map((p, i) => (
              <ProductCard key={p._id} product={p} priority={i < 2} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
