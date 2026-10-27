using System.ComponentModel.DataAnnotations;

namespace Shopping.Api.Entities;

public class Product
{
    public int Id { get; set; }
    public string Sku { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string Category { get; set; } = "";
    public decimal Price { get; set; }
    public Stock Stock { get; set; } = new();
    public string ImageUrl { get; set; } = "/products/placeholder.svg";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    [ConcurrencyCheck] public byte[] RowVersion { get; set; } = Guid.NewGuid().ToByteArray();
}
