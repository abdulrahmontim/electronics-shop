import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatNaira, formatDate } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div>
        <h1>Orders</h1>
        <p>You need to sign in to view your orders.</p>
        <Link href="/login?next=/orders">Sign in</Link>
      </div>
    );
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1>Orders</h1>
      {orders && orders.length === 0 && (
        <div className="notice">
          You have no orders yet. <Link href="/">Continue shopping</Link>
        </div>
      )}
      {orders?.map((o) => (
        <div key={o.id} className="row">
          <div>
            <Link href={`/orders/${o.id}`}>Order #{o.id.slice(0, 8).toUpperCase()}</Link>
          </div>
          <div>{formatDate(o.created_at)}</div>
          <div>{o.status}</div>
          <div>{formatNaira(o.total_ngn)}</div>
        </div>
      ))}
    </div>
  );
}