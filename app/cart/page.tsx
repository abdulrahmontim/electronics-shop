"use client";

import { useCart } from "@/components/CartProvider";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatNaira } from "@/lib/format";
import Link from "next/link";

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, refreshFromSupabase } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    refreshFromSupabase();
  }, []);

  if (!mounted) return <div>Loading...</div>;

  const subtotal = items.reduce((sum, i) => sum + (i.price_ngn || 0) * i.quantity, 0);

  return (
    <div>
      <h1>Cart</h1>
      {items.length === 0 && (
        <div className="notice">
          Your cart is empty. <Link href="/">Continue shopping</Link>
        </div>
      )}
      {items.map((item) => (
        <div key={item.product_id} className="row">
          <div>
            <h3>{item.name || item.product_id}</h3>
            <p style={{ color: "var(--muted)" }}>{formatNaira(item.price_ngn || 0)}</p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <label>
              Qty
              <input
                type="number"
                min="1"
                max="20"
                value={item.quantity}
                onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value) || 1)}
                style={{ width: "4rem", marginLeft: "0.5rem" }}
              />
            </label>
            <button onClick={() => removeItem(item.product_id)}>Remove</button>
          </div>
        </div>
      ))}
      {items.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <p>
            <strong>Subtotal: {formatNaira(subtotal)}</strong>
          </p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={clearCart}>Clear cart</button>
            <Link href="/checkout">
              <button>Checkout</button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}