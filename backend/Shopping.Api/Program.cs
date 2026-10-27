using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Shopping.Api.Data;
using Shopping.Api.Services;
using Shopping.Api.Repo;
using Shopping.Api.Repo.Interfaces;

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true)
    .AddEnvironmentVariables();

// Resolve relative paths against the API project so DBeaver always opens the same file.
var connection = new SqliteConnectionStringBuilder(builder.Configuration.GetConnectionString("ShoppingDb"));
connection.DataSource = Path.GetFullPath(connection.DataSource, builder.Environment.ContentRootPath);
Directory.CreateDirectory(Path.GetDirectoryName(connection.DataSource)!);
builder.Services.AddDbContext<ShoppingDbContext>(options => options.UseSqlite(connection.ToString()));
builder.Services.AddScoped<CartService>();
builder.Services.AddScoped<ProductService>();
builder.Services.AddScoped<MockLoginService>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<ICartRepository, CartRepository>();
builder.Services.AddControllers().ConfigureApiBehaviorOptions(options =>
{
    options.InvalidModelStateResponseFactory = context => new BadRequestObjectResult(new
    {
        message = "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบช่องที่กรอก",
        errors = context.ModelState.Where(x => x.Value?.Errors.Count > 0)
            .ToDictionary(x => x.Key, x => x.Value!.Errors.Select(e => e.ErrorMessage).ToArray())
    });
});
builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    policy.WithOrigins(builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? [])
        .AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();
app.Use(async (context, next) =>
{
    try { await next(context); }
    catch (Exception exception)
    {
        var (status, message) = exception switch
        {
            ApiException e => (e.StatusCode, e.Message),
            DbUpdateConcurrencyException => (409, "ข้อมูลเปลี่ยนแปลงระหว่างทำรายการ กรุณาโหลดใหม่แล้วลองอีกครั้ง"),
            DbUpdateException { InnerException: SqliteException { SqliteExtendedErrorCode: 2067 or 1555 } } =>
                (409, "รหัสสินค้านี้ถูกใช้แล้ว กรุณาใช้รหัสอื่น"),
            SqliteException { SqliteErrorCode: 5 or 6 } => (409, "ฐานข้อมูลกำลังทำรายการอื่น กรุณาลองอีกครั้ง"),
            _ => (500, "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ กรุณาลองอีกครั้ง")
        };
        if (status == 500) app.Logger.LogError(exception, "Unhandled API error");
        context.Response.StatusCode = status;
        await context.Response.WriteAsJsonAsync(new { message });
    }
});
app.UseCors();
app.MapControllers();
app.MapGet("/api/health", async (ShoppingDbContext db) =>
    await db.Database.CanConnectAsync()
        ? Results.Ok(new { status = "ok", database = "SQLite" })
        : Results.Json(new { status = "unavailable" }, statusCode: 503));

using (var scope = app.Services.CreateScope())
{
    try { await SeedData.InitializeAsync(scope.ServiceProvider.GetRequiredService<ShoppingDbContext>()); }
    catch (Exception exception)
    {
        app.Logger.LogCritical(exception,
            "Cannot initialize shopping.db. Check the database path and file permissions.");
        throw;
    }
}

app.Logger.LogInformation("SQLite database: {DatabasePath}", connection.DataSource);
if (args.Contains("--init-db")) return;
app.Run();
