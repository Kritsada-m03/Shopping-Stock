"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { api, ApiError, errorMessage } from "@/lib/api";
import type { Cart, Customer, Order } from "@/lib/types";

const STORAGE_KEY = "shopping.cart.v1";
let cartRequest: Promise<Cart> | null = null;
let sessionCartId: string | null = null;

async function loadCart(): Promise<Cart> {
  if (cartRequest) return cartRequest;
  cartRequest = (async () => {
    let id = sessionCartId;
    try { id = localStorage.getItem(STORAGE_KEY) ?? id; } catch { /* private browser storage */ }
    if (id) {
      try { return await api.cart(id); }
      catch (error) { if (!(error instanceof ApiError) || error.status !== 404) throw error; }
    }
    const cart = await api.createCart();
    sessionCartId = cart.id;
    try { localStorage.setItem(STORAGE_KEY, cart.id); } catch { /* keep the session cart */ }
    return cart;
  })();
  try { return await cartRequest; }
  finally { cartRequest = null; }
}

interface ShopContextValue {
  cart: Cart | null;
  ready: boolean;
  connectionError: string;
  busy: boolean;
  actionError: string;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  search: string;
  setSearch: (search: string) => void;
  catalogVersion: number;
  refreshCatalog: () => void;
  retry: () => Promise<void>;
  refreshCart: () => Promise<void>;
  addItem: (id: number, quantity?: number) => Promise<boolean>;
  updateItem: (id: number, quantity: number) => Promise<boolean>;
  removeItem: (id: number) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  checkout: (customer: Customer) => Promise<Order | null>;
  notify: (text: string, isError?: boolean) => void;
}

const ShopContext = createContext<ShopContextValue | null>(null);

export function ShopProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [ready, setReady] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const mutating = useRef(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [catalogVersion, setCatalogVersion] = useState(0);
  const [toast, setToast] = useState<{ text: string; isError: boolean } | null>(null);
  const notify = useCallback((text: string, isError = false) => setToast({ text, isError }), []);
  const refreshCatalog = useCallback(() => setCatalogVersion(v => v + 1), []);

  const retry = useCallback(async () => {
    setReady(false);
    try { setCart(await loadCart()); setConnectionError(""); }
    catch (error) { setConnectionError(errorMessage(error)); }
    finally { setReady(true); }
  }, []);

  const refreshCart = useCallback(async () => {
    try { setCart(await loadCart()); setConnectionError(""); }
    catch (error) { setConnectionError(errorMessage(error)); }
  }, []);

  useEffect(() => { void retry(); }, [retry]);
  useEffect(() => {
    const onFocus = () => { void refreshCart(); refreshCatalog(); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshCart, refreshCatalog]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  async function mutate<T>(action: (id: string) => Promise<T>): Promise<T | null> {
    if (mutating.current) return null;
    mutating.current = true;
    setBusy(true);
    setActionError("");
    try {
      const current = cart ?? await loadCart();
      return await action(current.id);
    } catch (error) {
      setActionError(errorMessage(error));
      notify(errorMessage(error), true);
      await refreshCart();
      refreshCatalog();
      return null;
    } finally {
      mutating.current = false;
      setBusy(false);
    }
  }

  async function addItem(productId: number, quantity = 1) {
    const updated = await mutate(id => api.addItem(id, productId, quantity));
    if (!updated) return false;
    setCart(updated);
    notify("เพิ่มสินค้าในตะกร้าแล้ว");
    return true;
  }

  async function updateItem(productId: number, quantity: number) {
    const updated = await mutate(id => api.updateItem(id, productId, quantity));
    if (!updated) return false;
    setCart(updated);
    return true;
  }

  async function removeItem(productId: number) {
    const updated = await mutate(async id => { await api.removeItem(id, productId); return api.cart(id); });
    if (!updated) return false;
    setCart(updated);
    return true;
  }

  async function checkout(customer: Customer) {
    const order = await mutate(id => api.checkout(id, customer));
    if (!order) return null;
    await refreshCart();
    refreshCatalog();
    return order;
  }

  async function clearCart() {
    const updated = await mutate(id => api.clearCart(id));
    if (!updated) return false;
    setCart(updated);
    return true;
  }

  return <ShopContext.Provider value={{ cart, ready, connectionError, busy, actionError, cartOpen,
    setCartOpen, search, setSearch, catalogVersion, refreshCatalog, retry, refreshCart,
    addItem, updateItem, removeItem, clearCart, checkout, notify }}>
    {children}
    <div className="toast-region" role="status" aria-live="polite" aria-atomic="true">
      {toast && <div className={`toast ${toast.isError ? "toast-error" : ""}`}>
        {toast.isError ? <CircleAlert size={21} /> : <CheckCircle2 size={21} />}
        <span>{toast.text}</span>
        <button className="icon-button" aria-label="ปิดข้อความ" onClick={() => setToast(null)}><X size={18} /></button>
      </div>}
    </div>
  </ShopContext.Provider>;
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) throw new Error("useShop must be used inside ShopProvider");
  return context;
}
