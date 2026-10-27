using Shopping.Api.Contracts;
using Shopping.Api.Entities;
using Shopping.Api.Repo.Interfaces;

namespace Shopping.Api.Services;

public class CartService(ICartRepository carts, IProductRepository products)
{
    public async Task<CartResponse> CreateAsync()
    {
        var cart = new Cart();
        carts.Add(cart);
        await carts.SaveAsync();
        return await GetAsync(cart.Id);
    }
    public async Task<CartResponse> GetAsync(Guid cartId)
    {
        await EnsureExistsAsync(cartId);
        var rows = await carts.GetItemsAsync(cartId);
        var items = rows.Select(i => new CartItemResponse(i.ProductId, i.Product.Sku,
            i.Product.Name, i.Product.ImageUrl, i.Product.Price, i.Quantity,
            i.Product.Stock.Quantity, i.Product.IsActive,
            i.Product.IsActive && i.Quantity <= i.Product.Stock.Quantity,
            i.Product.Price * i.Quantity)).ToList();
        return new CartResponse(cartId, items, items.Sum(i => i.Quantity),
            items.Sum(i => i.Subtotal), items.Count > 0 && items.All(i => i.IsAvailable));
    }
    private async Task EnsureExistsAsync(Guid cartId)
    {
        if (!await carts.ExistsAsync(cartId))
            throw new ApiException(404, "ไม่พบตะกร้านี้ กรุณาโหลดหน้าใหม่");
    }
    public async Task<CartResponse> ChangeQuantityAsync(Guid cartId, int productId, int quantity, bool add)
    {
        // SQLite's non-deferred write transaction makes other writers wait before reading.
        await using var transaction = await carts.BeginTransactionAsync();
        await EnsureExistsAsync(cartId);
        var product = await products.GetByIdAsync(productId);
        if (product is null || !product.IsActive) throw new ApiException(404, "สินค้านี้ไม่พร้อมจำหน่าย");
        var item = await carts.FindItemAsync(cartId, productId);
        if (!add && item is null) throw new ApiException(404, "ไม่พบสินค้าในตะกร้า");
        var newQuantity = add ? (long)(item?.Quantity ?? 0) + quantity : quantity;
        // Let the customer reduce a stale cart in steps, even if it still exceeds new stock.
        if (newQuantity > product.Stock.Quantity && (item is null || newQuantity >= item.Quantity))
            throw new ApiException(409, $"{product.Name} มีเหลือ {product.Stock.Quantity} ชิ้น (รวมจำนวนที่อยู่ในตะกร้าแล้ว)");
        if (item is null)
            carts.AddItem(new CartItem { CartId = cartId, ProductId = productId, Quantity = (int)newQuantity });
        else item.Quantity = (int)newQuantity;
        await carts.SaveAsync();
        await transaction.CommitAsync();
        return await GetAsync(cartId);
    }
    public async Task RemoveAsync(Guid cartId, int productId)
    {
        await using var transaction = await carts.BeginTransactionAsync();
        await EnsureExistsAsync(cartId);
        await carts.RemoveItemAsync(cartId, productId);
        await transaction.CommitAsync();
    }
    public async Task<CartResponse> ClearAsync(Guid cartId)
    {
        await using var transaction = await carts.BeginTransactionAsync();
        await EnsureExistsAsync(cartId);
        await carts.ClearItemsAsync(cartId);
        await transaction.CommitAsync();
        // Stock is deducted at checkout only. Clearing a cart must not add stock back.
        return await GetAsync(cartId);
    }
    public async Task<OrderResponse> CheckoutAsync(Guid cartId, CheckoutRequest request)
    {
        await using var transaction = await carts.BeginTransactionAsync();
        await EnsureExistsAsync(cartId);
        var items = await carts.GetItemsAsync(cartId);
        if (items.Count == 0) throw new ApiException(409, "ตะกร้ายังไม่มีสินค้า หรือคำสั่งซื้อนี้ได้รับการยืนยันไปแล้ว");
        var order = new Order
        {
            CartId = cartId, OrderNumber = $"SP-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid():N}",
            CustomerName = request.CustomerName.Trim(), Phone = request.Phone, Address = request.Address.Trim()
        };
        foreach (var item in items)
        {
            var product = item.Product;
            if (!product.IsActive || product.Stock.Quantity < item.Quantity)
                throw new ApiException(409, $"{product.Name} มีสินค้าไม่พอ (เหลือ {product.Stock.Quantity} ชิ้น) กรุณาปรับตะกร้า");
            product.Stock.Quantity -= item.Quantity;
            product.UpdatedAt = DateTime.UtcNow;
            order.Items.Add(new OrderItem
            {
                ProductId = product.Id, Sku = product.Sku, ProductName = product.Name,
                ImageUrl = product.ImageUrl, UnitPrice = product.Price, Quantity = item.Quantity
            });
        }
        order.Total = order.Items.Sum(i => i.UnitPrice * i.Quantity);
        carts.AddOrder(order);
        carts.RemoveItems(items);
        // Stock, order, and clearing the cart succeed or roll back as one unit.
        await carts.SaveAsync();
        await transaction.CommitAsync();
        return OrderResponse.From(order);
    }
    public async Task<List<OrderResponse>> GetOrdersAsync(Guid cartId)
    {
        await EnsureExistsAsync(cartId);
        return (await carts.GetOrdersAsync(cartId)).Select(OrderResponse.From).ToList();
    }
    public async Task<OrderResponse> GetOrderAsync(Guid cartId, Guid orderId)
    {
        var order = await carts.GetOrderAsync(cartId, orderId) ?? throw new ApiException(404, "ไม่พบคำสั่งซื้อ");
        return OrderResponse.From(order);
    }
}
