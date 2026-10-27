using Shopping.Api.Contracts;
using Shopping.Api.Entities;
using Shopping.Api.Repo.Interfaces;

namespace Shopping.Api.Services;

public class ProductService(IProductRepository products)
{
    public async Task<List<ProductResponse>> GetAllAsync(bool includeInactive = false, string? search = null, string? category = null) =>
        (await products.GetAllAsync(includeInactive, search, category)).Select(ProductResponse.From).ToList();
    public async Task<ProductResponse> GetAsync(int id)
    {
        var product = await products.GetByIdAsync(id);
        if (product is null || !product.IsActive) throw new ApiException(404, "ไม่พบสินค้า");
        return ProductResponse.From(product);
    }
    public async Task<List<StockResponse>> GetStocksAsync() =>
        (await products.GetAllAsync()).Select(p => new StockResponse(p.Id, p.Sku, p.Stock.Quantity)).ToList();

    public async Task<ProductResponse> CreateAsync(ProductRequest request)
    {
        ValidatePrice(request.Price);
        var product = new Product();
        Apply(product, request);
        products.Add(product);
        await products.SaveAsync();
        return ProductResponse.From(product);
    }
    public async Task<ProductResponse> UpdateAsync(int id, ProductRequest request)
    {
        ValidatePrice(request.Price);
        var product = await products.GetByIdAsync(id) ?? throw new ApiException(404, "ไม่พบสินค้า");
        if (request.RowVersion != Convert.ToBase64String(product.RowVersion))
            throw new ApiException(409, "ข้อมูลสินค้ามีการเปลี่ยนแปลง กรุณาเปิดฟอร์มแก้ไขใหม่");
        Apply(product, request);
        await products.SaveAsync();
        return ProductResponse.From(product);
    }
    public async Task DeleteAsync(int id)
    {
        var product = await products.GetByIdAsync(id) ?? throw new ApiException(404, "ไม่พบสินค้า");
        product.IsActive = false;
        product.UpdatedAt = DateTime.UtcNow;
        await products.SaveAsync();
    }
    private static void ValidatePrice(decimal price)
    {
        if (decimal.Round(price, 2) != price)
            throw new ApiException(400, "ราคาต้องมีทศนิยมไม่เกิน 2 ตำแหน่ง");
    }
    private static void Apply(Product product, ProductRequest request)
    {
        product.Sku = request.Sku.Trim().ToUpperInvariant();
        product.Name = request.Name.Trim();
        product.Description = request.Description.Trim();
        product.Category = request.Category.Trim();
        product.Price = request.Price;
        product.Stock.Quantity = request.StockQuantity;
        product.ImageUrl = request.ImageUrl.Trim();
        product.IsActive = request.IsActive;
        product.UpdatedAt = DateTime.UtcNow;
    }
}
