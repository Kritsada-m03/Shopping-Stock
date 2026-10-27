"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronDown, Clock3, MapPin, PackageCheck, RefreshCw } from "lucide-react";
import { api, dateTime, errorMessage, money } from "@/lib/api";
import type { Order } from "@/lib/types";
import { useShop } from "@/components/shop-provider";
import { ProductImage } from "@/components/product-image";
import { CustomerView } from "@/components/customer-view";

export default function OrdersPage() {
  return <CustomerView><CustomerOrders /></CustomerView>;
}

function CustomerOrders() {
  const { cart, ready, connectionError, catalogVersion, retry: retryConnection } = useShop();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!cart?.id) return;
    let active = true;
    api.orders(cart.id).then(data => { if (active) { setOrders(data); setError(""); } })
      .catch(error => { if (active) setError(errorMessage(error)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [cart?.id, catalogVersion, retry]);

  return <div className="container inner-page orders-page"><div className="page-heading"><div><span className="eyebrow orange">YOUR LITTLE JOYS</span><h1>คำสั่งซื้อของฉัน<span className="orange">.</span></h1><p>ทุกชิ้นที่เลือกไว้ ดูรายละเอียดได้ที่นี่</p></div><Link className="button button-outline" href="/">เลือกซื้อสินค้าต่อ <ArrowRight size={16} /></Link></div>
    {(error || connectionError) ? <div className="empty-state error-panel"><PackageCheck size={40} /><h3>โหลดคำสั่งซื้อไม่สำเร็จ</h3><p>{error || connectionError}</p><button className="button button-primary" onClick={() => { void retryConnection(); setRetry(v => v + 1); }}><RefreshCw size={16} /> ลองอีกครั้ง</button></div>
      : loading || !ready ? <div className="empty-state" aria-busy="true"><span className="spinner" /><p>กำลังโหลดคำสั่งซื้อ...</p></div>
        : !orders.length ? <div className="empty-state page-empty"><div className="empty-icon"><PackageCheck size={38} /></div><h2>คำสั่งซื้อแรกกำลังรอคุณอยู่</h2><p>เมื่อยืนยันสั่งซื้อแล้ว รายละเอียดจะมาอยู่ที่นี่<br />ประวัติผูกกับตะกร้าในเบราว์เซอร์นี้</p><Link className="button button-primary" href="/">ไปเลือกซื้อสินค้า <ArrowRight size={17} /></Link></div>
          : <div className="order-list">{orders.map((order, index) => <details className="order-card" key={order.id} open={index === 0}>
            <summary><span className="order-package"><PackageCheck size={24} /></span><div className="order-meta"><b>{order.orderNumber}</b><span>{dateTime(order.createdAt)} · {order.items.reduce((sum, i) => sum + i.quantity, 0)} ชิ้น</span></div><span className="status-pill"><Clock3 size={13} /> รอดำเนินการ</span><strong>{money(order.total)}</strong><ChevronDown size={19} className="details-chevron" /></summary>
            <div className="order-content">{order.items.map(item => <div className="order-line" key={item.productId}><ProductImage src={item.imageUrl} alt={item.productName} /><div><span className="sku">{item.sku}</span><h3>{item.productName}</h3><span className="muted">{money(item.unitPrice)} × {item.quantity}</span></div><b>{money(item.subtotal)}</b></div>)}
              <div className="order-delivery"><MapPin size={19} /><div><b>{order.customerName} · {order.phone}</b><p>{order.address}</p></div></div>
              <div className="order-total"><span>รวมทั้งหมด · จัดส่งฟรี</span><strong>{money(order.total)}</strong></div><p className="muted small">คำสั่งซื้อทดลอง ไม่มีการชำระเงินจริง</p>
            </div></details>)}</div>}
  </div>;
}
