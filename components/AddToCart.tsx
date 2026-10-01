"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";

export function AddToCart({
  productId,
  productName,
  priceNgn,
  inStock,
  slug,
  imageUrl,
}: {
  productId: string;
  productName: string;
  priceNgn: number;
  inStock: boolean;
  slug: string;
  imageUrl?: string | null;
}) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!inStock) {
    return <button disabled>Out of stock</button>;
  }

  return (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
      <label>
        Qty
        <select
          value={qty}
          onChange={(e) => setQty(parseInt(e.target.value))}
          style={{ marginLeft: "0.25rem" }}
        >
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <button
        onClick={() => {
          addItem({
            product_id: productId,
            quantity: qty,
            name: productName,
            price_ngn: priceNgn,
            in_stock: inStock,
            slug,
            image_url: imageUrl,
          });
          setAdded(true);
          setTimeout(() => setAdded(false), 1000);
        }}
      >
        {added ? "Added" : "Add to cart"}
      </button>
    </div>
  );
}
