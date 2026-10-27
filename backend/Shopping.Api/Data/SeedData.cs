using Microsoft.EntityFrameworkCore;
using Shopping.Api.Entities;

namespace Shopping.Api.Data;

public static class SeedData
{
    public static async Task InitializeAsync(ShoppingDbContext db)
    {
        // For this practice project: create the database once, retain edits on later starts.
        await db.Database.EnsureCreatedAsync();
        await LegacyStockMigration.ApplyAsync(db);
        if (await db.Products.AnyAsync()) return;

        db.Products.AddRange(
            New("EL-001", "หูฟังไร้สาย Everyday", "เสียงที่ชอบ ไปได้ทุกที่ หูฟังบลูทูธดีไซน์เรียบ น้ำหนักเบา ใช้งานได้สูงสุด 30 ชั่วโมง พร้อมสายชาร์จ USB-C", "อิเล็กทรอนิกส์", 1290, 12, "headphones"),
            New("FA-001", "รองเท้าผ้าใบ Cloud Step", "คู่โปรดสำหรับทุกวัน พื้นนุ่ม น้ำหนักเบา ระบายอากาศดี สีครีมแมตช์ง่าย รุ่นตัวอย่างไซซ์ 39", "แฟชั่น", 890, 8, "sneakers"),
            New("HO-001", "โคมไฟโต๊ะ Little Sun", "เติมแสงอุ่นให้มุมโปรด โคมไฟทรงเห็ดสีส้ม ปรับความสว่างได้ 3 ระดับ ใช้ไฟ USB", "บ้านและไลฟ์สไตล์", 590, 5, "lamp"),
            New("FA-002", "กระเป๋าผ้า Daily Tote", "ใบเดียวไปได้ทั้งวัน ผ้าแคนวาสเนื้อหนา มีกระเป๋าด้านใน ใส่แล็ปท็อป 13 นิ้วได้ สีเขียวเซจ", "แฟชั่น", 290, 24, "tote"),
            New("HO-002", "แก้วเซรามิก Slow Morning", "ค่อย ๆ เริ่มวันด้วยกาแฟแก้วโปรด เซรามิกเคลือบด้าน ขนาด 350 มล. สีครีม เข้าไมโครเวฟได้", "บ้านและไลฟ์สไตล์", 250, 3, "mug"),
            New("EL-002", "ลำโพงบลูทูธ Pocket Sound", "เพลงดี ๆ ในทุกมุม ลำโพงพกพาสีเขียว เสียงชัด เชื่อมต่อง่าย แบตเตอรี่ใช้งานได้ 12 ชั่วโมง", "อิเล็กทรอนิกส์", 790, 0, "speaker"),
            New("BE-001", "แฮนด์ครีม Soft Touch", "ดูแลมือให้ชุ่มชื้นทุกวัน กลิ่นซิตรัสอ่อน ๆ เนื้อครีมซึมง่าย ขนาด 50 มล. พกใส่กระเป๋าได้", "ความงาม", 190, 18, "cream"),
            New("HO-003", "ต้นไม้กระถาง Green Corner", "เพิ่มพื้นที่สีเขียวให้ห้อง ต้นยางอินเดียพร้อมกระถางเซรามิก ดูแลง่าย วางในที่มีแสงรำไร", "บ้านและไลฟ์สไตล์", 390, 7, "plant")
        );
        await db.SaveChangesAsync();
    }

    private static Product New(string sku, string name, string description, string category,
        decimal price, int stock, string image) => new()
        {
            Sku = sku, Name = name, Description = description, Category = category,
            Price = price, Stock = new Stock { Quantity = stock }, ImageUrl = $"/products/{image}.svg"
        };
}
