# shopping.

แอปฝึกเขียนระบบสินค้า สต็อก และตะกร้าสินค้า หน้าบ้าน **Next.js + TypeScript** หลังบ้าน **C# ASP.NET Core Web API (.NET 10)** ฐานข้อมูล **SQLite** ตามที่ปรับจาก SQL Server โดยใช้ **DBeaver** เปิดดูไฟล์ฐานข้อมูลได้โดยตรง หน้าบ้านคุยกับหลังบ้านผ่าน **REST API / JSON**

## เปิดใช้งาน

ต้องมี Node.js 24, .NET SDK 10 และ DBeaver หากต้องการเปิดฐานข้อมูล ไม่ต้องใช้ Docker

เปิด Terminal แรกจากโฟลเดอร์โปรเจกต์:

```powershell
dotnet restore backend/Shopping.Api
dotnet run --project backend/Shopping.Api
```

API: http://localhost:5099/api/health

เปิด Terminal ที่สอง:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

หน้าร้าน: http://127.0.0.1:3000 · คำสั่งซื้อ: http://127.0.0.1:3000/orders · จัดการสินค้า: http://127.0.0.1:3000/admin

ใช้ `npm.cmd` บน Windows เพื่อไม่ติดข้อจำกัดการรัน `npm.ps1` กด Ctrl+C ในแต่ละ Terminal เพื่อหยุดเซิร์ฟเวอร์

## ฐานข้อมูลใน DBeaver

ไฟล์จริงอยู่ที่ `backend/Shopping.Api/App_Data/shopping.db` API สร้างตารางและข้อมูลตัวอย่าง 8 รายการครั้งแรกให้อัตโนมัติ การเปิดครั้งต่อไปจะรักษาข้อมูลเดิม

สร้างเฉพาะฐานข้อมูลโดยไม่เปิด API:

```powershell
dotnet run --project backend/Shopping.Api -- --init-db
```

เปิด DBeaver → **New Database Connection** → **SQLite** → Browse เลือกไฟล์ `shopping.db` → Finish ไม่ต้องใส่ host, port, username หรือ password หากมีคำถามดาวน์โหลด SQLite driver ให้กด Download

