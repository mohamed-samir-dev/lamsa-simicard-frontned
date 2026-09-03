import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import { headers } from "next/headers";
import Script from "next/script";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import ClientLayout from "./components/ClientLayout";
import Footer from "./components/Footer";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900", "1000"],
  display: "swap",
});

const BACKEND = process.env.BACKEND_URL || "http://localhost:5000";
const SITE_URL = "https://basmathatify.com";

export const viewport: Viewport = {
  themeColor: "#04454A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

async function getCompany() {
  try {
    const r = await fetch(`${BACKEND}/api/admin/company/public`, { next: { revalidate: 60, tags: ["company"] } });
    return r.ok ? r.json() : {};
  } catch {
    return {};
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const c = await getCompany();

  const siteName = c.nameAr || "لمسه لبيع الشرائح";
  const titleDefault = `${siteName} | أفضل متجر لبيع شرائح الاتصال في السعودية`;
  const description = c.details || "لمسه لبيع الشرائح - تسوق أفضل شرائح الاتصال وباقات الإنترنت من فيرجن وSTC وزين وموبايلي بأسعار مميزة. توصيل سريع لجميع مناطق المملكة العربية السعودية.";
  const ogImage = `${SITE_URL}/logo.webp`;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: titleDefault,
      template: `%s | ${siteName} - متجر إلكتروني معتمد`,
    },
    description,
    keywords: [
      "لمسه", "لمسه لبيع الشرائح", "basmathatify", "بيع شرائح الاتصال",
      "شرائح اتصال", "باقات إنترنت", "شريحة SIM", "شريحة بيانات",
      "فيرجن موبايل", "Virgin Mobile", "STC", "زين", "موبايلي",
      "إنترنت مفتوح", "باقة شهرية", "باقة سنوية", "5G", "4G",
      "شريحة إنترنت", "باقة بيانات", "سوشيال مفتوح",
      "السعودية", "الرياض", "جدة", "مكة", "المدينة", "الدمام", "الخبر",
      "أرخص باقات الإنترنت", "عروض شرائح الاتصال",
    ],
    authors: [{ name: siteName, url: SITE_URL }],
    creator: siteName,
    publisher: siteName,
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: "ar_SA",
      url: SITE_URL,
      siteName,
      title: titleDefault,
      description,
      images: [
        { url: ogImage, width: 1200, height: 630, alt: siteName, type: "image/webp" },
        { url: `${SITE_URL}/web-app-manifest-512x512.png`, width: 512, height: 512, alt: siteName, type: "image/png" },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: titleDefault,
      description,
      images: [ogImage],
      creator: "@lamsasimicard",
      site: "@lamsasimicard",
    },
    alternates: {
      canonical: SITE_URL,
      languages: { "ar-SA": SITE_URL },
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION || "",
    },
    category: "electronics",
    other: {
      "mobile-web-app-capable": "yes",
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "black-translucent",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="ar" dir="rtl">
      <head>
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
  ttq.load('DACRSIRC77UA4RFI6U6G');
  ttq.page();
}(window, document, 'ttq');`}
        </Script>
      </head>
      <body className={`${cairo.className} antialiased`} suppressHydrationWarning>
        <ClientLayout footer={<Footer />} nonce={nonce}>{children}</ClientLayout>
      </body>
    </html>
  );
}
