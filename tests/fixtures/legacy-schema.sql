-- First-version schema, used only to verify that existing user data survives upgrading.
PRAGMA foreign_keys = ON;
CREATE TABLE Products (
  Id INTEGER PRIMARY KEY AUTOINCREMENT, Sku TEXT COLLATE NOCASE NOT NULL,
  Name TEXT NOT NULL, Description TEXT NOT NULL, Category TEXT NOT NULL,
  Price TEXT NOT NULL, StockQuantity INTEGER NOT NULL CHECK (StockQuantity >= 0),
  ImageUrl TEXT NOT NULL, IsActive INTEGER NOT NULL,
  CreatedAt TEXT NOT NULL, UpdatedAt TEXT NOT NULL, RowVersion BLOB NOT NULL
);
CREATE UNIQUE INDEX IX_Products_Sku ON Products(Sku);
CREATE TABLE Carts (Id TEXT PRIMARY KEY, CreatedAt TEXT NOT NULL);
CREATE TABLE CartItems (
  Id INTEGER PRIMARY KEY AUTOINCREMENT, CartId TEXT NOT NULL REFERENCES Carts(Id) ON DELETE CASCADE,
  ProductId INTEGER NOT NULL REFERENCES Products(Id) ON DELETE RESTRICT,
  Quantity INTEGER NOT NULL CHECK (Quantity > 0)
);
CREATE UNIQUE INDEX IX_CartItems_CartId_ProductId ON CartItems(CartId, ProductId);
CREATE TABLE Orders (
  Id TEXT PRIMARY KEY, OrderNumber TEXT NOT NULL UNIQUE,
  CartId TEXT NOT NULL REFERENCES Carts(Id) ON DELETE RESTRICT,
  CustomerName TEXT NOT NULL, Phone TEXT NOT NULL, Address TEXT NOT NULL,
  Total TEXT NOT NULL, Status TEXT NOT NULL, CreatedAt TEXT NOT NULL
);
CREATE TABLE OrderItems (
  Id INTEGER PRIMARY KEY AUTOINCREMENT, OrderId TEXT NOT NULL REFERENCES Orders(Id) ON DELETE CASCADE,
  ProductId INTEGER NOT NULL REFERENCES Products(Id) ON DELETE RESTRICT,
  Sku TEXT NOT NULL, ProductName TEXT NOT NULL, ImageUrl TEXT NOT NULL,
  UnitPrice TEXT NOT NULL, Quantity INTEGER NOT NULL CHECK (Quantity > 0)
);
INSERT INTO Products VALUES (10, 'OLD-001', 'Existing product', 'Keep this description', 'Existing category',
  '12.50', 9, '/products/mug.svg', 1, '2026-10-01 00:00:00', '2026-10-02 00:00:00', randomblob(16));
INSERT INTO Products VALUES (20, 'OLD-002', 'Existing sold-out product', 'Keep this too', 'Existing category',
  '29.90', 0, '/products/tote.svg', 0, '2026-10-01 00:00:00', '2026-10-02 00:00:00', randomblob(16));
INSERT INTO Carts VALUES ('00000000-0000-0000-0000-000000000001', '2026-10-02 00:00:00');
INSERT INTO CartItems VALUES (1, '00000000-0000-0000-0000-000000000001', 10, 2);
INSERT INTO Orders VALUES ('00000000-0000-0000-0000-000000000002', 'EXISTING-ORDER',
 '00000000-0000-0000-0000-000000000001', 'Existing customer', '0812345678', 'Existing address', '12.50', 'Pending', '2026-10-02 00:00:00');
INSERT INTO OrderItems VALUES (1, '00000000-0000-0000-0000-000000000002', 10, 'OLD-001',
 'Original order name', '/products/mug.svg', '12.50', 1);
