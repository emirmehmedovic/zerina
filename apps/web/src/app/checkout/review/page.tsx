"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { API_URL } from "@/lib/api";
import { getCsrfToken } from "@/lib/csrf";

export default function CheckoutReviewPage() {
  const router = useRouter();
  const { items, clear } = useCart();
  const [shipping, setShipping] = useState<{ street: string; city: string; postalCode: string; country: string } | null>(null);
  const [billing, setBilling] = useState<{ street: string; city: string; postalCode: string; country: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validated, setValidated] = useState<{ items: any[]; totalCents: number; currency: string } | null>(null);
  const [placing, setPlacing] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    try {
      const s = sessionStorage.getItem("checkout:shipping");
      const b = sessionStorage.getItem("checkout:billing");
      if (!s || !b) {
        router.push("/checkout");
        return;
      }
      setShipping(JSON.parse(s));
      setBilling(JSON.parse(b));
    } catch {}
  }, [router]);

  useEffect(() => {
    const run = async () => {
      if (!shipping || !billing) return;
      if (items.length === 0) {
        setError("Cart is empty");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // Get CSRF token
        const csrf = await getCsrfToken();
        
        const res = await fetch(`${API_URL}/api/v1/checkout/validate`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-CSRF-Token": csrf
          },
          credentials: "include",
          body: JSON.stringify({ items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, qty: i.qty })) }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error || `Failed (${res.status})`);
        setValidated(body);
      } catch (e: any) {
        setError(e?.message || "Failed to validate cart");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [items, shipping, billing]);

  const placeOrder = async () => {
    if (!shipping || !billing) return;
    setPlacing(true);
    try {
      // Get CSRF token
      const csrf = await getCsrfToken();
      
      const res = await fetch(`${API_URL}/api/v1/checkout/draft`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrf
        },
        credentials: "include",
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, qty: i.qty })),
          shipping,
          billing,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `Failed (${res.status})`);
      setResult(body);
      try {
        sessionStorage.setItem("checkout:result", JSON.stringify(body));
      } catch {}
      clear();
      router.push("/checkout/confirmation");
    } catch (e: any) {
      setError(e?.message || "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  if (!shipping || !billing) return null;

  return (
    <main>
      <h1 className="text-3xl font-bold mb-4">Review your order</h1>
      {loading ? (
        <div className="card-base card-glass p-4">Validating your cart…</div>
      ) : error ? (
        <div className="card-base card-glass p-4 text-red-600 text-sm">{error}</div>
      ) : result ? (
        <div className="card-base card-glass p-4">
          <div className="text-lg font-semibold mb-2">Order created</div>
          <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
          <div className="mt-3">
            <a href="/" className="btn-primary">Back to Home</a>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card-base card-glass p-4">
            <div className="text-lg font-semibold mb-2">Items</div>
            {/* Group by shop */}
            {(() => {
              const groups: Record<string, { shop?: any; rows: any[]; subtotal: number }> = {};
              (validated?.items || []).forEach((it) => {
                const key = it.shopId || 'unknown';
                if (!groups[key]) groups[key] = { shop: it.shop, rows: [], subtotal: 0 };
                groups[key].rows.push(it);
                groups[key].subtotal += it.priceCents * it.qty;
              });
              const entries = Object.entries(groups);
              return (
                <div className="space-y-4">
                  {entries.map(([shopId, g]) => (
                    <div key={shopId} className="border border-light-glass-border rounded-md p-3">
                      <div className="mb-2 text-sm font-medium">{g.shop?.name || 'Shop'}{g.shop?.slug && (
                        <a className="ml-2 text-xs underline" href={`/shops/${g.shop.slug}`}>View shop</a>
                      )}</div>
                      <ul className="divide-y divide-light-glass-border">
                        {g.rows.map((it, idx) => (
                          <li key={idx} className="py-2 flex items-center justify-between">
                            <div className="text-sm">{it.title} {it.variantId ? `(variant)` : ''} × {it.qty}</div>
                            <div className="text-sm font-medium">{((it.priceCents * it.qty)/100).toFixed(2)} {validated?.currency}</div>
                          </li>
                        ))}
                      </ul>
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-xs text-light-muted dark:text-dark-muted">Shop subtotal</div>
                        <div className="text-sm font-medium">{(g.subtotal/100).toFixed(2)} {validated?.currency}</div>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-light-muted dark:text-dark-muted">Total</div>
                    <div className="text-sm font-medium">{(validated!.totalCents/100).toFixed(2)} {validated?.currency}</div>
                  </div>
                </div>
              );
            })()}
          </div>
          <div className="card-base card-glass p-4 h-fit">
            <div className="text-lg font-semibold mb-2">Addresses</div>
            <div className="mb-3">
              <div className="text-sm font-medium mb-1">Shipping</div>
              <div className="text-sm text-light-muted dark:text-dark-muted">{shipping.street}, {shipping.city} {shipping.postalCode}, {shipping.country}</div>
            </div>
            <div className="mb-4">
              <div className="text-sm font-medium mb-1">Billing</div>
              <div className="text-sm text-light-muted dark:text-dark-muted">{billing.street}, {billing.city} {billing.postalCode}, {billing.country}</div>
            </div>
            <button className="btn-primary w-full" onClick={placeOrder} disabled={placing}>{placing ? 'Placing…' : 'Place order'}</button>
          </div>
        </div>
      )}
    </main>
  );
}
