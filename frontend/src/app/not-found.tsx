import Link from "next/link";

export default function NotFound() {
  return <div className="container empty-state inner-page"><span className="eyebrow orange">404</span><h1>ไม่พบหน้านี้</h1><p>กลับไปเลือกของที่ชอบกันต่อได้เลย</p><Link className="button button-primary" href="/">กลับหน้าร้าน</Link></div>;
}

