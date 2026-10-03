"use client";

import { useCart } from "@/components/CartProvider";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatNaira } from "@/lib/format";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function CheckoutForm() {
  const { items, clearCart, refreshFromSupabase } = useCart();
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    refreshFromSupabase();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        const meta = data.user.user_metadata || {};
        setForm((f) => ({
          ...f,
          full_name: meta.full_name || meta.name || f.full_name,
        }));
      }
    });
  }, []);

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
  });

  if (!mounted) return <p className="muted">Loading checkout...</p>;

  const subtotal = items.reduce((sum, i) => sum + (i.price_ngn || 0) * i.quantity, 0);
  const valid = form.full_name.trim() && form.phone.trim() && form.address.trim() && form.city.trim() && form.state.trim() && items.length > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    const body = {
      ...form,
      items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
    };
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Order failed");
        setSubmitting(false);
        return;
      }
      clearCart();
      const q = data.emailSent ? "email=sent" : "email=failed";
      router.push(`/orders/${data.orderId}?${q}`);
    } catch (e: any) {
      setError("Something went wrong");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="checkout-layout">
      <div className="checkout-form">
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={user?.email ?? ""}
            readOnly
            autoComplete="email"
          />
        </div>

        <div className="field">
          <label htmlFor="full_name">Full name</label>
          <input
            id="full_name"
            name="full_name"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            autoComplete="name"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="phone">Phone</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            autoComplete="tel"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="address">Address</label>
          <input
            id="address"
            name="address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            autoComplete="street-address"
            required
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="city">City</label>
            <input
              id="city"
              name="city"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              autoComplete="address-level2"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="state">State</label>
            <input
              id="state"
              name="state"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              autoComplete="address-level1"
              required
            />
          </div>
        </div>

        {error && <p className="msg msg-error">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={!valid || submitting}>
          {submitting ? "Placing order..." : `Place order, ${formatNaira(subtotal)}`}
        </button>
      </div>

      <aside className="checkout-summary" aria-label="Order summary">
        <h2>Order summary</h2>
        {items.length === 0 ? (
          <div className="empty">
            <p>Your cart is empty, so there is nothing to order yet.</p>
            <Link href="/#shop" className="btn btn-primary">
              Browse parts
            </Link>
          </div>
        ) : (
          <>
            {items.map((i) => (
              <div key={i.product_id} className="summary-row">
                <span className="summary-row-name">
                  {i.name || "Item"} <span className="muted">× {i.quantity}</span>
                </span>
                <span className="summary-row-total">
                  {formatNaira((i.price_ngn || 0) * i.quantity)}
                </span>
              </div>
            ))}
            <div className="summary-total">
              <span>Total</span>
              <span>{formatNaira(subtotal)}</span>
            </div>
          </>
        )}
      </aside>
    </form>
  );
}