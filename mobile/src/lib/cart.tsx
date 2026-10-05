import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import type { SupabaseClient } from '@supabase/supabase-js';
import { MAX_PER_ITEM } from './config';
import { clampQuantity } from './format';
import { getSupabase, configurationError } from './supabase';
import { useSession } from './session';

export type CartItem = {
  product_id: string;
  quantity: number;
  name: string;
  price_ngn: number;
  in_stock: boolean;
  slug: string;
  image_url: string | null;
};

export type CartSyncState = 'local' | 'loading' | 'synced' | 'error';

type CartRow = { product_id: string; quantity: number };
type ProductRow = {
  id: string;
  slug: string;
  name: string;
  price_ngn: number;
  in_stock: boolean;
  image_url: string | null;
};

/** Where a visitor's cart lives before they sign in. Never the source of truth. */
const LOCAL_CART_KEY = 'bench-supply-cart';

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  loading: boolean;
  isSignedIn: boolean;
  syncState: CartSyncState;
  /** Returns how many were actually added, which is lower if the 20 cap trims it. */
  addItem: (item: CartItem) => Promise<number>;
  updateQuantity: (product_id: string, quantity: number) => Promise<void>;
  removeItem: (product_id: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refresh: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}

/**
 * Reads the signed-in customer's cart lines and joins them to the product rows
 * that prices always come from. Returns null when the shared cart is not
 * available, so the app falls back to the device copy instead of breaking.
 */
