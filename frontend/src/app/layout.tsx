import type { Metadata } from "next";
import { ShopProvider } from "@/components/shop-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CartDialog } from "@/components/cart-dialog";
import { MockLoginProvider } from "@/components/mock-login-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "shopping. — ของดีในทุกวัน", template: "%s | shopping." },
  description: "เลือกของที่ใช่ ในราคาที่ชอบ ร้านค้าเล็ก ๆ สำหรับความสุขในทุกวัน",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th" data-scroll-behavior="smooth"><body><MockLoginProvider><ShopProvider>
    <a className="skip-link" href="#main">ข้ามไปเนื้อหาหลัก</a>
    <Header /><main id="main">{children}</main><Footer /><CartDialog />
  </ShopProvider></MockLoginProvider></body></html>;
}
