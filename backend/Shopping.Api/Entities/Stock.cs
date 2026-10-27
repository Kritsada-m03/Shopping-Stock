namespace Shopping.Api.Entities;

public class Stock
{
    // One record per product. ProductId is both the primary and foreign key.
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public int Quantity { get; set; }
}
