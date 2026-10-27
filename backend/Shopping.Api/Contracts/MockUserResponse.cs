namespace Shopping.Api.Contracts;

// Demo profile only. This is not an authentication token or a database entity.
public record MockUserResponse(string Id, string DisplayName, string Role, string? Phone);