หรือสั่งจากโฟลเดอร์โปรเจกต์:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/Open-Database.ps1
```

มีตัวอย่าง SQL อ่านสินค้า สต็อก ตะกร้า และออเดอร์ใน [database/queries.sql](database/queries.sql) เลือก SELECT ที่ต้องการแล้วกด Ctrl+Enter หากเปิดฐานข้อมูลไว้ก่อนแยกตาราง Stocks ให้ Refresh (F5) ใน Database Navigator

ตาราง:

| ตาราง | หน้าที่ |
| --- | --- |
| Products | Id, SKU, ชื่อ, รายละเอียด, หมวดหมู่, ราคาต่อหน่วย, รูปภาพ, สถานะ |
| Stocks | ProductId, Quantity จำนวนคงเหลือ เชื่อม Products แบบ 1:1 |
| Carts | ตะกร้าแต่ละเบราว์เซอร์ |
| CartItems | สินค้าและจำนวนในตะกร้า |
| Orders | เลขคำสั่งซื้อ ผู้รับ ที่อยู่ ยอดรวม และสถานะ |
| OrderItems | ชื่อและราคาสินค้า ณ ตอนซื้อ จำนวน และความสัมพันธ์กับออเดอร์ |

SKU ต้องไม่ซ้ำ สต็อกห้ามติดลบ และจำนวนในตะกร้าต้องมากกว่า 0 มี constraint ในฐานข้อมูลด้วย ราคาคำนวณด้วย `decimal` ใน C#; SQLite provider เก็บ decimal เป็น TEXT เพื่อรักษาค่าทศนิยม เมื่อเขียน SQL คำนวณเองใช้ `CAST(Price AS NUMERIC)` ได้

ฐานข้อมูลจากเวอร์ชันแรกที่เก็บ `Products.StockQuantity` จะถูกย้ายเป็น `Stocks` อัตโนมัติ เก็บข้อมูลและออเดอร์เดิมไว้ พร้อมสำรองไฟล์ในโฟลเดอร์ `App_Data/backups` ก่อนย้าย ไม่ได้ล้างฐานข้อมูล

## โครงสร้าง MVC + Repository

โปรเจกต์นี้เป็นการแยกหน้าจอกับ API: **View = Next.js**, **Controller = C# API**, **Model = Entities** โดยเพิ่ม Service และ Repo เพื่อให้แยกหน้าที่อ่านตามได้ง่าย จึงไม่มี Razor Views ใน C#

```text
Shopping-Stock/
├─ frontend/                          ← View: Next.js
│  ├─ src/app/page.tsx                 ← หน้าร้าน
│  ├─ src/app/orders/page.tsx          ← ประวัติคำสั่งซื้อ
│  ├─ src/app/admin/page.tsx           ← จัดการสินค้า
│  ├─ src/components/                 ← ส่วนประกอบหน้าจอและตะกร้า
│  └─ src/lib/api.ts                  ← เรียก REST API
├─ backend/Shopping.Api/
│  ├─ Controllers/                    ← รับ HTTP request และส่ง response
│  ├─ Entities/                       ← Product, Stock, Cart, CartItem, Order, OrderItem
│  ├─ Repo/
│  │  ├─ Interfaces/                  ← กำหนดวิธีอ่าน/เขียนข้อมูล
│  │  ├─ ProductRepository.cs         ← ข้อมูลสินค้าและ Stock
│  │  └─ CartRepository.cs            ← ข้อมูลตะกร้าและออเดอร์
│  ├─ Services/                       ← เงื่อนไขสต็อก คำนวณยอด Checkout
│  ├─ Contracts/                      ← รูปแบบ request/response (DTO)
│  ├─ Data/                           ← EF Core DbContext และข้อมูลตัวอย่าง
│  ├─ App_Data/shopping.db             ← SQLite จริง (ไม่ commit ข้อมูลลง Git)
│  └─ Program.cs                      ← ตั้งค่า API, CORS, DI และฐานข้อมูล
├─ database/queries.sql
└─ tests/                             ← ทดสอบ API และการย้ายฐานข้อมูล
```

ตัวอย่างเส้นทางเมื่อเพิ่มสินค้า: ปุ่มใน Next.js → `api.addItem()` → `CartsController.Add()` → `CartService.ChangeQuantityAsync()` → `ProductRepository` ตรวจ Stock → `CartRepository` บันทึก → ส่ง JSON กลับมาอัปเดตตะกร้า Controller และ Service ไม่ใช้ DbContext โดยตรง

## กติกาสต็อกและเงื่อนไขงาน

**ตัดสต็อกเมื่อยืนยัน Check out** การเพิ่มลงตะกร้ายังไม่จองสินค้า และไม่หักสต็อกจริง จึงตรวจสต็อกอีกครั้งตอนยืนยันซื้อ กติกานี้ป้องกันการหักซ้ำตอนเพิ่มตะกร้าแล้วหักอีกรอบตอน Checkout

| เงื่อนไข | การทำงาน |
| --- | --- |
| Mock ข้อมูลสินค้าและสต็อกใน DB | มีสินค้า 8 รายการ พร้อมตัวอย่างสต็อกน้อยและสินค้าหมด |
| รหัสสินค้า ชื่อ ราคาขายต่อหน่วย | มี Id, SKU, Name, Price พร้อมรายละเอียดอื่น ๆ |
| Stock: รหัสสินค้าและจำนวนคงเหลือ | ตาราง Stocks มี ProductId และ Quantity; API ส่ง SKU ให้ด้วย |
| แสดงรายการสินค้า | หน้าร้าน ค้นหา กรองหมวดหมู่ กรองที่มีสต็อก และเรียงราคา |
| เพิ่มสินค้าในตะกร้า | เพิ่มได้ครั้งละชิ้น หรือระบุจำนวนผ่าน API |
| ห้ามเพิ่มเกินสต็อก | ตรวจจำนวนเดิมในตะกร้า + จำนวนที่เพิ่ม ทั้งหน้าเว็บและ API; API ตอบ 409 |
| เพิ่ม/ลด/ลบ/ล้างตะกร้า | มีปุ่มครบ; ยอดตะกร้าคำนวณใหม่ตามจำนวนจริง |
| แสดงยอดก่อนชำระเงิน | ยอดแต่ละรายการและยอดรวมมาจากราคาปัจจุบันใน API ไม่รับราคาจากหน้าบ้าน |
| Check out และตัด Stock | ตรวจสินค้าทุกรายการ บันทึกออเดอร์ หัก Stocks และล้างตะกร้าใน transaction เดียว |

ตัวอย่าง: Stock = 5 → ใส่ตะกร้า 3 ชิ้น (Stock ยังเป็น 5) → ลดเหลือ 2 (Stock ยังเป็น 5) → ยืนยัน Check out → Stock = 3 ถ้าลบหรือล้างก่อนซื้อ Stock จะยังเป็น 5 การล้างตะกร้าหลังซื้อไม่คืนสินค้าที่ขายแล้ว

เมื่อมีคนอื่นซื้อจนสต็อกไม่พอ ตะกร้าเดิมจะแจ้งเตือนและยืนยันซื้อไม่ได้จนกว่าจะปรับจำนวน ระบบใช้ SQLite transaction ป้องกันซื้อชิ้นสุดท้ายพร้อมกันและกดยืนยันซ้ำ ถ้ารายการใดไม่ผ่าน จะไม่หักสต็อกของรายการอื่นในออเดอร์นั้น

คำสั่งซื้อเป็นการทดลอง **ไม่มี payment gateway และไม่มีการเก็บเงินจริง** หน้าจัดการใช้ login แบบ mock ตามรายละเอียดด้านล่าง ประวัติคำสั่งซื้อผูกกับ Cart ID ที่เก็บใน localStorage ของเบราว์เซอร์นี้

## เข้าสู่ระบบแบบ Mock

เปิด http://127.0.0.1:3000/login แล้วเลือกประเภทบัญชี

| ประเภท | ชื่อผู้ใช้ / เบอร์โทร | รหัสผ่าน |
| --- | --- | --- |
| แอดมิน | `Admin` | `Admin` |
| ผู้ใช้ทั่วไป | เบอร์ไทย 10 หลักขึ้นต้นด้วย 0 เช่น `0812345678` หรือเบอร์สมมติอื่น | `1234` |

แอดมินเข้าสู่ `/admin` พร้อมเมนูจัดการสินค้าและสต็อก มีส่วนหัวและท้ายหน้าแยกจากหน้าผู้ซื้อ ผู้ใช้ทั่วไปใช้หน้าร้าน ตะกร้า และ `/orders` สำหรับคำสั่งซื้อของตัวเอง หากแอดมินเปิด `/` หรือ `/orders` โดยตรง หน้าเว็บจะพากลับ `/admin`

เบอร์ที่ใช้ login จะเติมในฟอร์ม Checkout ให้ กดปุ่มออกจากระบบที่ส่วนหัวเว็บได้ สถานะจำในเบราว์เซอร์เมื่อรีเฟรช โดยเก็บเฉพาะ profile ใน localStorage ไม่เก็บรหัสผ่าน

การรับส่ง login ใช้ `POST /api/login` → `MockLoginController` → `MockLoginService` → `MockUserResponse` มีเพียงการเทียบค่าบัญชีตัวอย่าง ไม่มีตารางสมาชิก ไม่มี OTP ไม่มี token/cookie authentication และไม่มีการตรวจสิทธิ์ที่ API ตามขอบเขต mock ที่กำหนด การเลือกแสดงหน้าจัดการตาม role เป็นส่วนของหน้าเว็บ ไม่ใช่ระบบรักษาความปลอดภัยสำหรับใช้งานจริง

```json
{
  "accountType": "Admin",
  "identifier": "Admin",
  "password": "Admin"
}
```

สำหรับผู้ใช้ทั่วไปส่ง `accountType: "User"`, `identifier` เป็นเบอร์โทร และ `password: "1234"` ไม่มีการสมัครสมาชิกหรือบันทึกเบอร์ลงฐานข้อมูล

## REST API

Base URL: `http://localhost:5099/api`

