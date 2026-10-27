using Microsoft.AspNetCore.Mvc;
using Shopping.Api.Contracts;
using Shopping.Api.Services;

namespace Shopping.Api.Controllers;

[ApiController]
[Route("api/carts")]
public class CartsController(CartService carts) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<CartResponse>> Create()
    {
        var cart = await carts.CreateAsync();
        return Created($"/api/carts/{cart.Id}", cart);
    }
    [HttpGet("{cartId:guid}")]
    public Task<CartResponse> Get(Guid cartId) => carts.GetAsync(cartId);
    [HttpPost("{cartId:guid}/items")]
    public Task<CartResponse> Add(Guid cartId, AddItemRequest request) =>
        carts.ChangeQuantityAsync(cartId, request.ProductId, request.Quantity, add: true);
    [HttpPut("{cartId:guid}/items/{productId:int}")]
    public Task<CartResponse> Update(Guid cartId, int productId, UpdateQuantityRequest request) =>
        carts.ChangeQuantityAsync(cartId, productId, request.Quantity, add: false);
    [HttpDelete("{cartId:guid}/items/{productId:int}")]
    public async Task<IActionResult> Remove(Guid cartId, int productId)
    {
        await carts.RemoveAsync(cartId, productId);
        return NoContent();
    }
    [HttpDelete("{cartId:guid}/items")]
    public Task<CartResponse> Clear(Guid cartId) => carts.ClearAsync(cartId);
    [HttpPost("{cartId:guid}/checkout")]
    public async Task<ActionResult<OrderResponse>> Checkout(Guid cartId, CheckoutRequest request)
    {
        var order = await carts.CheckoutAsync(cartId, request);
        return Created($"/api/carts/{cartId}/orders/{order.Id}", order);
    }
    [HttpGet("{cartId:guid}/orders")]
    public Task<List<OrderResponse>> Orders(Guid cartId) => carts.GetOrdersAsync(cartId);
    [HttpGet("{cartId:guid}/orders/{orderId:guid}")]
    public Task<OrderResponse> Order(Guid cartId, Guid orderId) => carts.GetOrderAsync(cartId, orderId);
}
