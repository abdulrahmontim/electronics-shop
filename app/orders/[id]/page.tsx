import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatNaira, formatDay } from "@/lib/format";

export const dynamic = "force-dynamic";

function isUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

function statusLabel(status: string): string {
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : "";
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
    <div className="container page order-detail">
      {email === "sent" && (
        <p className="msg msg-success">
          Confirmation email sent to {order.email}.
        </p>
      )}
      {email === "failed" && (
        <p className="msg msg-neutral">
          Your order is saved, but the confirmation email could not be sent. You
          can keep this page as your receipt.
        </p>
      )}

      <h1>Order {order.id.slice(0, 8).toUpperCase()}</h1>
      <p className="order-meta">{formatDay(order.created_at)}</p>
      <p className="status-pill">{statusLabel(order.status)}</p>

      <div className="order-lines">
        {order.order_items?.map((it: any) => (
          <div key={it.id} className="order-line">
            <div className="order-line-name">
              {it.product_name}
              <div className="order-line-meta">
                {it.quantity} × {formatNaira(it.unit_price_ngn)}
              </div>
            </div>
            <span className="order-line-total">
              {formatNaira(it.unit_price_ngn * it.quantity)}
            </span>
          </div>
        ))}
      </div>

      <div className="order-total-row">
        <span>Total</span>
        <span>{formatNaira(order.total_ngn)}</span>
      </div>

      <h2>Delivering to</h2>
      <div className="address">
        <p>{order.full_name}</p>
        <p>{order.address}</p>
        <p>
          {order.city}, {order.state}
        </p>
        <p>{order.phone}</p>
      </div>

      <Link href="/#shop" className="btn btn-ghost order-continue">
        Continue shopping
      </Link>
    </div>
  );
}