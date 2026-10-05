"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
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

/** Maximum quantity allowed for one product in the cart. */
export const MAX_PER_ITEM = 20;

export function clampQuantity(n: number): number {
  const whole = Math.floor(Number.isFinite(n) ? n : 0);
  return Math.max(1, Math.min(MAX_PER_ITEM, whole));
}

/**
 * Adds item to a cart list without mutating it and reports how many were
 * actually added, which is lower than the requested amount when the per-item
 * cap trims it.
 */
export function addToCartList(
  items: CartItem[],
  item: CartItem
): { items: CartItem[]; added: number } {
  const requested = clampQuantity(item.quantity);
  const existing = items.find((p) => p.product_id === item.product_id);
  const current = existing ? clampQuantity(existing.quantity) : 0;
  const added = Math.max(0, Math.min(requested, MAX_PER_ITEM - current));

  if (added === 0) {
    return { items, added: 0 };
  }

  const next = existing
    ? items.map((p) =>
        p.product_id === item.product_id
          ? { ...p, quantity: current + added }
          : p
      )
    : [...items, { ...item, quantity: added }];

  return { items: next, added };
}

type CartRow = { product_id: string; quantity: number };
type ProductRow = {
  id: string;
  slug: string;
  name: string;
  price_ngn: number;
  in_stock: boolean;
  image_url: string | null;
};

/**
 * Where the cart currently lives. "local" means the customer is signed out, so
 * the cart only exists in this browser. Once they sign in the database copy
 * takes over and every client shares it.
 */
export type CartSyncState = "local" | "loading" | "synced" | "error";

type CartContextType = {
  items: CartItem[];
  count: number;
  addItem: (item: CartItem) => number;
  updateQuantity: (product_id: string, quantity: number) => void;
  removeItem: (product_id: string) => void;
  clearCart: () => void;
  refreshFromSupabase: () => Promise<void>;
  syncState: CartSyncState;
  isSignedIn: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

const STORAGE_KEY = "bench-supply-cart";

/**
 * Reads the signed-in user without assuming the client can answer. Any failure
 * is treated as "signed out", which keeps the local cart working.
 */
async function resolveUser(supabase: SupabaseClient): Promise<User | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data?.user ?? null;
  } catch {
    return null;
  }
}

/**
 * Reads the customer's cart lines and joins them to the product details that
 * prices are always read from. Returns null when the shared cart is not
 * available, so the app falls back to the browser cart instead of breaking.
 */
