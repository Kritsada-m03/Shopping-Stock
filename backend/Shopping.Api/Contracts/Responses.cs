using Shopping.Api.Entities;

namespace Shopping.Api.Contracts;

public record ProductResponse(int Id, string Sku, string Name, string Description, string Category,
    decimal Price, int StockQuantity, string ImageUrl, bool IsActive, DateTime CreatedAt,
    DateTime UpdatedAt, string RowVersion)
{
    public static ProductResponse From(Product p) => new(p.Id, p.Sku, p.Name, p.Description,
        p.Category, p.Price, p.Stock.Quantity, p.ImageUrl, p.IsActive, p.CreatedAt, p.UpdatedAt,
        Convert.ToBase64String(p.RowVersion));
}

public record StockResponse(int ProductId, string Sku, int Quantity);

public record CartItemResponse(int ProductId, string Sku, string Name, string ImageUrl,
    decimal Price, int Quantity, int StockQuantity, bool IsActive, bool IsAvailable, decimal Subtotal);

public record CartResponse(Guid Id, List<CartItemResponse> Items, int ItemCount, decimal Total, bool CanCheckout);

public record OrderItemResponse(int ProductId, string Sku, string ProductName, string ImageUrl,
    decimal UnitPrice, int Quantity, decimal Subtotal);

public record OrderResponse(Guid Id, string OrderNumber, string CustomerName, string Phone,
    string Address, decimal Total, string Status, DateTime CreatedAt, List<OrderItemResponse> Items)
{
    public static OrderResponse From(Order o) => new(o.Id, o.OrderNumber, o.CustomerName, o.Phone,
        o.Address, o.Total, o.Status, o.CreatedAt, o.Items.Select(i => new OrderItemResponse(
            i.ProductId, i.Sku, i.ProductName, i.ImageUrl, i.UnitPrice, i.Quantity,
            i.UnitPrice * i.Quantity)).ToList());
}
