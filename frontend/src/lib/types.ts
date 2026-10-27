export interface MockUser {
  id: string;
  displayName: string;
  role: "Admin" | "User";
  phone: string | null;
}

export interface MockLoginInput {
  accountType: "Admin" | "User";
  identifier: string;
  password: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stockQuantity: number;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  rowVersion: string;
}

export type ProductInput = Omit<Product, "id" | "createdAt" | "updatedAt" | "rowVersion"> & {
  rowVersion?: string;
};

export interface CartItem {
  productId: number;
  sku: string;
  name: string;
  imageUrl: string;
  price: number;
  quantity: number;
  stockQuantity: number;
  isActive: boolean;
  isAvailable: boolean;
  subtotal: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  itemCount: number;
  total: number;
  canCheckout: boolean;
}

export interface Customer {
  customerName: string;
  phone: string;
  address: string;
}

export interface OrderItem {
  productId: number;
  sku: string;
  productName: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Order extends Customer {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}
