"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";
import { useEffect, useRef, useState } from "react";
import StaticImage from "@/components/StaticImage";
import { ShoppingCart } from "lucide-react";

export default function HeaderCart() {
  const { items, totalCents, setQty, remove } = useCart();
  const count = items.reduce((n, it) => n + it.qty, 0);
  const currency = items[0]?.currency || "EUR";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Force cart to open on direct click to cart page if not opening properly
  const handleCartClick = () => {
    setOpen((o) => !o);
    // If cart doesn't open after a short delay, redirect to cart page
    setTimeout(() => {
      if (!open) {
        window.location.href = '/cart';
      }
    }, 100);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={handleCartClick}
        className="relative inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/20 hover:bg-white/30 text-white border border-white/30 transition"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="mini-cart"
        title="Cart"
      >
        <ShoppingCart className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-rose-600 text-white text-[11px] leading-5 text-center font-semibold shadow">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div id="mini-cart" className="absolute right-0 mt-2 w-80 card-base card-glass p-3 z-50 shadow-lg">
          {items.length === 0 ? (
            <div className="text-sm text-light-muted dark:text-dark-muted">Your cart is empty.</div>
          ) : (
            <div className="space-y-3">
              <ul className="max-h-64 overflow-auto divide-y divide-light-glass-border">
                {items.map((it) => (
                  <li key={it.id} className="py-2 flex items-center gap-3">
                    {it.image ? (
                      <StaticImage fileName={it.image} alt={it.title} className="h-10 w-10 rounded object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-light-muted/10 dark:bg-dark-muted/10" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-medium">{it.title}</div>
                      <div className="text-xs text-light-muted dark:text-dark-muted">{(it.priceCents/100).toFixed(2)} {it.currency}</div>
                    </div>
                    <div className="inline-flex items-center gap-1">
                      <button className="btn-secondary" onClick={() => setQty(it.id, Math.max(1, it.qty - 1))}>-</button>
                      <input
                        type="number"
                        min={1}
                        className="w-12 text-center border border-light-glass-border rounded-md px-1 py-0.5 bg-white/30 backdrop-blur-sm dark:bg-zinc-800/30 text-xs"
                        value={it.qty}
                        onChange={(e) => setQty(it.id, Math.max(1, Number(e.target.value) || 1))}
                      />
                      <button className="btn-secondary" onClick={() => setQty(it.id, it.qty + 1)}>+</button>
                    </div>
                    <button 
                      className="text-xs underline underline-offset-4 text-rose-600" 
                      onClick={() => {
                        if (window.confirm(`Remove ${it.title} from cart?`)) {
                          remove(it.id);
                        }
                      }}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between text-sm">
                <div className="text-light-muted dark:text-dark-muted">Subtotal</div>
                <div className="font-medium">{(totalCents/100).toFixed(2)} {currency}</div>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/cart" className="btn-secondary flex-1 text-center" onClick={() => setOpen(false)}>View cart</Link>
                <Link href="/checkout" className="btn-primary flex-1 text-center" onClick={() => setOpen(false)}>Checkout</Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
