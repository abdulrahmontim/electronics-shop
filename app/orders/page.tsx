import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatNaira, formatDay } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

function statusLabel(status: string): string {
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : "";
}

export default async function OrdersPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="container page">
        <h1>Your orders</h1>
        <div className="empty">
          <p>You need to sign in to see the orders you have placed.</p>
          <Link href="/login?next=/orders" className="btn btn-primary">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="container page">
      <h1>Your orders</h1>

      {orders && orders.length === 0 && (
        <div className="empty">
          <p>
            You have not ordered anything yet. Your orders will appear here once
            you place one.
          </p>
          <Link href="/#shop" className="btn btn-primary">
            Browse parts
          </Link>
        </div>
      )}

      {orders && orders.length > 0 && (
        <div className="orders-list">
          {orders.map((o) => (
            <Link key={o.id} href={`/orders/${o.id}`} className="order-row">
              <div className="order-main">
                <p className="order-ref">Order {o.id.slice(0, 8).toUpperCase()}</p>
                <p className="order-date">{formatDay(o.created_at)}</p>
              </div>
              <span className="status-pill order-status">{statusLabel(o.status)}</span>
              <span className="order-total">{formatNaira(o.total_ngn)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}