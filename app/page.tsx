import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Resistor } from "@/components/Resistor";
import { ProductCard } from "@/components/ProductCard";
import { CATEGORIES, type Category } from "@/lib/config";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const supabase = await createServerSupabaseClient();
  let query = supabase.from("products").select("*").order("created_at", { ascending: true });
  const cat = category as string | undefined;
  const validCat = cat && CATEGORIES.includes(cat as Category) ? (cat as Category) : null;
  if (validCat) {
    query = query.eq("category", validCat);
  }
  const { data: products, error } = await query;
  if (error) {
    console.error(error);
  }

  return (
    <div>
      <section className="hero">
        <Resistor />
        <p style={{ textAlign: "center", marginTop: "1rem" }}>
          Quality electronics parts for your projects
        </p>
      </section>
      <div className="chips">
        <Link href="/" className={chip }>
          All
        </Link>
        {CATEGORIES.map((c) => (
          <Link
            key={c}
            href={/?category=}
            className={chip }
          >
            {c}
          </Link>
        ))}
      </div>
      {error && <div className="error">Products could not load</div>}
      {products && products.length === 0 && <div className="notice">No products found</div>}
      <div className="grid">
        {products?.map((p) => (
          <ProductCard
            key={p.id}
            slug={p.slug}
            name={p.name}
            category={p.category}
            priceNgn={p.price_ngn}
            imageUrl={p.image_url}
          />
        ))}
      </div>
    </div>
  );
}
