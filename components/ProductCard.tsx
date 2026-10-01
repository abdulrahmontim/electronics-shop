import Link from "next/link";
import { BandArt } from "./BandArt";
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
    <Link href={/products/} style={{ textDecoration: "none" }}>
      <div className="card">
        <div className="art">
          {imageUrl ? (
            <img src={imageUrl} alt={name} style={{ maxWidth: "100%", maxHeight: "100%" }} />
          ) : (
            <BandArt slug={slug} />
          )}
        </div>
        <div>
          <h3 style={{ fontSize: "1rem" }}>{name}</h3>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>{category}</p>
        </div>
        <p>{formatNaira(priceNgn)}</p>
      </div>
    </Link>
  );
}
