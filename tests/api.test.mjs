// Real HTTP requests + a separate real SQLite file. No mocked stock checks.
// Run from the repo root: dotnet build backend/Shopping.Api
//                         node --test tests/api.test.mjs
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let base;
let server;
let logs = '';
let sequence = 0;
const customer = { customerName: 'Test Customer', phone: '0812345678', address: '123 Test Road, Bangkok 10110' };

before(async () => {
  await mkdir(resolve(root, '.artifacts'), { recursive: true });
  const probe = createServer();
  await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  base = `http://127.0.0.1:${port}/api`;
  server = spawn('dotnet', [resolve(root, 'backend/Shopping.Api/bin/Debug/net10.0/Shopping.Api.dll')], {
    cwd: resolve(root, 'backend/Shopping.Api'),
    windowsHide: true,
    env: { ...process.env, ASPNETCORE_URLS: `http://127.0.0.1:${port}`,
      ASPNETCORE_ENVIRONMENT: 'Development',
      ConnectionStrings__ShoppingDb: `Data Source=${resolve(root, '.artifacts', `test-${Date.now()}.db`)};Foreign Keys=True;Default Timeout=15` },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', chunk => { logs += chunk; });
  server.stderr.on('data', chunk => { logs += chunk; });
  server.on('error', error => { logs += error.message; });
  for (let attempt = 0; attempt < 100; attempt++) {
    try { if ((await fetch(`${base}/health`)).ok) return; } catch { /* starting */ }
    if (server.exitCode !== null) break;
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  throw new Error(`Test API did not start. Build the API first.\n${logs}`);
});

after(async () => {
  if (!server || server.exitCode !== null) return;
  const stopped = new Promise(resolve => server.once('exit', resolve));
  server.kill();
  await stopped;
});

async function request(path, method = 'GET', body, expected = 200) {
  const response = await fetch(`${base}${path}`, {
    method, headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = response.status === 204 ? null : await response.json();
  assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(result)}`);
  return result;
}

async function product(stock = 5, price = 100) {
  return request('/admin/products', 'POST', {
    sku: `TEST-${++sequence}`, name: `Test product ${sequence}`, description: 'Integration test product',
    category: 'Test', price, stockQuantity: stock, imageUrl: '/products/placeholder.svg', isActive: true,
  }, 201);
}
const cart = () => request('/carts', 'POST', undefined, 201);
const add = (c, p, quantity, expected = 200) => request(`/carts/${c.id}/items`, 'POST', { productId: p.id, quantity }, expected);
const getProduct = p => request(`/products/${p.id}`);
const checkout = (c, expected = 201) => request(`/carts/${c.id}/checkout`, 'POST', customer, expected);

test('SQLite starts with 8 seeded products and an out-of-stock example', async () => {
  assert.equal((await request('/health')).database, 'SQLite');
  const products = await request('/products');
  assert.equal(products.length, 8);
  assert.ok(products.some(p => p.stockQuantity === 0));
  const stocks = await request('/stocks');
  assert.equal(stocks.length, 8);
  for (const p of products) {
    const stock = stocks.find(s => s.productId === p.id);
    assert.equal(stock.sku, p.sku);
    assert.equal(stock.quantity, p.stockQuantity);
  }
});

test('mock login accepts Admin/Admin or any Thai example phone with password 1234, without tokens', async () => {
  const admin = await request('/login', 'POST', { accountType: 'Admin', identifier: 'Admin', password: 'Admin' });
  assert.deepEqual(admin, { id: 'admin', displayName: 'Admin', role: 'Admin', phone: null });
  await request('/login', 'POST', { accountType: 'Admin', identifier: 'Admin', password: 'wrong' }, 401);
  for (const phone of ['0812345678', '0999999999']) {
    const user = await request('/login', 'POST', { accountType: 'User', identifier: phone, password: '1234' });
    assert.deepEqual(user, { id: `user-${phone}`, displayName: phone, role: 'User', phone });
    assert.equal('password' in user, false);
    assert.equal('token' in user, false);
  }
  await request('/login', 'POST', { accountType: 'User', identifier: '0812345678', password: '0000' }, 401);
  await request('/login', 'POST', { accountType: 'User', identifier: 'not-a-phone', password: '1234' }, 400);
  await request('/login', 'POST', { accountType: 'Other', identifier: 'Admin', password: 'Admin' }, 400);
  // The user explicitly requested no authentication/authorization on existing APIs.
  assert.ok(Array.isArray(await request('/admin/products')));
});

test('adding checks the combined cart quantity; rejected additions leave the cart unchanged', async () => {
  const p = await product(5);
  const c = await cart();
  await add(c, p, 2);
  assert.equal((await add(c, p, 3)).items[0].quantity, 5);
  await add(c, p, 1, 409);
  assert.equal((await request(`/carts/${c.id}`)).items[0].quantity, 5);
  assert.equal((await getProduct(p)).stockQuantity, 5, 'adding does not reserve stock');
});

test('out-of-stock, negative, zero and oversized requests cannot enter a cart', async () => {
  const p = await product(0);
  const c = await cart();
  await add(c, p, 1, 409);
  await add(c, p, 0, 400);
  await add(c, p, -1, 400);
  await add(c, p, 1000001, 400);
  assert.equal((await request(`/carts/${c.id}`)).itemCount, 0);
});

test('updating quantities checks stock and removing an item clears it', async () => {
  const p = await product(2);
  const c = await cart();
  await add(c, p, 1);
  await request(`/carts/${c.id}/items/${p.id}`, 'PUT', { quantity: 3 }, 409);
  await request(`/carts/${c.id}/items/${p.id}`, 'PUT', { quantity: 0 }, 400);
  assert.equal((await request(`/carts/${c.id}/items/${p.id}`, 'PUT', { quantity: 2 })).itemCount, 2);
  await request(`/carts/${c.id}/items/${p.id}`, 'DELETE', undefined, 204);
  assert.equal((await request(`/carts/${c.id}`)).itemCount, 0);
});

test('checkout deducts stock once, empties the cart and preserves exact decimal totals', async () => {
  const p = await product(5, 0.10);
  const c = await cart();
  await add(c, p, 3);
  const order = await checkout(c);
  assert.equal(order.total, 0.30);
  assert.equal(order.items[0].subtotal, 0.30);
  assert.equal((await getProduct(p)).stockQuantity, 2);
  assert.equal((await request(`/carts/${c.id}`)).itemCount, 0);
  await checkout(c, 409);
  assert.equal((await request(`/carts/${c.id}/orders`)).length, 1);
  const latest = await getProduct(p);
  await request(`/admin/products/${p.id}`, 'PUT', { ...latest, name: 'Changed name', price: 999 });
  const saved = await request(`/carts/${c.id}/orders/${order.id}`);
  assert.equal(saved.items[0].productName, p.name);
  assert.equal(saved.items[0].unitPrice, 0.10);
});

test('two customers racing for the final item: exactly one order succeeds', async () => {
  const p = await product(1);
  const a = await cart(), b = await cart();
  await add(a, p, 1);
  await add(b, p, 1);
  const responses = await Promise.all([a, b].map(c => fetch(`${base}/carts/${c.id}/checkout`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(customer),
  })));
  assert.deepEqual(responses.map(r => r.status).sort(), [201, 409]);
  assert.equal((await getProduct(p)).stockQuantity, 0);
  const loser = responses[0].status === 409 ? a : b;
  assert.equal((await request(`/carts/${loser.id}`)).itemCount, 1, 'failed checkout retains the cart');
});

test('simultaneous additions to one cart do not bypass the stock limit', async () => {
  const p = await product(1);
  const c = await cart();
  const responses = await Promise.all([1, 2].map(() => fetch(`${base}/carts/${c.id}/items`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: p.id, quantity: 1 }),
  })));
  assert.deepEqual(responses.map(r => r.status).sort(), [200, 409]);
  assert.equal((await request(`/carts/${c.id}`)).itemCount, 1);
});

test('double-click checkout creates only one order for the same cart', async () => {
  const p = await product(10);
  const c = await cart();
  await add(c, p, 1);
  const responses = await Promise.all([1, 2].map(() => fetch(`${base}/carts/${c.id}/checkout`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(customer),
  })));
  assert.deepEqual(responses.map(r => r.status).sort(), [201, 409]);
  assert.equal((await getProduct(p)).stockQuantity, 9);
  assert.equal((await request(`/carts/${c.id}/orders`)).length, 1);
});

test('if one item becomes unavailable, checkout rolls back every item', async () => {
  const first = await product(2), second = await product(1);
  const c = await cart();
  await add(c, first, 1);
  await add(c, second, 1);
  await request(`/admin/products/${second.id}`, 'PUT', { ...second, stockQuantity: 0 });
  await checkout(c, 409);
  assert.equal((await getProduct(first)).stockQuantity, 2);
  assert.equal((await request(`/carts/${c.id}`)).itemCount, 2);
  assert.equal((await request(`/carts/${c.id}/orders`)).length, 0);
});

test('old admin forms cannot overwrite stock after a purchase', async () => {
  const p = await product(3);
  const c = await cart();
  await add(c, p, 1);
  await checkout(c);
  await request(`/admin/products/${p.id}`, 'PUT', { ...p, stockQuantity: 100 }, 409);
  assert.equal((await getProduct(p)).stockQuantity, 2);
});

test('duplicate SKUs and invalid prices are rejected; disabled products cannot be bought', async () => {
  const p = await product(3);
  await request('/admin/products', 'POST', { ...p, sku: p.sku.toLowerCase() }, 409);
  await request('/admin/products', 'POST', { ...p, sku: 'INVALID-PRICE', price: -1 }, 400);
  await request('/admin/products', 'POST', { ...p, sku: 'INVALID-PRECISION', price: 1.999 }, 400);
  const c = await cart();
  await add(c, p, 1);
  await request(`/admin/products/${p.id}`, 'DELETE', undefined, 204);
  await add(c, p, 1, 404);
  await checkout(c, 409);
  await getProductStatus(p, 404);
});

async function getProductStatus(p, status) { return request(`/products/${p.id}`, 'GET', undefined, status); }

test('invalid recipient information never deducts stock or clears a cart', async () => {
  const p = await product(2);
  const c = await cart();
  await add(c, p, 1);
  await request(`/carts/${c.id}/checkout`, 'POST', { ...customer, phone: 'invalid' }, 400);
  assert.equal((await getProduct(p)).stockQuantity, 2);
  assert.equal((await request(`/carts/${c.id}`)).itemCount, 1);
});

test('clear removes every item, resets the total, preserves stock and leaves other carts alone', async () => {
  const a = await product(8), b = await product(4);
  const first = await cart(), other = await cart();
  await add(first, a, 3);
  await add(first, b, 2);
  await add(other, a, 1);
  const cleared = await request(`/carts/${first.id}/items`, 'DELETE');
  assert.deepEqual(cleared.items, []);
  assert.equal(cleared.itemCount, 0);
  assert.equal(cleared.total, 0);
  assert.equal(cleared.canCheckout, false);
  assert.equal((await getProduct(a)).stockQuantity, 8);
  assert.equal((await getProduct(b)).stockQuantity, 4);
  assert.equal((await request(`/carts/${other.id}`)).itemCount, 1);
  await request(`/carts/${first.id}/items`, 'DELETE');
  await checkout(first, 409);
});

test('decreasing or removing cart items keeps actual stock unchanged until checkout', async () => {
  const p = await product(10);
  const c = await cart();
  await add(c, p, 5);
  const reduced = await request(`/carts/${c.id}/items/${p.id}`, 'PUT', { quantity: 2 });
  assert.equal(reduced.total, 200);
  assert.equal((await getProduct(p)).stockQuantity, 10);
  await request(`/carts/${c.id}/items/${p.id}`, 'DELETE', undefined, 204);
  assert.equal((await getProduct(p)).stockQuantity, 10);
  await add(c, p, 3);
  await checkout(c);
  await request(`/carts/${c.id}/items`, 'DELETE');
  assert.equal((await getProduct(p)).stockQuantity, 7, 'clearing does not restore sold stock');
});

test('a stale cart can be reduced step by step after stock changes', async () => {
  const p = await product(5);
  const c = await cart();
  await add(c, p, 5);
  await request(`/admin/products/${p.id}`, 'PUT', { ...p, stockQuantity: 2 });
  const reducing = await request(`/carts/${c.id}/items/${p.id}`, 'PUT', { quantity: 4 });
  assert.equal(reducing.canCheckout, false);
  const valid = await request(`/carts/${c.id}/items/${p.id}`, 'PUT', { quantity: 2 });
  assert.equal(valid.canCheckout, true);
  await checkout(c);
  assert.equal((await getProduct(p)).stockQuantity, 0);
});
