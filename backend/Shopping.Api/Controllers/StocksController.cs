using Microsoft.AspNetCore.Mvc;
using Shopping.Api.Contracts;
using Shopping.Api.Services;

namespace Shopping.Api.Controllers;

[ApiController]
[Route("api/stocks")]
public class StocksController(ProductService products) : ControllerBase
{
    [HttpGet]
    public Task<List<StockResponse>> GetAll() => products.GetStocksAsync();
}
