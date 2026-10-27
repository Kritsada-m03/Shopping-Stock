using Microsoft.AspNetCore.Mvc;
using Shopping.Api.Contracts;
using Shopping.Api.Services;

namespace Shopping.Api.Controllers;

[ApiController]
[Route("api/login")]
public class MockLoginController(MockLoginService login) : ControllerBase
{
    [HttpPost]
    public ActionResult<MockUserResponse> Login(MockLoginRequest request) => Ok(login.Login(request));
}
