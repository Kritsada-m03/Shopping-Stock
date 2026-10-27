using Microsoft.EntityFrameworkCore;
using Shopping.Api.Data;
using Shopping.Api.Entities;
using Shopping.Api.Repo.Interfaces;

namespace Shopping.Api.Repo;

public class ProductRepository(ShoppingDbContext db) : IProductRepository
{
    public async Task<List<Product>> GetAllAsync(bool includeInactive = false, string? search = null, string? category = null)
    {
        var query = db.Products.AsNoTracking().Include(p => p.Stock).AsQueryable();
        if (!includeInactive) query = query.Where(p => p.IsActive);
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(p => p.Name.Contains(search) || p.Sku.Contains(search));
        if (!string.IsNullOrWhiteSpace(category)) query = query.Where(p => p.Category == category);
        return await query.OrderBy(p => p.Id).ToListAsync();
    }

    public Task<Product?> GetByIdAsync(int id) =>
        db.Products.Include(p => p.Stock).SingleOrDefaultAsync(p => p.Id == id);
    public void Add(Product product) => db.Products.Add(product);
    public Task SaveAsync() => db.SaveChangesAsync();
}
