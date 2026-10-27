using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace Shopping.Api.Data;

// One-time upgrade for the first version, which stored StockQuantity in Products.
// New databases already have the correct schema and skip this entirely.
public static class LegacyStockMigration
{
    public static async Task ApplyAsync(ShoppingDbContext db)
    {
        await db.Database.OpenConnectionAsync();
        var connection = (SqliteConnection)db.Database.GetDbConnection();
        try
        {
            var legacy = false;
            using (var inspect = connection.CreateCommand())
            {
                inspect.CommandText = "PRAGMA table_info(Products);";
                await using var columns = await inspect.ExecuteReaderAsync();
                while (await columns.ReadAsync())
                    if (columns.GetString(1) == "StockQuantity") legacy = true;
            }
            if (!legacy) return;

            // SQLite's backup API includes committed WAL data, unlike copying the db file.
            var backupDirectory = Path.Combine(Path.GetDirectoryName(connection.DataSource)!, "backups");
            Directory.CreateDirectory(backupDirectory);
            var backupPath = Path.Combine(backupDirectory, $"shopping-before-stock-split-{DateTime.UtcNow:yyyyMMddHHmmssfff}.db");
            using (var backup = new SqliteConnection(new SqliteConnectionStringBuilder { DataSource = backupPath }.ToString()))
            {
                await backup.OpenAsync();
                connection.BackupDatabase(backup);
            }

            // SQLite requires table rebuilding to remove the old column/check constraint.
            // Disable FK enforcement only on this connection and verify every FK before commit.
            using var command = connection.CreateCommand();
            command.CommandText = "PRAGMA foreign_keys = OFF;";
            await command.ExecuteNonQueryAsync();
            try
            {
                await using var transaction = (SqliteTransaction)await connection.BeginTransactionAsync();
                command.Transaction = transaction;
                command.CommandText = """
                    CREATE TABLE Products_new (
                        Id INTEGER NOT NULL CONSTRAINT PK_Products PRIMARY KEY AUTOINCREMENT,
                        Sku TEXT COLLATE NOCASE NOT NULL,
                        Name TEXT NOT NULL,
                        Description TEXT NOT NULL,
                        Category TEXT NOT NULL,
                        Price TEXT NOT NULL,
                        ImageUrl TEXT NOT NULL,
                        IsActive INTEGER NOT NULL,
                        CreatedAt TEXT NOT NULL,
                        UpdatedAt TEXT NOT NULL,
                        RowVersion BLOB NOT NULL,
                        CONSTRAINT CK_Products_Price CHECK (CAST(Price AS NUMERIC) > 0)
                    );
                    INSERT INTO Products_new
                        (Id, Sku, Name, Description, Category, Price, ImageUrl, IsActive, CreatedAt, UpdatedAt, RowVersion)
                    SELECT Id, Sku, Name, Description, Category, Price, ImageUrl, IsActive, CreatedAt, UpdatedAt, RowVersion
                    FROM Products;
                    CREATE TABLE IF NOT EXISTS Stocks (
                        ProductId INTEGER NOT NULL CONSTRAINT PK_Stocks PRIMARY KEY,
                        Quantity INTEGER NOT NULL,
                        CONSTRAINT CK_Stocks_Quantity CHECK (Quantity >= 0),
                        CONSTRAINT FK_Stocks_Products_ProductId FOREIGN KEY (ProductId) REFERENCES Products(Id) ON DELETE CASCADE
                    );
                    INSERT OR IGNORE INTO Stocks (ProductId, Quantity) SELECT Id, StockQuantity FROM Products;
                    DROP TABLE Products;
                    ALTER TABLE Products_new RENAME TO Products;
                    CREATE UNIQUE INDEX IX_Products_Sku ON Products(Sku);
                    """;
                await command.ExecuteNonQueryAsync();
                command.CommandText = "PRAGMA foreign_key_check;";
                await using (var violations = await command.ExecuteReaderAsync())
                {
                    if (await violations.ReadAsync())
                        throw new InvalidOperationException("Stock migration found an invalid foreign key. Changes were rolled back.");
                }
                await transaction.CommitAsync();
            }
            finally
            {
                command.Transaction = null;
                command.CommandText = "PRAGMA foreign_keys = ON;";
                await command.ExecuteNonQueryAsync();
            }
        }
        finally { await db.Database.CloseConnectionAsync(); }
    }
}
