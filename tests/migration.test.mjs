import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

test('existing SQLite products, stock, carts and orders survive migration; rerunning is safe', () => verifyMigration(false));
test('legacy product migration preserves an existing Stocks table and its current quantities', () => verifyMigration(true));

function verifyMigration(existingStocks) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const artifactDir = resolve(root, '.artifacts');
  mkdirSync(artifactDir, { recursive: true });
  const dbPath = resolve(artifactDir, `legacy-${Date.now()}.db`);
  const legacy = new DatabaseSync(dbPath);
  legacy.exec(readFileSync(resolve(root, 'tests/fixtures/legacy-schema.sql'), 'utf8'));
  if (existingStocks) {
    legacy.exec(`CREATE TABLE Stocks (
      ProductId INTEGER NOT NULL PRIMARY KEY REFERENCES Products(Id) ON DELETE CASCADE,
      Quantity INTEGER NOT NULL CHECK (Quantity >= 0)
    ); INSERT INTO Stocks VALUES (10, 4);`);
  }
  const productsBefore = legacy.prepare('SELECT Id, Sku, Name, Price, IsActive, RowVersion FROM Products ORDER BY Id').all();
  const stockBefore = legacy.prepare('SELECT Id AS ProductId, StockQuantity AS Quantity FROM Products ORDER BY Id').all();
  if (existingStocks) stockBefore.find(s => s.ProductId === 10).Quantity = 4;
  const cartsBefore = legacy.prepare('SELECT * FROM CartItems').all();
  const ordersBefore = legacy.prepare('SELECT * FROM Orders').all();
  const itemsBefore = legacy.prepare('SELECT * FROM OrderItems').all();
  legacy.close();

  const initialize = () => {
    const result = spawnSync('dotnet', [resolve(root, 'backend/Shopping.Api/bin/Debug/net10.0/Shopping.Api.dll'), '--init-db'], {
      cwd: resolve(root, 'backend/Shopping.Api'), encoding: 'utf8', windowsHide: true, timeout: 30_000,
      env: { ...process.env, ConnectionStrings__ShoppingDb: `Data Source=${dbPath};Foreign Keys=True` },
    });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  };
  initialize();
  initialize();
  const db = new DatabaseSync(dbPath);
  try {
    assert.deepEqual(db.prepare('SELECT Id, Sku, Name, Price, IsActive, RowVersion FROM Products ORDER BY Id').all(), productsBefore);
    assert.deepEqual(db.prepare('SELECT ProductId, Quantity FROM Stocks ORDER BY ProductId').all(), stockBefore);
    assert.deepEqual(db.prepare('SELECT * FROM CartItems').all(), cartsBefore);
    assert.deepEqual(db.prepare('SELECT * FROM Orders').all(), ordersBefore);
    assert.deepEqual(db.prepare('SELECT * FROM OrderItems').all(), itemsBefore);
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    assert.ok(!db.prepare('PRAGMA table_info(Products)').all().some(c => c.name === 'StockQuantity'));
    assert.throws(() => db.exec('UPDATE Stocks SET Quantity = -1 WHERE ProductId = 10'), /CHECK constraint/);
    assert.ok(readdirSync(resolve(artifactDir, 'backups')).some(f => f.startsWith('shopping-before-stock-split-')));
  } finally { db.close(); }
}
