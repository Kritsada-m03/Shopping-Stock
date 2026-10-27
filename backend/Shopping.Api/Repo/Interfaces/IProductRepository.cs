using Shopping.Api.Entities;

namespace Shopping.Api.Repo.Interfaces;

public interface IProductRepository
{
    Task<List<Product>> GetAllAsync(bool includeInactive = false, string? search = null, string? category = null);
    Task<Product?> GetByIdAsync(int id);
    void Add(Product product);
    Task SaveAsync();
}
