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
      <main>
        <h1 className="text-3xl font-bold mb-4">Order confirmation</h1>
        <div className="card-base card-glass p-4">No confirmation data. You can return to the home page.</div>
        <div className="mt-3">
          <Link className="btn-primary" href="/">Back to Home</Link>
        </div>
      </main>
    );
  }

  const orders = Array.isArray(result.orders) ? result.orders : [];

  return (
    <main>
      <h1 className="text-3xl font-bold mb-4">Thank you! 🎉</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-base card-glass p-4">
          <div className="text-lg font-semibold mb-2">Your orders</div>
          {orders.length === 0 ? (
            <div className="text-sm text-light-muted dark:text-dark-muted">No orders to show.</div>
          ) : (
            <ul className="space-y-3">
              {orders.map((o: Order) => (
                <li key={o.id} className="border border-light-glass-border rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Order #{o.id.slice(0, 8)}</div>
                    <div className="text-sm">{(o.totalCents/100).toFixed(2)} {o.currency}</div>
                  </div>
                  <div className="text-xs text-light-muted dark:text-dark-muted mt-1">Status: {o.status}</div>
                  <ul className="text-sm mt-2 divide-y divide-light-glass-border">
                    {o.items?.map((it: OrderItem) => (
                      <li key={it.id} className="py-1 flex items-center justify-between">
                        <div>{it.quantity} × {it.productId}{it.variantId ? ` (variant)` : ''}</div>
                        <div>{(it.priceCents/100).toFixed(2)} {o.currency}</div>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4">
            <Link className="btn-primary" href="/">Continue shopping</Link>
          </div>
        </div>
        <div className="card-base card-glass p-4 h-fit">
          <div className="text-lg font-semibold mb-2">What happens next?</div>
          <ul className="list-disc list-inside text-sm text-light-muted dark:text-dark-muted space-y-1">
            <li>Your orders are created in Pending Payment status.</li>
            <li>Once payment is integrated, this page will reflect payment results.</li>
            <li>You will also receive order updates by email (future feature).</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
