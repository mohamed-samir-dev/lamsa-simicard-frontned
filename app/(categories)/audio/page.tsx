import type { Metadata } from "next";
import AudioClient from "./AudioClient";

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
    title: `أجهزة صوت و سماعات | ${siteName}`,
    description: `تسوق سماعات أبل وأجهزة الصوت بأفضل الأسعار في ${siteName}. شحن سريع وضمان معتمد.`,
    alternates: { canonical: `${SITE_URL}/audio` },
  };
}

export default function AudioPage() {
  return <AudioClient />;
}
