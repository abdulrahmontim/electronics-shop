"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";

export type CartItem = {
  product_id: string;
  quantity: number;
  name?: string;
  price_ngn?: number;
  in_stock?: boolean;
  slug?: string;
  image_url?: string | null;
};

type CartContextType = {
  items: CartItem[];
  count: number;
  addItem: (item: CartItem) => void;
  updateQuantity: (product_id: string, quantity: number) => void;
  removeItem: (product_id: string) => void;
  clearCart: () => void;
  refreshFromSupabase: () => Promise<void>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const stored = localStorage.getItem("bench-supply-cart");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CartItem[];
        setItems(parsed);
      } catch {}
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem("bench-supply-cart", JSON.stringify(items));
    }
  }, [items, loaded]);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.product_id === item.product_id);
      if (existing) {
        return prev.map((p) =>
          p.product_id === item.product_id
            ? { ...p, quantity: Math.min(20, p.quantity + item.quantity) }
            : p
        );
      }
      return [...prev, { ...item, quantity: Math.min(20, item.quantity) }];
    });
  };

  const updateQuantity = (product_id: string, quantity: number) => {
    const q = Math.max(1, Math.min(20, Math.floor(quantity)));
    setItems((prev) =>
      prev.map((p) => (p.product_id === product_id ? { ...p, quantity: q } : p))
    );
  };

  const removeItem = (product_id: string) => {
    setItems((prev) => prev.filter((p) => p.product_id !== product_id));
  };

  const clearCart = () => setItems([]);

  const refreshFromSupabase = async () => {
    if (items.length === 0) return;
    const ids = items.map((i) => i.product_id);
    const { data } = await supabase
      .from("products")
      .select("id, name, price_ngn, in_stock, slug, image_url")
      .in("id", ids);
    if (!data) return;
    setItems((prev) =>
      prev
        .map((p) => {
          const found = data.find((d) => d.id === p.product_id);
          if (!found) return { ...p, in_stock: false };
          return {
            ...p,
            name: found.name,
            price_ngn: found.price_ngn,
            in_stock: found.in_stock,
            slug: found.slug,
            image_url: found.image_url,
          };
        })
        .filter((p) => p.in_stock !== false)
    );
  };

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        refreshFromSupabase,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
