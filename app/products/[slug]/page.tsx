import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
import { AddToCart } from "@/components/AddToCart";
import { formatNaira } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: any) {
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
    <div className="container page product">
      <p className="crumb">
        <Link href="/#shop">Shop</Link>
        <span> / {product.category}</span>
      </p>

      <div className="product-layout">
        <div className="product-media">
          <ProductImage
            slug={product.slug}
            name={product.name}
            imageUrl={product.image_url}
          />
        </div>

        <div className="product-details">
          <p className="product-category">{product.category}</p>
          <h1>{product.name}</h1>
          <p className="product-price">{formatNaira(product.price_ngn)}</p>
          <p className="product-description">{product.description}</p>
          <p className={product.in_stock ? "product-stock stock-in" : "product-stock stock-out"}>
            {product.in_stock ? "In stock" : "Out of stock"}
          </p>

          <AddToCart
            productId={product.id}
            productName={product.name}
            priceNgn={product.price_ngn}
            inStock={product.in_stock}
            slug={product.slug}
            imageUrl={product.image_url}
          />
        </div>
      </div>
    </div>
  );
}