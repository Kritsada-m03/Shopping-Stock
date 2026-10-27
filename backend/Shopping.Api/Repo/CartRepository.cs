using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Shopping.Api.Data;
using Shopping.Api.Entities;
using Shopping.Api.Repo.Interfaces;

namespace Shopping.Api.Repo;

public class CartRepository(ShoppingDbContext db) : ICartRepository
{
    public Task<bool> ExistsAsync(Guid cartId) => db.Carts.AnyAsync(c => c.Id == cartId);
    public void Add(Cart cart) => db.Carts.Add(cart);
    public Task<List<CartItem>> GetItemsAsync(Guid cartId) =>
        db.CartItems.Include(i => i.Product).ThenInclude(p => p.Stock)
            .Where(i => i.CartId == cartId).OrderBy(i => i.ProductId).ToListAsync();
    public Task<CartItem?> FindItemAsync(Guid cartId, int productId) =>
        db.CartItems.SingleOrDefaultAsync(i => i.CartId == cartId && i.ProductId == productId);
    public void AddItem(CartItem item) => db.CartItems.Add(item);
    public Task RemoveItemAsync(Guid cartId, int productId) =>
        db.CartItems.Where(i => i.CartId == cartId && i.ProductId == productId).ExecuteDeleteAsync();
    public Task ClearItemsAsync(Guid cartId) =>
        db.CartItems.Where(i => i.CartId == cartId).ExecuteDeleteAsync();
    public void RemoveItems(IEnumerable<CartItem> items) => db.CartItems.RemoveRange(items);
    public void AddOrder(Order order) => db.Orders.Add(order);
    public Task<List<Order>> GetOrdersAsync(Guid cartId) =>
        db.Orders.AsNoTracking().Include(o => o.Items).Where(o => o.CartId == cartId)
            .OrderByDescending(o => o.CreatedAt).ToListAsync();
    public Task<Order?> GetOrderAsync(Guid cartId, Guid orderId) =>
        db.Orders.AsNoTracking().Include(o => o.Items)
            .SingleOrDefaultAsync(o => o.Id == orderId && o.CartId == cartId);
    public Task SaveAsync() => db.SaveChangesAsync();
    public Task<IDbContextTransaction> BeginTransactionAsync() => db.Database.BeginTransactionAsync();
}