| Method | Path | หน้าที่ |
| --- | --- | --- |
| GET | /health | ตรวจ API และฐานข้อมูล |
| POST | /login | ตรวจบัญชี mock และส่ง profile กลับ ไม่มี token |
| GET | /products?search=...&category=... | รายการสินค้าที่เปิดขายและ Stock |
| GET | /products/{id} | รายละเอียดสินค้า |
| GET | /stocks | ProductId, SKU และจำนวนคงเหลือ |
| POST | /carts | สร้างตะกร้า |
| GET | /carts/{cartId} | รายการ จำนวน ราคา ยอดรวม และความพร้อม Checkout |
| POST | /carts/{cartId}/items | เพิ่ม `{ "productId": 1, "quantity": 2 }` |
| PUT | /carts/{cartId}/items/{productId} | ตั้งจำนวนใหม่ `{ "quantity": 1 }` |
| DELETE | /carts/{cartId}/items/{productId} | ลบหนึ่งรายการ |
| DELETE | /carts/{cartId}/items | ล้างตะกร้าทั้งหมด |
| POST | /carts/{cartId}/checkout | ยืนยันคำสั่งซื้อและตัดสต็อก |
| GET | /carts/{cartId}/orders | ประวัติคำสั่งซื้อ |
| GET | /carts/{cartId}/orders/{orderId} | รายละเอียดออเดอร์ |
| GET / POST | /admin/products | ดูรายการทั้งหมด / เพิ่มสินค้า |
| PUT / DELETE | /admin/products/{id} | แก้ไข / ปิดการขาย |

