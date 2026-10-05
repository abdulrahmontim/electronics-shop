export const SHOP_NAME = 'Bench Supply';

export const CATEGORIES = ['Boards', 'Parts', 'Kits', 'Tools', 'Sensors'] as const;

export type Category = (typeof CATEGORIES)[number];

export function isCategory(value: string | null | undefined): value is Category {
  return !!value && (CATEGORIES as readonly string[]).includes(value);
}

/**
 * The deployed web app. It serves the product images from /products/* and owns
 * the only checkout endpoint, which is where place_order and Mailgun run. There
 * is deliberately no localhost default: a phone cannot reach the dev machine.
 */
export const WEB_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');

/** The single place where orders are created. The phone never calls Supabase to place one. */
export const CHECKOUT_URL = WEB_BASE_URL ? `${WEB_BASE_URL}/api/checkout` : '';

/** Maximum quantity allowed for one product in the cart, matching the web app. */
export const MAX_PER_ITEM = 20;

/** The product page offers at most this many at a time. */
export const MAX_SELECTABLE = 10;

export function resolveImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  if (imageUrl.startsWith('/') && WEB_BASE_URL) return `${WEB_BASE_URL}${imageUrl}`;
  return null;
}