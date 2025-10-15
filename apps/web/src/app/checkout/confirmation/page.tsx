"use client";

import { useEffect, useState } from "react";
import Link from 'next/link';

type OrderItem = {
  id: string;
  quantity: number;
  priceCents: number;
  productId: string;
  variantId?: string;
};

type Order = {
  id: string;
  totalCents: number;
  currency: string;
  status: string;
  items: OrderItem[];
};

type CheckoutResult = {
  orders: Order[];
};

export default function CheckoutConfirmationPage() {
  const [result, setResult] = useState<CheckoutResult | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("checkout:result");
      if (raw) setResult(JSON.parse(raw));
    } catch {}
  }, []);

  if (!result) {
    return (
      <main className="min-h-screen p-6 sm:p-10">
        <div className="relative w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-6 tracking-tight text-amber-900">Order confirmation</h1>
          <div className="card-base card-glass p-5 ring-1 ring-rose-200/40 rounded-2xl text-amber-900">No confirmation data. You can return to the home page.</div>
          <div className="mt-4">
            <Link className="group inline-block rounded-xl px-5 py-3 font-semibold text-amber-900 ring-1 ring-rose-200/60 bg-gradient-to-r from-rose-100/80 via-amber-100/80 to-rose-100/80 hover:from-rose-100 hover:to-amber-100 transition-colors" href="/">Back to Home<span aria-hidden className="sr-only"> </span></Link>
          </div>
        </div>
      </main>
    );
  }

  const orders = Array.isArray(result.orders) ? result.orders : [];

  return (
    <main className="min-h-screen p-6 sm:p-10 relative overflow-hidden">
      <div className="relative w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Thank-you hero card */}
        <div className="mb-6 rounded-2xl p-6 sm:p-8 ring-1 ring-rose-200/50 dark:ring-rose-400/20 bg-gradient-to-br from-rose-100/70 via-amber-100/60 to-rose-100/70">
          <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-amber-900 dark:text-amber-900">Thank you for your order! 🎉</h1>
              <p className="mt-2 text-sm sm:text-base text-amber-900/90 dark:text-amber-900/90">We’ve received your order. You’ll receive updates about its status and delivery soon.</p>
            </div>
            <div className="shrink-0 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold text-amber-900 dark:text-amber-900 ring-1 ring-rose-200/60 bg-white/60">
              <span aria-hidden>✅</span>
              <span>Potvrđeno</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card-base card-glass p-5 ring-1 ring-rose-200/40 rounded-2xl">
            <div className="text-lg font-semibold mb-3 text-amber-900 dark:text-amber-900">Your orders</div>
            {orders.length === 0 ? (
              <div className="text-sm text-amber-900/80 dark:text-amber-900/80">No orders to show.</div>
            ) : (
              <ul className="space-y-3">
                {orders.map((o: Order) => (
                  <li key={o.id} className="rounded-xl p-4 ring-1 ring-rose-200/40 dark:ring-rose-400/20 bg-rose-50/20 dark:bg-rose-500/5">
                    <div className="flex items-start sm:items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-amber-900 dark:text-amber-900">Order #{o.id.slice(0, 8)}</div>
                      <div className="inline-flex items-center gap-2">
                        <span className="text-[11px] px-2 py-1 rounded-full bg-rose-100/70 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200 border border-rose-200/50 dark:border-rose-400/20 capitalize">{o.status}</span>
                        <div className="text-sm font-semibold text-amber-900 dark:text-amber-900">{(o.totalCents/100).toFixed(2)} {o.currency}</div>
                      </div>
                    </div>
                    <div aria-hidden className="h-px w-full bg-gradient-to-r from-rose-200/50 via-amber-200/50 to-rose-200/50 rounded-full mt-2" />
                    <ul className="text-sm mt-3 divide-y divide-rose-200/50 dark:divide-rose-400/20">
                      {o.items?.map((it: OrderItem) => (
                        <li key={it.id} className="py-1.5 flex items-center justify-between">
                          <div className="text-amber-900 dark:text-amber-900">{it.quantity} × {it.productId}{it.variantId ? ` (variant)` : ''}</div>
                          <div className="text-amber-900 dark:text-amber-900 font-medium">{(it.priceCents/100).toFixed(2)} {o.currency}</div>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              <Link className="group inline-block rounded-xl px-5 py-3 font-semibold text-amber-900 dark:text-amber-900 ring-1 ring-rose-200/60 dark:ring-rose-400/20 bg-gradient-to-r from-rose-100/80 via-amber-100/80 to-rose-100/80 hover:from-rose-100 hover:to-amber-100 transition-colors" href="/">Continue shopping</Link>
            </div>
          </div>
          <div className="card-base card-glass p-5 h-fit ring-1 ring-rose-200/40 dark:ring-rose-400/20 rounded-2xl">
            <div className="text-lg font-semibold mb-2 text-amber-900 dark:text-amber-900">What happens next?</div>
            <ul className="list-disc list-inside text-sm text-amber-900/80 dark:text-amber-900/80 space-y-1">
              <li>Your orders are created in Pending Payment status.</li>
              <li>Once payment is integrated, this page will reflect payment results.</li>
              <li>You will also receive order updates by email (future feature).</li>
            </ul>
            <div className="mt-3 text-xs text-amber-900/80 dark:text-amber-900/80">Need help? <a href="/support" className="underline">Contact support</a>.</div>
          </div>
        </div>
      </div>
    </main>
  );
}
