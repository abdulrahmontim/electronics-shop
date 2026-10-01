import { SHOP_NAME } from "@/lib/config";

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  if (!apiKey || !domain) {
    throw new Error("Missing Mailgun configuration");
  }
  const apiBase = process.env.MAILGUN_API_BASE || "https://api.mailgun.net";
  const from = process.env.MAILGUN_FROM || `Bench Supply <postmaster@${domain}>`;

  const formData = new URLSearchParams();
  formData.append("from", from);
  formData.append("to", params.to);
  formData.append("subject", params.subject);
  formData.append("text", params.text);
  formData.append("html", params.html);

  const res = await fetch(`${apiBase}/v3/${domain}/messages`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from("api:" + apiKey).toString("base64"),
    },
    body: formData,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Mailgun error: ${res.status} ${txt}`);
  }
}

export async function sendOrderConfirmation(supabase: any, orderId: string) {
  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .single();
  if (!order) return;

  const ref = order.id.slice(0, 8).toUpperCase();
  const subject = `Your Bench Supply order ${ref}`;

  const textLines = [
    `Order: ${ref}`,
    `Date: ${new Date(order.created_at).toLocaleString("en-NG")}`,
    `Total: ₦${Number(order.total_ngn).toLocaleString("en-NG")}`,
    "",
    "Items:",
  ];
  for (const it of order.order_items || []) {
    textLines.push(`${it.product_name} x ${it.quantity} - ₦${Number(it.unit_price_ngn).toLocaleString("en-NG")} each`);
  }
  textLines.push("");
  textLines.push("Delivery:");
  textLines.push(order.full_name);
  textLines.push(order.phone);
  textLines.push(order.address);
  textLines.push(`${order.city}, ${order.state}`);
  const text = textLines.join("\n");

  const htmlItems = (order.order_items || [])
    .map(
      (it: any) => `<li>${escapeHtml(it.product_name)} x ${it.quantity} - ₦${Number(it.unit_price_ngn).toLocaleString("en-NG")} each</li>`
    )
    .join("");
  const html = `
    <div>
      <h2>Your Bench Supply order ${escapeHtml(ref)}</h2>
      <p>Date: ${escapeHtml(new Date(order.created_at).toLocaleString("en-NG"))}</p>
      <p>Total: ₦${escapeHtml(Number(order.total_ngn).toLocaleString("en-NG"))}</p>
      <h3>Items</h3>
      <ul>${htmlItems}</ul>
      <h3>Delivery</h3>
      <p>${escapeHtml(order.full_name)}</p>
      <p>${escapeHtml(order.phone)}</p>
      <p>${escapeHtml(order.address)}</p>
      <p>${escapeHtml(order.city)}, ${escapeHtml(order.state)}</p>
    </div>
  `;

  await sendEmail({ to: order.email, subject, text, html });
}