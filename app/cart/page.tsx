"use client";

import { useCart } from "@/components/CartProvider";
import { useEffect, useState } from "react";
import { formatNaira } from "@/lib/format";
import Link from "next/link";

const QUANTITIES = Array.from({ length: 20 }, (_, i) => i + 1);

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, refreshFromSupabase } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    refreshFromSupabase();
  }, []);

  if (!mounted) {
    return (
      <div className="container page">
        <h1>Your cart</h1>
        <p className="muted">Loading your cart...</p>
      </div>
    );
  }

  const subtotal = items.reduce((sum, i) => sum + (i.price_ngn || 0) * i.quantity, 0);

  return (
    <div className="container page">
      <h1>Your cart</h1>

      {items.length === 0 ? (
        <div className="empty">
          <p>Your cart is empty. Pick a part from the shop to start an order.</p>
          <Link href="/#shop" className="btn btn-primary">
            Browse parts
          </Link>
        </div>
      ) : (
        <>
          <div className="cart-list">
            {items.map((item) => {
              const name = item.name || "This part";
              const unit = item.price_ngn || 0;
              return (
                <div key={item.product_id} className="cart-row">
                  <div className="cart-row-main">
                    <div className="cart-row-name">
                      {item.slug ? (
                        <Link href={`/products/${item.slug}`}>{name}</Link>
                      ) : (
                        name
                      )}
                    </div>
                    <p className="cart-row-each">{formatNaira(unit)} each</p>
                  </div>

                  <div className="cart-row-controls">
                    <div className="cart-row-qty">
                      <label className="sr-only" htmlFor={`qty-${item.product_id}`}>
                        Quantity for {name}
                      </label>
                      <select
                        id={`qty-${item.product_id}`}
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(item.product_id, Number(e.target.value))
                        }
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
                      className="link-btn cart-row-remove"
                      onClick={() => removeItem(item.product_id)}
                    >
                      Remove
                    </button>
                  </div>

                  <p className="cart-row-total">{formatNaira(unit * item.quantity)}</p>
                </div>
              );
            })}
          </div>

          <div className="cart-summary">
            <div className="cart-summary-head">
              <span>Subtotal</span>
              <span className="summary-amount">{formatNaira(subtotal)}</span>
            </div>
            <Link href="/checkout" className="btn btn-primary">
              Go to checkout
            </Link>
            <button type="button" className="btn btn-ghost" onClick={clearCart}>
              Clear cart
            </button>
          </div>
        </>
      )}
    </div>
  );
}