Checkout body:

```json
{
  "customerName": "ชื่อผู้รับ",
  "phone": "0812345678",
  "address": "123 ถนนตัวอย่าง กรุงเทพฯ 10110"
}
```

PUT สินค้าต้องส่ง `rowVersion` จาก GET ล่าสุดด้วย เพื่อไม่ให้ฟอร์มเก่าเขียนทับสต็อกที่เพิ่งมีคนซื้อ

## ตรวจสอบโปรแกรม

รันจากโฟลเดอร์โปรเจกต์ โดยหยุด API ที่รันอยู่ก่อน build บน Windows:

```powershell
dotnet build backend/Shopping.Api
node --test tests/api.test.mjs tests/migration.test.mjs
```

ทดสอบกับ SQLite จริงใน `.artifacts` ซึ่งเป็นคนละไฟล์กับที่เปิดใน DBeaver ครอบคลุมเพิ่มเกินสต็อก เพิ่มพร้อมกัน ซื้อชิ้นสุดท้ายพร้อมกัน ยืนยันซ้ำ ยอดทศนิยม การย้อนกลับทั้งออเดอร์ ล้างตะกร้า และรักษาข้อมูลตอนย้าย Stock

ฝั่งหน้าบ้าน:

```powershell
cd frontend
npm.cmd run build
npm.cmd run test:e2e
```

Browser test ใช้ Edge ที่ติดตั้งในเครื่อง เปิด API และ Next.js แยกที่พอร์ต 5199/3100 พร้อมฐานข้อมูลทดสอบของตัวเอง ภาพหน้าจอและผลทดสอบอยู่ใน `.artifacts`

ตั้งค่า API URL อื่นได้โดยคัดลอก `frontend/.env.example` เป็น `.env.local`; ตั้งค่า DB อื่นได้ผ่าน environment variable `ConnectionStrings__ShoppingDb` หรือ `appsettings.Local.json` (ไม่ commit ลง Git)

เอกสารอ้างอิง: [Next.js](https://nextjs.org/docs/app/getting-started/installation), [SQLite transactions ของ Microsoft](https://learn.microsoft.com/en-us/dotnet/standard/data/sqlite/transactions), [DBeaver SQLite](https://dbeaver.com/docs/dbeaver/Database-driver-SQLite/)
