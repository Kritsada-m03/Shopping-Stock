using Microsoft.EntityFrameworkCore.Storage;
using Shopping.Api.Entities;

namespace Shopping.Api.Repo.Interfaces;

public interface ICartRepository
{
    Task<bool> ExistsAsync(Guid cartId);
    void Add(Cart cart);
    Task<List<CartItem>> GetItemsAsync(Guid cartId);
    Task<CartItem?> FindItemAsync(Guid cartId, int productId);
    void AddItem(CartItem item);
    Task RemoveItemAsync(Guid cartId, int productId);
    Task ClearItemsAsync(Guid cartId);
    void RemoveItems(IEnumerable<CartItem> items);
    void AddOrder(Order order);
    Task<List<Order>> GetOrdersAsync(Guid cartId);
    Task<Order?> GetOrderAsync(Guid cartId, Guid orderId);
    Task SaveAsync();
    Task<IDbContextTransaction> BeginTransactionAsync();
}
