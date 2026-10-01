import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { BandArt } from "@/components/BandArt";
import { AddToCart } from "@/components/AddToCart";
import { formatNaira } from "@/lib/format";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: any): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("products").select("name").eq("slug", slug).single();
  if (data) return { title: data.name + " - Bench Supply" };
  return { title: "Bench Supply" };
}

export default async function ProductPage({ params }: any) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: product, error } = await supabase.from("products").select("*").eq("slug", slug).single();
  if (error || !product) notFound();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div className="art" style={{ maxWidth: "400px", margin: "0 auto" }}>
        {product.image_url ? <img src={product.image_url} alt={product.name} style={{ maxWidth: "100%", maxHeight: "100%" }} /> : <BandArt slug={product.slug} />}
      </div>
      <div>
        <h1>{product.name}</h1>
        <p style={{ color: "var(--muted)" }}>{product.category}</p>
        <p style={{ fontSize: "1.25rem" }}>{formatNaira(product.price_ngn)}</p>
        <p>{product.description}</p>
        <p>{product.in_stock ? "In stock" : "Out of stock"}</p>
        <AddToCart productId={product.id} productName={product.name} priceNgn={product.price_ngn} inStock={product.in_stock} slug={product.slug} imageUrl={product.image_url} />
      </div>
    </div>
  );
}