async function readBackendCart(
  supabase: SupabaseClient,
  userId: string
): Promise<CartItem[] | null> {
  const { data: lineData, error: lineError } = await supabase
    .from('cart_items')
    .select('product_id, quantity')
    .eq('user_id', userId);

  if (lineError) return null;

  const lines = (lineData ?? []) as CartRow[];
  if (lines.length === 0) return [];

  const { data: productData, error: productError } = await supabase
    .from('products')
    .select('id, slug, name, price_ngn, in_stock, image_url')
    .in(
      'id',
      lines.map((l) => l.product_id)
    );

  if (productError) return null;

  const products = new Map(((productData ?? []) as ProductRow[]).map((p) => [p.id, p]));

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
  const { user } = useSession();
  const userId = user?.id ?? null;

  const [items, setItems] = useState<CartItem[]>([]);
  const [syncState, setSyncState] = useState<CartSyncState>('local');
  const [ready, setReady] = useState(false);

  const itemsRef = useRef<CartItem[]>([]);
  const userIdRef = useRef<string | null>(null);
  const syncStateRef = useRef<CartSyncState>('local');

  const setSync = useCallback((next: CartSyncState) => {
    if (syncStateRef.current === next) return;
    syncStateRef.current = next;
    setSyncState(next);
  }, []);

  const replaceItems = useCallback((next: CartItem[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  /**
   * Replaces the cart with what the database holds. When mergeLocal is set,
   * lines still sitting on this device are pushed up first, so signing in after
   * browsing as a guest does not throw away what was picked.
   */
  const loadBackendCart = useCallback(
    async (mergeLocal: boolean) => {
      const uid = userIdRef.current;
      if (!uid || configurationError) return;
      setSync('loading');
      try {
        const supabase = getSupabase();
        let backend = await readBackendCart(supabase, uid);
        if (backend === null) {
          setSync('error');
          return;
        }

        const local = mergeLocal ? itemsRef.current : [];
        if (local.length > 0) {
          const known = new Set(backend.map((i) => i.product_id));
          const toPush = local.filter((i) => !known.has(i.product_id));
          for (const line of toPush) {
            await supabase.rpc('cart_add', {
              p_product_id: line.product_id,
              p_quantity: clampQuantity(line.quantity),
            });
          }
          if (toPush.length > 0) {
            const refreshed = await readBackendCart(supabase, uid);
            if (refreshed !== null) backend = refreshed;
          }
        }

        await AsyncStorage.removeItem(LOCAL_CART_KEY);
        replaceItems(backend);
        setSync('synced');
      } catch {
        setSync('error');
      }
    },
    [replaceItems, setSync]
  );

  // Start from the device copy so a guest sees their cart immediately, then let
  // the database take over as soon as there is an account to read.
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(LOCAL_CART_KEY)
      .then((stored) => {
        if (!active || !stored) return;
        try {
          const parsed = JSON.parse(stored) as CartItem[];
          if (Array.isArray(parsed)) replaceItems(parsed);
        } catch {
          // A corrupt cache is not worth reporting; the shop still works.
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [replaceItems]);

  useEffect(() => {
    const previous = userIdRef.current;
    userIdRef.current = userId;
    if (!ready) return;

    if (!userId) {
      setSync('local');
      return;
    }
    if (previous !== userId) {
      void loadBackendCart(true);
    }
  }, [userId, ready, loadBackendCart, setSync]);

  // The device copy is only for signed-out visitors. Once an account is signed
  // in the database is authoritative, so nothing local may overwrite it.
  useEffect(() => {
    if (!ready || userId) return;
    AsyncStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items)).catch(() => undefined);
  }, [items, ready, userId]);

  // Coming back to the app is the moment another device is most likely to have
  // changed the cart, so it is re-read here.
  useEffect(() => {
    if (!userId) return;
    const onChange = (state: AppStateStatus) => {
      if (state === 'active') void loadBackendCart(false);
    };
    const subscription = AppState.addEventListener('change', onChange);
    return () => subscription.remove();
  }, [userId, loadBackendCart]);

  const addItem = useCallback(
    async (item: CartItem): Promise<number> => {
      const current = itemsRef.current;
      const existing = current.find((i) => i.product_id === item.product_id);
      const have = existing ? existing.quantity : 0;
      const added = Math.max(
        0,
        Math.min(clampQuantity(item.quantity), MAX_PER_ITEM - have)
      );
      if (added === 0) return 0;

      const next = existing
        ? current.map((i) =>
            i.product_id === item.product_id ? { ...i, quantity: have + added } : i
          )
        : [...current, { ...item, quantity: added }];
      replaceItems(next);

      if (userIdRef.current) {
        try {
          const { error } = await getSupabase().rpc('cart_add', {
            p_product_id: item.product_id,
            p_quantity: added,
          });
          if (error) {
            setSync('error');
          } else {
            await loadBackendCart(false);
          }
        } catch {
          setSync('error');
        }
      }
      return added;
    },
    [replaceItems, loadBackendCart, setSync]
  );

  const updateQuantity = useCallback(
    async (product_id: string, quantity: number) => {
      const next = clampQuantity(quantity);
      replaceItems(
        itemsRef.current.map((i) => (i.product_id === product_id ? { ...i, quantity: next } : i))
      );
      if (!userIdRef.current) return;
      try {
        const { error } = await getSupabase()
          .from('cart_items')
          .upsert(
            { user_id: userIdRef.current, product_id, quantity: next },
            { onConflict: 'user_id,product_id' }
          );
        if (error) {
          setSync('error');
        } else {
          await loadBackendCart(false);
        }
      } catch {
        setSync('error');
      }
    },
    [replaceItems, loadBackendCart, setSync]
  );

  const removeItem = useCallback(
    async (product_id: string) => {
      replaceItems(itemsRef.current.filter((i) => i.product_id !== product_id));
      if (!userIdRef.current) return;
      try {
        const { error } = await getSupabase()
          .from('cart_items')
          .delete()
          .eq('user_id', userIdRef.current)
          .eq('product_id', product_id);
        if (error) {
          setSync('error');
        } else {
          await loadBackendCart(false);
        }
      } catch {
        setSync('error');
      }
    },
    [replaceItems, loadBackendCart, setSync]
  );

  const clearCart = useCallback(async () => {
    replaceItems([]);
    if (!userIdRef.current) return;
    try {
      const { error } = await getSupabase()
        .from('cart_items')
        .delete()
        .eq('user_id', userIdRef.current);
      if (error) {
        setSync('error');
      } else {
        await loadBackendCart(false);
      }
    } catch {
      setSync('error');
    }
  }, [replaceItems, loadBackendCart, setSync]);

  const refresh = useCallback(async () => {
    if (userIdRef.current) {
      await loadBackendCart(false);
      return;
    }
    // A guest still needs current prices, because the database is what decides
    // what will be charged.
    const current = itemsRef.current;
    if (current.length === 0) return;
    try {
      const { data } = await getSupabase()
        .from('products')
        .select('id, slug, name, price_ngn, in_stock, image_url')
        .in(
          'id',
          current.map((i) => i.product_id)
        );
      const rows = (data ?? []) as ProductRow[];
      if (rows.length === 0) return;
      const byId = new Map(rows.map((p) => [p.id, p]));
      replaceItems(
        current
          .map((i): CartItem | null => {
            const found = byId.get(i.product_id);
            if (!found || !found.in_stock) return null;
            return { ...i, ...found };
          })
          .filter((i): i is CartItem => i !== null)
      );
    } catch {
      setSync('error');
    }
  }, [replaceItems, loadBackendCart, setSync]);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price_ngn * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        subtotal,
        loading: !ready || syncState === 'loading',
        isSignedIn: userId !== null,
        syncState,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        refresh,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}