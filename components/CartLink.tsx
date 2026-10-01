"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";
import { useEffect, useState } from "react";

export function CartLink() {
  const { count } = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <Link href="/cart">
      Cart {mounted && count > 0 && <span className="badge">{count}</span>}
    </Link>
  );
}