async function readBackendCart(
  supabase: SupabaseClient,
  userId: string
): Promise<CartItem[] | null> {
  const { data: lineData, error: lineError } = await supabase
    .from("cart_items")
    .select("product_id, quantity")
    .eq("user_id", userId);

  if (lineError) return null;

  const lines = (lineData ?? []) as CartRow[];
  if (lines.length === 0) return [];

  const ids = lines.map((l) => l.product_id);
  const { data: productData, error: productError } = await supabase
    .from("products")
    .select("id, slug, name, price_ngn, in_stock, image_url")
    .in("id", ids);

  if (productError) return null;

  const products = new Map(
    ((productData ?? []) as ProductRow[]).map((p) => [p.id, p])
  );

  return lines
    .map((line): CartItem | null => {
      const product = products.get(line.product_id);
      if (!product || !product.in_stock) return null;
      return {
        product_id: line.product_id,
        quantity: clampQuantity(line.quantity),
        name: product.name,
        price_ngn: product.price_ngn,
        in_stock: product.in_stock,
        slug: product.slug,
        image_url: product.image_url,
      };
    })
    .filter((item): item is CartItem => item !== null);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<CartSyncState>("local");
  // Created once so the client identity is stable across renders.
  const [supabase] = useState(() => createClient());
  const itemsRef = useRef<CartItem[]>([]);
  const userIdRef = useRef<string | null>(null);
  const syncStateRef = useRef<CartSyncState>("local");

  // Only writes when the value actually changes, so a poll that finds nothing
  // new does not re-render every screen that shows the cart.
  const setSync = useCallback((next: CartSyncState) => {
    if (syncStateRef.current === next) return;
    syncStateRef.current = next;
    setSyncState(next);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CartItem[];
        setItems(parsed);
      } catch {}
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    itemsRef.current = items;
    // The shared cart is authoritative once signed in, so the browser copy is
    // only kept for signed-out visitors.
    if (loaded && !userId) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, loaded, userId]);

  /**
   * Replaces the cart with what the database holds. When mergeLocal is set, any
   * lines still sitting in this browser are pushed up first, so signing in on a
   * new device does not throw away what the customer picked earlier.
   */
  const loadBackendCart = useCallback(
    async (mergeLocal: boolean) => {
      const uid = userIdRef.current;
      if (!uid) return;
      setSync("loading");
      try {
        let backend = await readBackendCart(supabase, uid);
        if (backend === null) {
          setSync("error");
          return;
        }

        const local = mergeLocal ? itemsRef.current : [];
        if (local.length > 0) {
          const known = new Set(backend.map((i) => i.product_id));
          const toPush = local.filter((i) => !known.has(i.product_id));
          for (const line of toPush) {
            await supabase.rpc("cart_add", {
              p_product_id: line.product_id,
              p_quantity: clampQuantity(line.quantity),
            });
          }
          if (toPush.length > 0) {
            const refreshed = await readBackendCart(supabase, uid);
            if (refreshed !== null) backend = refreshed;
          }
        }

        localStorage.removeItem(STORAGE_KEY);
        itemsRef.current = backend;
        setItems(backend);
        setSync("synced");
      } catch {
        setSync("error");
      }
    },
    [supabase, setSync]
  );

  useEffect(() => {
    if (!loaded) return;
    let active = true;

    const adopt = async (user: User | null) => {
      if (!active) return;
      const nextId = user?.id ?? null;
      const signedInChanged = (userIdRef.current !== null) !== (nextId !== null);
      userIdRef.current = nextId;
      if (signedInChanged) setUserId(nextId);
      if (!user) {
        setSync("local");
        return;
      }
      await loadBackendCart(true);
    };

    resolveUser(supabase).then((user) => {
      void adopt(user);
    });

    let unsubscribe: (() => void) | undefined;
    try {
      const result = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_OUT") {
          void adopt(null);
        } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          void adopt(session?.user ?? null);
        }
      });
      unsubscribe = () => result.data.subscription.unsubscribe();
    } catch {
      // An auth client that cannot report changes simply leaves the cart local.
    }

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [loaded, supabase, loadBackendCart, setSync]);

  // Pick up carts that another device changed while this tab was in the
  // background, which is what makes adding on the phone show up here.
  useEffect(() => {
    if (!userId) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void loadBackendCart(false);
      }
    };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [userId, loadBackendCart]);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  /** Writes a change to the database, then trusts the database from then on. */
  const reconcile = useCallback(async () => {
    await loadBackendCart(false);
  }, [loadBackendCart]);

  const addItem = (item: CartItem): number => {
    const result = addToCartList(itemsRef.current, item);
    itemsRef.current = result.items;
    setItems(result.items);
    if (userIdRef.current && result.added > 0) {
      void supabase
        .rpc("cart_add", {
          p_product_id: item.product_id,
          p_quantity: result.added,
        })
        .then(({ error }) => (error ? setSync("error") : reconcile()));
    }
    return result.added;
  };

  const updateQuantity = (product_id: string, quantity: number) => {
    const q = clampQuantity(quantity);
    setItems((prev) =>
      prev.map((p) => (p.product_id === product_id ? { ...p, quantity: q } : p))
    );
    if (userIdRef.current) {
      void supabase
        .from("cart_items")
        .upsert(
          { user_id: userIdRef.current, product_id, quantity: q },
          { onConflict: "user_id,product_id" }
        )
        .then(({ error }) => (error ? setSync("error") : reconcile()));
    }
  };

  const removeItem = (product_id: string) => {
    setItems((prev) => prev.filter((p) => p.product_id !== product_id));
    if (userIdRef.current) {
      void supabase
        .from("cart_items")
        .delete()
        .eq("user_id", userIdRef.current)
        .eq("product_id", product_id)
        .then(({ error }) => (error ? setSync("error") : reconcile()));
    }
  };

  const clearCart = () => {
    setItems([]);
    if (userIdRef.current) {
      void supabase
        .from("cart_items")
        .delete()
        .eq("user_id", userIdRef.current)
        .then(({ error }) => (error ? setSync("error") : reconcile()));
    }
  };

  const refreshFromSupabase = async () => {
    if (userIdRef.current) {
      await loadBackendCart(false);
      return;
    }
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
        syncState,
        isSignedIn: userId !== null,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}