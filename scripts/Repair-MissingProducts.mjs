// Restore a missing or empty Products table from a known local backup; keep current Stocks/orders.
// This is a manual recovery command, not an automatic part of application startup.
// Usage: node scripts/Repair-MissingProducts.mjs path/to/shopping.db path/to/backup.db
import { DatabaseSync, backup } from 'node:sqlite';
import { resolve, dirname, join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';

const [databaseArg, sourceArg] = process.argv.slice(2);
if (!databaseArg || !sourceArg) throw new Error('Provide a database file and a backup file.');
const databasePath = resolve(databaseArg), sourcePath = resolve(sourceArg);
if (databasePath === sourcePath || !existsSync(databasePath) || !existsSync(sourcePath))
  throw new Error('Provide two different existing database files.');

const db = new DatabaseSync(databasePath);
try {
  const tableExists = !!db.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='Products'").get();
  if (tableExists && db.prepare('SELECT COUNT(*) AS count FROM Products').get().count !== 0)
    throw new Error('Products contains data. No data was changed.');
  const source = new DatabaseSync(sourcePath, { readOnly: true });
  try {
    if (!source.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='Products'").get())
      throw new Error('The selected backup does not contain Products.');
  } finally { source.close(); }

  const backupDirectory = join(dirname(databasePath), 'backups');
  mkdirSync(backupDirectory, { recursive: true });
  const snapshotPath = join(backupDirectory, `shopping-before-products-repair-${Date.now()}.db`);
  await backup(db, snapshotPath);
  db.prepare('ATTACH DATABASE ? AS restore_source').run(sourcePath);
  db.exec('PRAGMA foreign_keys = OFF; BEGIN IMMEDIATE;');
  try {
    if (tableExists && db.prepare('SELECT COUNT(*) AS count FROM Products').get().count !== 0)
      throw new Error('Products changed during recovery. No data was changed.');
    if (!tableExists) db.exec(`CREATE TABLE Products (
      Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      Sku TEXT COLLATE NOCASE NOT NULL, Name TEXT NOT NULL, Description TEXT NOT NULL,
      Category TEXT NOT NULL, Price TEXT NOT NULL, ImageUrl TEXT NOT NULL,
      IsActive INTEGER NOT NULL, CreatedAt TEXT NOT NULL, UpdatedAt TEXT NOT NULL,
      RowVersion BLOB NOT NULL,
      CONSTRAINT CK_Products_Price CHECK (CAST(Price AS NUMERIC) > 0)
    );`);
    const hasLegacyStock = db.prepare('PRAGMA table_info(Products)').all().some(c => c.name === 'StockQuantity');
    const extraColumn = hasLegacyStock ? ',StockQuantity' : '';
    db.exec(`INSERT INTO Products (Id,Sku,Name,Description,Category,Price,ImageUrl,IsActive,CreatedAt,UpdatedAt,RowVersion${extraColumn})
    SELECT Id,Sku,Name,Description,Category,Price,ImageUrl,IsActive,CreatedAt,UpdatedAt,RowVersion${extraColumn}
    FROM restore_source.Products;
    CREATE UNIQUE INDEX IF NOT EXISTS IX_Products_Sku ON Products(Sku);`);
    const violations = db.prepare('PRAGMA foreign_key_check').all();
    if (violations.length) throw new Error('Foreign-key check failed; recovery was rolled back.');
    const count = db.prepare('SELECT COUNT(*) AS count FROM Products').get().count;
    db.exec('COMMIT;');
    console.log(JSON.stringify({ restoredProducts: count, backup: snapshotPath }));
  } catch (error) { db.exec('ROLLBACK;'); throw error; }
  finally { db.exec('PRAGMA foreign_keys = ON; DETACH DATABASE restore_source;'); }
} finally { db.close(); }
