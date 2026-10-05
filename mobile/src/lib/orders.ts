import { getSupabase, configurationError } from './supabase';

export type OrderItem = {
  id: string;
  product_id: string | null;
  product_name: string;
  unit_price_ngn: number;
  quantity: number;
};

export type Order = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  total_ngn: number;
  status: string;
  created_at: string;
  order_items?: OrderItem[];
};

export type OrdersResult =
  | { status: 'ok'; orders: Order[] }
  | { status: 'error'; message: string };

export type OrderResult =
  | { status: 'ok'; order: Order }
  | { status: 'missing' }
  | { status: 'error'; message: string };

function toOrderItem(row: Record<string, unknown>): OrderItem {
  return {
    id: String(row.id),
    product_id: row.product_id ? String(row.product_id) : null,
    product_name: String(row.product_name),
    unit_price_ngn: Number(row.unit_price_ngn),
    quantity: Number(row.quantity),
  };
}

function toOrder(row: Record<string, unknown>): Order {
  const rawItems = Array.isArray(row.order_items) ? (row.order_items as Record<string, unknown>[]) : [];
  return {
    id: String(row.id),
    email: String(row.email),
    full_name: String(row.full_name),
    phone: String(row.phone),
    address: String(row.address),
    city: String(row.city),
    state: String(row.state),
    total_ngn: Number(row.total_ngn),
    status: String(row.status),
    created_at: String(row.created_at),
    order_items: rawItems.map(toOrderItem),
  };
}

const ORDER_COLUMNS =
  'id, email, full_name, phone, address, city, state, total_ngn, status, created_at';

/**
 * Reads the signed-in customer's orders straight from the orders table. Row
 * level security means this can only ever return that customer's own orders, so
 * no user id is sent from the app.
 */
export async function fetchOrders(): Promise<OrdersResult> {
  if (configurationError) return { status: 'error', message: configurationError };
  try {
    const { data, error } = await getSupabase()
      .from('orders')
      .select(ORDER_COLUMNS)
      .order('created_at', { ascending: false });

    if (error) {
      return {
        status: 'error',
        message: 'Your orders could not load. Check your connection and try again.',
      };
    }
    return { status: 'ok', orders: ((data ?? []) as Record<string, unknown>[]).map(toOrder) };
  } catch {
    return {
      status: 'error',
      message: 'Your orders could not load. Check your connection and try again.',
    };
  }
}

export async function fetchOrderById(id: string): Promise<OrderResult> {
  if (configurationError) return { status: 'error', message: configurationError };
  try {
    const { data, error } = await getSupabase()
      .from('orders')
      .select(`${ORDER_COLUMNS}, order_items(*)`)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return {
        status: 'error',
        message: 'This order could not load. Check your connection and try again.',
      };
    }
    if (!data) return { status: 'missing' };
    return { status: 'ok', order: toOrder(data as Record<string, unknown>) };
  } catch {
    return {
      status: 'error',
      message: 'This order could not load. Check your connection and try again.',
    };
  }
}