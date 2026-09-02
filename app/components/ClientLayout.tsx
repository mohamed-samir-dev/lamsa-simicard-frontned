"use client";
import { usePathname } from "next/navigation";
import { Navbar } from "./navbar";
import WhatsappButton from "./WhatsappButton";
import AddToCartPopup from "./AddToCartPopup";

export default function ClientLayout({ children, footer, nonce }: { children: React.ReactNode; footer: React.ReactNode; nonce?: string }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isFileView = pathname.startsWith("/file-view");
  const isVerify = pathname === "/checkout/verify";
  const isMaintenance = pathname.startsWith("/maintenance");
  const hideChrome = isAdmin || isFileView || isVerify || isMaintenance;

  return (
    <>
      {!hideChrome && <Navbar />}
      {children}
      {!hideChrome && footer}
      {!hideChrome && <WhatsappButton />}
      {!hideChrome && <AddToCartPopup />}
    </>
  );
}
