import SimCardsClient from "./SimCardsClient";
import type { Product } from "../components/products/types";
import { sortProducts } from "../lib/sortProducts";

export const metadata = {
  title: "شرائح الاتصال | سهلناها لمسه لبيع الشرائح",
  description: "اختر شريحتك المناسبة من جميع شركات الاتصالات السعودية من سهلناها لمسه لبيع الشرائح وتمتع باتصال سريع وتغطية قوية في كل مكان",
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function getSimCards(): Promise<Product[]> {
  try {
    const res = await fetch(`${API}/api/products?category=sim-cards`, {
      next: { revalidate: 60 } // Revalidate every 60 seconds
    });
    
    if (!res.ok) {
      console.error("Failed to fetch sim cards");
      return [];
    }
    
    const data = await res.json();
    return sortProducts(data);
  } catch (error) {
    console.error("Error fetching sim cards:", error);
    return [];
  }
}

export default async function SimCardsPage() {
  const products = await getSimCards();
  
  return <SimCardsClient initialProducts={products} />;
}
