using System.ComponentModel.DataAnnotations;

namespace Shopping.Api.Contracts;

public class ProductRequest
{
    [Required, StringLength(30), RegularExpression(@"^[A-Za-z0-9][A-Za-z0-9_-]*$")]
    public string Sku { get; set; } = "";
    [Required, StringLength(160)] public string Name { get; set; } = "";
    [Required, StringLength(1200)] public string Description { get; set; } = "";
    [Required, StringLength(60)] public string Category { get; set; } = "";
    [Range(typeof(decimal), "0.01", "99999999.99")] public decimal Price { get; set; }
    [Range(0, 1000000)] public int StockQuantity { get; set; }
    [Required, StringLength(1000)]
    [RegularExpression(@"^(https://[^\s]+|/products/[a-zA-Z0-9_-]+\.svg)$")]
    public string ImageUrl { get; set; } = "/products/placeholder.svg";
    public bool IsActive { get; set; } = true;
    public string? RowVersion { get; set; }
}

public class AddItemRequest
{
    [Range(1, int.MaxValue)] public int ProductId { get; set; }
    [Range(1, 1000000)] public int Quantity { get; set; } = 1;
}

public class UpdateQuantityRequest
{
    [Range(1, 1000000)] public int Quantity { get; set; }
}

public class CheckoutRequest
{
    [Required, StringLength(120, MinimumLength = 2)] public string CustomerName { get; set; } = "";
    [Required, RegularExpression(@"^0[0-9]{8,9}$", ErrorMessage = "กรอกเบอร์โทรศัพท์ไทย 9–10 หลัก ขึ้นต้นด้วย 0")]
    public string Phone { get; set; } = "";
    [Required, StringLength(600, MinimumLength = 10)] public string Address { get; set; } = "";
}

