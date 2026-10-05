import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { sendOrderConfirmation } from "@/lib/mailgun";

function isValidUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Works out who is ordering and returns a client that acts as that user.
 *
 * The browser signs in through @supabase/ssr, so its session arrives as cookies.
 * The mobile app cannot hold those cookies, so it sends the Supabase access
 * token as a bearer token instead. Both paths end up with a client whose
 * requests carry the caller's own JWT, so place_order and row level security
 * still see the real user. No service-role key is involved either way.
 */
async function getOrderClient(
  request: NextRequest
): Promise<{ db: SupabaseClient; userId: string } | { error: NextResponse }> {
  const header = request.headers.get("authorization") ?? "";
  const bearer = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : "";

  if (bearer) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      return {
        error: NextResponse.json(
          { error: "Something went wrong" },
          { status: 500 }
        ),
      };
    }

    const db = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${bearer}` } },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const {
      data: { user },
      error,
    } = await db.auth.getUser();
    if (error || !user) {
      return {
        error: NextResponse.json(
          { error: "Sign in to place an order" },
          { status: 401 }
        ),
      };
    }
    return { db, userId: user.id };
  }

  const db = await createServerSupabaseClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) {
    return {
      error: NextResponse.json(
        { error: "Sign in to place an order" },
        { status: 401 }
      ),
    };
  }
  return { db, userId: user.id };
}

export async function POST(request: NextRequest) {
  const session = await getOrderClient(request);
  if ("error" in session) return session.error;
  const { db: supabase, userId } = session;

  try {
    const body = await request.json();
    const { full_name, phone, address, city, state, items } = body as {
      full_name?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      items?: Array<{ product_id: string; quantity: number }>;
    };

    const name = (full_name || "").trim();
    const ph = (phone || "").trim();
    const addr = (address || "").trim();
    const cty = (city || "").trim();
    const st = (state || "").trim();

    if (!name || !ph || !addr || !cty || !st) {
      return NextResponse.json({ error: "Fill in every delivery field" }, { status: 400 });
    }
    if (name.length > 100 || ph.length > 50 || addr.length > 255 || cty.length > 100 || st.length > 100) {
      return NextResponse.json({ error: "Fill in every delivery field" }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
    }

    const merged = new Map<string, number>();
    for (const it of items) {
      if (!it?.product_id || typeof it.quantity !== "number") continue;
      if (!isValidUuid(it.product_id)) continue;
      const q = Math.max(1, Math.min(20, Math.floor(it.quantity)));
      merged.set(it.product_id, (merged.get(it.product_id) || 0) + q);
    }
    if (merged.size === 0 || merged.size > 50) {
      return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
    }

    const rpcItems = Array.from(merged.entries()).map(([product_id, quantity]) => ({
      product_id,
      quantity,
    }));

    const { data: orderId, error } = await supabase.rpc("place_order", {
      p_full_name: name,
      p_phone: ph,
      p_address: addr,
      p_city: cty,
      p_state: st,
      p_items: rpcItems,
    });

    if (error) {
      if (error.code === "P0001") {
        return NextResponse.json({ error: error.message || "Order failed" }, { status: 400 });
      }
      console.error("place_order failed", error);
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }

    const { data: orderWithItems } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();

    let emailSent = false;
    try {
      await sendOrderConfirmation(supabase, orderId);
      emailSent = true;
    } catch (e) {
      console.error("email failed", e);
      emailSent = false;
    }

    // The order is saved, so the shared cart is emptied here. A missing
    // cart_items table must not turn a placed order into a failed request.
    try {
      await supabase.from("cart_items").delete().eq("user_id", userId);
    } catch (e) {
      console.error("cart clear failed", e);
    }

    return NextResponse.json({ orderId, emailSent });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}