import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CheckoutForm } from "./CheckoutForm";

export default async function CheckoutPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/checkout");
  }

  return (
    <div className="container page">
      <h1>Checkout</h1>
      <CheckoutForm />
    </div>
  );
}