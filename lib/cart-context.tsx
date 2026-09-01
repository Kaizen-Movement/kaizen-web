"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface CartLine {
  productId: string;
  slug: string;
  title: string;
  priceCents: number;
  quantity: number;
}

interface CartContextValue {
  lines: CartLine[];
  addItem: (line: Omit<CartLine, "quantity">) => void;
  removeItem: (productId: string) => void;
  totalCents: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "kaizen_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const addItem: CartContextValue["addItem"] = (line) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === line.productId);
      if (existing) {
        // Digital goods — buying twice makes no sense, just no-op quantity bump.
        return prev;
      }
      return [...prev, { ...line, quantity: 1 }];
    });
  };

  const removeItem = (productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  };

  const totalCents = lines.reduce(
    (sum, l) => sum + l.priceCents * l.quantity,
    0
  );

  return (
    <CartContext.Provider value={{ lines, addItem, removeItem, totalCents }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
