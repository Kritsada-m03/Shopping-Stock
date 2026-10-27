"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Minus, Plus, ShieldCheck, ShoppingBag, Trash2, Truck } from "lucide-react";
import { money } from "@/lib/api";
import type { Order } from "@/lib/types";
import { Dialog } from "./dialog";
import { ProductImage } from "./product-image";
import { useShop } from "./shop-provider";
import { useMockLogin } from "./mock-login-provider";

export function CartDialog() {
  const { user } = useMockLogin();
  const { cart, busy, ready, connectionError, actionError, cartOpen, setCartOpen, updateItem, removeItem, clearCart, checkout, refreshCart } = useShop();
  const [step, setStep] = useState<"cart" | "checkout" | "success">("cart");
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (user?.role === "Admin") {
      setCartOpen(false);
      setStep("cart");
    }
  }, [user?.role, setCartOpen]);

  if (user?.role === "Admin") return null;

  function close() {
    if (busy) return;
    setCartOpen(false);
    setStep("cart");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const result = await checkout({ customerName: String(data.get("customerName")).trim(),
      phone: String(data.get("phone")).trim(), address: String(data.get("address")).trim() });
    if (result) { setOrder(result); setStep("success"); }
    else setStep("cart");
  }

  return <Dialog open={cartOpen} onClose={close} title={step === "success" ? "คำสั่งซื้อของคุณ" : step === "checkout" ? "ข้อมูลจัดส่ง" : `ตะกร้าของฉัน (${cart?.itemCount ?? 0})`} className="cart-dialog">
    {step === "success" && order ? <div className="order-success">
      <span className="success-mark"><Check size={34} /></span>
      <span className="eyebrow">THANK YOU FOR SHOPPING</span>
      <h2>รับคำสั่งซื้อเรียบร้อย!</h2>
      <p>ขอบคุณที่ให้เราเป็นส่วนหนึ่งของวันดี ๆ</p>
      <div className="success-receipt"><span>หมายเลขคำสั่งซื้อ</span><strong>{order.orderNumber}</strong><div className="summary-row"><span>ยอดรวม</span><b>{money(order.total)}</b></div></div>
      <p className="muted small">รายการนี้เป็นการทดลองสั่งซื้อ ไม่มีการเรียกเก็บเงิน</p>
      <Link href="/orders" className="button button-primary" onClick={close}>ดูคำสั่งซื้อของฉัน <ArrowRight size={18} /></Link>
      <button className="text-button" onClick={close}>เลือกซื้อสินค้าต่อ</button>
    </div> : !ready ? <div className="empty-state"><span className="spinner" /><p>กำลังเปิดตะกร้า...</p></div>
      : connectionError ? <div className="empty-state"><ShoppingBag size={42} /><h3>ยังเปิดตะกร้าไม่ได้</h3><p>{connectionError}</p><button className="button button-primary" onClick={() => void refreshCart()}>ลองอีกครั้ง</button></div>
      : !cart?.items.length ? <div className="empty-state cart-empty"><div className="empty-icon"><ShoppingBag size={36} /></div><h3>ตะกร้ารอของที่คุณชอบอยู่</h3><p>ลองเลือกของดี ๆ สักชิ้น แล้วกลับมาดูกัน</p><button className="button button-primary" onClick={close}>ไปเลือกซื้อสินค้า <ArrowRight size={17} /></button></div>
      : <>
        {step === "cart" ? <div className="cart-items"><div className="cart-toolbar"><span>รายการที่เลือก</span><button className="text-button danger" disabled={busy} onClick={() => void clearCart()}><Trash2 size={14} /> ล้างตะกร้าทั้งหมด</button></div>{cart.items.map(item => <div className={`cart-item ${!item.isAvailable ? "cart-item-unavailable" : ""}`} key={item.productId}>
          <ProductImage src={item.imageUrl} alt={item.name} />
          <div className="cart-item-info"><span className="sku">{item.sku}</span><h3>{item.name}</h3><strong>{money(item.price)}</strong>
            {!item.isAvailable && <p className="stock-error">{!item.isActive ? "สินค้านี้หยุดจำหน่ายแล้ว" : `สินค้าเหลือ ${item.stockQuantity} ชิ้น กรุณาลดจำนวน`}</p>}
            <div className="cart-item-actions"><div className="quantity-control">
              <button aria-label={`ลดจำนวน ${item.name}`} disabled={busy || item.quantity <= 1} onClick={() => void updateItem(item.productId, item.quantity - 1)}><Minus size={14} /></button>
              <span aria-label="จำนวน">{item.quantity}</span>
              <button aria-label={`เพิ่มจำนวน ${item.name}`} disabled={busy || item.quantity >= item.stockQuantity || !item.isActive} onClick={() => void updateItem(item.productId, item.quantity + 1)}><Plus size={14} /></button>
            </div><button className="icon-button remove-button" aria-label={`นำ ${item.name} ออกจากตะกร้า`} disabled={busy} onClick={() => void removeItem(item.productId)}><Trash2 size={17} /></button></div>
          </div><b className="cart-item-total">{money(item.subtotal)}</b>
        </div>)}</div> : <form id="checkout-form" className="checkout-form" onSubmit={submit}>
          <button type="button" className="text-button back-link" onClick={() => setStep("cart")} disabled={busy}><ArrowLeft size={16} /> กลับไปที่ตะกร้า</button>
          <div className="form-intro"><h3>ส่งความสุขไปที่ไหนดี?</h3><p>กรอกข้อมูลผู้รับเพื่อยืนยันคำสั่งซื้อ</p></div>
          <label>ชื่อ–นามสกุลผู้รับ<input name="customerName" autoComplete="name" required minLength={2} maxLength={120} placeholder="ชื่อและนามสกุล" disabled={busy} /></label>
          <label>เบอร์โทรศัพท์<input name="phone" type="tel" autoComplete="tel-national" inputMode="numeric" required pattern="0[0-9]{8,9}" maxLength={10} title="เบอร์โทรศัพท์ไทย 9–10 หลัก ขึ้นต้นด้วย 0" placeholder="08XXXXXXXX" defaultValue={user?.phone ?? ""} disabled={busy} /></label>
          <label>ที่อยู่จัดส่ง<textarea name="address" autoComplete="street-address" required minLength={10} maxLength={600} rows={4} placeholder="บ้านเลขที่ ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด และรหัสไปรษณีย์" disabled={busy} /></label>
          <div className="info-note"><ShieldCheck size={19} /><p>นี่คือร้านค้าทดลอง ระบบจะบันทึกคำสั่งซื้อและตัดสต็อก โดยไม่มีการชำระเงิน</p></div>
        </form>}
        <div className="cart-summary">{actionError && <div className="form-error" role="alert">{actionError}</div>}<div className="shipping-note"><Truck size={18} /> คำสั่งซื้อนี้จัดส่งฟรี</div>
          <div className="summary-row"><span>รวมสินค้า ({cart.itemCount} ชิ้น)</span><span>{money(cart.total)}</span></div>
          <div className="summary-row"><span>ค่าจัดส่ง</span><span className="green">ฟรี</span></div>
          <div className="summary-row summary-total"><b>ยอดรวมทั้งหมด</b><strong>{money(cart.total)}</strong></div>
          {!cart.canCheckout && <p className="stock-error">มีสินค้าไม่พร้อมจำหน่าย กรุณาปรับจำนวนหรือนำออกจากตะกร้า</p>}
          {step === "cart" ? <button className="button button-primary full-width" disabled={busy || !cart.canCheckout} onClick={() => setStep("checkout")}>ชำระเงิน (Check out) <ArrowRight size={18} /></button>
            : <button type="submit" form="checkout-form" className="button button-primary full-width" disabled={busy || !cart.canCheckout}>{busy ? <><span className="spinner" /> กำลังยืนยัน...</> : <>ยืนยันชำระเงิน (ทดลอง) <CheckCircle2 size={18} /></>}</button>}
          <p className="cart-disclaimer"><ShieldCheck size={13} /> ตรวจสอบสต็อกอีกครั้งก่อนยืนยันทุกคำสั่งซื้อ</p>
        </div>
      </>}
  </Dialog>;
}
