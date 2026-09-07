import type { Metadata } from "next";
import SmartWatchesClient from "./SmartWatchesClient";

const BACKEND = process.env.BACKEND_URL || "http://localhost:5000";
const SITE_URL = "https://www.pasmthatfee.com";

async function getCompany() {
  try {
    const r = await fetch(`${BACKEND}/api/admin/company`, { next: { revalidate: 3600 } });
    return r.ok ? r.json() : {};
  } catch {
    return {};
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const company = await getCompany();
  const siteName = company.nameAr || "مدار";
  return {
    title: `الساعات الذكية | ${siteName}`,
    description: `تسوق أحدث الساعات الذكية بأفضل الأسعار وبالأقساط في ${siteName}.`,
    alternates: { canonical: `${SITE_URL}/smart-watches` },
  };
}

export default function SmartWatchesPage() {
  return <SmartWatchesClient />;
}
