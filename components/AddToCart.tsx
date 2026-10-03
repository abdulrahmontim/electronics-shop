"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";

const QUANTITIES = Array.from({ length: 10 }, (_, i) => i + 1);

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
    return (
      <div className="purchase">
        <div className="purchase-row">
          <button type="button" className="btn btn-ghost" disabled>
            Out of stock
          </button>
        </div>
        <p className="added-note" aria-live="polite" />
      </div>
    );
  }

  return (
    <div className="purchase">
      <div className="purchase-row">
        <div className="purchase-qty">
          <label htmlFor={`qty-${productId}`}>Quantity</label>
          <select
            id={`qty-${productId}`}
            value={qty}
            onChange={(e) => setQty(parseInt(e.target.value, 10) || 1)}
          >
            {QUANTITIES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="btn btn-primary"
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
            setTimeout(() => setAdded(false), 2000);
          }}
        >
          Add to cart
        </button>
      </div>
      <p className="added-note" aria-live="polite">
        {added ? "Added to your cart" : ""}
      </p>
    </div>
  );
}