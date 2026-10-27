"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, LogOut, PackageCheck, Search, ShoppingBag, ShoppingCart, SlidersHorizontal, Store, Truck, UserRound } from "lucide-react";
import { useShop } from "./shop-provider";
import { useMockLogin } from "./mock-login-provider";

export function Header() {
  const { cart, setCartOpen, refreshCart, search, setSearch } = useShop();
  const path = usePathname();
  const router = useRouter();
  const { user, ready, logout } = useMockLogin();
  const accountControls = <div className="header-account">
    {ready && user ? <><div className="account-identity"><span>{user.role === "Admin" ? "ผู้ดูแลร้าน" : "สวัสดีคุณ"}</span><b>{user.displayName}</b></div><button className="icon-button" aria-label="ออกจากระบบ" title="ออกจากระบบ" onClick={() => { logout(); setCartOpen(false); router.replace("/"); }}><LogOut size={18} /></button></>
      : <Link href="/login" className="login-link" aria-label="เข้าสู่ระบบ"><UserRound size={19} /><span>เข้าสู่ระบบ</span></Link>}
  </div>;

  if (!ready) return <header className="site-header"><div className="container header-main"><span className="brand"><span className="brand-mark"><ShoppingBag size={25} /></span>shopping<span className="brand-dot">.</span></span></div></header>;

  if (user?.role === "Admin") return <>
    <div className="announcement"><div className="container announcement-inner"><span><Store size={14} /> ระบบจัดการร้านค้า shopping</span><span className="announcement-right">สินค้า · ราคา · สต็อก</span></div></div>
    <header className="site-header admin-header">
      <div className="container header-main admin-header-main">
        <div className="admin-brand"><Link href="/admin" className="brand" aria-label="shopping หน้าจัดการสินค้า"><span className="brand-mark"><ShoppingBag size={25} strokeWidth={2} /></span>shopping<span className="brand-dot">.</span></Link><span className="admin-brand-badge">ADMIN</span></div>
        <span className="admin-header-title">พื้นที่จัดการร้านค้า</span>
        {accountControls}
      </div>
      <nav className="container main-nav" aria-label="เมนูแอดมิน">
        <div className="nav-links"><Link href="/admin" className={path === "/admin" ? "active" : ""}><SlidersHorizontal size={16} /> จัดการสินค้า</Link></div>
        <span className="account-role-label"><Store size={14} /> ผู้ดูแลร้าน</span>
      </nav>
    </header>
  </>;

  return <>
    <div className="announcement"><div className="container announcement-inner">
      <span><Truck size={14} /> ส่งฟรีทุกคำสั่งซื้อ · เริ่มวันดี ๆ ด้วยของที่ชอบ</span>
      <span className="announcement-right">เลือกง่าย ช้อปสบาย <ArrowUpRight size={13} /></span>
    </div></div>
    <header className="site-header">
      <div className="container header-main">
        <Link href="/" className="brand" aria-label="shopping หน้าหลัก"><span className="brand-mark"><ShoppingBag size={25} strokeWidth={2} /></span>shopping<span className="brand-dot">.</span></Link>
        <form className="search-box" role="search" onSubmit={event => { event.preventDefault(); router.push("/#catalog"); }}>
          <Search size={19} aria-hidden="true" />
          <input aria-label="ค้นหาชื่อหรือรหัสสินค้า" placeholder="ค้นหาของที่คุณชอบ..." value={search} onChange={event => setSearch(event.target.value)} />
          <button type="submit" aria-label="ค้นหา"><ArrowUpRight size={18} /></button>
        </form>
        <button className="cart-trigger" onClick={() => { void refreshCart(); setCartOpen(true); }}>
          <ShoppingCart size={21} /><span>ตะกร้าของฉัน</span><b>{cart?.itemCount ?? 0}</b>
        </button>
        {accountControls}
      </div>
      <nav className="container main-nav" aria-label="เมนูหลัก">
        <div className="nav-links">
          <Link href="/" className={path === "/" ? "active" : ""}><ShoppingBag size={16} /> หน้าร้าน</Link>
          <Link href="/orders" className={path === "/orders" ? "active" : ""}><PackageCheck size={16} /> คำสั่งซื้อของฉัน</Link>
        </div>
        {!user ? <Link className="admin-link" href="/login?as=Admin"><SlidersHorizontal size={15} /> สำหรับแอดมิน</Link>
            : <span className="account-role-label"><UserRound size={14} /> ผู้ใช้ทั่วไป</span>}
      </nav>
    </header>
  </>;
}
