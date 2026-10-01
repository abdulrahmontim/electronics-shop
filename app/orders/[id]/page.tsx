import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { formatNaira, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

function isUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ email?: string }>;
}) {
  const { id } = await params;
  const { email } = await searchParams;
  if (!isUuid(id)) {
    notFound();
  }
  const supabase = await createServerSupabaseClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .single();
  if (error || !order) {
    notFound();
  }

  return (
    <div>
      {email === "sent" && (
        <div className="notice">Confirmation email sent to {order.email}</div>
      )}
      {email === "failed" && (
        <div className="notice">
          Your order is saved, but the confirmation email could not be sent.
        </div>
      )}
      <h1>Order #{order.id.slice(0, 8).toUpperCase()}</h1>
      <p>Date: {formatDate(order.created_at)}</p>
      <p>Status: {order.status}</p>
      <h2>Items</h2>
      {order.order_items?.map((it: any) => (
        <div key={it.id} className="row">
          <div>{it.product_name}</div>
          <div>Qty: {it.quantity}</div>
          <div>Unit: {formatNaira(it.unit_price_ngn)}</div>
          <div>Total: {formatNaira(it.unit_price_ngn * it.quantity)}</div>
        </div>
      ))}
      <h2>Delivery</h2>
      <p>{order.full_name}</p>
      <p>{order.phone}</p>
      <p>{order.address}</p>
      <p>
        {order.city}, {order.state}
      </p>
      <p>
        <strong>Total: {formatNaira(order.total_ngn)}</strong>
      </p>
    </div>
  );
}