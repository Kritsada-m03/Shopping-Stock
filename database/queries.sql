-- Open backend/Shopping.Api/App_Data/shopping.db in DBeaver (SQLite).
-- Run one SELECT at a time with Ctrl+Enter.

SELECT p.Id, p.Sku, p.Name, p.Category, p.Price, s.Quantity AS StockQuantity, p.IsActive
FROM Products AS p
JOIN Stocks AS s ON s.ProductId = p.Id
ORDER BY p.Id;

-- Low / out-of-stock products
SELECT p.Sku, p.Name, s.Quantity
FROM Products AS p
JOIN Stocks AS s ON s.ProductId = p.Id
WHERE p.IsActive = 1 AND s.Quantity <= 5;

-- Orders and their original price snapshots
SELECT o.OrderNumber, o.CustomerName, o.Total, o.Status, o.CreatedAt,
       i.Sku, i.ProductName, i.UnitPrice, i.Quantity
FROM Orders AS o
JOIN OrderItems AS i ON i.OrderId = o.Id
ORDER BY o.CreatedAt DESC;

-- Current carts
SELECT c.CartId, p.Sku, p.Name, c.Quantity AS CartQuantity, s.Quantity AS StockQuantity
FROM CartItems AS c
JOIN Products AS p ON p.Id = c.ProductId
JOIN Stocks AS s ON s.ProductId = p.Id;

-- Example: select and run this separately to restock the speaker.
-- BEGIN;
-- UPDATE Stocks SET Quantity = 10
-- WHERE ProductId = (SELECT Id FROM Products WHERE Sku = 'EL-002');
-- UPDATE Products SET UpdatedAt = datetime('now'), RowVersion = randomblob(16)
-- WHERE Sku = 'EL-002';
-- COMMIT;
