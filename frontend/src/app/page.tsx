"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowRight, Check, ChevronRight, Grid2X2, Headphones, Leaf, Package, Plus, RefreshCw, SearchX, ShieldCheck, Shirt, ShoppingBag, Sparkles, Truck, X } from "lucide-react";
import { api, errorMessage, money } from "@/lib/api";
import type { Product } from "@/lib/types";
import { useShop } from "@/components/shop-provider";
import { Dialog } from "@/components/dialog";
import { ProductImage } from "@/components/product-image";
import { CustomerView } from "@/components/customer-view";

const categoryIcons = { "ทั้งหมด": Grid2X2, "อิเล็กทรอนิกส์": Headphones, "แฟชั่น": Shirt, "บ้านและไลฟ์สไตล์": Leaf, "ความงาม": Sparkles };

export default function Storefront() {
  return <CustomerView><StorefrontContent /></CustomerView>;
}

function StorefrontContent() {
  const { search, setSearch, cart, busy, addItem, catalogVersion } = useShop();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [category, setCategory] = useState("ทั้งหมด");
  const [sort, setSort] = useState("recommended");
  const [inStock, setInStock] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);

  useEffect(() => {
    let active = true;
    api.products().then(data => { if (active) { setProducts(data); setError(""); } })
      .catch(error => { if (active) setError(errorMessage(error)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [catalogVersion, retry]);

  const categories = ["ทั้งหมด", ...new Set(products.map(p => p.category))];
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const items = products.filter(p => (category === "ทั้งหมด" || p.category === category)
      && (!inStock || p.stockQuantity > 0)
      && (!query || `${p.name} ${p.sku} ${p.description}`.toLowerCase().includes(query)));
    if (sort === "price-asc") items.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") items.sort((a, b) => b.price - a.price);
    if (sort === "newest") items.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id);
    return items;
  }, [products, search, category, inStock, sort]);

  const quantityInCart = (id: number) => cart?.items.find(i => i.productId === id)?.quantity ?? 0;
  const selectedLive = selected ? products.find(p => p.id === selected.id) ?? selected : null;

  return <div className="container storefront">
    <section className="hero-section" aria-label="ยินดีต้อนรับสู่ shopping">
      <div className="hero-main">
        <div className="hero-copy"><span className="hero-label"><span /> LITTLE THINGS, EVERYDAY JOY</span>
          <h1>ของที่ใช่<br />ในราคาที่<span className="hero-word">ชอบ<svg viewBox="0 0 180 15" aria-hidden="true"><path d="M4 10Q87 -2 175 8" /></svg></span></h1>
          <p>คัดของดี ๆ มาให้ทุกวัน<br />เติมความสุขง่าย ๆ ให้ทุกไลฟ์สไตล์ของคุณ</p>
          <a className="button hero-button" href="#catalog">เริ่มช้อปกันเลย <ArrowRight size={18} /></a>
          <span className="hero-footnote"><Check size={14} /> มีสต็อกจริง พร้อมให้เลือกช้อป</span>
        </div>
        <div className="hero-art" aria-hidden="true"><div className="hero-circle" /><span className="hero-star star-one">✳</span>
          <div className="hero-product hero-headphones"><ProductImage src="/products/headphones.svg" alt="" eager /></div>
          <div className="hero-product hero-shoe"><ProductImage src="/products/sneakers.svg" alt="" eager /></div>
          <div className="floating-label"><span className="tiny-bag"><ShoppingBag size={17} /></span><div><b>เลือกมาแล้ว เพื่อคุณ</b><span>Everyday essentials</span></div><span className="floating-check"><Check size={13} /></span></div>
          <span className="hero-star star-two">✳</span><span className="art-caption">GOOD FINDS. GOOD MOOD.</span>
        </div>
      </div>
      <a href="#catalog" className="hero-side" onClick={() => { setCategory("บ้านและไลฟ์สไตล์"); setSearch(""); }}>
        <span className="eyebrow">MAKE ROOM FOR JOY</span><h2>มุมเล็ก ๆ<br />ความสุขใหม่ ๆ</h2><span className="side-subtitle">ของน่ารักสำหรับบ้านของคุณ</span>
        <ProductImage src="/products/lamp.svg" alt="โคมไฟสีส้มสำหรับมุมโปรด" eager />
        <div className="side-bottom"><span>บ้านและไลฟ์สไตล์</span><span className="round-arrow"><ArrowRight size={18} /></span></div>
      </a>
    </section>

    <div className="benefits-strip"><div><Truck /><span><b>ส่งฟรีทุกออเดอร์</b><small>ไม่มีขั้นต่ำ ช้อปได้สบาย</small></span></div>
      <div><ShieldCheck /><span><b>เลือกอย่างมั่นใจ</b><small>ราคาและสต็อกชัดเจน</small></span></div>
      <div><Package /><span><b>ของดีที่คัดมาแล้ว</b><small>ให้ทุกวันพิเศษขึ้นอีกนิด</small></span></div>
      <div><ShoppingBag /><span><b>ช้อปง่ายในไม่กี่คลิก</b><small>ใส่ตะกร้า แล้วไปต่อได้เลย</small></span></div></div>

    <section id="catalog" className="catalog-section">
      <div className="section-heading"><div><span className="eyebrow orange">THE EVERYDAY EDIT</span><h2>ค้นพบของที่คุณชอบ<span className="orange">.</span></h2><p>ชิ้นเล็กชิ้นใหญ่ ก็เติมความสุขให้วันธรรมดาได้</p></div><a href="#product-grid" className="browse-link">เลือกดูสินค้า <ArrowDown size={16} /></a></div>
      <div className="category-tabs" aria-label="หมวดหมู่สินค้า">{categories.map(name => {
        const Icon = categoryIcons[name as keyof typeof categoryIcons] ?? Package;
        return <button key={name} className={`category-tab ${category === name ? "selected" : ""}`} onClick={() => setCategory(name)} aria-pressed={category === name}><Icon size={19} />{name}{name === "ทั้งหมด" && <span>{products.length}</span>}</button>;
      })}</div>
      <div className="catalog-toolbar"><div className="result-count">{search.trim() ? <>ผลการค้นหา “{search.trim()}” <button className="clear-search" aria-label="ล้างการค้นหา" onClick={() => setSearch("")}><X size={13} /></button> · </> : "สินค้าทั้งหมด "}<b>{filtered.length}</b> รายการ</div>
        <div className="filter-options"><label className="stock-toggle"><input type="checkbox" checked={inStock} onChange={e => setInStock(e.target.checked)} /> เฉพาะที่มีสินค้า</label>
          <label className="sort-select"><span>เรียงตาม:</span><select aria-label="เรียงลำดับสินค้า" value={sort} onChange={e => setSort(e.target.value)}><option value="recommended">แนะนำ</option><option value="price-asc">ราคา: ต่ำไปสูง</option><option value="price-desc">ราคา: สูงไปต่ำ</option><option value="newest">ใหม่ล่าสุด</option></select></label></div>
      </div>

      {error ? <div className="empty-state error-panel" role="alert"><Package size={36} /><h3>ยังเชื่อมต่อร้านค้าไม่ได้</h3><p>{error}</p><button className="button button-primary" onClick={() => { setLoading(true); setRetry(v => v + 1); }}><RefreshCw size={16} /> ลองอีกครั้ง</button></div>
        : loading ? <div className="product-grid" aria-label="กำลังโหลดสินค้า" aria-busy="true">{Array.from({ length: 8 }, (_, i) => <div className="product-skeleton" key={i}><div /><span /><span /></div>)}</div>
          : !filtered.length ? <div className="empty-state"><SearchX size={42} /><h3>ยังไม่เจอของที่ค้นหา</h3><p>ลองคำค้นใหม่ หรือเลือกดูสินค้าทั้งหมดอีกครั้ง</p><button className="button button-outline" onClick={() => { setSearch(""); setCategory("ทั้งหมด"); setInStock(false); }}>ดูสินค้าทั้งหมด</button></div>
            : <div className="product-grid" id="product-grid">{filtered.map((product, index) => {
              const soldOut = product.stockQuantity === 0;
              const atLimit = quantityInCart(product.id) >= product.stockQuantity;
              return <article className={`product-card ${soldOut ? "product-sold-out" : ""}`} key={product.id}>
                <button className="product-visual" onClick={() => setSelected(product)} aria-label={`ดูรายละเอียด ${product.name}`}>
                  <ProductImage src={product.imageUrl} alt={product.name} eager={index < 4} />
                  {soldOut ? <span className="product-badge badge-sold-out">สินค้าหมด</span> : product.stockQuantity <= 5 ? <span className="product-badge badge-low">เหลือเพียง {product.stockQuantity} ชิ้น</span> : index < 2 && <span className="product-badge badge-pick">คัดมาให้คุณ</span>}
                  <span className="product-open"><ArrowRight size={18} /></span>
                </button>
                <div className="product-info"><span className="product-category">{product.category}<span> / {product.sku}</span></span>
                  <h3><button onClick={() => setSelected(product)}>{product.name}</button></h3>
                  <p className={`stock-label ${soldOut ? "muted" : ""}`}><span className={`stock-dot ${soldOut ? "dot-gray" : ""}`} />{soldOut ? "รอเติมสินค้า" : `พร้อมส่ง · เหลือ ${product.stockQuantity} ชิ้น`}</p>
                  <div className="product-bottom"><strong>{money(product.price)}</strong><button className="add-button" disabled={busy || atLimit} onClick={() => void addItem(product.id)} aria-label={`เพิ่ม ${product.name} ลงตะกร้า`} title={soldOut ? "สินค้าหมด" : atLimit ? "จำนวนในตะกร้าถึงสต็อกที่มีแล้ว" : "เพิ่มลงตะกร้า"}>{atLimit && !soldOut ? <Check size={17} /> : <Plus size={19} />}</button></div>
                </div>
              </article>;
            })}</div>}
      {!loading && !error && filtered.length > 0 && <div className="catalog-end"><span />เจอของที่ชอบแล้วหรือยัง?<ShoppingBag size={15} /><span /></div>}
    </section>

    <section className="closing-banner"><span className="closing-icon"><ShoppingBag size={29} /></span><div><h3>ความสุขเล็ก ๆ เริ่มต้นที่นี่</h3><p>เลือกของที่ใช่ให้ตัวเอง หรือส่งต่อให้คนที่คุณนึกถึง</p></div><a className="button button-outline" href="#catalog">เลือกของที่ชอบ <ChevronRight size={17} /></a></section>

    <Dialog open={!!selected} onClose={() => setSelected(null)} title="รายละเอียดสินค้า" className="product-dialog">
      {selectedLive && <div className="product-detail"><ProductImage src={selectedLive.imageUrl} alt={selectedLive.name} eager /><div><span className="eyebrow orange">{selectedLive.category}</span><h2>{selectedLive.name}</h2><span className="sku">รหัสสินค้า {selectedLive.sku}</span><p>{selectedLive.description}</p><strong className="detail-price">{money(selectedLive.price)}</strong><p className="stock-label">คงเหลือ {selectedLive.stockQuantity} ชิ้น · ในตะกร้า {quantityInCart(selectedLive.id)} ชิ้น</p><button className="button button-primary full-width" disabled={busy || quantityInCart(selectedLive.id) >= selectedLive.stockQuantity} onClick={() => void addItem(selectedLive.id)}><Plus size={18} />{selectedLive.stockQuantity === 0 ? "สินค้าหมด" : quantityInCart(selectedLive.id) >= selectedLive.stockQuantity ? "จำนวนถึงสต็อกที่มีแล้ว" : "เพิ่มลงตะกร้า"}</button></div></div>}
    </Dialog>
  </div>;
}
