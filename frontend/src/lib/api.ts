import type { Cart, Customer, MockLoginInput, MockUser, Order, Product, ProductInput } from "./types";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5099/api").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "เชื่อมต่อร้านค้าไม่ได้ กรุณาตรวจสอบว่า C# API เปิดอยู่");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const details = error.errors
      ? (Object.values(error.errors) as string[][]).flat().join(" · ")
      : "";
    throw new ApiError(response.status, details || error.message || "ทำรายการไม่สำเร็จ กรุณาลองอีกครั้ง");
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  login: (input: MockLoginInput) => request<MockUser>("/login", "POST", input),
  products: () => request<Product[]>("/products"),
  adminProducts: () => request<Product[]>("/admin/products"),
  createProduct: (product: ProductInput) => request<Product>("/admin/products", "POST", product),
  updateProduct: (id: number, product: ProductInput) => request<Product>(`/admin/products/${id}`, "PUT", product),
  deleteProduct: (id: number) => request<void>(`/admin/products/${id}`, "DELETE"),
  createCart: () => request<Cart>("/carts", "POST"),
  cart: (id: string) => request<Cart>(`/carts/${id}`),
  addItem: (id: string, productId: number, quantity: number) =>
    request<Cart>(`/carts/${id}/items`, "POST", { productId, quantity }),
  updateItem: (id: string, productId: number, quantity: number) =>
    request<Cart>(`/carts/${id}/items/${productId}`, "PUT", { quantity }),
  removeItem: (id: string, productId: number) => request<void>(`/carts/${id}/items/${productId}`, "DELETE"),
  clearCart: (id: string) => request<Cart>(`/carts/${id}/items`, "DELETE"),
  checkout: (id: string, customer: Customer) => request<Order>(`/carts/${id}/checkout`, "POST", customer),
  orders: (id: string) => request<Order[]>(`/carts/${id}/orders`),
};

export const money = (value: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 2 }).format(value);

export const dateTime = (value: string) => new Intl.DateTimeFormat("th-TH", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok",
}).format(new Date(value));

export const errorMessage = (error: unknown) => error instanceof Error ? error.message : "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง";
