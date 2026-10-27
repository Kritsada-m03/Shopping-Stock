"use client";

import Link from "next/link";
import { ArrowUpRight, ShoppingBag } from "lucide-react";
import { useMockLogin } from "./mock-login-provider";

export function Footer() {
  const { user, ready } = useMockLogin();
  if (!ready) return null;
  if (user?.role === "Admin") return <footer className="site-footer"><div className="container footer-inner">
    <div><Link href="/admin" className="brand footer-brand"><ShoppingBag size={22} />shopping<span className="brand-dot">.</span></Link><p>พื้นที่จัดการสินค้าและสต็อก</p></div>
    <div className="footer-links"><Link href="/admin">จัดการสินค้า <ArrowUpRight size={14} /></Link></div>
    <span className="footer-note">ผู้ดูแลร้าน · บัญชี Admin แบบทดลอง</span>
  </div></footer>;
  return <footer className="site-footer"><div className="container footer-inner">
    <div><Link href="/" className="brand footer-brand"><ShoppingBag size={22} />shopping<span className="brand-dot">.</span></Link>
      <p>ของดีในทุกวัน ความสุขในทุกชิ้น</p></div>
    <div className="footer-links"><Link href="/orders">คำสั่งซื้อของฉัน <ArrowUpRight size={14} /></Link><Link href="/login">เข้าสู่ระบบ <ArrowUpRight size={14} /></Link></div>
    <span className="footer-note">ร้านค้าสำหรับฝึกเขียนแอป · ไม่มีการชำระเงินจริง</span>
  </div></footer>;
}
