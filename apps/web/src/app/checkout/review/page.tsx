"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { loadStripe, type Appearance } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

type ValidatedItem = {
  shopId: string;
  shop: { name: string; slug: string };
  title: string;
  variantId?: string;
  qty: number;
  priceCents: number;
};

type ValidatedData = {
  items: ValidatedItem[];
  totalCents: number;
  currency: string;
  discount?: {
    code: string;
    percentOff: number;
    amountCents: number;
    shopId: string;
    shopName?: string | null;
  } | null;
  discountCents?: number;
  payableCents?: number;
};

type Group = {
  shop?: { name: string; slug: string };
  rows: ValidatedItem[];
  subtotal: number;
};
import { useCart } from "@/components/CartProvider";
import { API_URL } from "@/lib/api";
import { imageUrl } from "@/lib/imageUrl";
import { getCsrfToken } from "@/lib/csrf";
import AddToCartButton from "@/components/AddToCartButton";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;
const appearance: Appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#f97316',
    colorBackground: '#ffffff',
    colorText: '#0f172a',
  },
};

type StripePaymentFormProps = {
  intentId: string | null;
  onSubmit: (paymentIntentId?: string) => Promise<void>;
  placing: boolean;
  paymentError: string | null;
  setPaymentError: (message: string | null) => void;
};

function StripePaymentForm({ intentId, onSubmit, placing, paymentError, setPaymentError }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [confirmingPayment, setConfirmingPayment] = useState(false);

  const handleSubmit = async () => {
    if (!stripe || !elements) {
      setPaymentError('Payment form is not ready yet.');
      return;
    }
    setPaymentError(null);
    setConfirmingPayment(true);
    try {
      const result = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });
      if (result.error) {
        throw new Error(result.error.message || 'Payment confirmation failed.');
      }
      await onSubmit(intentId || undefined);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setPaymentError(err.message);
      } else {
        setPaymentError('An unknown payment error occurred.');
      }
    } finally {
      setConfirmingPayment(false);
    }
  };

  return (
    <>
      <div className="mb-4 rounded-xl border border-rose-200/60 dark:border-rose-400/20 bg-white/70 p-4">
        <PaymentElement options={{ layout: 'tabs' }} />
      </div>
      {paymentError && (
        <div className="mb-3 rounded-lg border border-red-400/40 bg-red-100/60 px-3 py-2 text-sm text-red-700">{paymentError}</div>
      )}
      <button
        className="group relative w-full rounded-xl px-5 py-3 font-semibold text-amber-900 dark:text-amber-900 shadow-sm ring-1 ring-rose-200/60 dark:ring-rose-400/20 bg-gradient-to-r from-rose-100/80 via-amber-100/80 to-rose-100/80 hover:from-rose-100 hover:to-amber-100 transition-colors disabled:opacity-60"
        onClick={handleSubmit}
        disabled={placing || confirmingPayment}
      >
        {placing || confirmingPayment ? 'Processing…' : 'Confirm and pay'}
        <span aria-hidden className="absolute inset-0 rounded-xl pointer-events-none shadow-[0_0_0_1px_rgba(244,114,182,0.25)_inset]" />
      </button>
    </>
  );
}

