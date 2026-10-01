"use client";

import { useCart } from "@/components/CartProvider";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatNaira } from "@/lib/format";
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

  if (!mounted) return <div>Loading...</div>;

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
    <form onSubmit={submit} className="form">
      {error && <div className="error">{error}</div>}
      <div className="input">
        <label htmlFor="full_name">Full name</label>
        <input id="full_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
      </div>
      <div className="input">
        <label htmlFor="phone">Phone</label>
        <input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
      </div>
      <div className="input">
        <label htmlFor="address">Address</label>
        <input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
      </div>
      <div className="input">
        <label htmlFor="city">City</label>
        <input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
      </div>
      <div className="input">
        <label htmlFor="state">State</label>
        <input id="state" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
      </div>
      <div>
        <h2>Order summary</h2>
        {items.map((i) => (
          <div key={i.product_id} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--hairline)", padding: "0.5rem 0" }}>
            <span>{i.name || "Item"} x {i.quantity}</span>
            <span>{formatNaira((i.price_ngn || 0) * i.quantity)}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
          <strong>Total</strong>
          <strong>{formatNaira(subtotal)}</strong>
        </div>
      </div>
      <button type="submit" disabled={!valid || submitting}>
        {submitting ? "Placing order..." : `Place order, ${formatNaira(subtotal)}`}
      </button>
    </form>
  );
}