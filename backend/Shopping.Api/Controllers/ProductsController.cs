using Microsoft.AspNetCore.Mvc;
using Shopping.Api.Contracts;
using Shopping.Api.Services;

namespace Shopping.Api.Controllers;

[ApiController]
[Route("api/products")]
public class ProductsController(ProductService products) : ControllerBase
{
    [HttpGet]
    public Task<List<ProductResponse>> GetAll([FromQuery] string? search, [FromQuery] string? category) =>
        products.GetAllAsync(search: search, category: category);
    [HttpGet("{id:int}")]
    public Task<ProductResponse> Get(int id) => products.GetAsync(id);
    [HttpGet("/api/admin/products")]
    public Task<List<ProductResponse>> GetAdmin() => products.GetAllAsync(includeInactive: true);
    [HttpPost("/api/admin/products")]
    public async Task<ActionResult<ProductResponse>> Create(ProductRequest request)
    {
        var product = await products.CreateAsync(request);
        return Created($"/api/products/{product.Id}", product);
    }
    [HttpPut("/api/admin/products/{id:int}")]
    public Task<ProductResponse> Update(int id, ProductRequest request) => products.UpdateAsync(id, request);
    [HttpDelete("/api/admin/products/{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await products.DeleteAsync(id);
        return NoContent();
    }
}
