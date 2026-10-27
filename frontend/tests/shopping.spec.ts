import { expect, test } from "@playwright/test";

const API = "http://127.0.0.1:5199/api";

test("desktop storefront: search, categories, stock filter and product details", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /ของที่ใช่/ })).toBeVisible();
  await expect(page.locator(".product-card")).toHaveCount(8);
  await page.screenshot({ path: "../.artifacts/storefront-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "อิเล็กทรอนิกส์", exact: true }).click();
  await expect(page.locator(".product-card")).toHaveCount(2);
  await page.getByLabel("เฉพาะที่มีสินค้า").check();
  await expect(page.locator(".product-card")).toHaveCount(1);
  await page.getByRole("button", { name: "ดูรายละเอียด หูฟังไร้สาย Everyday" }).click();
  const detail = page.getByRole("dialog", { name: "รายละเอียดสินค้า" });
  await expect(detail.getByRole("heading", { name: "หูฟังไร้สาย Everyday" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(detail).not.toBeVisible();
  await page.getByRole("textbox", { name: "ค้นหาชื่อหรือรหัสสินค้า" }).fill("EL-001");
  await expect(page.locator(".product-card")).toHaveCount(1);
  await page.getByRole("textbox", { name: "ค้นหาชื่อหรือรหัสสินค้า" }).fill("ไม่พบสินค้านี้แน่นอน");
  await expect(page.getByRole("heading", { name: "ยังไม่เจอของที่ค้นหา" })).toBeVisible();
});

test("mobile storefront fits the screen and cart dialog works", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".product-card")).toHaveCount(8);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "../.artifacts/storefront-mobile.png", fullPage: true });
  await page.getByRole("button", { name: /ตะกร้าของฉัน/ }).click();
  await expect(page.getByRole("heading", { name: "ตะกร้ารอของที่คุณชอบอยู่" })).toBeVisible();
  await page.getByRole("button", { name: "ไปเลือกซื้อสินค้า" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("cart cannot exceed stock; checkout saves the order and reduces inventory", async ({ page, request }) => {
  const name = "สินค้าทดสอบตะกร้า";
  const response = await request.post(`${API}/admin/products`, { data: {
    sku: `UI-${Date.now()}`, name, description: "สินค้าสำหรับทดสอบผ่านเบราว์เซอร์",
    category: "ทดสอบ", price: 125.5, stockQuantity: 2, imageUrl: "/products/placeholder.svg", isActive: true,
  } });
  expect(response.status()).toBe(201);
  const product = await response.json();
  await page.goto("/");
  await page.getByRole("textbox", { name: "ค้นหาชื่อหรือรหัสสินค้า" }).fill(product.sku);
  const add = page.getByRole("button", { name: `เพิ่ม ${name} ลงตะกร้า`, exact: true });
  await expect(add).toBeEnabled();
  await add.click();
  await expect(add).toBeEnabled();
  await add.click();
  await expect(add).toBeDisabled();
  await page.getByRole("button", { name: /ตะกร้าของฉัน/ }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("button", { name: `เพิ่มจำนวน ${name}`, exact: true })).toBeDisabled();
  await expect(dialog.locator(".summary-total")).toContainText("251");
  await dialog.getByRole("button", { name: "ชำระเงิน (Check out)" }).click();
  await dialog.getByLabel("ชื่อ–นามสกุลผู้รับ").fill("ทดสอบ ระบบร้านค้า");
  await dialog.getByLabel("เบอร์โทรศัพท์").fill("0812345678");
  await dialog.getByLabel("ที่อยู่จัดส่ง").fill("123 ถนนทดสอบ แขวงทดสอบ เขตทดสอบ กรุงเทพฯ 10110");
  await dialog.getByRole("button", { name: "ยืนยันชำระเงิน (ทดลอง)", exact: true }).click();
  await expect(dialog.getByRole("heading", { name: "รับคำสั่งซื้อเรียบร้อย!" })).toBeVisible();
  await dialog.getByRole("link", { name: "ดูคำสั่งซื้อของฉัน" }).click();
  await expect(page.getByRole("heading", { name: "คำสั่งซื้อของฉัน." })).toBeVisible();
  await expect(page.locator(".order-card")).toHaveCount(1);
  expect((await (await request.get(`${API}/products/${product.id}`)).json()).stockQuantity).toBe(0);
});

test("admin can create, edit and disable a product", async ({ page }) => {
  await page.goto("/login?as=Admin");
  await page.getByLabel("ชื่อผู้ใช้", { exact: true }).fill("Admin");
  await page.getByLabel("รหัสผ่าน", { exact: true }).fill("Admin");
  await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.getByRole("button", { name: "เพิ่มสินค้าใหม่" }).click();
  const dialog = page.getByRole("dialog", { name: "เพิ่มสินค้าใหม่", exact: true });
  await dialog.getByLabel("รหัสสินค้า (SKU)").fill(`ADMIN-${Date.now()}`);
  await dialog.getByLabel("ชื่อสินค้า", { exact: true }).fill("สินค้าใหม่จากหน้าจัดการ");
  await dialog.getByLabel("รายละเอียดสินค้า").fill("รายละเอียดสินค้าตัวอย่างสำหรับทดสอบ");
  await dialog.getByLabel("ราคาขาย (บาท)").fill("199");
  await dialog.getByLabel("จำนวนคงเหลือ (ชิ้น)").fill("4");
  await dialog.getByRole("button", { name: "บันทึกสินค้า" }).click();
  await expect(dialog).not.toBeVisible();
  const row = page.getByRole("row").filter({ hasText: "สินค้าใหม่จากหน้าจัดการ" });
  await expect(row).toContainText("199");
  await row.getByRole("button", { name: "แก้ไข สินค้าใหม่จากหน้าจัดการ" }).click();
  const edit = page.getByRole("dialog", { name: "แก้ไขสินค้า", exact: true });
  await edit.getByLabel("ราคาขาย (บาท)").fill("249");
  await edit.getByLabel("จำนวนคงเหลือ (ชิ้น)").fill("7");
  await edit.getByRole("button", { name: "บันทึกสินค้า" }).click();
  await expect(edit).not.toBeVisible();
  await expect(row).toContainText("249");
  await row.getByRole("button", { name: "ปิดการขาย สินค้าใหม่จากหน้าจัดการ" }).click();
  await page.getByRole("dialog", { name: "ปิดการขายสินค้า", exact: true }).getByRole("button", { name: "ปิดการขาย", exact: true }).click();
  await expect(row.locator(".status-pill")).toHaveText("ปิดการขาย");
});

test("cart supports decreasing, deleting and clearing items without changing unsold stock", async ({ page, request }) => {
  const products = [];
  for (let index = 0; index < 2; index++) {
    const response = await request.post(`${API}/admin/products`, { data: {
      sku: `CLEAR-${Date.now()}-${index}`, name: `ทดสอบล้างตะกร้า ${index + 1}`,
      description: "สินค้าทดสอบล้างตะกร้า", category: "ทดสอบ", price: index ? 30 : 20,
      stockQuantity: 4, imageUrl: "/products/placeholder.svg", isActive: true,
    } });
    expect(response.status()).toBe(201);
    products.push(await response.json());
  }
  await page.goto("/");
  const search = page.getByRole("textbox", { name: "ค้นหาชื่อหรือรหัสสินค้า" });
  for (const [index, product] of products.entries()) {
    await search.fill(product.sku);
    const add = page.getByRole("button", { name: `เพิ่ม ${product.name} ลงตะกร้า`, exact: true });
    await add.click();
    if (index === 0) { await expect(add).toBeEnabled(); await add.click(); }
    await expect(add).toBeEnabled();
  }
  await page.getByRole("button", { name: /ตะกร้าของฉัน/ }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator(".summary-total")).toContainText("70");
  await dialog.getByRole("button", { name: `ลดจำนวน ${products[0].name}` }).click();
  await expect(dialog.locator(".summary-total")).toContainText("50");
  await dialog.getByRole("button", { name: `นำ ${products[0].name} ออกจากตะกร้า` }).click();
  await expect(dialog.locator(".cart-item")).toHaveCount(1);
  await expect(dialog.locator(".summary-total")).toContainText("30");
  await dialog.getByRole("button", { name: "ล้างตะกร้าทั้งหมด" }).click();
  await expect(dialog.getByRole("heading", { name: "ตะกร้ารอของที่คุณชอบอยู่" })).toBeVisible();
  for (const product of products) {
    expect((await (await request.get(`${API}/products/${product.id}`)).json()).stockQuantity).toBe(4);
  }
});

test("mock admin login shows product management, survives refresh and logs out", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "เข้าสู่ระบบสำหรับแอดมิน" })).toBeVisible();
  await expect(page.getByRole("button", { name: "เพิ่มสินค้าใหม่" })).toHaveCount(0);
  await page.getByRole("link", { name: "เข้าสู่ระบบแอดมิน", exact: true }).click();
  await page.getByLabel("ชื่อผู้ใช้", { exact: true }).fill("Admin");
  await page.getByLabel("รหัสผ่าน", { exact: true }).fill("wrong");
  await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
  await expect(page.locator(".login-form").getByRole("alert")).toContainText("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
  await page.getByLabel("รหัสผ่าน", { exact: true }).fill("Admin");
  await page.screenshot({ path: "../.artifacts/login-admin.png", fullPage: true });
  await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("button", { name: "เพิ่มสินค้าใหม่" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "เพิ่มสินค้าใหม่" })).toBeVisible();
  const profile = await page.evaluate(() => JSON.parse(localStorage.getItem("shopping.mock-user.v1")!));
  expect(profile.role).toBe("Admin");
  expect(profile).not.toHaveProperty("password");
  await page.getByRole("button", { name: "ออกจากระบบ" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: "จัดการสินค้า", exact: true })).toHaveCount(0);
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "เข้าสู่ระบบสำหรับแอดมิน" })).toBeVisible();
});

