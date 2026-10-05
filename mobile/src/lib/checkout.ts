import { CHECKOUT_URL } from './config';
import { getAccessToken } from './supabase';

export type CheckoutLine = { product_id: string; quantity: number };

export type CheckoutDetails = {
  full_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
};

export type PlaceOrderResult =
  | { ok: true; orderId: string; emailSent: boolean }
  | { ok: false; message: string; status?: number };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MAX_LINES = 50;
const MAX_QUANTITY = 20;

const LIMITS: Record<keyof CheckoutDetails, number> = {
  full_name: 100,
  phone: 50,
  address: 255,
  city: 100,
  state: 100,
};

/** Mirrors the server's own checks so the customer is told what is wrong immediately. */
export function validateCheckout(details: CheckoutDetails, lines: CheckoutLine[]): string | null {
  for (const key of Object.keys(LIMITS) as (keyof CheckoutDetails)[]) {
    const value = details[key].trim();
    if (!value) return 'Fill in every delivery field';
    if (value.length > LIMITS[key]) return 'Fill in every delivery field';
  }
  if (lines.length === 0) return 'Your cart is empty';
  if (lines.length > MAX_LINES) return 'Your cart is too large to order in one go';
  for (const line of lines) {
    if (!UUID_PATTERN.test(line.product_id)) return 'Your cart has an invalid item';
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > MAX_QUANTITY) {
      return 'Your cart has an invalid quantity';
    }
  }
  return null;
}

/**
 * Places an order through the same Next.js endpoint the web shop uses. That
 * endpoint is the only place place_order and the Mailgun email run, so the
 * phone never sees a database price, an order insert or a server secret. It
 * authenticates with the customer's own Supabase access token.
 */
export async function placeOrder(
  details: CheckoutDetails,
  lines: CheckoutLine[]
): Promise<PlaceOrderResult> {
  if (!CHECKOUT_URL) {
    return {
      ok: false,
      message:
        'Checkout is not available yet. The app needs EXPO_PUBLIC_API_URL set to the deployed shop address.',
    };
  }

  const token = await getAccessToken();
  if (!token) {
    return { ok: false, message: 'Your session has expired. Please sign in again.', status: 401 };
  }

  const invalid = validateCheckout(details, lines);
  if (invalid) return { ok: false, message: invalid };

  let response: Response;
  try {
    response = await fetch(CHECKOUT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...details, items: lines }),
    });
  } catch {
    return {
      ok: false,
      message: 'We could not reach the shop. Check your connection and try again.',
    };
  }

  let payload: { orderId?: string; emailSent?: boolean; error?: string } = {};
  try {
    payload = (await response.json()) as typeof payload;
  } catch {
    payload = {};
  }

  if (!response.ok) {
    if (response.status === 401) {
      return { ok: false, message: 'Your session has expired. Please sign in again.', status: 401 };
    }
    return {
      ok: false,
      message: payload.error ?? 'The order could not be placed. Please try again.',
      status: response.status,
    };
  }

  if (!payload.orderId) {
    return { ok: false, message: 'The order could not be placed. Please try again.' };
  }

  return { ok: true, orderId: payload.orderId, emailSent: payload.emailSent === true };
}