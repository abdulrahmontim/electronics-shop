"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "./CartProvider";

export function Header() {
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();
  const { count } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <header>
      <nav>
        <Link href="/" className="logo">
          Bench Supply
        </Link>
        <div className="nav-links">
          <Link href="/">Shop</Link>
          {user && <Link href="/orders">Orders</Link>}
          <Link href="/cart">
            Cart
            {mounted && count > 0 && <span className="badge">{count}</span>}
          </Link>
          {user ? (
            <form action="/auth/signout" method="post">
              <button type="submit">Sign out</button>
            </form>
          ) : (
            <Link href="/login">Sign in</Link>
          )}
        </div>
      </nav>
    </header>
  );
}