test("mock customer login on mobile uses a Thai phone and prefills checkout", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByLabel("เบอร์โทรศัพท์", { exact: true }).fill("0899999999");
  await page.getByLabel("รหัสผ่าน", { exact: true }).fill("0000");
  await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
  await expect(page.locator(".login-form").getByRole("alert")).toContainText("เบอร์โทรหรือรหัสผ่านไม่ถูกต้อง");
  await page.getByLabel("รหัสผ่าน", { exact: true }).fill("1234");
  await page.screenshot({ path: "../.artifacts/login-user-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", { name: "ออกจากระบบ" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "เมนูหลัก" }).getByRole("link", { name: "คำสั่งซื้อของฉัน" })).toBeVisible();
  await expect(page.getByRole("link", { name: "จัดการสินค้า", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "เพิ่ม หูฟังไร้สาย Everyday ลงตะกร้า", exact: true }).click();
  await page.getByRole("button", { name: /ตะกร้าของฉัน/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "ชำระเงิน (Check out)" }).click();
  await expect(page.getByRole("dialog").getByLabel("เบอร์โทรศัพท์", { exact: true })).toHaveValue("0899999999");
  await page.keyboard.press("Escape");
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "เข้าสู่ระบบสำหรับแอดมิน" })).toBeVisible();
  await expect(page.getByRole("button", { name: "เพิ่มสินค้าใหม่" })).toHaveCount(0);
});

test("admin has a separate interface and cannot open customer storefront or personal orders", async ({ page }) => {
  await page.goto("/login?as=Admin");
  await page.getByLabel("ชื่อผู้ใช้", { exact: true }).fill("Admin");
  await page.getByLabel("รหัสผ่าน", { exact: true }).fill("Admin");
  await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("button", { name: "เพิ่มสินค้าใหม่" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "เมนูแอดมิน" }).getByRole("link", { name: "จัดการสินค้า" })).toBeVisible();
  await expect(page.getByRole("link", { name: "คำสั่งซื้อของฉัน" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "หน้าร้าน", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /ตะกร้าของฉัน/ })).toHaveCount(0);
  await expect(page.getByRole("search")).toHaveCount(0);
  await page.screenshot({ path: "../.artifacts/admin-role-desktop.png", fullPage: true });
  for (const path of ["/orders", "/"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("button", { name: "เพิ่มสินค้าใหม่" })).toBeVisible();
    await expect(page.getByRole("link", { name: "คำสั่งซื้อของฉัน" })).toHaveCount(0);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "../.artifacts/admin-role-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "ออกจากระบบ" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", { name: /ตะกร้าของฉัน/ })).toBeVisible();
});
