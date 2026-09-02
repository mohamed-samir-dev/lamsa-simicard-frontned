import type { Metadata } from "next";

const BACKEND = process.env.BACKEND_URL || "http://localhost:5000";
const SITE_URL = "https://basmathatify.com";

async function getCompany() {
  try {
    const r = await fetch(`${BACKEND}/api/admin/company`, { next: { revalidate: 3600 } });
    return r.ok ? r.json() : {};
  } catch { return {}; }
}

export async function generateMetadata(): Promise<Metadata> {
  const c = await getCompany();
  return {
    title: "سلة التسوق - راجع منتجاتك وأكمل طلبك بسهولة | لمسه لبيع الشرائح",
    description: c.details || "راجع المنتجات المضافة لسلتك وأكمل طلبك بسهولة. تقسيط مريح وشحن مجاني لجميع مناطق المملكة.",
    robots: { index: false, follow: false },
    alternates: { canonical: `${SITE_URL}/cart` },
  };
}

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