function InnerCheckoutReview() {
  const router = useRouter();
  const { items, clear } = useCart();
  const [shipping, setShipping] = useState<{ street: string; city: string; postalCode: string; country: string } | null>(null);
  const [billing, setBilling] = useState<{ street: string; city: string; postalCode: string; country: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validated, setValidated] = useState<ValidatedData | null>(null);
  const [placing, setPlacing] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [recommended, setRecommended] = useState<Array<{
    id: string;
    slug: string;
    title: string;
    priceCents: number;
    originalPriceCents?: number;
    discountPercent?: number;
    isOnSale?: boolean;
    currency: string;
    images?: Array<{ storageKey: string }>;
    shop?: { slug: string };
  }> | null>(null);

  const [discountInput, setDiscountInput] = useState("");
  const [discountFeedback, setDiscountFeedback] = useState<string | null>(null);
  const [discountApplying, setDiscountApplying] = useState(false);
  const [activeDiscountCode, setActiveDiscountCode] = useState<string | null>(null);

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
          body: JSON.stringify({
            items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, qty: i.qty })),
            discountCode: activeDiscountCode || undefined,
          }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error || `Failed (${res.status})`);
        setValidated(body);
        if (body?.discount?.code) {
          setActiveDiscountCode(body.discount.code);
          setDiscountFeedback(`Discount ${body.discount.code} applied.`);
          setDiscountInput(body.discount.code);
        } else {
          setDiscountFeedback(null);
        }
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [items, shipping, billing, activeDiscountCode]);

  // Fetch a few suggested products for the "Forgot something?" strip after validation completes,
  // cache in sessionStorage, and filter out items already in the cart
  useEffect(() => {
    if (loading) return;
    const run = async () => {
      try {
        // Try cache first
        try {
          const cached = sessionStorage.getItem('checkout:recs');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) {
              const filtered = parsed.filter((p: any) => !items.some((ci) => ci.productId === p.id));
              setRecommended(filtered);
              return;
            }
          }
        } catch {}

        const res = await fetch(`${API_URL}/api/v1/products?latest=1&take=6&noCount=1`, { credentials: 'include' });
        const body = await res.json().catch(() => ({}));
        if (res.ok) {
          const list = Array.isArray(body.items) ? body.items : [];
          const filtered = list.filter((p: any) => !items.some((ci) => ci.productId === p.id));
          setRecommended(filtered);
          try { sessionStorage.setItem('checkout:recs', JSON.stringify(list)); } catch {}
        }
      } catch {}
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [intentId, setIntentId] = useState<string | null>(null);

  useEffect(() => {
    if (!items.length || !shipping || !billing) return;
    const createIntent = async () => {
      try {
        const csrf = await getCsrfToken();
        const res = await fetch(`${API_URL}/api/v1/checkout/payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrf,
          },
          credentials: 'include',
          body: JSON.stringify({
            items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, qty: i.qty })),
            discountCode: activeDiscountCode || undefined,
          }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error || `Failed (${res.status})`);
        setClientSecret(body.clientSecret || null);
        setIntentId(body.paymentIntentId || null);
        setPaymentError(null);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setPaymentError(err.message);
        } else {
          setPaymentError('Unable to create payment.');
        }
      }
    };
    createIntent();
  }, [items, shipping, billing, activeDiscountCode]);

  const submitOrder = async (paymentIntentId?: string) => {
    if (!shipping || !billing) {
      setPaymentError('Missing address information.');
      throw new Error('Missing address information.');
    }
    setPlacing(true);
    setPaymentError(null);
    try {
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
          discountCode: validated?.discount?.code || undefined,
          paymentIntentId,
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
    } catch (e: unknown) {
      if (e instanceof Error) {
        setPaymentError(e.message);
        throw e;
      } else {
        setPaymentError("An unknown error occurred");
        throw new Error('An unknown error occurred');
      }
    } finally {
      setPlacing(false);
    }
  };

  const applyDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountInput.trim()) {
      setDiscountFeedback("Enter a discount code.");
      return;
    }
    setDiscountApplying(true);
    setDiscountFeedback(null);
    try {
      const csrf = await getCsrfToken();
      const normalized = discountInput.trim().toUpperCase();
      const res = await fetch(`${API_URL}/api/v1/checkout/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrf,
        },
        credentials: "include",
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, qty: i.qty })),
          discountCode: normalized,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.message || body?.error || `Failed (${res.status})`);
      }
      setValidated(body);
      setActiveDiscountCode(body?.discount?.code || normalized);
      setDiscountInput(body?.discount?.code || normalized);
      setDiscountFeedback(`Discount ${body?.discount?.code || normalized} applied.`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setDiscountFeedback(err.message);
      } else {
        setDiscountFeedback("Unable to apply discount");
      }
    } finally {
      setDiscountApplying(false);
    }
  };

  const removeDiscount = async () => {
    setActiveDiscountCode(null);
    setDiscountInput("");
    setDiscountFeedback("Discount removed.");
    setValidated((prev) => prev ? { ...prev, discount: null, discountCents: 0, payableCents: prev.totalCents } : prev);
  };

  if (!shipping || !billing) {
    return (
      <main className="min-h-screen p-6 sm:p-10 relative overflow-hidden">
        <div className="relative w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="card-base card-glass p-5 ring-1 ring-rose-200/40 rounded-2xl">
            <div className="text-amber-900 dark:text-amber-900 mb-3">We couldn't find your address details for this step.</div>
            <a href="/checkout" className="group inline-block rounded-xl px-5 py-3 font-semibold text-amber-900 dark:text-amber-900 ring-1 ring-rose-200/60 bg-gradient-to-r from-rose-100/80 via-amber-100/80 to-rose-100/80 hover:from-rose-100 hover:to-amber-100 transition-colors">Go back to Address</a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 sm:p-10 relative overflow-hidden">
      <div className="relative w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Progress indicator */}
        <div className="mb-4 flex items-center gap-2 text-xs font-medium text-amber-900">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-100/70 text-amber-900 ring-1 ring-rose-200/60">1</span>
            <span>Address</span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-rose-200/60 via-amber-200/60 to-rose-200/60" />
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-100/80 text-amber-900 ring-1 ring-rose-200/60">2</span>
            <span>Review</span>
          </div>
          <div className="flex items-center gap-2 opacity-80">
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-50/70 text-amber-900 ring-1 ring-rose-200/60">3</span>
            <span className="dark:text-amber-900">Confirm</span>
          </div>
        </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-6 tracking-tight text-amber-900 dark:text-amber-900">Review your order</h1>
        {loading ? (
          <div className="card-base card-glass p-4 text-amber-900 dark:text-amber-900">Validating your cart…</div>
        ) : error ? (
          <div className="card-base card-glass p-4 text-sm text-red-700 dark:text-red-400">{error}</div>
        ) : result ? (
          <div className="card-base card-glass p-4">
            <div className="text-lg font-semibold mb-2 text-amber-900 dark:text-amber-900">Order created</div>
            <pre className="text-xs whitespace-pre-wrap text-amber-900 dark:text-amber-900">{JSON.stringify(result, null, 2)}</pre>
            <div className="mt-3">
              <Link href="/" className="group inline-block rounded-xl px-4 py-2 font-semibold text-amber-900 dark:text-amber-900 ring-1 ring-rose-200/60 bg-gradient-to-r from-rose-100/80 via-amber-100/80 to-rose-100/80 hover:from-rose-100 hover:to-amber-100 transition-colors">Back to Home</Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card-base card-glass p-5 ring-1 ring-rose-200/40 dark:ring-rose-400/20 rounded-2xl">
              <div className="text-lg font-semibold mb-3 text-amber-900 dark:text-amber-900">Items</div>
              {/* Group by shop */}
              {(() => {
                const groups: Record<string, Group> = {};
                (validated?.items || []).forEach((it: ValidatedItem) => {
                  const key = it.shopId || 'unknown';
                  if (!groups[key]) groups[key] = { shop: it.shop, rows: [], subtotal: 0 };
                  groups[key].rows.push(it);
                  groups[key].subtotal += it.priceCents * it.qty;
                });
                const entries = Object.entries(groups);
                return (
                  <div className="space-y-4">
                    {entries.map(([shopId, g]) => (
                      <div key={shopId} className="rounded-xl p-4 ring-1 ring-rose-200/40 dark:ring-rose-400/20 bg-rose-50/20 dark:bg-rose-500/5">
                        <div className="mb-3 flex items-center justify-between">
                          <div className="text-sm font-semibold text-amber-900 dark:text-amber-900">{g.shop?.name || 'Shop'}</div>
                          {g.shop?.slug && (
                            <a className="text-xs text-amber-800 dark:text-amber-900 hover:underline" href={`/shops/${g.shop.slug}`}>View shop</a>
                          )}
                        </div>
                        <ul className="divide-y divide-rose-200/50 dark:divide-rose-400/20">
                          {g.rows.map((it, idx) => (
                            <li key={idx} className="py-2 flex items-center justify-between">
                              <div className="pr-3 min-w-0">
                                <div className="text-sm font-medium text-amber-900 dark:text-amber-900 truncate">{it.title}</div>
                                <div className="mt-0.5 flex items-center gap-2 text-xs">
                                  {it.variantId && (
                                    <span className="inline-block px-2 py-0.5 rounded-full bg-rose-100/70 text-rose-800 dark:bg-rose-500/15 dark:text-rose-200 border border-rose-200/50 dark:border-rose-400/20">variant</span>
                                  )}
                                  <span className="text-amber-900/80 dark:text-amber-900/80">× {it.qty}</span>
                                  <span className="text-amber-900/70 dark:text-amber-900/70">{(it.priceCents/100).toFixed(2)} {validated?.currency} each</span>
                                </div>
                              </div>
                              <div className="text-sm font-semibold text-amber-900 dark:text-amber-900 whitespace-nowrap">{((it.priceCents * it.qty)/100).toFixed(2)} {validated?.currency}</div>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="text-xs text-amber-900/90 dark:text-amber-900/90">Shop subtotal</div>
                          <div className="text-sm font-semibold text-amber-900 dark:text-amber-900">{(g.subtotal/100).toFixed(2)} {validated?.currency}</div>
                        </div>
                      </div>
                    ))}
                    <div className="pt-4 border-t border-rose-200/60 dark:border-rose-400/30 space-y-2 text-sm">
                      <div className="flex items-center justify-between text-amber-900 dark:text-amber-900/90">
                        <span>Subtotal</span>
                        <span>{((validated?.totalCents || 0)/100).toFixed(2)} {validated?.currency}</span>
                      </div>
                      {validated?.discount && (validated.discountCents || validated.discount.amountCents) ? (
                        <div className="flex items-center justify-between text-emerald-700">
                          <span>Discount {validated.discount.code}</span>
                          <span>-{((validated.discountCents ?? validated.discount.amountCents)/100).toFixed(2)} {validated?.currency}</span>
                        </div>
                      ) : null}
                      <div className="flex items-center justify-between text-base font-semibold text-amber-900 dark:text-amber-900">
                        <span>Total due</span>
                        <span>{((validated?.payableCents ?? validated?.totalCents ?? 0)/100).toFixed(2)} {validated?.currency}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="card-base card-glass p-5 h-fit ring-1 ring-rose-200/40 dark:ring-rose-400/20 rounded-2xl">
              <div className="text-lg font-semibold mb-3 text-amber-900 dark:text-amber-900">Addresses</div>
              <div className="mb-3">
                <div className="text-sm font-medium mb-1 text-amber-900 dark:text-amber-900">Shipping</div>
                <div className="text-sm text-amber-900/90 dark:text-amber-900/90">{shipping.street}, {shipping.city} {shipping.postalCode}, {shipping.country}</div>
              </div>
              <div className="mb-4">
                <div className="text-sm font-medium mb-1 text-amber-900 dark:text-amber-900">Billing</div>
                <div className="text-sm text-amber-900/90 dark:text-amber-900/90">{billing.street}, {billing.city} {billing.postalCode}, {billing.country}</div>
              </div>
              <form onSubmit={applyDiscount} className="mb-4 space-y-2">
                <label className="text-xs font-semibold text-amber-900/80 dark:text-amber-900">Have a discount code?</label>
                <div className="flex items-center gap-2">
                  <input
                    className="flex-1 rounded-lg border border-rose-200/60 bg-white/70 px-3 py-2 text-sm text-amber-900 focus:border-rose-400 focus:outline-none"
                    placeholder="SUMMER25"
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
                  />
                  <button
                    type="submit"
                    disabled={discountApplying}
                    className="rounded-lg border border-rose-200/60 bg-rose-100/80 px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-rose-100 disabled:opacity-60"
                  >
                    {discountApplying ? 'Applying…' : 'Apply'}
                  </button>
                  {validated?.discount?.code && (
                    <button
                      type="button"
                      onClick={removeDiscount}
                      className="rounded-lg border border-amber-200/60 bg-amber-50/80 px-3 py-2 text-sm text-amber-900 hover:bg-amber-100"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {discountFeedback && (
                  <div className="text-xs text-amber-700">{discountFeedback}</div>
                )}
              </form>
              {clientSecret && stripePromise ? (
                <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
                  <StripePaymentForm
                    intentId={intentId}
                    onSubmit={submitOrder}
                    placing={placing}
                    paymentError={paymentError}
                    setPaymentError={setPaymentError}
                  />
                </Elements>
              ) : (
                <div className="mb-4 rounded-xl border border-rose-200/60 dark:border-rose-400/20 bg-white/50 p-4 text-sm text-amber-900/70">
                  {paymentError ? paymentError : 'Preparing secure payment form…'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Forgot something? recommendations strip */}
        <div className="mt-8">
          <div className="card-base card-glass p-5 ring-1 ring-rose-200/40 dark:ring-rose-400/20 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold text-amber-900 dark:text-amber-900">Forgot something?</div>
              <div className="text-xs text-amber-900/80 dark:text-amber-900/80">Hand-picked for you</div>
            </div>
            <div className="overflow-x-auto -mx-2 px-2">
              <div className="flex gap-4 min-w-full snap-x snap-mandatory">
                {(recommended || []).slice(0,6).map((p) => (
                  <div key={p.id} className="w-48 shrink-0 snap-start rounded-xl ring-1 ring-rose-200/40 dark:ring-rose-400/20 bg-rose-50/20 dark:bg-rose-500/5 overflow-hidden">
                    <div className="aspect-[4/3] bg-white/40 dark:bg-rose-900/20">
                      <img
                        src={imageUrl(p.images?.[0]?.storageKey)}
                        alt={p.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
                      />
                    </div>
                    <div className="p-3">
                      <div className="text-xs font-semibold text-amber-900 dark:text-amber-900 line-clamp-2">{p.title}</div>
                      <div className="mt-1 flex items-baseline gap-2">
                        <div className="text-sm font-bold text-amber-900 dark:text-amber-900">{(p.priceCents/100).toFixed(2)} {p.currency}</div>
                        {((p.isOnSale || p.discountPercent) && p.originalPriceCents && p.originalPriceCents > p.priceCents) && (
                          <>
                            <div className="text-xs text-amber-900/70 line-through">{(p.originalPriceCents/100).toFixed(2)} {p.currency}</div>
                            {typeof p.discountPercent === 'number' && p.discountPercent > 0 && (
                              <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-rose-100/70 text-rose-800 border border-rose-200/50">-{p.discountPercent}%</span>
                            )}
                          </>
                        )}
                      </div>
                      {p?.shop?.slug && (
                        <a href={`/shops/${p.shop.slug}`} className="mt-2 inline-block text-[11px] underline text-amber-900/90 dark:text-amber-900/90">View</a>
                      )}
                      <AddToCartButton
                        product={{
                          productId: p.id,
                          title: p.title,
                          slug: p.slug,
                          priceCents: p.priceCents,
                          currency: p.currency,
                          image: p.images?.[0]?.storageKey || null,
                        }}
                        variant="soft"
                        className="mt-2 w-full"
                      />
                    </div>
                  </div>
                ))}
                {recommended === null && (
                  <div className="text-sm text-amber-900/80 dark:text-amber-900/80">Loading suggestions…</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutReviewPage() {
  if (!stripePromise) {
    return (
      <main className="max-w-5xl mx-auto py-10 px-4">
        <div className="card-base card-glass p-8 text-center text-sm text-amber-900/70">
          Stripe is not configured. Add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to your environment and refresh.
        </div>
      </main>
    );
  }

  return <InnerCheckoutReview />;
}
