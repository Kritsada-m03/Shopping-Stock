"use client";

import Link from "next/link";
import { LogIn, Store } from "lucide-react";
import type { ReactNode } from "react";
import { useMockLogin } from "./mock-login-provider";

// Demo navigation only; the API deliberately has no authentication or authorization.
export function AdminView({ children }: { children: ReactNode }) {
  const { user, ready } = useMockLogin();
  if (!ready) return <div className="container empty-state inner-page"><span className="spinner" /><p>กำลังเปิดหน้าจัดการ...</p></div>;
  if (user?.role === "Admin") return children;

  return <div className="container inner-page"><div className="empty-state page-empty">
    <div className="empty-icon"><Store size={35} /></div>
    <h1>เข้าสู่ระบบสำหรับแอดมิน</h1>
    <p>{user ? "คุณกำลังใช้บัญชีผู้ใช้ทั่วไป เปลี่ยนเป็นบัญชี Admin เพื่อเปิดหน้าจัดการสินค้า" : "ใช้บัญชี Admin เพื่อเปิดหน้าจัดการสินค้าและสต็อก"}</p>
    <Link className="button button-primary" href="/login?as=Admin"><LogIn size={17} /> เข้าสู่ระบบแอดมิน</Link>
    <Link className="text-button" href="/">กลับไปหน้าร้านของผู้ซื้อ</Link>
  </div></div>;
}
