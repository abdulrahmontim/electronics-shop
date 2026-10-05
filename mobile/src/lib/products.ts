import { getSupabase, configurationError } from './supabase';

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  price_ngn: number;
  image_url: string | null;
  in_stock: boolean;
};

export type ProductResult =
  | { status: 'ok'; products: Product[] }
  | { status: 'error'; message: string };

export type SingleProductResult =
  | { status: 'ok'; product: Product }
  | { status: 'missing' }
  | { status: 'error'; message: string };

function toProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: typeof row.description === 'string' ? row.description : '',
    category: String(row.category),
    price_ngn: Number(row.price_ngn),
    image_url: typeof row.image_url === 'string' ? row.image_url : null,
    in_stock: row.in_stock === true,
  };
}

/**
 * Reads the real catalogue from the same products table the web shop uses.
 * Prices are never computed on the phone; they only come from here.
 */
export async function fetchProducts(): Promise<ProductResult> {
  if (configurationError) {
    return { status: 'error', message: configurationError };
  }
  try {
    const { data, error } = await getSupabase()
      .from('products')
      .select('id, slug, name, description, category, price_ngn, image_url, in_stock')
      .order('created_at', { ascending: true });

    if (error) {
      return {
        status: 'error',
        message: 'Products could not load. Check your connection and try again.',
      };
    }
    return { status: 'ok', products: ((data ?? []) as Record<string, unknown>[]).map(toProduct) };
  } catch {
    return {
      status: 'error',
      message: 'Products could not load. Check your connection and try again.',
    };
  }
}

export async function fetchProductBySlug(slug: string): Promise<SingleProductResult> {
  if (configurationError) {
    return { status: 'error', message: configurationError };
  }
  try {
    const { data, error } = await getSupabase()
      .from('products')
      .select('id, slug, name, description, category, price_ngn, image_url, in_stock')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      return {
        status: 'error',
        message: 'This product could not load. Check your connection and try again.',
      };
    }
    if (!data) return { status: 'missing' };
    return { status: 'ok', product: toProduct(data as Record<string, unknown>) };
  } catch {
    return {
      status: 'error',
      message: 'This product could not load. Check your connection and try again.',
    };
  }
}

/**
 * Filters an already-fetched catalogue. The web shop has no search endpoint, so
 * this deliberately reuses the products the app already has rather than
 * standing up a second search backend.
 */
export function filterProducts(products: Product[], query: string, category: string | null): Product[] {
  const needle = query.trim().toLowerCase();
  return products.filter((p) => {
    if (category && p.category !== category) return false;
    if (!needle) return true;
    return (
      p.name.toLowerCase().includes(needle) ||
      p.category.toLowerCase().includes(needle) ||
      p.description.toLowerCase().includes(needle)
    );
  });
}