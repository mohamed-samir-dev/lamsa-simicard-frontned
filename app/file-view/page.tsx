"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";

function FileViewer() {
  const params = useSearchParams();
  const url = params.get("url");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  if (!url) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <div className="text-center space-y-4">
          <p className="text-gray-500 text-lg">لا يوجد ملف لعرضه</p>
          <Link href="/" className="text-teal-600 hover:underline">العودة للرئيسية</Link>
        </div>
      </div>
    );
  }

  const proxyUrl = `/api/file-proxy?url=${encodeURIComponent(url)}`;
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(proxyUrl)}&embedded=true`;

  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      <header className="bg-[#053132] text-white px-4 py-3 flex items-center justify-between" dir="rtl">
        <h1 className="text-sm font-bold">عرض الملف</h1>
        <div className="flex gap-3">
          <a href={proxyUrl} download className="text-xs bg-teal-600 hover:bg-teal-700 px-3 py-1.5 rounded transition">
            تحميل
          </a>
          <Link href="/" className="text-xs bg-gray-600 hover:bg-gray-700 px-3 py-1.5 rounded transition">
            الرئيسية
          </Link>
        </div>
      </header>

      {isMobile ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 text-center bg-gray-50" dir="rtl">
          <p className="text-gray-600 text-sm">المتصفح على الجوال لا يدعم عرض الملف مباشرة</p>
          <a
            href={proxyUrl}
            download
            className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-6 py-3 rounded-xl transition"
          >
            تحميل الملف
          </a>
          <a
            href={googleViewerUrl}
            target="_blank"
            rel="noreferrer"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-3 rounded-xl transition"
          >
            فتح في Google Docs
          </a>
        </div>
      ) : (
        <iframe src={proxyUrl} className="flex-1 w-full" title="file-viewer" />
      )}
    </div>
  );
}

export default function FileViewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>جاري التحميل...</p></div>}>
      <FileViewer />
    </Suspense>
  );
}
