"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, CircleAlert, Eye, EyeOff, Phone, ShoppingBag, Store, UserRound } from "lucide-react";
import { errorMessage } from "@/lib/api";
import { useMockLogin } from "@/components/mock-login-provider";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useMockLogin();
  const accountType = params.get("as") === "Admin" ? "Admin" : "User";
  const isAdmin = accountType === "Admin";
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function changeAccount(type: "Admin" | "User") {
    setIdentifier(""); setPassword(""); setError(""); setVisible(false);
    router.replace(`/login?as=${type}`, { scroll: false });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const profile = await login({ accountType, identifier: identifier.trim(), password });
      router.replace(profile.role === "Admin" ? "/admin" : "/");
    } catch (error) { setError(errorMessage(error)); }
    finally { setBusy(false); }
  }

  return <div className="container login-page">
    <Link href="/" className="text-button login-back"><ArrowLeft size={16} /> กลับไปหน้าร้าน</Link>
    <div className="login-card"><div className="login-story">
      <span className="eyebrow">WELCOME TO YOUR EVERYDAY JOY</span>
      <h1>ยินดีต้อนรับ<br />กลับมาช้อป<span className="orange">.</span></h1>
      <p>ของดีในทุกวัน<br />และความสุขเล็ก ๆ ที่รอให้คุณเลือก</p>
      <div className="login-bag" aria-hidden="true"><ShoppingBag size={87} strokeWidth={1.1} /><span><Check size={19} /></span></div>
      <div className="login-story-bottom"><span className="stock-dot" /> เลือกง่าย ช้อปสบาย สไตล์คุณ</div>
    </div><div className="login-content">
      <span className="eyebrow orange">LET’S GET STARTED</span>
      <h2>เข้าสู่ระบบ</h2><p className="login-intro">{isAdmin ? "เปิดร้านของคุณ แล้วมาจัดการสินค้ากัน" : "ใช้เบอร์โทรของคุณเพื่อเริ่มต้นใช้งาน"}</p>
      <div className="login-tabs" role="group" aria-label="ประเภทบัญชี">
        <button type="button" aria-pressed={!isAdmin} className={!isAdmin ? "selected" : ""} disabled={busy} onClick={() => changeAccount("User")}><UserRound size={17} /> ผู้ใช้ทั่วไป</button>
        <button type="button" aria-pressed={isAdmin} className={isAdmin ? "selected" : ""} disabled={busy} onClick={() => changeAccount("Admin")}><Store size={17} /> แอดมิน</button>
      </div>
      <form className="login-form" onSubmit={submit}>
        {error && <div className="form-error" role="alert"><CircleAlert size={18} />{error}</div>}
        <label>{isAdmin ? "ชื่อผู้ใช้" : "เบอร์โทรศัพท์"}<div className="login-input">
          {isAdmin ? <UserRound size={18} /> : <Phone size={18} />}
          <input type={isAdmin ? "text" : "tel"} autoComplete="username" inputMode={isAdmin ? "text" : "numeric"}
            required maxLength={isAdmin ? 30 : 10} pattern={isAdmin ? undefined : "0[0-9]{9}"}
            title={isAdmin ? undefined : "เบอร์โทรไทย 10 หลัก ขึ้นต้นด้วย 0"}
            placeholder={isAdmin ? "Admin" : "0812345678"} value={identifier} onChange={e => setIdentifier(e.target.value)} disabled={busy} />
        </div></label>
        <label>รหัสผ่าน<div className="login-input">
          <input type={visible ? "text" : "password"} autoComplete="current-password" required maxLength={100}
            placeholder="กรอกรหัสผ่าน" value={password} onChange={e => setPassword(e.target.value)} disabled={busy} />
          <button type="button" aria-label={visible ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button>
        </div></label>
        <button type="submit" className="button button-primary full-width" disabled={busy}>{busy ? <><span className="spinner" /> กำลังเข้าสู่ระบบ...</> : <>เข้าสู่ระบบ <ArrowRight size={17} /></>}</button>
      </form>
      <div className="login-demo"><span>บัญชีสำหรับทดลอง</span>{isAdmin ? <p>ชื่อผู้ใช้ <code>Admin</code> · รหัสผ่าน <code>Admin</code></p> : <p>เบอร์ไทย 10 หลักใดก็ได้ เช่น <code>0812345678</code><br />รหัสผ่าน <code>1234</code> · ไม่ต้องสมัครหรือยืนยัน OTP</p>}</div>
    </div></div>
  </div>;
}

export default function LoginPage() {
  return <Suspense fallback={<div className="container empty-state inner-page"><span className="spinner" /><p>กำลังเปิดหน้าเข้าสู่ระบบ...</p></div>}><LoginForm /></Suspense>;
}
