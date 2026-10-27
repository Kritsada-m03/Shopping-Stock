using Microsoft.EntityFrameworkCore;
using Shopping.Api.Entities;

namespace Shopping.Api.Data;

public class ShoppingDbContext(DbContextOptions<ShoppingDbContext> options) : DbContext(options)
{
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Stock> Stocks => Set<Stock>();
    public DbSet<Cart> Carts => Set<Cart>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder model)
    {
        var product = model.Entity<Product>();
        product.ToTable("Products", t =>
        {
            t.HasCheckConstraint("CK_Products_Price", "CAST([Price] AS NUMERIC) > 0");
        });
        product.HasIndex(p => p.Sku).IsUnique();
        product.Property(p => p.Sku).UseCollation("NOCASE");
        product.Property(p => p.Sku).HasMaxLength(30);
        product.Property(p => p.Name).HasMaxLength(160);
        product.Property(p => p.Description).HasMaxLength(1200);
        product.Property(p => p.Category).HasMaxLength(60);
        product.Property(p => p.ImageUrl).HasMaxLength(1000);
        product.Property(p => p.Price).HasPrecision(18, 2);
        product.Property(p => p.RowVersion).IsConcurrencyToken();

        var stock = model.Entity<Stock>();
        stock.ToTable("Stocks", t => t.HasCheckConstraint("CK_Stocks_Quantity", "[Quantity] >= 0"));
        stock.HasKey(s => s.ProductId);
        stock.HasOne(s => s.Product).WithOne(p => p.Stock)
            .HasForeignKey<Stock>(s => s.ProductId).OnDelete(DeleteBehavior.Cascade);

        var cartItem = model.Entity<CartItem>();
        cartItem.ToTable("CartItems", t => t.HasCheckConstraint("CK_CartItems_Quantity", "[Quantity] > 0"));
        cartItem.HasIndex(i => new { i.CartId, i.ProductId }).IsUnique();
        cartItem.HasOne(i => i.Cart).WithMany().HasForeignKey(i => i.CartId).OnDelete(DeleteBehavior.Cascade);
        cartItem.HasOne(i => i.Product).WithMany().HasForeignKey(i => i.ProductId).OnDelete(DeleteBehavior.Restrict);

        var order = model.Entity<Order>();
        order.HasIndex(o => o.OrderNumber).IsUnique();
        order.Property(o => o.OrderNumber).HasMaxLength(50);
        order.Property(o => o.CustomerName).HasMaxLength(120);
        order.Property(o => o.Phone).HasMaxLength(10);
        order.Property(o => o.Address).HasMaxLength(600);
        order.Property(o => o.Status).HasMaxLength(30);
        order.Property(o => o.Total).HasPrecision(18, 2);
        order.HasOne(o => o.Cart).WithMany().HasForeignKey(o => o.CartId).OnDelete(DeleteBehavior.Restrict);

        var orderItem = model.Entity<OrderItem>();
        orderItem.ToTable("OrderItems", t => t.HasCheckConstraint("CK_OrderItems_Quantity", "[Quantity] > 0"));
        orderItem.Property(i => i.Sku).HasMaxLength(30);
        orderItem.Property(i => i.ProductName).HasMaxLength(160);
        orderItem.Property(i => i.ImageUrl).HasMaxLength(1000);
        orderItem.Property(i => i.UnitPrice).HasPrecision(18, 2);
        orderItem.HasOne(i => i.Order).WithMany(o => o.Items).HasForeignKey(i => i.OrderId);
        orderItem.HasOne(i => i.Product).WithMany().HasForeignKey(i => i.ProductId).OnDelete(DeleteBehavior.Restrict);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // SQLite has no SQL Server rowversion type, so the application creates its own token.
        foreach (var entry in ChangeTracker.Entries<Product>()
            .Where(e => e.State is EntityState.Added or EntityState.Modified))
        {
            entry.Entity.RowVersion = Guid.NewGuid().ToByteArray();
            entry.Entity.UpdatedAt = DateTime.UtcNow;
        }
        return base.SaveChangesAsync(cancellationToken);
    }
}
