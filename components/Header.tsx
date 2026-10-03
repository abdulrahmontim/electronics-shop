"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SHOP_NAME } from "@/lib/config";
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
      <div className="container header-inner">
        <Link href="/" className="logo">
          {SHOP_NAME}
        </Link>
        <nav className="nav-links" aria-label="Main">
          <Link href="/">Shop</Link>
          {user && <Link href="/orders">Orders</Link>}
          <Link href="/cart">
            Cart
            {mounted && count > 0 && <span className="badge">{count}</span>}
          </Link>
          {user ? (
            <form action="/auth/signout" method="post">
              <button type="submit" className="link-btn">
                Sign out
              </button>
            </form>
          ) : (
            <Link href="/login">Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}