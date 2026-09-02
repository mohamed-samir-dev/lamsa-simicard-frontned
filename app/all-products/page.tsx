import { Suspense } from "react";
import AllProductsClient from "./AllProductsClient";

export const metadata = {
  title: "جميع الشرائح | لمسه لبيع الشرائح",
  description: "تصفح جميع شرائح الاتصال وباقات الإنترنت بأفضل الأسعار من لمسه لبيع الشرائح",
};

export default function AllProductsPage() {
  return (
    <Suspense>
      <AllProductsClient />
    </Suspense>
  );
}
