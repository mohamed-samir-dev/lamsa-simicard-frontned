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
    title: "إتمام الطلب - أكمل عملية الشراء بأمان وسهولة | لمسه لبيع الشرائح",
    description: c.details || "أكمل عملية الشراء بأمان تام. دفع مشفر وآمن مع خيارات تقسيط مريحة بدون فوائد.",
    robots: { index: false, follow: false },
    alternates: { canonical: `${SITE_URL}/checkout` },
  };
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
