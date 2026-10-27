"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Check, CircleAlert, Eye, Package, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { api, errorMessage, money } from "@/lib/api";
import type { Product, ProductInput } from "@/lib/types";
import { Dialog } from "@/components/dialog";
import { ProductImage } from "@/components/product-image";
import { useShop } from "@/components/shop-provider";
import { AdminView } from "@/components/admin-view";

const blankProduct: ProductInput = { sku: "", name: "", description: "", category: "บ้านและไลฟ์สไตล์", price: 0, stockQuantity: 0, imageUrl: "/products/placeholder.svg", isActive: true };

export default function AdminPage() {
  return <AdminView><AdminDashboard /></AdminView>;
}

function AdminDashboard() {
  const { notify, refreshCatalog, refreshCart } = useShop();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductInput>(blankProduct);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleting, setDeleting] = useState<Product | null>(null);

  async function load() {
    try { setProducts(await api.adminProducts()); setError(""); }
    catch (error) { setError(errorMessage(error)); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  function edit(product: Product | null) {
    setEditing(product);
    setForm(product ? { ...product } : { ...blankProduct });
    setFormError("");
    setOpen(true);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      if (editing) await api.updateProduct(editing.id, form);
      else await api.createProduct(form);
      setOpen(false);
      notify(editing ? "บันทึกการแก้ไขแล้ว" : "เพิ่มสินค้าใหม่แล้ว");
      await load();
      refreshCatalog();
      void refreshCart();
    } catch (error) { setFormError(errorMessage(error)); await load(); }
    finally { setSaving(false); }
  }

  async function remove() {
    if (!deleting) return;
    setSaving(true);
    try { await api.deleteProduct(deleting.id); setDeleting(null); notify("ปิดการขายสินค้าแล้ว"); await load(); refreshCatalog(); void refreshCart(); }
    catch (error) { notify(errorMessage(error), true); }
    finally { setSaving(false); }
  }

  const visible = products.filter(p => `${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(query.toLowerCase()));
  const stats = [
    { label: "สินค้าทั้งหมด", value: products.length, icon: Package, className: "orange" },
    { label: "กำลังวางขาย", value: products.filter(p => p.isActive).length, icon: Eye, className: "green" },
    { label: "ใกล้หมด (1–5 ชิ้น)", value: products.filter(p => p.isActive && p.stockQuantity > 0 && p.stockQuantity <= 5).length, icon: CircleAlert, className: "amber" },
    { label: "สินค้าหมด", value: products.filter(p => p.isActive && p.stockQuantity === 0).length, icon: Package, className: "muted" },
  ];

  return <div className="container inner-page admin-page"><div className="page-heading"><div><span className="eyebrow orange">YOUR SHOP, AT A GLANCE</span><h1>จัดการสินค้า<span className="orange">.</span></h1><p>ดูแลสินค้า ราคา และจำนวนคงเหลือของร้านคุณ</p></div><button className="button button-primary" onClick={() => edit(null)}><Plus size={18} /> เพิ่มสินค้าใหม่</button></div>
    <div className="admin-notice"><CircleAlert size={17} /><span>เข้าสู่ระบบด้วยบัญชี Admin · โหมดทดลองสำหรับจัดการสินค้า</span></div>
    <div className="stats-grid">{stats.map(stat => <div className="stat-card" key={stat.label}><span className={`stat-icon ${stat.className}`}><stat.icon size={23} /></span><div><span>{stat.label}</span><b>{stat.value}<small> รายการ</small></b></div></div>)}</div>
    <section className="admin-panel"><div className="admin-panel-heading"><h2>รายการสินค้า <span>{products.length}</span></h2><div className="admin-search"><Search size={17} /><input aria-label="ค้นหาในรายการสินค้า" placeholder="ค้นหาชื่อ / รหัสสินค้า" value={query} onChange={e => setQuery(e.target.value)} /></div></div>
      {error ? <div className="empty-state" role="alert"><p>{error}</p><button className="button button-outline" onClick={() => void load()}><RefreshCw size={16} /> ลองอีกครั้ง</button></div>
        : loading ? <div className="empty-state"><span className="spinner" /><p>กำลังโหลดสินค้า...</p></div>
          : <div className="table-scroll"><table className="product-table"><thead><tr><th>สินค้า</th><th>หมวดหมู่</th><th className="text-right">ราคาขาย</th><th className="text-right">คงเหลือ</th><th>สถานะ</th><th className="text-right">จัดการ</th></tr></thead><tbody>{visible.map(product => <tr key={product.id}>
            <td><div className="table-product"><ProductImage src={product.imageUrl} alt={product.name} /><div><b>{product.name}</b><span>{product.sku}</span></div></div></td><td>{product.category}</td><td className="text-right table-price">{money(product.price)}</td><td className="text-right"><b className={product.stockQuantity === 0 ? "muted" : product.stockQuantity <= 5 ? "orange" : ""}>{product.stockQuantity}</b> <span className="muted small">ชิ้น</span></td><td><span className={`status-pill ${product.isActive ? product.stockQuantity ? "status-active" : "status-empty" : "status-inactive"}`}><span className="stock-dot" />{!product.isActive ? "ปิดการขาย" : product.stockQuantity ? "วางขาย" : "สินค้าหมด"}</span></td><td><div className="table-actions"><button className="icon-button" aria-label={`แก้ไข ${product.name}`} onClick={() => edit(product)}><Pencil size={17} /></button><button className="icon-button danger" aria-label={`ปิดการขาย ${product.name}`} disabled={!product.isActive} onClick={() => setDeleting(product)}><Trash2 size={17} /></button></div></td>
          </tr>)}</tbody></table>{!visible.length && <div className="empty-state"><p>ไม่พบสินค้า</p></div>}</div>}
      <div className="table-footnote">การปิดการขายจะเก็บประวัติสินค้าและคำสั่งซื้อเดิมไว้</div>
    </section>

    <Dialog open={open} onClose={() => { if (!saving) setOpen(false); }} title={editing ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"} className="admin-dialog">
      <form className="product-form" onSubmit={save}>
        {formError && <div className="form-error" role="alert"><CircleAlert size={18} />{formError}</div>}
        <div className="form-grid"><label>รหัสสินค้า (SKU)<input required maxLength={30} pattern="[A-Za-z0-9][A-Za-z0-9_-]*" title="ใช้ตัวอักษรอังกฤษ ตัวเลข ขีดกลาง หรือขีดล่าง" placeholder="เช่น HO-004" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} disabled={saving} /></label><label>หมวดหมู่<input list="category-options" required maxLength={60} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} disabled={saving} /><datalist id="category-options">{["อิเล็กทรอนิกส์", "แฟชั่น", "บ้านและไลฟ์สไตล์", "ความงาม"].map(c => <option key={c} value={c} />)}</datalist></label></div>
        <label>ชื่อสินค้า<input required maxLength={160} placeholder="สินค้าของคุณชื่ออะไร?" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} disabled={saving} /></label>
        <label>รายละเอียดสินค้า<textarea required maxLength={1200} rows={3} placeholder="อธิบายจุดเด่น ขนาด หรือสิ่งที่ควรรู้" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} disabled={saving} /></label>
        <div className="form-grid"><label>ราคาขาย (บาท)<input type="number" required min="0.01" max="99999999.99" step="0.01" value={form.price || ""} onChange={e => setForm({ ...form, price: Number(e.target.value) })} disabled={saving} /></label><label>จำนวนคงเหลือ (ชิ้น)<input type="number" required min="0" max="1000000" step="1" value={form.stockQuantity} onChange={e => setForm({ ...form, stockQuantity: Number(e.target.value) })} disabled={saving} /></label></div>
        <label>ที่อยู่รูปภาพ<input required maxLength={1000} placeholder="https://... หรือ /products/placeholder.svg" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} disabled={saving} /><span className="field-help">ใช้ลิงก์ HTTPS หรือรูป SVG ในโฟลเดอร์ public/products</span></label>
        <label className="checkbox-label"><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} disabled={saving} /> เปิดการขายสินค้า</label>
        <div className="form-actions"><button type="button" className="button button-outline" onClick={() => setOpen(false)} disabled={saving}>ยกเลิก</button><button type="submit" className="button button-primary" disabled={saving}>{saving ? <span className="spinner" /> : <Check size={17} />}{saving ? "กำลังบันทึก..." : "บันทึกสินค้า"}</button></div>
      </form>
    </Dialog>
    <Dialog open={!!deleting} onClose={() => { if (!saving) setDeleting(null); }} title="ปิดการขายสินค้า" className="confirm-dialog"><div className="confirm-content"><p>ต้องการปิดการขาย <b>{deleting?.name}</b> ใช่ไหม?</p><p className="muted">สินค้าจะไม่แสดงในหน้าร้าน และเปิดขายใหม่ได้จากปุ่มแก้ไข</p><div className="form-actions"><button className="button button-outline" onClick={() => setDeleting(null)} disabled={saving}>ยกเลิก</button><button className="button button-danger" onClick={() => void remove()} disabled={saving}>{saving ? "กำลังบันทึก..." : "ปิดการขาย"}</button></div></div></Dialog>
  </div>;
}
