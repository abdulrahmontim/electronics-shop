"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MAX_PER_ITEM, useCart } from "./CartProvider";

/** The selector never offers more than ten at a time. */
const MAX_SELECTABLE = 10;

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
  const { items, addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [confirmation, setConfirmation] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const inCart =
    items.find((i) => i.product_id === productId)?.quantity ?? 0;
  const atMax = inCart >= MAX_PER_ITEM;
  const maxSelectable = Math.max(
    1,
    Math.min(MAX_SELECTABLE, MAX_PER_ITEM - inCart)
  );
  const selected = Math.min(qty, maxSelectable);

  const add = () => {
    const requested = selected;
    const added = addItem({
      product_id: productId,
      quantity: requested,
      name: productName,
      price_ngn: priceNgn,
      in_stock: inStock,
      slug,
      image_url: imageUrl,
    });

    setQty(1);
    if (added <= 0) {
      setConfirmation(`Maximum ${MAX_PER_ITEM} per item.`);
    } else if (added < requested) {
      setConfirmation(
        `Added ${added}. Maximum is ${MAX_PER_ITEM} per item.`
      );
    } else {
      setConfirmation("Added to your cart");
    }

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setConfirmation(""), 4000);
  };

  if (!inStock) {
    return (
      <div className="purchase">
        <div className="purchase-row">
          <button type="button" className="btn btn-ghost" disabled>
            Out of stock
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="purchase">
      <div className="purchase-row">
        {!atMax && (
          <div className="purchase-qty">
            <label htmlFor={`qty-${productId}`}>Quantity</label>
            <select
              id={`qty-${productId}`}
              value={selected}
              onChange={(e) => setQty(parseInt(e.target.value, 10) || 1)}
            >
              {Array.from({ length: maxSelectable }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        )}
        <button
          type="button"
          className="btn btn-primary"
          onClick={add}
          disabled={atMax}
        >
          Add to cart
        </button>
      </div>

      {atMax && (
        <p className="purchase-limit">
          Maximum {MAX_PER_ITEM} per item.{" "}
          <Link href="/cart">Change the quantity in your cart.</Link>
        </p>
      )}

      <p className="added-note" aria-live="polite">
        {confirmation}
      </p>

      {inCart > 0 && (
        <p className="in-cart-note" aria-live="polite">
          {inCart} in your cart
        </p>
      )}
    </div>
  );
}