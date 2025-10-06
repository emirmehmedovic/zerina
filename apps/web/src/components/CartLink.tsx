"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "./CartProvider";

export default function CartLink() {
  const { items } = useCart();
  const count = items.reduce((n, it) => n + it.qty, 0);

  return (
    <Link 
      href="/cart" 
      className="relative inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/20 hover:bg-white/30 text-amber-900 border border-white/30 transition" 
      title="Cart"
    >
      <ShoppingCart className="h-5 w-5 text-amber-900" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-rose-600 text-white text-[11px] leading-5 text-center font-semibold shadow">
          {count}
        </span>
      )}
    </Link>
  );
}
