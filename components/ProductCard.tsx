import Link from "next/link";
import { ProductImage } from "./ProductImage";
import { formatNaira } from "@/lib/format";

export function ProductCard({
  slug,
  name,
  category,
  priceNgn,
  imageUrl,
}: {
  slug: string;
  name: string;
  category: string;
  priceNgn: number;
  imageUrl?: string | null;
}) {
  return (
    <Link href={`/products/${slug}`} className="tile">
      <div className="tile-frame">
        <ProductImage slug={slug} name={name} imageUrl={imageUrl} />
      </div>
      <h3 className="tile-name">{name}</h3>
      <div className="tile-meta">
        <span className="tile-category">{category}</span>
        <span className="tile-price">{formatNaira(priceNgn)}</span>
      </div>
    </Link>
  );
}