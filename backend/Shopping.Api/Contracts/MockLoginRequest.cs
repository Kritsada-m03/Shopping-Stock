using System.ComponentModel.DataAnnotations;

namespace Shopping.Api.Contracts;

public class MockLoginRequest
{
    [Required, RegularExpression("^(Admin|User)$")]
    public string AccountType { get; set; } = "User";

    [Required, StringLength(30)]
    public string Identifier { get; set; } = "";

    [Required, StringLength(100)]
    public string Password { get; set; } = "";
}
